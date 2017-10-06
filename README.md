# szn-elements

This package contains the common runtime for the custom szn-* elements.

## Example usage

Note: remove the `async` attributes and add this markup to the
`<head>` element to prevent the flash of unstyled content:

```html
<script src="/path/to/szn-elements.js" async></script>
<script>
  (function(){
    var browserRuntime;
    if (window.customElements) {
      browserRuntime = 'custom-elements';
    } else {
      browserRuntime = 'mutation-observer';
    }
    document.write(
      '<script src="/path/to/szn-elements/szn-elements-' + browserRuntime +
      '.js" async></' + 'script>'
    )
  }())
</script>
<script src="/path/to/custom/szn/element1.js" async></script>
<script src="/path/to/custom/szn/element2.js" async></script>
<script src="/path/to/custom/szn/element3.js" async></script>
<!-- any other SZN elements -->
```

To support IE 9-10, use this MutationObserver polyfill
(https://www.npmjs.com/package/mutation-observer) like this (IE 10 does not
support conditional comments, so we have to use a script):

```html
<script>
  if (!window.MutationObserver) {
    document.write('<script src="/path/to/mutationobserver/polyfill.js"></' + 'script>')
  }
</script>
<!-- SZN elements code goes here -->
```

If you need IE8 support as well, use the ES3-compatible polyfill
(https://www.npmjs.com/package/mutationobserver-shim) and the following
pattern:

```html
<!--[if IE 8]>
<script src="/path/to/mutationobserver/shim.js"></script>
<![endif]-->
<![if (gt IE 8)|(!IE)]>
<!-- IE 9-10 polyfill code goes here -->
<!-- SZN elements code goes here -->
<![endif]>
```

Alternatively, you may just always include the necessary polyfills, but most
of your visitors will have download javascript that they wont even use.
