#' Reindent code using PhantomJS
#' @description Reindent some code using the V8 package.
#'
#' @param contents the code to be reindented; there are three possibilities for
#'   this argument:
#'   \code{NA} (default), to use the file currently opened in RStudio;
#'   the path to a file;
#'   or the code given as a character vector
#' @param language the language of the code in lower case, such as
#'   \code{"javascript"};
#'   see \code{\link{getPrettifiableLanguages}};
#'   if the contents are read from a file and \code{language=NA}, then the
#'   language is guessed from the file extension
#' @param tabSize number of spaces of the indentation (usually \code{2} or
#'   \code{4});
#'   if \code{NULL} (the default), there are two possibilities:
#'   if the contents are read from the current file in RStudio, then the
#'   number of spaces will be the one you use in RStudio;
#'   otherwise it is set to \code{2}
#'
#' @return The reindented code in a character string.
#'
#' @importFrom rstudioapi isAvailable
#' @importFrom tools file_ext
#' @export
#'
#' @examples library(prettifyAddins)
#'
#' code <- c(
#'   "function f(x){",
#'   "return x+1",
#'   "}"
#' )
#' cat(reindent_V8(code, "javascript"))
reindent_PhantomJS <- function(contents = NA, language = NA, tabSize = NULL){
  if(!requireNamespace("V8")){
    stop("This function requires the 'V8' package.")
  }

  if(isNA(contents) && isAvailable()){
    context <- RStudioContext()
    if(is.na(language)){
      ext <- file_ext(context[["path"]])
      if(ext %in% names(Languages()[["codemirror"]])){
        language <- Languages()[["codemirror"]][[ext]]
      }else{
        stop("Unrecognized or unsupported language.")
      }
    }else{
      if(!is.element(language, Languages()[["codemirror"]])){
        stop("Unrecognized or unsupported language.")
      }
    }
    if(is.null(tabSize)){
      tabSize <- RStudioTabSize()
    }
    contents <- context[["contents"]]
  }else if(isNA(contents)){
    stop("You have to provide something for the `contents` argument.")
  }else{
    if(is.na(language)){
      if(!isFile(contents)){
        stop("You have to set a language.")
      }
      ext <- tolower(file_ext(contents))
      if(ext %in% names(Languages()[["codemirror"]])){
        language <- Languages()[["codemirror"]][[ext]]
      }else{
        stop("Unrecognized or unsupported language.")
      }
    }else if(!is.element(language, Languages()[["codemirror"]])){
      stop("Unrecognized or unsupported language.")
    }
    if(isFile(contents)){
      contents <- suppressWarnings(readLines(contents))
    }
    if(is.null(tabSize)){
      if(isAvailable()){
        tabSize <- RStudioTabSize()
      }else{
        tabSize <- 2
      }
    }
  }
  code <- paste0(contents, collapse = "\n")

  folder <-
    system.file("shinyApp", "www", "codemirror", package = "prettifyAddins")
  codemirror <- file.path(folder, "lib", "codemirror.js")
  formatting <- file.path(folder, "formatting.js")
  meta <- file.path(folder, "mode", "meta.js")
  mode <- file.path(folder, "mode", "python", "python.js")

  script <- system.file("PhantomJS", "script.js", package = "prettifyAddins")

  prettyCode <- system2(
    "phantomjs",
    c(script, codemirror, formatting, meta, mode, shQuote(code), "python")
  )

  prettyCode

}
