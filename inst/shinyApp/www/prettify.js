function prettify(codeAndParser) {
  var prettyCode, error;
  try {
    prettyCode = prettier.format(codeAndParser.code, {
      parser: codeAndParser.parser,
      plugins: prettierPlugins,
      trailingComma: "none"
    });
    Shiny.setInputValue("prettyCode", prettyCode, { priority: "event" });
  } catch(err) {
    error = err.message;
    Shiny.setInputValue("prettifyError", error, { priority: "event" });
  }
}

function indentify(codeAndParser) {
  var prettyCode, error;
  try {
    switch(codeAndParser.parser) {
      case "js":
        prettyCode = indent.js(codeAndParser.code, {tabString: "  "});
        break;
      case "css":
        prettyCode = indent.css(codeAndParser.code, {tabString: "  "});
        break;
      case "html":
        prettyCode = indent.html(codeAndParser.code, {tabString: "  "});
        break;
    }
    Shiny.setInputValue("prettyCode", prettyCode, { priority: "event" });
  } catch(err) {
    error = err.message;
    Shiny.setInputValue("prettifyError", error, { priority: "event" });
  }
}

$(document).on("shiny:connected", function() {
  Shiny.addCustomMessageHandler("prettify", prettify);
  Shiny.addCustomMessageHandler("indentify", indentify);
});
