#' Prettify HTML
#' @description Prettify some HTML code. It works for big files.
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
#' @note This function requires the command line utility \code{prettydiff},
#'   to install with \code{npm}.
#'
#' @importFrom rstudioapi isAvailable
#' @importFrom tools file_ext
#' @export
prettifyHTML <- function(contents = NA, tabSize = NULL){

  if(Sys.which("prettydiff") == ""){
    stop(
      "This function requires `prettydiff`. ",
      "Either it is not installed, or it is not found. ",
      "If your file is not too big, you can use the 'Prettify V8' addin."
    )
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
  config <- paste0(
    '{"format_array": "inline", ',
    '"indent_char": " ", ',
    '"indent_size": ', tabSize, ', ',
    '"variable_list": "list", ',
    '"wrap": 80}'
  )
  writeLines(config, file.path(tmpDir, ".prettydiffrc"))
  tmpFile <- tempfile(fileext = paste0(".", ext))
  writeLines(contents, tmpFile)
  prettyCode <- suppressWarnings(system2(
    "prettydiff", c("beautify", tmpFile),
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
