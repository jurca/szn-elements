'use strict'
;(global => {
  const NOOP = () => {}

  const SznElements = global.SznElements = global.SznElements || {}
  const registeredElements = {}

  const pendingElements = []

  /**
   * Initializes the runtime. This method should be called (if defined) whenever a new element is defined. Elements
   * that have been defined since the last call will be initialized in the runtime so they can be used in the browser.
   *
   * The method has no effect if the element-to-browser registration runtime has not been loaded yet or no new elements
   * were defined since the last call.
   */
  SznElements.init = () => {
    if (!SznElements.registerElement) {
      return
    }

    for (const [elementName, elementClass] of getUnregisteredElements()) {
      registeredElements[elementName] = true
      SznElements.registerElement(elementName, elementClass)
    }
  }

  /**
   * Registers the provided callback to be called when the specified szn- element has been properly initialized (this
   * might happen after the element has been added to the DOM, depending on the current runtime). The callback is
   * always executed asynchronously, even if the element is already initialized.
   *
   * @param {HTMLElement} element The custom element.
   * @param {function()} callback The callback to execute when the element has been initialized.
   */
  SznElements.awaitElementReady = (element, callback) => {
    if (element._broker) {
      setTimeout(callback, 0) // the callback should always be called asynchronously
      return
    }

    pendingElements.push([element, callback])
  }

  /**
   * Generates DOM from the provided HTML string, passing every element with the <code>data-szn-ref</code> attribute
   * to the provided callback for further post-processing before returning the result.
   *
   * This is a helper function that can be used to generate a document fragment with multiple "root" elements or a
   * single structured element.
   *
   * @param {string} html The HTML code to turn into DOM.
   * @param {function(HTMLElement, string)=} refCallback A callback to invoked for each created element that has the
   *        <code>data-szn-ref</code> attribute set.
   * @param {boolean=} returnElement If <code>true</code>, the function returns only the created first element (with
   *        its children), otherwise the function returns a document fragment containing all created nodes, including
   *        text nodes containing whitespace. Defaults to <code>true</code>.
   * @return {(DocumentFragment|HTMLElement)} The generated DOM node(s).
   */
  SznElements.buildDom = (html, refCallback = NOOP, returnElement = true) => {
    const template = document.createElement('template')
    template.innerHTML = html
    const content = template.content || (() => {
      const nodes = document.createDocumentFragment()
      while (template.firstChild) {
        nodes.appendChild(template.firstChild)
      }
      return nodes
    })()
    for (const referencedElement of Array.prototype.slice.call(content.querySelectorAll('[data-szn-ref]'))) {
      refCallback(referencedElement, referencedElement.getAttribute('data-szn-ref'))
    }

    if (!returnElement) {
      return content
    }

    // IE/Edge does not support firstElementChild on document fragments :(
    let firstElement = content.firstChild
    while (firstElement && firstElement.nodeType !== 1) {
      firstElement = firstElement.nextSibling
    }
    return firstElement
  }

  /**
   * Alerts the common runtime that the provided element has been properly initialized and invokes all registered
   * callbacks.
   *
   * @param {HTMLElement} element The element that has been initialized.
   */
  SznElements._onElementReady = element => {
    for (let i = pendingElements.length - 1; i >= 0; i--) {
      const elementWithCallback = pendingElements[i]
      if (elementWithCallback[0] === element) {
        elementWithCallback[1]()
        pendingElements.splice(i, 1)
      }
    }
  }

  /**
   * Returns an all so-far known custom elements that have not been registered yet.
   *
   * @return {Array<[string, function(HTMLElement, ?HTMLElement)]>} An array of the DOM tag name and the
   *         custom element class tuples for each so-far registered custom element.
   */
  function getUnregisteredElements() {
    const elements = []
    for (const key of Object.keys(SznElements)) {
      if (key.includes('-') && !registeredElements[key]) {
        elements.push([key, SznElements[key]])
      }
    }
    return elements
  }

  SznElements.init()
})(self)
