//// jquery-prelude
// make jquery object available from the console for the cheerio iframe as $
var $ = window.$ = require('jquery');
var el = document.querySelector('body');

// insert the unmodified html into the body
el.innerHTML = <%- html  %>;


//// user code

