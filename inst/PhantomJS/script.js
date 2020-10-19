// phantomjs phantomjs04.js $'if test == 1:\nprint "it is one"\nelse:\nprint "it is not one"' python
"use strict";

var system = require("system");
var args = system.args; // [codemirror.js, formatting.js, meta.js, {mode}.js, code, mode]

var page = require("webpage").create();

page.onConsoleMessage = function (str) {
  console.log(str);
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
            page.evaluate(function (mode) {
              var editor = CodeMirror.fromTextArea(
                document.getElementById("editor"),
                {
                  lineNumbers: true,
                  mode: mode,
                  lineWrapping: true
                }
              );
              CodeMirror.commands.selectAll(editor);
              editor.autoFormatRange(
                editor.getCursor(true),
                editor.getCursor(false)
              );
              editor.setCursor(0);
              console.log(editor.getValue());
            }, args[6]);
          } else {
            console.log("injectJs failed");
            phantom.exit(1);
          }
        } else {
          console.log("injectJs failed");
          phantom.exit(1);
        }
      } else {
        console.log("injectJs failed");
        phantom.exit(1);
      }
    } else {
      console.log("injectJs failed");
      phantom.exit(1);
    }
  } else {
    console.log("issue status");
    phantom.exit(1);
  }
  phantom.exit(0);
});
