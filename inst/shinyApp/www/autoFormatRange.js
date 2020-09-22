function indentify(codeAndParser) {
  var editor = CodeMirror.fromTextArea(document.getElementById("editor"), {
    lineNumbers: true,
    mode: codeAndParser.parser,
    lineWrapping: true,
    theme: theme
  });
  var prettyCode, error;
  try {
    CodeMirror.commands.selectAll(editor);
    editor.autoFormatRange(editor.getCursor(true), editor.getCursor(false));
    editor.setCursor(0);
    prettyCode = editor.getValue();
    Shiny.setInputValue("prettyCode", prettyCode, { priority: "event" });
  } catch(err) {
    error = err.message;
    Shiny.setInputValue("prettifyError", error, { priority: "event" });
  }
}

$(document).on("shiny:connected", function() {
  Shiny.addCustomMessageHandler("indentify", indentify);
});
