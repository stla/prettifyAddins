#' Prettify XML
#' @description Prettify some XML or SVG code.
#'
#' @param contents the code to be prettified; there are three possibilities for
#'   this argument:
#'   \code{NA} (default), to use the file currently opened in RStudio;
#'   the path to a file;
#'   or the code given as a character vector
#' @param tabSize number of spaces of the indentation (usually \code{2} or
#'   \code{4});
#'   if \code{NULL} (the default), there are two possibilities:
#'   if the contents are read from the current file in RStudio, then the
#'   number of spaces will be the one you use in RStudio;
#'   otherwise it is set to \code{2}
#'
#' @return The pretty code in a character string.
#'
#' @details The code is prettified with the help of the command line utility
#'   \code{xmllint} if it is available, otherwise the \code{xml2} is used.
#'
#' @importFrom rstudioapi isAvailable
#' @importFrom tools file_ext
#' @importFrom xml2 read_xml
#' @export
prettifyXML <- function(contents = NA, tabSize = NULL){
  if(isNA(contents) && isAvailable()){
    context <- RStudioContext()
    ext <- tolower(file_ext(context[["path"]]))
    if(!is.element(ext, c("xml", "svg"))){
      stop("Looks like this file is not a XML file.")
    }
    if(is.null(tabSize)){
      tabSize <- RStudioTabSize()
    }
    contents <- context[["contents"]]
  }else if(isNA(contents)){
    stop("You have to provide something for the `contents` argument.")
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
      if(!is.element(ext, c("xml", "svg"))){
        stop("Looks like this file is not a XML file.")
      }
      contents <- suppressWarnings(readLines(contents))
    }
  }
  if(Sys.which("xmllint") == ""){
    message(
      "`xmllint` not found --- using `xml2` (ignoring `tabSize`)"
    )
    prettyCode <- tryCatch({
      as.character(read_xml(paste0(contents, collapse = "\n")))
    }, error = function(e){
      NULL
    })
    if(is.null(prettyCode)){
      stop(
        "Something went wrong. ",
        "Probably the code is not valid."
      )
    }
  }else{
    tmpFile <- tempfile(fileext = ".xml")
    writeLines(contents, tmpFile)
    Sys.setenv(XMLLINT_INDENT = paste0(rep(" ", tabSize), collapse = ""))
    prettyCode <- suppressWarnings(system2(
      "xmllint", paste0("--format ", tmpFile), stdout = TRUE, stderr = TRUE
    ))
    if(!is.null(attr(prettyCode, "status"))){
      stop(
        "Something went wrong. ",
        "Probably the code is not valid."
      )
    }
    prettyCode <- paste0(prettyCode, collapse = "\n")
  }

  prettyCode
}

# todo: ligne de commande pour python? on verra RStudio 1.4
