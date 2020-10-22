#' Prettify Julia
#' @description Prettify Julia code.
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
#' @return The pretty code in a character string.
#'
#' @note This function requires that Julia is installed on your system and that
#'   the Julia package \code{JuliaFormatter} is installed.
#'
#' @importFrom rstudioapi isAvailable
#' @importFrom tools file_ext
#' @importFrom XRJulia findJulia juliaEval
#' @export
prettifyJulia <- function(contents = NA, tabSize = NULL){

  if(!findJulia(test = TRUE)){
    stop(
      "This function requires `Julia`. ",
      "Either it is not installed, or it is not found."
    )
  }

  message("Note: the first run takes a while...")

  juliaEval("using JuliaFormatter")

  if(isNA(contents) && isAvailable()){
    context <- RStudioContext()
    ext <- tolower(file_ext(context[["path"]]))
    if(!is.element(ext, c("jl", "julia"))){
      stop("Looks like this file is not a Julia file.")
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
      if(!is.element(ext, c("jl", "julia"))){
        stop("Looks like this file is not a Julia file.")
      }
      contents <- suppressWarnings(readLines(contents))
    }
  }
  tmpFile <- tempfile(fileext = ".jl")
  writeLines(contents, tmpFile)
  juliaEval(
    sprintf('format_file("%s", indent = %d)', tmpFile, tabSize)
  )
  prettyCode <- suppressWarnings(readLines(tmpFile))
  paste0(prettyCode, collapse = "\n")
}
