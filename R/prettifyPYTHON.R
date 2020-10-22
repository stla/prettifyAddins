#' Prettify Python
#' @description Prettify Python code.
#'
#' @param contents the code to be prettified; there are three possibilities for
#'   this argument:
#'   \code{NA} (default), to use the file currently opened in RStudio;
#'   the path to a file;
#'   or the code given as a character vector
#'
#' @return The pretty code in a character string.
#'
#' @note This function requires \href{https://github.com/psf/black}{black}.
#'
#' @importFrom rstudioapi isAvailable
#' @importFrom tools file_ext
#' @export
prettifyPython <- function(contents = NA){

  if(Sys.which("black") == ""){
    stop(
      "This function requires `black`. ",
      "Either it is not installed, or it is not found."
    )
  }

  if(isNA(contents) && isAvailable()){
    context <- RStudioContext()
    ext <- tolower(file_ext(context[["path"]]))
    if(!is.element(ext, c("py", "python"))){
      stop("Looks like this file is not a Python file.")
    }
    contents <- context[["contents"]]
  }else if(isNA(contents)){
    stop("You have to provide something for the `contents` argument.")
    return(invisible())
  }else{
    if(isFile(contents)){
      ext <- tolower(file_ext(contents))
      if(!is.element(ext, c("py", "python"))){
        stop("Looks like this file is not a Python file.")
      }
      contents <- suppressWarnings(readLines(contents))
    }
  }
  tmpFile <- tempfile(fileext = ".py")
  writeLines(contents, tmpFile)
  x <- suppressWarnings(system2(
    "black", tmpFile, stdout = TRUE, stderr = TRUE
  ))
  if(!is.null(attr(x, "status"))){
    stop("Failed to reformat.")
  }
  prettyCode <- suppressWarnings(readLines(tmpFile))
  paste0(prettyCode, collapse = "\n")
}
