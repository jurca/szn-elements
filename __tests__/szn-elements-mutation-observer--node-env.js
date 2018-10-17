/**
 * @jest-environment node
 */

describe('registered DOM mutation observer', () => {
  let mutationObserver = null
  let SznElements
  let self
  let document

  beforeEach(() => {
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

    self = {}
    document = {
      documentElement: {},
      querySelectorAll() {
        return []
      },
    }
    reimportImplementation()
    SznElements = self.SznElements
  })

  it('should fall back to observing the documentElement if document\'s body is not available', () => {
    SznElements.registerElement('szn-foo', class SznFoo {})
    expect(mutationObserver.target).toBe(document.documentElement)
  })

  afterEach(() => {
    mutationObserver = null
    SznElements = null
    self = null
    document = null
  })

  function reimportImplementation() {
    // Yes, this is ugly, but we have to work around jest replacing/patching the native require function, and the
    // patched version not allowing us to re-require a module by removing it from the require.cache object.

    const modulePath = '../szn-elements-mutation-observer'
    const fs = require('fs')
    const code = fs.readFileSync(require.resolve(modulePath), 'utf-8')
    eval(code) // eslint-disable-line no-eval
  }
})
