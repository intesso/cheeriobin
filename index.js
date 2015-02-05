var fs = require('fs');
var ejs = require('ejs');
var debug = require('debug')('cheeriobin');
var keydown = require('keydown');
var Sandbox = require('browser-module-sandbox');
var marked = require('marked');

var config = require('./config');
var text2string = require('text-to-string');
var cheerioPreludeTmpl = fs.readFileSync('./tmpl/cheerio-prelude.js', 'utf-8');
var cheerioPostlude = fs.readFileSync('./tmpl/cheerio-postlude.js', 'utf-8');
var jqueryPreludeTmpl = fs.readFileSync('./tmpl/jquery-prelude.js', 'utf-8');
var jqueryPostlude = fs.readFileSync('./tmpl/jquery-postlude.js', 'utf-8');
var howtoMarkdown = fs.readFileSync('./howto.md', 'utf-8');

var messageSave = "<strong>Uee</strong>  your code is now saved in the local storage of your browser, yay.";
var messageStart = "<strong>Don't worry</strong> the evaluation of your code has just started.";
var messageAlert = "<strong>Uups</strong> something went wrong, I'm terribly sorry :-|";

function noop(e) {
  if (e && typeof e.preventDefault == 'function') e.preventDefault();
  return false;
}
/**
 * CheerioBin Constructor
 * @param opts
 * @returns {CheerioBin}
 * @constructor
 */
function CheerioBin(opts) {
  if (!(this instanceof CheerioBin)) return new CheerioBin(opts);

  this.counter = 0;
  this.parseMarkdown();
  this.initHtmlEditor();
  this.initJsEditor();
  this.getCode();
  this.attachListeners();
  this.setSaved();

  // TODO remove
  cheeriobin = this;

}

CheerioBin.prototype.parseMarkdown = function () {
  var selector = '.js-howto-html';
  var howtoHtml = marked(howtoMarkdown);
  var $el = $(selector);
  $el.empty();
  $el.prepend(howtoHtml);
};


CheerioBin.prototype.initHtmlEditor = function () {
  var self = this;
  editorHtml = this.editorHtml = CodeMirror.fromTextArea($('#js-code-html').get(0), {
    lineNumbers: true,
    mode: 'text/html',
    extraKeys: {
      "Ctrl-Space": "autocomplete"
    }
  });
  editorHtml.on('change', self.setChanged.bind(self));
};

CheerioBin.prototype.initJsEditor = function () {
  var self = this;
  editorJs = this.editorJs = CodeMirror.fromTextArea($('#js-code-js').get(0), {
    lineNumbers: true,
    extraKeys: {
      "Ctrl-Space": "autocomplete",
      "F11": function (cm) {
        cm.setOption("fullScreen", !cm.getOption("fullScreen"));
      }
      ,
      "Esc": function (cm) {
        if (cm.getOption("fullScreen")) cm.setOption("fullScreen", false);
      }
    },
    mode: {
      name: "javascript", globalVars: true
    },
    gutters: ['CodeMirror-lint-markers'],
    lint: true
  })
  ;
  editorJs.on('change', self.setChanged.bind(self));
}
;

CheerioBin.prototype.attachListeners = function () {
  var self = this;

  this.isTouchDevice = (true == ("ontouchstart" in window || window.DocumentTouch && document instanceof DocumentTouch));

  $('#js-run').on('click', function (e) {
    e.preventDefault();
    self.resetSpinner();
    self.updateOutputs();
    return false;
  });

  // handle keyboard shortcuts
  keydown({
    preventImmediate: false,
    preventDefault: true,
    stopPropagation: true
  });

  // save shortcut
  keydown(['<meta>', 'S']).on('pressed', self.saveCodeKeydown.bind(self));
  keydown(['<control>', 'S']).on('pressed', self.saveCodeKeydown.bind(self));

  // run shortcut
  keydown(['<meta>', '<enter>']).on('pressed', self.updateOutputs.bind(self));
  keydown(['<control>', '<enter>']).on('pressed', self.updateOutputs.bind(self));


  // fullscreen texteditor triggers
  $('[data-toggle="fullscreen"]').on('click', function (e) {
    var target = $(this).attr('data-target');
    debug('fullscreen on', target);
    self.enterFullScreen(target);
    e.preventDefault();
    e.stopPropagation();
    return false;
  });

  $('body').on('click', '.fullscreen-close', function (e) {
    console.log('fullscreen off');
    self.leaveFullScreen();
    e.preventDefault();
    e.stopPropagation();
    return false;
  });

  // stuff that should not run on touch devices
  if (this.isTouchDevice) return;
  $('[data-toggle="tooltip"]').tooltip().click(function (e) {
    $(this).tooltip('toggle');
  });

};

