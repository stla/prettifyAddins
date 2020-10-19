function indentify(codeAndParserAndTabSize) {
  var editor = CodeMirror.fromTextArea(document.getElementById("editor"), {
    mode: codeAndParserAndTabSize.parser,
    tabSize: codeAndParserAndTabSize.tabSize,
    indentUnit: codeAndParserAndTabSize.tabSize,
    lineNumbers: true,
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
