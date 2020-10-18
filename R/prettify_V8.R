#' @importFrom rstudioapi isAvailable
#' @importFrom tools file_ext
#' @export
prettify_V8 <- function(contents = NA, language = NA, tabSize = NULL){

  if(!requireNamespace("V8")){
    stop("This function requires the 'V8' package.")
  }

  if(is.na(contents) && isAvailable()){
    context <- RStudioContext()
    if(is.na(language)){
      ext <- file_ext(context[["path"]])
      if(ext %in% names(Languages()[["prettify"]])){
        language <- Languages()[["prettify"]][[ext]]
      }else{
        stop("Unrecognized or unsupported language.")
      }
    }else{
      if(!is.element(language, Languages()[["prettify"]])){
        stop("Unrecognized or unsupported language.")
      }
    }
    if(is.null(tabSize)){
      tabSize <- RStudioTabSize()
    }
    contents <- context[["contents"]]
  }else if(is.na(contents)){
    stop("You have to provide something for the `contents` argument.")
  }else{
    if(!is.element(language, Languages()[["prettify"]])){
      stop("Unrecognized or unsupported language.")
    }
    if(is.null(tabSize)){
      if(isAvailable()){
        tabSize <- RStudioTabSize()
      }else{
        tabSize <- 2
      }
    }
    if(file.exists(contents)){
      ext <- tolower(file_ext(contents))
      if(ext %in% names(Languages()[["prettify"]])){
        language <- Languages()[["prettify"]][[ext]]
      }else{
        stop("Unrecognized or unsupported language.")
      }
      contents <- suppressWarnings(readLines(contents))
    }
  }
  code <- paste0(contents, collapse = "\n")

  parser <- switch(
    tolower(language),
    css = "css",
    html = "html",
    rhtml = "html",
    js = "babel",
    javascript = "babel",
    jsx = "babel",
    md = "markdown",
    markdown = "markdown",
    rmd = "markdown",
    scss = "css"
  )


  jsfile <- function(file){
    system.file(
      "shinyApp", "www", "prettier", file, package = "prettifyAddins"
    )
  }

  ctx <- V8::v8(console = FALSE)
  tryCatch({
    ctx$source(jsfile("standalone.js"))
  }, error = function(e){
    stop(
      "'V8' has failed to source some files. ",
      "Probably your version of the 'V8' engine is not recent enough."
    )
  })

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
      "function prettify(code, parser, tabSize) {",
      "  var prettyCode = null, error = null;",
      "  try {",
      "    prettyCode = prettier.format(code, {",
      "      parser: parser,",
      "      plugins: prettierPlugins,",
      "      trailingComma: \"none\",",
      "      tabWidth: tabSize,",
      "      printWidth: 80",
      "    });",
      "  } catch(err) {",
      "    error = err.message;",
      "  }",
      "  return {prettyCode: prettyCode, error: error};",
      "}",
      "var result = prettify(code, parser, tabSize);"
    ),
    collapse = "\n"
  )
  ctx$assign("code", code)
  ctx$assign("parser", parser)
  ctx$assign("tabSize", tabSize)
  ctx$eval(prettify)
  result <- ctx$get("result")
  if(!is.null(err <- result[["error"]])){
    stop(err)
  }
  result[["prettyCode"]]
}


#' @importFrom rstudioapi isAvailable
#' @importFrom tools file_ext
#' @export
indentify_V8 <- function(contents = NA, language = NA, tabSize = NULL){

  if(!requireNamespace("V8")){
    stop("This function requires the 'V8' package.")
  }

  if(is.na(contents) && isAvailable()){
    context <- RStudioContext()
    if(is.na(language)){
      ext <- file_ext(context[["path"]])
      if(ext %in% names(Languages()[["prettify"]])){
        language <- Languages()[["prettify"]][[ext]]
      }else{
        stop("Unrecognized or unsupported language.")
      }
    }else{
      if(!is.element(language, Languages()[["prettify"]])){
        stop("Unrecognized or unsupported language.")
      }
    }
    if(is.null(tabSize)){
      tabSize <- RStudioTabSize()
    }
    contents <- context[["contents"]]
  }else if(is.na(contents)){
    stop("You have to provide something for the `contents` argument.")
  }else{
    if(!is.element(language, Languages()[["prettify"]])){
      stop("Unrecognized or unsupported language.")
    }
    if(is.null(tabSize)){
      if(isAvailable()){
        tabSize <- RStudioTabSize()
      }else{
        tabSize <- 2
      }
    }
    if(file.exists(contents)){
      if(ext %in% names(Languages()[["prettify"]])){
        language <- Languages()[["prettify"]][[ext]]
      }else{
        stop("Unrecognized or unsupported language.")
      }
      contents <- suppressWarnings(readLines(contents))
    }
  }
  code <- paste0(contents, collapse = "\n")

  parser <- switch(
    tolower(language),
    css = "css",
    html = "html",
    rhtml = "html",
    javascript = "js",
    js = "js",
    jsx = "js",
    scss = "css"
  )

  jsfile <- system.file(
    "shinyApp", "www", "indent", "indent.min.js", package = "prettifyAddins"
  )

  ctx <- V8::v8(console = FALSE)
  tryCatch({
    ctx$source(jsfile)
  }, error = function(e){
    stop(
      "'V8' has failed to source some files. ",
      "Probably your version of the 'V8' engine is not recent enough."
    )
  })

  indentify <- paste0(
    c(
      "function indentify(code, parser, tabSize) {",
      "  var prettyCode = null, error = null;",
      "  var tabString = \" \".repeat(tabSize);",
      "  try {",
      "    switch(parser) {",
      "      case \"js\":",
      "        prettyCode = indent.js(code, {tabString: tabString});",
      "        break;",
      "      case \"css\":",
      "        prettyCode = indent.css(code, {tabString: tabString});",
      "        break;",
      "      case \"html\":",
      "        prettyCode = indent.html(code, {tabString: tabString});",
      "        break;",
      "    }",
      "  } catch(err) {",
      "    error = err.message;",
      "  }",
      "  return {prettyCode: prettyCode, error: error};",
      "}",
      "var result = indentify(code, parser, tabSize);"
    ),
    collapse = "\n"
  )
  ctx$assign("code", code)
  ctx$assign("parser", parser)
  ctx$assign("tabSize", tabSize)
  ctx$eval(indentify)
  result <- ctx$get("result")
  if(!is.null(err <- result[["error"]])){
    stop(err)
  }
  result[["prettyCode"]]
}
