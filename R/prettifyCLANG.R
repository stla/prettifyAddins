#' Prettify C, C++, Java
#' @description Prettify some C, C++ or Java code.
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
#' @note This function requires the command line utility \code{clang-format}.
#'
#' @importFrom rstudioapi isAvailable
#' @importFrom tools file_ext
#' @export
prettifyCLANG <- function(contents = NA, tabSize = NULL){
  if(Sys.which("clang-format") == ""){
    stop(
      "This function requires `clang-format`. ",
      "Either it is not installed, or it is not found. ",
      "To reindent C/C++/Java code, you can use the 'Shiny Indent' addin."
    )
  }
  if(is.na(contents) && isAvailable()){
    context <- RStudioContext()
    ext <- tolower(file_ext(context[["path"]]))
    if(!is.element(ext, c("c", "cpp", "c++", "h", "hpp", "java"))){
      stop("Looks like this file is not a C/C++/Java file.")
    }
    if(is.null(tabSize)){
      tabSize <- RStudioTabSize()
    }
    contents <- context[["contents"]]
  }else if(is.na(contents)){
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
    if(file.exists(contents)){
      ext <- tolower(file_ext(contents))
      if(!is.element(ext, c("c", "cpp", "c++", "h", "hpp", "java"))){
        stop("Looks like this file is not a C/C++/Java file.")
      }
      contents <- suppressWarnings(readLines(contents))
    }
  }
  tmpDir <- tempdir()
  writeLines(.clangFormat(tabSize), file.path(tmpDir, ".clang-format"))
  tmpFile <- tempfile(fileext = paste0(".", ext))
  writeLines("contents", tmpFile)
  prettyCode <- suppressWarnings(system2(
    "clang-format", tmpFile,
    stdout = TRUE, stderr = TRUE
  ))
  if(!is.null(attr(prettyCode, "status"))){
    stop(
      "Something went wrong. ",
      "Probably the code is not valid."
    )
  }
  prettyCode
}
