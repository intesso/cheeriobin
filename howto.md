# motivation

[cheerio](//github.com/cheeriojs/cheerio) is a great server side module to run most of [jQuery's](http://api.jquery.com/) core functions on the node.js server.
comparing the cheerio and jquery results can be tedious.
with requirebin you can now run Cheerio and jQuery commands simultaneously.


# how to
 1. enter your html code you want to evaluate in the html template editor
 2. enter your javascript into the editor. hint: use `$` for jQuery and Cheerio commands.
 3. run the code

### tips
 - you can require anything that can be browserified.
 - since cheerio is not attached to the [DOM](//developer.mozilla.org/en-US/docs/Web/API), you have to run `.html()` and insert into the dom or the console.
 - the html editor has autocomplete function when you press ctrl+space.
 - the js editor (helps) you to write nice javascript with semicolon etc. :-|


# how it works
it runs everything in the browser. therefore the time measured may be quite different than it would be on the server.
before your code runs, cheeriobin loads all the modules you require'd in your code.
It then runs the following code before your code as well:

### jQuery Prelude
```javascript
// make jquery object available from the console for the cheerio iframe as $
var $ = window.$ = require('jquery');
var el = document.querySelector('body');

// insert the user html into the body
el.innerHTML = <%- html  %>;

// then run the js editor user code
```

### Cheerio Prelude
```javascript
var cheerio = window.cheerio = require('cheerio');
// make cheerio object available from the console for the cheerio iframe as $
var $ = window.$ = cheerio.load(<%- html  %>);

// insert the parsed user html into the body
var el = document.querySelector('body');
var result = $.html();
el.innerHTML = result;

// then run the js editor user code
```


# credits / inspiration

> [Standing On The Shoulders Of Giants](http://en.wikipedia.org/wiki/Standing_on_the_shoulders_of_giants)

 - http://api.jquery.com/
 - https://github.com/cheeriojs/cheerio/blob/master/Readme.md
 - http://browserify.org/
 - https://www.npmjs.com/
 - http://requirebin.com/
 - https://github.com/jesusabdullah/browserify-cdn
 - http://codemirror.net/
 - http://getbootstrap.com/

# license

MIT

provided by [intesso](//intesso.com)
