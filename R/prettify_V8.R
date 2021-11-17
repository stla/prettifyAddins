#' Prettify code using V8
#' @description Prettify some code using the V8 package.
#'
#' @param contents the code to be prettified; there are three possibilities for
#'   this argument:
#'   \code{NA} (default), to use the file currently opened in RStudio;
#'   the path to a file;
#'   or the code given as a character vector
#' @param language the language of the code, such as \code{"javascript"};
#'   see \code{\link{getPrettifiableLanguages}};
#'   if the contents are read from a file and \code{language=NA}, then the
#'   language is guessed from the file extension
#' @param tabSize number of spaces of the indentation (usually \code{2} or
#'   \code{4});
#'   if \code{NULL} (the default), there are two possibilities:
#'   if the contents are read from the current file in RStudio, then the
#'   number of spaces will be the one you use in RStudio;
#'   otherwise it is set to \code{2}
#'
#' @return The pretty code in a character string.
#'
#' @importFrom rstudioapi isAvailable
#' @importFrom tools file_ext
#' @export
#'
#' @examples library(prettifyAddins)
#'
#' code <- c(
#'   "function f(x){",
#'   "return x+1",
#'   "}"
#' )
#' \donttest{cat(prettify_V8(code, "JavaScript"))}
prettify_V8 <- function(contents = NA, language = NA, tabSize = NULL){

  if(!requireNamespace("V8")){
    stop("This function requires the 'V8' package.")
  }

  language <- tolower(language)

  if(isNA(contents) && isAvailable()){
    context <- RStudioContext()
    if(is.na(language)){
      ext <- tolower(file_ext(context[["path"]]))
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
  }else if(isNA(contents)){
    stop("You have to provide something for the `contents` argument.")
  }else{
    if(is.na(language)){
      if(!isFile(contents)){
        stop("You have to set a language.")
      }
      ext <- tolower(file_ext(contents))
      if(ext %in% names(Languages()[["prettify"]])){
        language <- Languages()[["prettify"]][[ext]]
      }else{
        stop("Unrecognized or unsupported language.")
      }
    }else if(!is.element(language, Languages()[["prettify"]])){
      stop("Unrecognized or unsupported language.")
    }
    if(isFile(contents)){
      contents <- suppressWarnings(readLines(contents))
    }
    if(is.null(tabSize)){
      if(isAvailable()){
        tabSize <- RStudioTabSize()
      }else{
        tabSize <- 2
      }
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
    scss = "css",
    sql = "sql",
    ts = "typescript",
    tsx = "typescript",
    typescript = "typescript",
    yaml = "yaml"
  )


  jsfile <- function(file, folder = "prettier"){
    system.file(
      "shinyApp", "www", folder, file, package = "prettifyAddins"
    )
  }

  addsfile <- function(file){
    system.file(
      "V8adds", file, package = "prettifyAddins"
    )
  }

  ctx <- V8::v8(console = FALSE)

  if(parser != "sql"){
    tryCatch({
      ctx$source(jsfile("standalone.js"))
    }, error = function(e){
      stop(
        "'V8' has failed to source some files. ",
        "Probably your version of the 'V8' engine is not recent enough."
      )
    })

    ctx$source(addsfile("StringTrim.js"))

    js <- switch(
      parser,
      babel = "parser-babel.js",
      html = "parser-html.js",
      markdown = "parser-markdown.js",
      css = "parser-postcss.js",
      yaml = "parser-yaml.js",
      typescript = "parser-typescript.js"
    )
    ctx$source(jsfile(js))
    if(parser %in% c("html","markdown")){
      ctx$source(jsfile("parser-babel.js"))
      ctx$source(jsfile("parser-postcss.js"))
    }
    if(parser == "markdown"){
      ctx$source(jsfile("parser-html.js"))
      ctx$source(jsfile("parser-yaml.js"))
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
  }else{
    ctx$source(jsfile("regexpu-core_bundle.js", folder = "sql-formatter"))
    ctx$eval("var rewritePattern = require('regexpu-core');")
    ctx$source(jsfile("sql-formatter_bundle.js", folder = "sql-formatter"))
    prettify <- paste0(
      c(
        "var sqlFormatter = require('sql-formatter');",
        "function prettify(code, tabSize) {",
        "  var prettyCode = null, error = null;",
        "  try {",
        "    prettyCode = sqlFormatter.format(code, {",
        "      indent: ' '.repeat(tabSize)",
        "    });",
        "  } catch(err) {",
        "    error = err.message;",
        "  }",
        "  return {prettyCode: prettyCode, error: error};",
        "}",
        "var result = prettify(code, tabSize);"
      ),
      collapse = "\n"
    )
  }

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


#' Reindent code using V8
#' @description Reindent some code using the V8 package.
#'
#' @param contents the code to be reindented; there are three possibilities for
#'   this argument:
#'   \code{NA} (default), to use the file currently opened in RStudio;
#'   the path to a file;
#'   or the code given as a character vector
#' @param language the language of the code, such as \code{"javascript"};
#'   see \code{\link{getPrettifiableLanguages}};
#'   if the contents are read from a file and \code{language=NA}, then the
#'   language is guessed from the file extension
#' @param tabSize number of spaces of the indentation (usually \code{2} or
#'   \code{4});
#'   if \code{NULL} (the default), there are two possibilities:
#'   if the contents are read from the current file in RStudio, then the
#'   number of spaces will be the one you use in RStudio;
#'   otherwise it is set to \code{2}
#'
#' @return The reindented code in a character string.
#'
#' @importFrom rstudioapi isAvailable
#' @importFrom tools file_ext
#' @export
#'
#' @examples library(prettifyAddins)
#'
#' code <- c(
#'   "function f(x){",
#'   "return x+1",
#'   "}"
#' )
#' \donttest{cat(reindent_V8(code, "javascript"))}
reindent_V8 <- function(contents = NA, language = NA, tabSize = NULL){

  if(!requireNamespace("V8")){
    stop("This function requires the 'V8' package.")
  }

  language <- tolower(language)

  if(isNA(contents) && isAvailable()){
    context <- RStudioContext()
    if(is.na(language)){
      ext <- tolower(file_ext(context[["path"]]))
      if(ext %in% names(Languages()[["indentify"]])){
        language <- Languages()[["indentify"]][[ext]]
      }else{
        stop("Unrecognized or unsupported language.")
      }
    }else{
      if(!is.element(language, Languages()[["indentify"]])){
        stop("Unrecognized or unsupported language.")
      }
    }
    if(is.null(tabSize)){
      tabSize <- RStudioTabSize()
    }
    contents <- context[["contents"]]
  }else if(isNA(contents)){
    stop("You have to provide something for the `contents` argument.")
  }else{
    if(is.na(language)){
      if(!isFile(contents)){
        stop("You have to set a language.")
      }
      ext <- tolower(file_ext(contents))
      if(ext %in% names(Languages()[["indentify"]])){
        language <- Languages()[["indentify"]][[ext]]
      }else{
        stop("Unrecognized or unsupported language.")
      }
    }else if(!is.element(language, Languages()[["indentify"]])){
      stop("Unrecognized or unsupported language.")
    }
    if(isFile(contents)){
      contents <- suppressWarnings(readLines(contents))
    }
    if(is.null(tabSize)){
      if(isAvailable()){
        tabSize <- RStudioTabSize()
      }else{
        tabSize <- 2
      }
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
    scss = "css",
    typescript = "ts",
    ts = "ts",
    tsx = "ts",
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
      "      case \"ts\":",
      "        prettyCode = indent.ts(code, {tabString: tabString});",
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
