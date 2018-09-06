'use strict'
;(global => {
  const SznElements = global.SznElements = global.SznElements || {}

  /**
   * Registers the provided custom element with the runtime. This will ensure that any occurrence of the custom element
   * in the DOM will be paired with the provided functionality.
   *
   * This implementation relies on the custom elements API, see http://mdn.io/Custom_Elements for more details.
   *
   * @param {string} elementName The DOM node name of the custom element. This should be prefixed by "szn-".
   * @param {function(HTMLElement)} elementClass The class representing the custom element.
   */
  SznElements.registerElement = (elementName, elementClass) => {
    customElements.define(elementName, class extends HTMLElement {
      static get is() {
        return elementName
      }

      constructor() {
        super()

        if (!this.hasAttribute('data-szn-elements--init-on-demand')) {
          this._broker = new elementClass(this)
          SznElements._onElementReady(this)
        }
      }

      connectedCallback() {
        if (this._broker && this._broker.onMount) {
          this._broker.onMount()
        }
      }

      disconnectedCallback() {
        if (this._broker && this._broker.onUnmount) {
          this._broker.onUnmount()
        }
      }
    })
  }

  if (SznElements.init) {
    SznElements.init()
  }
})(self)
