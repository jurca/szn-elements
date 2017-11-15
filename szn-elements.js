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
   * Registers the provided callback to be triggered whenever any of the specified attributes change on the provided
   * element. Changes to other attributes will be ignored.
   *
   * @param {HTMLElement} element The HTML element on which the attribute modifications are to be observed.
   * @param {Array<string>} attributes The names of attributes that should be observed.
   * @param {function(MutationRecord)} callback Callback executed whenever any of the specified attributes is modified.
   * @return {function(): void} A function to disable the observing of the attributes. Use this to clean up.
   */
  SznElements.observeAttributes = (element, attributes, callback) => {
    const observer = new MutationObserver(callback)
    observer.observe(element, {
      attributes: true,
      attributeFilter: attributes,
    })

    return () => observer.disconnect()
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
   * Returns an iterator that yields all so-far registered custom elements.
   *
   * @return {Iterator<[string, function(HTMLElement, ?HTMLElement)]>} Iterator that yields the DOM tag name and the
   *         custom element class tuple for each so-far registered custom element.
   */
  function *getUnregisteredElements() {
    for (const key of Object.keys(SznElements)) {
      if (key.includes('-') && !registeredElements[key]) {
        yield [key, SznElements[key]]
      }
    }
  }

  SznElements.init()
})(self)
