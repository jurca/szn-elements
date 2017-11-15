'use strict'
;(global => {
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
