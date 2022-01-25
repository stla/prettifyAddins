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
  phantomjs = function() reindent_PhantomJS(),
  latex = function() prettifyLaTeX(),
  julia = function() prettifyJulia(),
  python = function() prettifyPython(),
  fca = function() prettify_FCA(),
  html = function() prettifyHTML()
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
  if(!is.null(contents)) setDocumentContents(contents, context[["id"]])
}

PrettifyShiny <- function() Addin(addins$shiny$prettify)
IndentShiny <- function() Addin(addins$shiny$indent)
PrettifyV8 <- function() Addin(addins$v8$prettify)
IndentV8 <- function() Addin(addins$v8$indent)
PrettifyXML <- function() Addin(addins$xml)
PrettifyCLANG <- function() Addin(addins$clang)
IndentPhantomJS <- function() Addin(addins$phantomjs)
PrettifyLaTeX <- function() Addin(addins$latex)
PrettifyJulia <- function() Addin(addins$julia)
PrettifyPython <- function() Addin(addins$python)
PrettifyFCA <- function() Addin(addins$fca)
PrettifyHTML <- function() Addin(addins$html)
