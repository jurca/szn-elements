'use strict'
;(global => {
  const SznElements = global.SznElements = global.SznElements || {}

  /**
   * Registers the provided custom element with the runtime. This will ensure that any occurrence of the custom element
   * in the DOM will be paired with the provided functionality.
   *
   * This implementation has no effect, as it is meant to be used with a frontend framework that would manage
   * szn-element instances on its own (e.g. a React app that loads a szn-elements bundle on its own).
   *
   * @param {string} elementName The DOM node name of the custom element. This should be prefixed by "szn-".
   * @param {function(HTMLElement)} elementClass The class representing the custom element.
   */
  SznElements.registerElement = (elementName, elementClass) => {
  }

  if (SznElements.init) {
    SznElements.init()
  }
})(self)
