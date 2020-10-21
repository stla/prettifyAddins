#' Prettify LaTeX
#' @description Prettify LaTeX code, including Sweave code, \code{sty} files,
#'   \code{cls} files, and \code{bib} files.
#'
#' @param contents the code to be prettified; there are three possibilities for
#'   this argument:
#'   \code{NA} (default), to use the file currently opened in RStudio;
#'   the path to a file;
#'   or the code given as a character vector
#' @param tabSize number of spaces of the indentation (usually \code{2} or
#'   \code{4});
#'   if \code{NULL} (the default), there are two possibilities:
#'   if the contents is read from the current file in RStudio, then the
#'   number of spaces will be the one you use in RStudio;
#'   otherwise it is set to \code{2}
#' @param log logical, whether to generate a log file (it will be named
#'   \code{indent.log})
#'
#' @return The pretty code in a character string.
#'
#' @note This function requires the command line utility \code{latexindent}.
#'
#' @importFrom rstudioapi isAvailable
#' @importFrom tools file_ext
#' @export
prettifyLaTeX <- function(contents = NA, tabSize = NULL, log = FALSE){

  if(Sys.which("latexindent") == ""){
    stop(
      "This function requires `latexindent`. ",
      "Either it is not installed, or it is not found."
    )
  }

  if(!isNA(contents) && !isFile(contents)){
    ext <- "tex" # this works for bib, etc.
  }
  if(isNA(contents) && isAvailable()){
    context <- RStudioContext()
    ext <- tolower(file_ext(context[["path"]]))
    if(!is.element(ext, c("tex", "latex", "rnw", "bib", "sty", "cls"))){
      stop("Looks like this file is not a LaTeX file.")
    }
    if(is.null(tabSize)){
      tabSize <- RStudioTabSize()
    }
    contents <- context[["contents"]]
  }else if(isNA(contents)){
    stop("You have to provide something for the `contents` argument.")
    return(invisible())
  }else{
    if(is.null(tabSize)){
      if(isAvailable()){
        tabSize <- RStudioTabSize()
      }else{
        tabSize <- 2
      }
    }
    if(isFile(contents)){
      ext <- tolower(file_ext(contents))
      if(!is.element(ext, c("tex", "latex", "rnw", "bib", "sty", "cls"))){
        stop("Looks like this file is not a LaTeX file.")
      }
      contents <- suppressWarnings(readLines(contents))
    }
  }
  ext0 <- ifelse(ext == "rnw", "tex", ext)
  tmpDir <- tempdir()
  tmpFile <- tempfile(fileext = paste0(".", ext0))
  writeLines(contents, tmpFile)
  cruft <- if(!log) paste0("--cruft=", shQuote(tmpDir))
  prettyCode <- suppressWarnings(system2(
    "latexindent",
    c(
      tmpFile,
      sprintf(
        sprintf("-y='%s'",
                paste0(c(
                  "defaultIndent:\"%s\"",
                  "indentRules:displayMath:\"\"",
                  "indentRules:displayMathTeX:\"\""
                ), collapse = ",")
        ),
        paste0(rep(" ", tabSize), collapse = "")
      ),
      cruft
    ),
    stdout = TRUE, stderr = TRUE
  ))
  if(!is.null(attr(prettyCode, "status"))){
    stop(
      "Something went wrong. ",
      "Probably the code is not valid."
    )
  }
  paste0(prettyCode, collapse = "\n")
}
