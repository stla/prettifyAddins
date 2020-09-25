#' @import V8
#' @importFrom rstudioapi getSourceEditorContext setDocumentContents
#' @importFrom tools file_ext
NULL

prettifyV8 <- function(){
  context <- getSourceEditorContext()
  ext <- file_ext(context[["path"]])
  parser <- switch(
    tolower(ext),
    css = "css",
    html = "html",
    rhtml = "html",
    js = "babel",
    jsx = "babel",
    md = "markdown",
    markdown = "markdown",
    rmd = "markdown",
    scss = "css"
  )
  if(is.null(parser)){
    message("Unrecognized or unsupported language.")
    return(invisible())
  }
  code <- paste0(context[["contents"]], collapse = "\n")
  jsfile <- function(file){
    system.file(
      "shinyApp", "www", "prettier", file, package = "prettifyAddins"
    )
  }

  ctx <- v8(console = FALSE)
  ctx$source(jsfile("standalone.js"))
  js <- switch(
    parser,
    babel = "parser-babel.js",
    html = "parser-html.js",
    markdown = "parser-markdown.js",
    css = "parser-postcss.js"
  )
  ctx$source(jsfile(js))
  if(parser %in% c("html","markdown")){
    ctx$source(jsfile("parser-babel.js"))
    ctx$source(jsfile("parser-postcss.js"))
  }
  if(parser == "markdown"){
    ctx$source(jsfile("parser-html.js"))
  }
  prettify <- paste0(
    c(
      "function prettify(code, parser) {",
      "  var prettyCode = null, error = null;",
      "  try {",
      "    prettyCode = prettier.format(code, {",
      "      parser: parser,",
      "      plugins: prettierPlugins,",
      "      trailingComma: \"none\"",
      "    });",
      "  } catch(err) {",
      "    error = err.message;",
      "  }",
      "  return {prettyCode: prettyCode, error: error};",
      "}",
      "var result = prettify(code, parser);"
    ),
    collapse = "\n"
  )
  ctx$assign("code", code)
  ctx$assign("parser", parser)
  ctx$eval(prettify)
  result <- ctx$get("result")
  if(!is.null(err <- result[["error"]])){
    message(err)
    return(invisible())
  }
  setDocumentContents(text = result[["prettyCode"]], id = context[["id"]])
  return(invisible())
}
