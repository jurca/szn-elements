'use strict'
;(global => {
  const SznElements = global.SznElements = global.SznElements || {}

  SznElements.registerElement = (elementName, elementClass) => {
    customElements.define(elementName, class extends HTMLElement {
      constructor() {
        super()
        this._broker = new elementClass(this, this.querySelector(`[data-${elementName}-ui]`))
      }

      connectedCallback() {
        if (this._broker.onMount) {
          this._broker.onMount()
        }
      }

      disconnectedCallback() {
        if (this._broker.onUnmount) {
          this._broker.onUnmount()
        }
      }
    })
  }

  if (SznElements.init) {
    SznElements.init()
  }
})(self)
