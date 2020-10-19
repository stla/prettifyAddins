"use strict";

var system = require("system");
var args = system.args; // [codemirror.js, formatting.js, meta.js, {mode}.js, code, mode, tabSize]

var page = require("webpage").create();

page.onConsoleMessage = function (str) {
  console.log(str);
};
page.onError = function (msg, trace) {
  console.error(msg);
  phantom.exit(1);
};

phantom.onError = function (msg, trace) {
  // this is the effective one, with throw
  console.error(msg);
  phantom.exit(1);
};

page.open("about:blank", function (status) {
  if (status === "success") {
    page.content =
      '<html><body><textarea id="editor">' +
      args[5] +
      "</textarea></body></html>";

    if (page.injectJs(args[1])) {
      if (page.injectJs(args[2])) {
        if (page.injectJs(args[3])) {
          if (page.injectJs(args[4])) {
            page.evaluate(function (args) {
              var editor = CodeMirror.fromTextArea(
                document.getElementById("editor"),
                {
                  mode: args[6],
                  tabSize: parseInt(args[7]),
                  indentUnit: parseInt(args[7])
                }
              );
              CodeMirror.commands.selectAll(editor);
              editor.autoFormatRange(
                editor.getCursor(true),
                editor.getCursor(false)
              );
              editor.setCursor(0);
              console.log(editor.getValue());
            }, args);
          } else {
            console.error("injectJs failed");
            throw new Error("injectJs failed");
            phantom.exit(1);
          }
        } else {
          console.error("injectJs failed");
          throw new Error("injectJs failed");
          phantom.exit(1);
        }
      } else {
        console.error("injectJs failed");
        throw new Error("injectJs failed");
        phantom.exit(1);
      }
    } else {
      console.error("injectJs failed");
      throw new Error("injectJs failed");
      phantom.exit(1);
    }
  } else {
    console.error("issue with status");
    throw new Error("issue with status");
    phantom.exit(1);
  }
  phantom.exit(0);
});
