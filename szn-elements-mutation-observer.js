'use strict'
;(global => {
  const SznElements = global.SznElements = global.SznElements || {}

  /**
   * The DOM mutation observer used to watch to insertion and removal of custom elements to and from the document.
   *
   * @type {?MutationObserver}
   */
  let observer

  /**
   * Element names of the custom elements that have been registered with the runtime.
   *
   * @type {Array<string>}
   */
  const registeredElementNames = []

  /**
   * Flag marking whether the SznElements.buildDom method has already been patched to initialize the custom elements
   * created using it.
   *
   * @type {boolean}
   */
  let buildDomPatched = false

  /**
   * Registers the provided custom element with the runtime. This will ensure that any occurrence of the custom element
   * in the DOM will be paired with the provided functionality.
   *
   * This implementation relies on the MutationObserver API, see http://mdn.io/MutationObserver for more details.
   *
   * @param {string} elementName The DOM node name of the custom element. This should be prefixed by "szn-".
   * @param {function(HTMLElement)} elementClass The class representing the custom element.
   */
  SznElements.registerElement = (elementName, elementClass) => {
    if (!buildDomPatched) {
      const originalBuildDom = SznElements.buildDom
      SznElements.buildDom = (...args) => {
        const result = originalBuildDom.apply(SznElements, args)
        for (const customElementName of Object.keys(SznElements).filter(property => property.includes('-'))) {
          if (result.nodeName.toLowerCase() === customElementName.toLowerCase()) {
            initElement(result)
          }
          for (const child of Array.from(result.querySelectorAll(customElementName))) {
            initElement(child)
          }
        }
        return result
      }
      buildDomPatched = true
    }

    if (!observer) {
      observer = new MutationObserver(processDOMMutations)
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      })
    }

    registeredElementNames.push(elementName)
    for (const element of Array.from(document.querySelectorAll(elementName))) {
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
      if (SznElements[element.tagName.toLowerCase()] && element.tagName.includes('-')) {
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
      for (const addedNode of Array.from(mutation.addedNodes)) {
        if (addedNode.nodeType !== Node.ELEMENT_NODE) {
          continue
        }

        if (SznElements[addedNode.nodeName.toLowerCase()]) {
          initElement(addedNode)
          handleElementMount(addedNode)
        }
        for (const elementName of registeredElementNames) {
          for (const addedSubElement of Array.from(addedNode.querySelectorAll(elementName))) {
            initElement(addedSubElement)
            handleElementMount(addedSubElement)
          }
        }
      }
      for (const removedNode of Array.from(mutation.removedNodes)) {
        if (removedNode.nodeType !== Node.ELEMENT_NODE) {
          continue
        }

        if (removedNode._broker) {
          handleElementUnmount(removedNode)
        }
        for (const elementName of registeredElementNames) {
          for (const addedSubElement of Array.from(removedNode.querySelectorAll(elementName))) {
            handleElementUnmount(addedSubElement)
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

    element._broker = new SznElements[element.nodeName.toLowerCase()](element)
    SznElements._onElementReady(element)
  }

  /**
   * Invokes the <code>onMount</code> method of the provided custom element's implementation, if the implementation
   * does contain it.
   *
   * @param {HTMLElement} element The element that has been mounted to the DOM.
   */
  function handleElementMount(element) {
    if (!element._mounted && element._broker.onMount) {
      element._broker.onMount()
    }
    element._mounted = true
  }

  /**
   * Invokes the <code>onUnmount</code> method of the provided custom element's implementation, if the implementation
   * does contain it.
   *
   * @param {HTMLElement} element A custom szn-* HTML element that has been unmounted from the DOM.
   */
  function handleElementUnmount(element) {
    if (!element._broker) {
      return
    }

    if (element._mounted && element._broker.onUnmount) {
      element._broker.onUnmount()
    }
    element._mounted = false
  }

  if (SznElements.init) {
    SznElements.init()
  }
})(self)
