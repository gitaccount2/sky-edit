/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: true latedef: false browser: true */
/*global define: true port: true */
!define(function(require, exports) {

"use strict";

var data = require("self").data
var PageMod = require("addon-kit/page-mod").PageMod
var protocol = require("https://raw.github.com/Gozala/jetpack-protocol/v0.1.0/protocol.js")
var fs = require("https://raw.github.com/Gozala/jetpack-io/v0.2.1/fs.js")

const PROTOCOL = 'edit'
const editorURI = data.url('index.html')
const rootURI = editorURI.substr(0, editorURI.lastIndexOf('/') + 1)

function errorToJSON(error) {
  return error ? { message: error.message, stack: error.stack } : error
}

var mod  = PageMod({
  include: PROTOCOL + ':*',
  contentScript: 'unsafeWindow.port = self.port',
  contentScriptWhen: 'start',
  onAttach: function onAttach(worker) {
    worker.port.on('<=', function onMessage(message) {
      fs[message.method].apply(fs, message.params.concat([function(error) {
          worker.port.emit('=>', {
            '@': message['@'],
            params: [errorToJSON(error)].concat(Array.slice(arguments, 1))
          })
      }]))
    })
  }
})

// Registers protocol handler for `edit:*` protocol.
var editProtocolHandler = protocol.Handler({
  // When browser is navigated to `edit:*` URI this function is called with an
  // absolute URI and returned content or content under returned URI will be
  // displayed to a user.
  onRequest: function(request, response) {
    var uri = request.uri
    var referer = request.referer
    if (0 === uri.indexOf('edit:')) {
      response.content = data.load('index.html')
      response.contentType = 'text/html'
      response.originalURI = editorURI
    } else {
      response.uri = rootURI + uri
    }
  }
})
editProtocolHandler.listen({ scheme: PROTOCOL })

});
