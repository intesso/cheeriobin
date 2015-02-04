var src = './css/github-page.css';
var target = './css/github-fragment.css';

var fs = require('fs');
var rework = require('rework');
var bootstrap = require('rework-bootstrap');

var css = fs.readFileSync(src, 'utf-8');
css = rework(css)
  .use(bootstrap('.nested-markdown'))
  .toString();
fs.writeFileSync(target, css, 'utf-8');