CheerioBin.prototype.enterFullScreen = function (selector) {
  // selector of the textarea: the next div is the div inserted from CodeMirror
  $(selector).toggleClass('fullscreen', 1000);
  $('.panel').css('opacity', 1);
  $(selector).parent().append('<i class="glyphicon glyphicon-remove fullscreen-close"></i>');
};

CheerioBin.prototype.leaveFullScreen = function () {
  // selector of the textarea: the next div is the div inserted from CodeMirror
  $('.fullscreen').toggleClass('fullscreen', 1000);
  $('.panel').removeAttr('style');
  $('.fullscreen-close').remove();
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
  }
};

CheerioBin.prototype.saveCodeKeydown = function () {
  this.message('.js-message-start', messageSave, 2500);
  this.saveCode();
};

CheerioBin.prototype.saveCode = function () {
  var userCode = {};
  userCode.html = this.editorHtml.getValue();
  userCode.js = this.editorJs.getValue();
  localStorage.setItem('CheerioBinUserCode', JSON.stringify(userCode));
  this.setSaved();
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

  try {
    var sandbox = Sandbox(opts);
    sandbox.bundle(code);
  } catch (err) {
    var title = '<h1>Sandbox could not be created</h1> please check your code<br/><br/>';
    debug(title, err);
    this.alert(title + '<pre>' + err + '</pre>');
  }
  this.attachSandboxListeners(sandbox);

};

CheerioBin.prototype.attachSandboxListeners = function (sandbox) {
  var self = this;
  if (typeof self.counter == 'undefined') self.counter = 0;
  sandbox.on('bundleStart', function () {
    self.counter++;
    debug('bundleStart');
    self.setRunning();
  });

  sandbox.on('bundleEnd', function (bundle) {
    debug('bundleEnd');
    if (--self.counter > 0) return;
    setTimeout(function () {
      self.setDone();
    }, 500);
  });

  sandbox.on('bundleError', function (err) {
    self.counter = 0;
    self.setDone();

    var title = '<h1>Bundling error</h1> please check the stuff you `require` or the cdn: ' + config.BROWSERIFYCDN + '<br/><br/>';
    debug(title, err);
    self.alert(title + '<pre>' + err + '</pre>');

  })
};

CheerioBin.prototype.setChanged = function () {
  // unicode star: '\u2B51'
  if (!(document.title.charAt(0) == '⭑')) {
    document.title = "⭑" + document.title;
  }
  var changedClass = document.querySelector('.js-changed').classList;
  changedClass.remove('hidden');
};

CheerioBin.prototype.setSaved = function () {
  // unicode star: '\u2B51'
  if ((document.title.charAt(0) == '⭑')) {
    document.title = document.title.replace('⭑', '');
  }
  var changedClass = document.querySelector('.js-changed').classList;
  changedClass.add('hidden');
};

CheerioBin.prototype.setRunning = function () {
  var loadingClass = document.querySelector('.spinner').classList;
  loadingClass.remove('hidden');
  $('#js-run').prop('disabled', true);
};

CheerioBin.prototype.setDone = function () {
  var loadingClass = document.querySelector('.spinner').classList;
  loadingClass.add('hidden');
  $('#js-run').prop('disabled', false);
};

CheerioBin.prototype.resetSpinner = function () {
  this.counter = 0;
  this.setDone();
};

CheerioBin.prototype.message = function (selector, message, delay) {
  var $el = $(selector);
  $el.html(message);
  $el.fadeIn();

  window.setTimeout(function () {
    $el.fadeOut();
  }, delay);
};

CheerioBin.prototype.alert = function (message) {
  alert('.js-alerts', '.js-alert-template', '.js-alert-message', message);
};

function alert(containerSelector, templateSelector, messageSelector, message) {
  var $container = $(containerSelector);
  var $template = $(templateSelector).html();
  $container.html($template);
  $(messageSelector).html(message);
  $container.alert();
}

module.exports = CheerioBin();
