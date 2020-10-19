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
  clang = function() prettifyCLANG()
)

#' @importFrom rstudioapi setDocumentContents
#' @keywords internal
Addin <- function(f){
  context <- RStudioContext()
  contents <- f()
  setDocumentContents(contents, context[["id"]])
}

PrettifyShiny <- function() Addin(addins$shiny$prettify)
IndentShiny <- function() Addin(addins$shiny$indent)
PrettifyV8 <- function() Addin(addins$v8$prettify)
IndentV8 <- function() Addin(addins$v8$indent)
PrettifyXML <- function() Addin(addins$xml)
PrettifyCLANG <- function() Addin(addins$clang)
