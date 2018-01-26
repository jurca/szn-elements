'use strict'

describe('szn-elements', () => {
  beforeEach(() => {
    delete global.self
  })

  it('should declare the global SznElements object', () => {
    global.self = {}
    reimportSznElements()
    expect(self.SznElements instanceof Object).toBe(true)
  })

  it('should extend instead of replacing the global SznElements object', () => {
    const original = {}
    global.self = {
      SznElements: original,
    }
    reimportSznElements()
    expect(self.SznElements).toBe(original)
  })

  describe('global SznElements object', () => {
    let SznElements

    beforeEach(() => {
      global.self = {}
      SznElements = null
      reimportSznElements()
      SznElements = self.SznElements
    })

    it('should declare the init method', () => {
      expect(typeof SznElements.init).toBe('function')
      expect(SznElements.init.length).toBe(0)
    })

    describe('init method', () => {
      it('should not do anything if the registerElement method is not defined', () => {
        SznElements.init()
        SznElements.init()
      })

      it('should register the elements that were not registered yet', () => {
        const elementsToRegister = new Map([
          ['szn-foo', class Foo {}],
          ['szn-bar', class Bar {}],
        ])
        SznElements.registerElement = (elementName, elementClass, ...extraArguments) => {
          expect(extraArguments.length).toBe(0)
          expect(elementsToRegister.has(elementName)).toBe(true)
          expect(elementClass).toBe(elementsToRegister.get(elementName))
          elementsToRegister.delete(elementName)
        }

        SznElements.init()
        expect(elementsToRegister.size).toBe(2)

        for (const elementName of elementsToRegister.keys()) {
          SznElements[elementName] = elementsToRegister.get(elementName)
        }
        SznElements.init()
        expect(elementsToRegister.size).toBe(0)

        elementsToRegister.set('szn-baz', class Baz {})
        SznElements.init()
        expect(elementsToRegister.size).toBe(1)
        SznElements['szn-baz'] = elementsToRegister.get('szn-baz')
        SznElements.init()
        expect(elementsToRegister.size).toBe(0)
      })

      it('should register the unregistered elements only once', () => {
        let callCount = 0
        SznElements.registerElement = () => {
          callCount++
        }
        SznElements['szn-test'] = class Test {}
        SznElements.init()
        SznElements.init()
        expect(callCount).toBe(1)
      })

      it('should register only the elements that contain a dash (-) in the element name', () => {
        let callCount = 0
        SznElements.registerElement = elementName => {
          expect(elementName).toBe('szn-test')
          callCount++
        }
        SznElements['szn-test'] = class Test {}
        SznElements.szntest = class Test2 {}
        SznElements.init()
        expect(callCount).toBe(1)
      })

      it('should be invoked automatically when the szn-elements module is loaded', () => {
        let callCount = 0
        SznElements.registerElement = () => {
          callCount++
        }
        SznElements['szn-test'] = class Test {}
        reimportSznElements()
        expect(callCount).toBe(1)
      })
    })

    it('should declare the awaitElementReady method', () => {
      expect(typeof SznElements.awaitElementReady).toBe('function')
      expect(SznElements.awaitElementReady.length).toBe(2)
    })

    describe('awaitElementReady method', () => {
      it('should invoke the callback asynchronously for initialized elements', done => {
        let wasAsync = false
        SznElements.awaitElementReady({_broker: true}, (...args) => {
          expect(args.length).toBe(0)
          expect(wasAsync).toBe(true)
          done()
        })
        wasAsync = true
      })

      it('should invoked the callback for uninitialized elements when the element is ready', done => {
        let isReady = false
        const element = {}
        SznElements.awaitElementReady(element, () => {
          expect(isReady).toBe(true)
          done()
        })

        setTimeout(() => {
          SznElements._onElementReady({})
          isReady = true
          SznElements._onElementReady(element)
        })
      })
    })

    it('should declare the buildDom method', () => {
      expect(typeof SznElements.buildDom).toBe('function')
      expect(SznElements.buildDom.length).toBe(1) // the other two parameters are optional
    })

    describe('buildDom method', () => {
      it('should return the first element in the provided html string', () => {
        const result = SznElements.buildDom(`
          <div>
            some text
          </div>
          <span>
            another text content
          </span>
        `)
        expect(result.nodeType).toBe(1)
        expect(result.nodeName).toBe('DIV')
        expect(result.innerHTML.trim()).toBe('some text')
      })

      it('should pass the elements annotated with data-szn-ref attribute to the callback (second argument)', () => {
        const toProcess = new Map([['root', 'DIV'], ['an article', 'ARTICLE'], ['footer', 'FOOTER']])
        SznElements.buildDom(
          `
            <div data-szn-ref="root">
              <article data-szn-ref="an article"></article>
            </div>
            <footer data-szn-ref="footer">
              foobar
            </footer>
          `,
          (element, refId, ...otherArgs) => {
            expect(otherArgs.length).toBe(0)
            expect(toProcess.has(refId)).toBe(true)
            expect(element.nodeName).toBe(toProcess.get(refId))
            toProcess.delete(refId)
          },
        )
        expect(toProcess.size).toBe(0)
      })

      it('should ignore the references if no callback is provided', () => {
        // We just need to make sure that the call to the method does not crash
        SznElements.buildDom(`
          <div data-szn-ref="root"></div>
        `)
      })

      it('should return the whole document fragment when the third argument is false', () => {
        const result = SznElements.buildDom(`
          first text
          <div>
            <p>lorem ipsum dolor sit amet</p>
          </div>
          <span></span>
        `, () => {}, false)
        expect(result.nodeType).toBe(11)
        expect(result.firstChild.nodeValue.trim()).toBe('first text')
        expect(result.querySelector('p').innerHTML).toBe('lorem ipsum dolor sit amet')
        expect(result.lastElementChild.nodeName).toBe('SPAN')
      })
    })

    it('should declare the _onElementReady method', () => {
      expect(typeof SznElements._onElementReady).toBe('function')
      expect(SznElements._onElementReady.length).toBe(1)
    })

    describe('_onElementReady method', () => {
      it('should invoke the element await callback exactly once even if called multiple times', () => {
        const element = {}
        let callCount = 0
        SznElements.awaitElementReady(element, (...args) => {
          expect(args.length).toBe(0)
          callCount++
        })
        SznElements._onElementReady(element)
        SznElements._onElementReady(element)
        expect(callCount).toBe(1)
      })
    })
  })
})

function reimportSznElements() {
  // Yes, this is ugly, but we have to work around jest replacing/patching the native require function, and the
  // patched version not allowing us to re-require a module by removing it from the require.cache object.

  const modulePath = '../szn-elements'
  const fs = require('fs')
  const code = fs.readFileSync(require.resolve(modulePath), 'utf-8')
  eval(code) // eslint-disable-line no-eval
}
