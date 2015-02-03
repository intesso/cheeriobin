var fs = require('fs');
var ejs = require('ejs');
var debug = require('debug')('cheeriobin');
var keydown = require('keydown');
var Sandbox = require('browser-module-sandbox');

var config = require('./config');
var text2string = require('text-to-string');
var cheerioPreludeTmpl = fs.readFileSync('./tmpl/cheerio-prelude.js', 'utf-8');
var cheerioPostlude = fs.readFileSync('./tmpl/cheerio-postlude.js', 'utf-8');
var jqueryPreludeTmpl = fs.readFileSync('./tmpl/jquery-prelude.js', 'utf-8');
var jqueryPostlude = fs.readFileSync('./tmpl/jquery-postlude.js', 'utf-8');

function noop(e) {
  if (e && typeof e.preventDefault == 'function') e.preventDefault();
  return false;
};

/**
 * CheerioBin Constructor
 * @param opts
 * @returns {CheerioBin}
 * @constructor
 */
function CheerioBin(opts) {
  if (!(this instanceof CheerioBin)) return new CheerioBin(opts);

  this.initHtmlEditor();
  this.initJsEditor();
  this.getCode();
  this.attachListeners();
}


CheerioBin.prototype.initHtmlEditor = function () {
  editorHtml = this.editorHtml = CodeMirror.fromTextArea($('#js-code-html').get(0), {
    lineNumbers: true,
    mode: 'text/html',
    extraKeys: {'Ctrl-Space': 'autocomplete'}
  });
};

CheerioBin.prototype.initJsEditor = function () {
  editorJs = this.editorJs = CodeMirror.fromTextArea($('#js-code-js').get(0), {
    lineNumbers: true,
    mode: 'javascript',
    gutters: ['CodeMirror-lint-markers'],
    lint: true
  });
};

CheerioBin.prototype.attachListeners = function () {
  var self = this;

  $('#js-run').on('click', function (e) {
    e.preventDefault();
    self.updateOutputs();
    return false;
  });

  $('[data-toggle="tooltip"]').tooltip();

  // handle keyboard shortcuts
  keydown({
    preventImmediate: false,
    preventDefault: true,
    stopPropagation: true
  });

  // save shortcut
  keydown(['<meta>', 'S']).on('pressed', self.saveCode.bind(self));
  keydown(['<control>', 'S']).on('pressed', self.saveCode.bind(self));

  // run shortcut
  keydown(['<meta>', '<enter>']).on('pressed', self.updateOutputs.bind(self));
  keydown(['<control>', '<enter>']).on('pressed', self.updateOutputs.bind(self));

};

CheerioBin.prototype.updateOutputs = function () {
  var userCode = this.saveCode();
  this.prepareIFrameSandbox('cheerio', '#js-cheerio', userCode.html, userCode.js, cheerioPreludeTmpl, cheerioPostlude);
  this.prepareIFrameSandbox('jquery', '#js-jquery', userCode.html, userCode.js, jqueryPreludeTmpl, jqueryPostlude);
};

CheerioBin.prototype.getCode = function () {
  var storage = JSON.parse(localStorage.getItem('CheerioBinUserCode'));
  if (storage) {
    this.editorHtml.setValue(storage.html);
    this.editorJs.setValue(storage.js);
  } else {

  }
}

CheerioBin.prototype.saveCode = function () {
  debug('save');
  var userCode = {};
  userCode.html = this.editorHtml.getValue();
  userCode.js = this.editorJs.getValue();
  localStorage.setItem('CheerioBinUserCode', JSON.stringify(userCode));
  debug('userCode', userCode);
  return userCode;
};


CheerioBin.prototype.prepareIFrameSandbox = function (name, selector, userHtml, userJs, prelude, postlude) {
  // escape quotes userCode html textarea value (input)
  var html = '<body>' + userHtml + '</body>';
  var html = text2string(html);
  debug('html', html);

  // prepare iframe javascript code
  var renderedPrelude = ejs.render(prelude, {html: html});
  var code = renderedPrelude + userJs + postlude;

  var $el = $(selector);
  var container = $el.get(0);
  // remove old iframe
  $el.empty();
  debug('code', code);

  // create new iframe
  this.createIFrameSandbox(container, name, code);

};


CheerioBin.prototype.createIFrameSandbox = function (container, name, code) {

  var opts = {
    name: name,
    cdn: config.BROWSERIFYCDN,
    container: container,
    iframeStyle: "body, html { height: 100%; width: 100%; }",
    sandboxAttributes: ['allow-scripts', 'allow-same-origin'],
    cacheOpts: {inMemory: true}
  };

  var sandbox = Sandbox(opts);
  sandbox.bundle(code);

};

module.exports = CheerioBin();
