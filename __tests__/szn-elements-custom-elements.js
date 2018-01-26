'use strict'

describe('szn-elements-custom-elements', () => {
  beforeEach(() => {
    delete global.self
  })

  it('should declare the global SznElements object', () => {
    global.self = {}
    reimportImplementation()
    expect(self.SznElements instanceof Object).toBe(true)
  })

  it('should extend instead of replacing the global SznElements object', () => {
    const original = {}
    global.self = {
      SznElements: original,
    }
    reimportImplementation()
    expect(self.SznElements).toBe(original)
  })

  describe('global SznElements object', () => {
    let SznElements

    beforeEach(() => {
      global.self = {}
      SznElements = null
      reimportImplementation()
      SznElements = self.SznElements
    })

    it('should declare the registerElement method', () => {
      expect(typeof SznElements.registerElement).toBe('function')
      expect(SznElements.registerElement.length).toBe(2)
    })

    describe('registerElement method', () => {
      it('should define a valid custom element that used the provided implementation', () => {
        class SznFooBroker {
          constructor(root, uiContainer, ...extraArgs) {
            expect(extraArgs.length).toBe(0)
            this.root = root
            expect(uiContainer).toBe(null)
          }
        }

        let uiContainerLookedFor = false
        global.HTMLElement = class HTMLElement {
          querySelector(selector) {
            expect(selector).toBe('[data-szn-foo-ui]')
            uiContainerLookedFor = true
            return null
          }
        }

        let defined = false
        let elementImplementation = null
        global.customElements = {
          define(elementName, implementation, ...extra) {
            expect(elementName).toBe('szn-foo')
            expect(implementation.prototype instanceof HTMLElement).toBe(true)
            expect(implementation.is).toBe('szn-foo')
            expect(typeof implementation.prototype.connectedCallback).toBe('function')
            expect(typeof implementation.prototype.disconnectedCallback).toBe('function')
            elementImplementation = implementation
            defined = true
          },
        }

        let elementPassedToReadyCallback = null
        SznElements._onElementReady = (element, ...extraArgs) => {
          expect(extraArgs.length).toBe(0)
          elementPassedToReadyCallback = element
        }

        SznElements.registerElement('szn-foo', SznFooBroker)
        expect(defined).toBe(true)

        const elementInstance = new elementImplementation() // we simulate document.createElement('szn-foo') like this
        expect(elementPassedToReadyCallback).toBe(elementInstance)
        expect(uiContainerLookedFor).toBe(true)
        expect(elementInstance._broker instanceof SznFooBroker).toBe(true)

        // these should not crash if the onMount and onUnmount methods are not defined
        elementInstance.connectedCallback()
        elementInstance.disconnectedCallback()

        SznFooBroker.prototype.onMount = () => {}
        SznFooBroker.prototype.onUnmount = () => {}
        const mountMock = spyOn(elementInstance._broker, 'onMount')
        const unmountMock = spyOn(elementInstance._broker, 'onUnmount')
        elementInstance.connectedCallback()
        elementInstance.disconnectedCallback()
        expect(mountMock).toBeCalledWith()
        expect(unmountMock).toBeCalledWith()
      })
    })
  })

  it('should call the init method if declared', () => {
    let called = false
    global.self = {
      SznElements: {
        init() {
          called = true
        },
      },
    }

    reimportImplementation()
    expect(called).toBe(true)
  })
})

function reimportImplementation() {
  // Yes, this is ugly, but we have to work around jest replacing/patching the native require function, and the
  // patched version not allowing us to re-require a module by removing it from the require.cache object.

  const modulePath = '../szn-elements-custom-elements'
  const fs = require('fs')
  const code = fs.readFileSync(require.resolve(modulePath), 'utf-8')
  eval(code) // eslint-disable-line no-eval
}
