#' Prettify Addins
#'
#' This package provides some RStudio addins: \code{Prettify} addins and
#'   \code{Indent} addins. To run an addin, select it from the Addins menu
#'   within RStudio. The \code{Indent} addins only reindent the code, while
#'   the \code{Prettify} addins also modify the code, e.g. they add trailing
#'   semi-colons to JavaScript code when they are missing.
#'
#' @name prettifyAddins
#' @docType package
#'
#' @examples # Here is the list of supported languages:
#' list(
#'   Shiny = list(
#'     Prettify = c("HTML", "CSS", "SCSS", "JavaScript", "JSX", "Markdown"),
#'     Indent = c("HTML", "CSS", "SCSS", "JavaScript", "JSX", "C(++)", "Java",
#'                "Python", "SAS", "Shell", "SQL")
#'   ),
#'   V8 = list(
#'     Prettify = c("HTML", "CSS", "SCSS", "JavaScript", "JSX", "Markdown"),
#'     Indent = c("HTML", "CSS", "SCSS", "JavaScript", "JSX")
#'   ),
#'   CLANG = c("C(++)", "Java"),
#'   XML = c("XML", "SVG")
#' )
NULL
