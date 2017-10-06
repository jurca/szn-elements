'use strict'
;(global => {

  const SznElements = global.SznElements = global.SznElements || {}
  const registeredElements = {}

  SznElements.init = () => {
    if (!SznElements.registerElement) {
      return
    }

    for (const [elementName, elementClass] of getUnregisteredElements()) {
      registeredElements[elementName] = true
      SznElements.registerElement(elementName, elementClass)
    }
  }

  SznElements.observeAttributes = (element, attributes, callback) => {
    const observer = new MutationObserver(callback)
    observer.observe(element, {
      attributes: true,
      attributeFilter: attributes,
    })

    return () => observer.disconnect()
  }

  function *getUnregisteredElements() {
    for (const key of Object.keys(SznElements)) {
      if (key.includes('-') && !registeredElements[key]) {
        yield [key, SznElements[key]]
      }
    }
  }

  SznElements.init()
})(self)
