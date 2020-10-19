addins <- list(
  shiny = list(
    prettify = function() prettify_Shiny(),
    indent = function() reindent_Shiny()
  ),
  v8 = list(
    prettify = function() prettify_V8(),
    indent = function() reindent_V8()
  ),
  xml = function() prettifyXML(),
  clang = function() prettifyCLANG(),
  phantomjs = function() reindent_PhantomJS()
)

#' @importFrom rstudioapi setDocumentContents
#' @keywords internal
Addin <- function(f){
  context <- RStudioContext()
  contents <- tryCatch({
    f()
  }, error = function(e){
    e
  })
  if(inherits(contents, "error")){
    message("Something went wrong. ", contents$message)
    return(invisible())
  }
  setDocumentContents(contents, context[["id"]])
}

PrettifyShiny <- function() Addin(addins$shiny$prettify)
IndentShiny <- function() Addin(addins$shiny$indent)
PrettifyV8 <- function() Addin(addins$v8$prettify)
IndentV8 <- function() Addin(addins$v8$indent)
PrettifyXML <- function() Addin(addins$xml)
PrettifyCLANG <- function() Addin(addins$clang)
IndentPhantomJS <- function() Addin(addins$phantomjs)