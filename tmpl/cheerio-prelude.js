//// cheerio-prelude
var cheerio = window.cheerio = require('cheerio');
// make cheerio object available from the console for the cheerio iframe as $
var $ = window.$ = cheerio.load(<%- html  %>);

// insert the parsed html into the body
var el = document.querySelector('body');
var result = $.html();
el.innerHTML = result;

//// user code

