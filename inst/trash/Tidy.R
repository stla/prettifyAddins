#' Indent HTML
#' @description Indent HTML code, works with big files.
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
#'
#' @return The indented code in a character string.
#'
#' @note This function requires the command line utility \code{tidy}. On
#'   Windows, you can install it with Chocolatey.
#'
#' @importFrom rstudioapi isAvailable
#' @importFrom tools file_ext
#' @export
tidyHTML <- function(contents = NA, tabSize = NULL){

  if(Sys.which("tidy") == ""){
    stop(
      "This function requires `tidy`. ",
      "Either it is not installed, or it is not found."
    )
  }

  if(!isNA(contents) && !isFile(contents)){
    ext <- "html"
  }
  if(isNA(contents) && isAvailable()){
    context <- RStudioContext()
    ext <- tolower(file_ext(context[["path"]]))
    if(!is.element(ext, c("html", "htm", "rhtml"))){
      stop("Looks like this file is not a HTML file.")
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
      if(!is.element(ext, c("html", "htm", "rhtml"))){
        stop("Looks like this file is not a HTML file.")
      }
      contents <- suppressWarnings(readLines(contents))
    }
  }
  tmpDir <- tempdir()
  tmpFile <- tempfile(fileext = paste0(".", ext))
  writeLines(contents, tmpFile)
  tidyCode <- suppressWarnings(system2(
    "tidy",
    c(
      "-i",
      "--wrap 80",
      "--wrap-script-literals yes",
      sprintf("--tab-size %d", as.integer(tabSize)),
      "--tidy-mark no",
      "--show-info no",
      "--show-warnings no",
      "--quiet yes",
      tmpFile
    ),
    stdout = TRUE, stderr = TRUE
  ))
  status <- attr(tidyCode, "status")
  if(!is.null(status) && status != 1L){
    stop(
      "Something went wrong. ",
      "Probably the code is not valid."
    )
  }
  paste0(tidyCode, collapse = "\n")
}


#' Indent big HTML file
#' @description Indent a big HTML file.
#'
#' @inheritParams tidyHTML
#'
#' @return The indented code in a character string.
#' @export
#'
#' @details This function calls \code{\link{tidyHTML}} followed by
#'   \code{\link{foldCode}}.
reindent_bigHTML <- function(contents = NA, tabSize = NULL){
  foldCode(tidyHTML(contents, tabSize))
}
