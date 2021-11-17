function prettify(codeAndParserAndTabSize) {
  var prettyCode, error;
  var parser = codeAndParserAndTabSize.parser;
  try {
    if(parser === "sql"){
      prettyCode = sqlFormatter.format(
        codeAndParserAndTabSize.code,
        {
          indent: " ".repeat(codeAndParserAndTabSize.tabSize)
        }
      );
    }else{
      prettyCode = prettier.format(codeAndParserAndTabSize.code, {
        parser: parser,
        plugins: prettierPlugins,
        trailingComma: "none",
        tabWidth: codeAndParserAndTabSize.tabSize
      });
    }
    Shiny.setInputValue("prettyCode", prettyCode, { priority: "event" });
  } catch(err) {
    error = err.message;
    Shiny.setInputValue("prettifyError", error, { priority: "event" });
  }
}

function indentify(codeAndParserAndTabSize) {
  var prettyCode, error;
  var tabString = " ".repeat(codeAndParserAndTabSize.tabSize);
  try {
    switch(codeAndParserAndTabSize.parser) {
      case "js":
        prettyCode =
          indent.js(codeAndParserAndTabSize.code, {tabString: tabString});
        break;
      case "css":
        prettyCode =
          indent.css(codeAndParserAndTabSize.code, {tabString: tabString});
        break;
      case "html":
        prettyCode =
          indent.html(codeAndParserAndTabSize.code, {tabString: tabString});
        break;
      case "ts":
        prettyCode =
          indent.ts(codeAndParserAndTabSize.code, {tabString: tabString});
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
