'use strict'

const nativeCreateElement = document.createElement

describe('szn-elements-custom-elements', () => {
  let mutationObserver

  beforeEach(() => {
    delete global.self
    document.createElement = nativeCreateElement
    mutationObserver = null
    global.MutationObserver = class MutationObserver {
      constructor(callback) {
        this.callback = callback
        // We are not subclassing this class, so exposing the instance from the constructor is OK
        mutationObserver = this
      }

      observe(target, options) {
        this.target = target
        this.options = options
      }

      disconnect() {
        throw new Error('The runtime must not disconnect the DOM mutation observer')
      }
    }
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

      SznElements.buildDom = (html, refCallback = () => {}, returnElement = true) => {
        const template = document.createElement('template')
        template.innerHTML = html
        const {content} = template
        for (const referencedElement of Array.from(content.querySelectorAll('[data-szn-ref]'))) {
          refCallback(referencedElement, referencedElement.getAttribute('data-szn-ref'))
        }
        return returnElement ? content.firstElementChild : content
      }
      SznElements.buildDom.$unpatched = true
    })

    it('should declare the registerElement method', () => {
      expect(typeof SznElements.registerElement).toBe('function')
      expect(SznElements.registerElement.length).toBe(2)
    })

    describe('registerElement method', () => {
      it('should patch the buildDom method', () => {
        expect(SznElements.buildDom.$unpatched).toBe(true)
        SznElements.registerElement('szn-foo', class SznFoo {})
        expect(SznElements.buildDom.$unpatched).toBeUndefined()
      })

      it('should patch the buildDom method only once', () => {
        let patchCount = 0
        Object.defineProperty(SznElements, 'buildDom', {
          configurable: true,
          enumerable: true,
          get() {
            return () => {}
          },
          set(value) {
            patchCount++
          },
        })
        SznElements.registerElement('szn-foo', class SznFoo {})
        SznElements.registerElement('szn-bar', class SznBar {})
        expect(patchCount).toBe(1)
      })

      it('should register the mutation observer', () => {
        expect(mutationObserver).toBe(null)
        const observeMock = spyOn(MutationObserver.prototype, 'observe')
        SznElements.registerElement('szn-foo', class SznFoo {})
        expect(mutationObserver instanceof MutationObserver).toBe(true)
        expect(typeof mutationObserver.callback).toBe('function')
        expect(mutationObserver.callback.length).toBe(1)
        expect(observeMock).toHaveBeenCalledWith(document.body, {
          childList: true,
          subtree: true,
        })
      })

      it('should register the mutation observer exactly once', () => {
        expect(mutationObserver).toBe(null)
        const observeMock = spyOn(MutationObserver.prototype, 'observe')
        SznElements.registerElement('szn-foo', class SznFoo {})
        const currentObserver = mutationObserver
        expect(mutationObserver instanceof MutationObserver).toBe(true)
        SznElements.registerElement('szn-bar', class SznBar {})
        expect(mutationObserver).toBe(currentObserver)
        expect(observeMock).toHaveBeenCalledTimes(1)
      })

      it('should initialize and call the onMount callback on the custom elements already in the DOM', () => {
        document.body.innerHTML = `
          <szn-foo></szn-foo>
        `
        class SznFoo {
          onMount() {}
        }

        const onMountMock = spyOn(SznFoo.prototype, 'onMount')
        const sznFooElement = document.body.firstElementChild
        expect(sznFooElement._broker).toBeUndefined()

        SznElements['szn-foo'] = SznFoo
        SznElements._onElementReady = () => {}
        const onElementReadyMock = spyOn(SznElements, '_onElementReady')
        SznElements.registerElement('szn-foo', SznFoo)
        expect(sznFooElement._broker instanceof SznFoo).toBe(true)
        expect(onMountMock).toHaveBeenCalledWith()
        expect(onElementReadyMock).toHaveBeenCalledWith(sznFooElement)
      })
    })
  })

  describe('patched buildDom method', () => {
    let SznElements

    beforeEach(() => {
      global.self = {}
      SznElements = null
      reimportImplementation()
      SznElements = self.SznElements

      SznElements.buildDom = (html, refCallback = () => {}, returnElement = true) => {
        const template = document.createElement('template')
        template.innerHTML = html
        const {content} = template
        for (const referencedElement of Array.from(content.querySelectorAll('[data-szn-ref]'))) {
          refCallback(referencedElement, referencedElement.getAttribute('data-szn-ref'))
        }
        return returnElement ? content.firstElementChild : content
      }
    })

    it('should initialize any custom element returned by the original buildDom method', () => {
      class SznFoo {
        onMount() {}
        onUnmount() {}
      }
      const mountMock = spyOn(SznFoo.prototype, 'onMount')
      const unmountMock = spyOn(SznFoo.prototype, 'onUnmount')
      SznElements['szn-foo'] = SznFoo
      SznElements.registerElement('szn-foo', SznFoo)
      SznElements._onElementReady = jest.fn()
      const element = SznElements.buildDom('<szn-foo></szn-foo>')
      expect(element._broker instanceof SznFoo).toBe(true)
      expect(mountMock).not.toHaveBeenCalled()
      expect(unmountMock).not.toHaveBeenCalled()
      expect(SznElements._onElementReady).toHaveBeenCalledWith(element)
    })
  })

  it('should patch the document.createElement method', () => {
    global.self = {}
    reimportImplementation()
    const implementationSource = document.createElement.toString()
    expect(implementationSource.includes('TypeError("Illegal invocation")')).toBe(false) // JSDom
    expect(implementationSource.includes('[native code]')).toBe(false)
  })

  describe('patched document.createElement method', () => {
    let SznElements

    beforeEach(() => {
      global.self = {}
      reimportImplementation()
      SznElements = self.SznElements
    })

    it('should initialize any custom element', () => {
      class SznFoo {
        onMount() {}
        onUnmount() {}
      }
      SznElements['szn-foo'] = SznFoo
      const mountMock = spyOn(SznFoo.prototype, 'onMount')
      const unmountMock = spyOn(SznFoo.prototype, 'onUnmount')
      SznElements._onElementReady = jest.fn()
      SznElements.registerElement('szn-foo', SznFoo)
      const element = document.createElement('szn-foo')
      expect(element._broker instanceof SznFoo).toBe(true)
      expect(mountMock).not.toHaveBeenCalled()
      expect(unmountMock).not.toHaveBeenCalled()
      expect(SznElements._onElementReady).toHaveBeenCalledWith(element)

      expect(() => {
        const element2 = document.createElement('szn-bar')
        expect(element2._broker).toBeUndefined()
      }).not.toThrow()
    })
  })

  describe('registered DOM mutation observer', () => {
    let SznElements
    let SznFoo
    let SznBar

    beforeEach(() => {
      global.self = {}
      reimportImplementation()
      SznElements = self.SznElements

      SznFoo = class SznFooImpl {
        constructor() {
          this.constructor.instanceCount++
        }
        onMount() {}
        onUnmount() {}
      }
      SznFoo.instanceCount = 0

      SznBar = class SznBarImpl {
        constructor() {
          this.constructor.instanceCount++
        }
        onMount() {}
        onUnmount() {}
      }
      SznBar.instanceCount = 0

      SznElements._onElementReady = jest.fn()
      SznElements['szn-foo'] = SznFoo
      SznElements['szn-bar'] = SznBar
      SznElements.registerElement('szn-foo', SznFoo)
      SznElements.registerElement('szn-bar', SznBar)
    })

    it('should initialize any new elements', () => {
      document.body.innerHTML = `
        <szn-foo>
          <szn-foo></szn-foo>        
        </szn-foo>
        <szn-bar></szn-bar>
      `
      mutationObserver.callback([makeMutation(document.body.children, document.head.children)])
      const fooElements = Array.from(document.querySelectorAll('szn-foo'))
      expect(fooElements.length).toBe(2)
      for (const element of fooElements) {
        expect(element._broker instanceof SznFoo).toBe(true)
      }
      const barElements = Array.from(document.querySelectorAll('szn-bar'))
      expect(barElements.length).toBe(1)
      for (const element of barElements) {
        expect(element._broker instanceof SznBar).toBe(true)
      }
    })

    it('should initialize new elements exactly once', () => {
      document.body.innerHTML = `
        <szn-foo></szn-foo>
        <szn-foo></szn-foo>
        <szn-foo></szn-foo>
        <szn-bar></szn-bar>
      `
      mutationObserver.callback([makeMutation(document.body.children, document.head.children)])
      expect(SznFoo.instanceCount).toBe(3)
      expect(SznBar.instanceCount).toBe(1)
    })

    it('should execute the onMount callback on mounted elements', () => {
      const onMountMock = spyOn(SznFoo.prototype, 'onMount')
      document.body.innerHTML = '<szn-foo></szn-foo>'
      mutationObserver.callback([makeMutation(document.body.children, document.head.children)])
      expect(onMountMock).toHaveBeenCalledTimes(1)
    })

    it('should execute the onMount callback only once for each mounted element until unmounted', () => {
      const onMountMock = spyOn(SznFoo.prototype, 'onMount')
      document.body.innerHTML = '<szn-foo></szn-foo>'
      mutationObserver.callback([makeMutation(document.body.children, document.head.children)])
      expect(onMountMock).toHaveBeenCalledTimes(1)
      mutationObserver.callback([makeMutation(document.body.children, document.head.children)])
      expect(onMountMock).toHaveBeenCalledTimes(1)
    })

    it('should execute the onMount callback after re-mounting an unmounted element', () => {
      const onMountMock = spyOn(SznFoo.prototype, 'onMount')
      document.body.innerHTML = '<szn-foo></szn-foo>'
      mutationObserver.callback([makeMutation(document.body.children, document.head.children)])
      expect(onMountMock).toHaveBeenCalledTimes(1)
      mutationObserver.callback([makeMutation(document.head.children, document.body.children)])
      mutationObserver.callback([makeMutation(document.body.children, document.head.children)])
      expect(onMountMock).toHaveBeenCalledTimes(2)
    })

    it('should execute the onUnmount callback for unmounted elements', () => {
      const onUnmountMock = spyOn(SznFoo.prototype, 'onUnmount')
      document.body.innerHTML = '<szn-foo></szn-foo>'
      mutationObserver.callback([makeMutation(document.body.children, document.head.children)])
      mutationObserver.callback([makeMutation(document.head.children, document.body.children)])
      expect(onUnmountMock).toHaveBeenCalled()
    })

    it('should execute the onUnmount callback exactly once for each unmounted element until mounted', () => {
      const onUnmountMock = spyOn(SznFoo.prototype, 'onUnmount')
      document.body.innerHTML = '<szn-foo></szn-foo>'
      mutationObserver.callback([makeMutation(document.head.children, document.body.children)])
      expect(onUnmountMock).not.toHaveBeenCalled()
      mutationObserver.callback([makeMutation(document.body.children, document.head.children)])
      mutationObserver.callback([makeMutation(document.head.children, document.body.children)])
      mutationObserver.callback([makeMutation(document.head.children, document.body.children)])
      expect(onUnmountMock).toHaveBeenCalledTimes(1)
    })

    it('should execute the onUnmount callback after unmounting a re-mounted element', () => {
      const onUnmountMock = spyOn(SznFoo.prototype, 'onUnmount')
      document.body.innerHTML = '<szn-foo></szn-foo>'
      mutationObserver.callback([makeMutation(document.body.children, document.head.children)])
      mutationObserver.callback([makeMutation(document.head.children, document.body.children)])
      mutationObserver.callback([makeMutation(document.body.children, document.head.children)])
      mutationObserver.callback([makeMutation(document.head.children, document.body.children)])
      expect(onUnmountMock).toHaveBeenCalledTimes(2)
    })

    it('should preserve the broker instance on unmounted elements', () => {
      document.body.innerHTML = '<szn-foo></szn-foo>'
      mutationObserver.callback([makeMutation(document.body.children, document.head.children)])
      mutationObserver.callback([makeMutation(document.head.children, document.body.children)])
      expect(document.body.firstElementChild._broker instanceof SznFoo).toBe(true)
    })

    it('should process all mutation records', () => {
      document.body.innerHTML = `
        <div>
          <szn-foo></szn-foo>
        </div>
        <div>
          <szn-foo></szn-foo>
        </div>
      `
      const firstNodes = document.body.firstElementChild.children
      const secondNodes = document.body.lastElementChild.children
      mutationObserver.callback([
        makeMutation(firstNodes, document.head.children),
        makeMutation(secondNodes, document.head.children),
      ])
      const elements = Array.from(document.body.querySelectorAll('szn-foo'))
      expect(elements.length).toBe(2)
      for (const element of elements) {
        expect(element._broker instanceof SznFoo).toBe(true)
      }
    })

    function makeMutation(addedNodes, removedNodes) {
      return {
        type: 'childList',
        target: document.body,
        addedNodes,
        removedNodes,
        previousSibling: null,
        nextSibling: null,
        attributeName: null,
        attributeNamespace: null,
        oldValue: null,
      }
    }
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

  const modulePath = '../szn-elements-mutation-observer'
  const fs = require('fs')
  const code = fs.readFileSync(require.resolve(modulePath), 'utf-8')
  eval(code) // eslint-disable-line no-eval
}
