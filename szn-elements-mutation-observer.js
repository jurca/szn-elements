'use strict'
;(global => {
  const SznElements = global.SznElements = global.SznElements || {}
  let observer
  const registeredElementNames = []

  /**
   * Registers the provided custom element with the runtime. This will ensure that any occurrence of the custom element
   * in the DOM will be paired with the provided functionality.
   *
   * This implementation relies on the MutationObserver API, see http://mdn.io/MutationObserver for more details.
   *
   * @param {string} elementName The DOM name of the custom element. This should be prefixed by "szn-".
   * @param {function(HTMLElement, ?HTMLElement)} elementClass The class representing the custom element.
   */
  SznElements.registerElement = (elementName, elementClass) => {
    if (!observer) {
      observer = new MutationObserver(processDOMMutations)
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      })
    }

    registeredElementNames.push(elementName)
    for (const element of toArray(document.querySelectorAll(elementName))) {
      initElement(element)
      handleElementMount(element)
    }
  }

  try {
    const nativeElementFactory = document.createElement
    // We want to make the behavior closer to how native custom elements work. while we cannot polyfill HTML processing
    // done by the browser, we can at least slightly improve the behavior of the DOM API.
    document.createElement = (...args) => {
      const element = nativeElementFactory.apply(document, args)
      if (SznElements[element.tagName.toLowerCase()] && element.tagName.indexOf('-') > -1) {
        initElement(element)
      }
      return element
    }
  } catch (_) {}

  /**
   * Processes the observed DOM mutations, creating and destroying instances of the custom elements as necessary.
   *
   * @param {Array<MutationRecord>} mutations The DOM mutations that were observed.
   */
  function processDOMMutations(mutations) {
    for (const mutation of mutations) {
      for (const addedNode of toArray(mutation.addedNodes)) {
        if (addedNode.nodeType !== Node.ELEMENT_NODE) {
          continue
        }

        if (SznElements[addedNode.nodeName.toLowerCase()]) {
          initElement(addedNode)
          handleElementMount(addedNode)
        }
        for (const elementName of registeredElementNames) {
          for (const addedSubElement of toArray(addedNode.querySelectorAll(elementName))) {
            initElement(addedSubElement)
            handleElementMount(addedSubElement)
          }
        }
      }
      for (const removedNode of toArray(mutation.removedNodes)) {
        if (removedNode.nodeType !== Node.ELEMENT_NODE) {
          continue
        }

        if (removedNode._broker) {
          destroyElement(removedNode)
        }
        for (const elementName of registeredElementNames) {
          for (const addedSubElement of toArray(removedNode.querySelectorAll(elementName))) {
            destroyElement(addedSubElement)
          }
        }
      }
    }
  }

  /**
   * Initializes the provided custom szn-* HTML element and notifies it that it has been mounted into the DOM.
   *
   * @param {HTMLElement} element A custom szn-* HTML element.
   */
  function initElement(element) {
    if (element._broker) {
      return
    }

    element._broker = new SznElements[element.nodeName.toLowerCase()](
      element,
      element.querySelector(`[data-${element.nodeName}-ui]`),
    )
    SznElements._onElementReady(element)
  }

  /**
   * Invokes the <code>onMount</code> method of the provided custom element's implementation, if the implementation
   * does contain it.
   *
   * @param {HTMLElement} element The element that has been mounted to the DOM.
   */
  function handleElementMount(element) {
    if (element._broker.onMount) {
      element._broker.onMount()
    }
  }

  /**
   * Destroys the custom element's instance. The instance is first notified of being unmounted from the DOM so that it
   * can perform its own cleanup.
   *
   * @param {HTMLElement} element A custom szn-* HTML element.
   */
  function destroyElement(element) {
    if (!element._broker) {
      return
    }

    if (element._broker.onUnmount) {
      element._broker.onUnmount()
    }
  }

  /**
   * Creates an array with the contents of the provided collection.
   *
   * @param {{length: number}} collection A densely-populated collection of values and finite size.
   * @return {Array} The contents of the collection as an array.
   */
  function toArray(collection) {
    // we cannot use Array.from because it might not be present in the legacy browsers
    return Array.prototype.slice.call(collection)
  }

  if (SznElements.init) {
    SznElements.init()
  }
})(self)
