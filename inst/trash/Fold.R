#' Fold a file
#' @description Fold any file (wrap lines to 80 characters). The result is
#'   not indented but the advantage is that this works for big files.
#'
#' @param contents the code to be folded; there are three possibilities for
#'   this argument:
#'   \code{NA} (default), to use the file currently opened in RStudio;
#'   the path to a file;
#'   or the code given as a character vector
#'
#' @return The folded code in a character string.
#'
#' @note This function requires the command line utility \code{fold}. You can
#'   find it in Rtools.
#'
#' @importFrom rstudioapi isAvailable
#' @export
#'
#' @examples library(prettifyAddins)
#' lorem <- stringi::stri_rand_lipsum(3)
#' lorem
#' cat(foldCode(lorem))
foldCode <- function(contents = NA){

  if(Sys.which("fold") == ""){
    stop(
      "This function requires `fold`. ",
      "Either it is not installed, or it is not found."
    )
  }

  if(isNA(contents) && isAvailable()){
    context <- RStudioContext()
    contents <- context[["contents"]]
  }else if(isNA(contents)){
    stop("You have to provide something for the `contents` argument.")
    return(invisible())
  }else{
    if(isFile(contents)){
      contents <- suppressWarnings(readLines(contents))
    }
  }
  tmpDir <- tempdir()
  tmpFile <- tempfile(fileext = ".txt")
  writeLines(contents, tmpFile)
  foldedCode <- suppressWarnings(system2(
    "fold",
    c(
      "-s",
      tmpFile
    ),
    stdout = TRUE, stderr = TRUE
  ))
  if(!is.null(attr(foldedCode, "status"))){
    stop(
      "Something went wrong.",
      call. = TRUE
    )
  }
  paste0(foldedCode, collapse = "\n")
}
