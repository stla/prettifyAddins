#' Prettify Java, JSON or Ruby
#' @description Prettify Java code, JSON code or Ruby code.
#'
#' @param contents the code to be prettified; there are three possibilities for
#'   this argument:
#'   \code{NA} (default), to use the file currently opened in RStudio;
#'   the path to a file;
#'   or the code given as a character vector
#' @param language the language of the code, such as \code{"json"};
#'   see \code{\link{getPrettifiableLanguages}};
#'   if the contents are read from a file and \code{language=NA}, then the
#'   language is guessed from the file extension
#'
#' @return The pretty code in a character string.
#'
#' @note This function requires a connection to Internet.
#'
#' @importFrom rstudioapi isAvailable
#' @importFrom tools file_ext
#' @importFrom httr http_error POST content content_type
#' @importFrom utils URLdecode
#' @export
#'
#' @examples library(prettifyAddins)
#'
#' code <- c(
#'   "{a: [0,1,  2   ],",
#'   "f:  function( x){return x+1}}" # this function will be prettified too
#' )
#'
#' \dontrun{
#' cat(prettify_FCA(code, "json"))}
prettify_FCA <- function(contents = NA, language = NA){

  if(http_error("http://www.google.com")){
    stop(
      "This function requires an Internet connection."
    )
  }

  language <- tolower(language)

  languages <- Languages()[["FCA"]]

  if(isNA(contents) && isAvailable()){
    context <- RStudioContext()
    if(is.na(language)){
      ext <- tolower(fileExt(context[["path"]]))
      if(ext %in% names(languages)){
        language <- languages[[ext]]
      }else{
        stop("Unrecognized or unsupported language.")
      }
    }else{
      if(!is.element(language, languages)){
        stop("Unrecognized or unsupported language.")
      }
    }
    contents <- context[["contents"]]
  }else if(isNA(contents)){
    stop("You have to provide something for the `contents` argument.")
  }else{
    if(is.na(language)){
      if(!isFile(contents)){
        stop("You have to set a language.")
      }
      ext <- tolower(fileExt(contents))
      if(ext %in% names(languages)){
        language <- languages[[ext]]
      }else{
        stop("Unrecognized or unsupported language.")
      }
    }else if(!isFile(contents) && !is.element(language, languages)){
      stop("Unrecognized or unsupported language.")
    }
  }
  if(isFile(contents)){
    contents <- suppressWarnings(readLines(contents))
  }

  code <- paste0(contents, collapse = "\n")

  url <- switch(
    language,
    java = "http://aozozo.com:600/java",
    json = "http://aozozo.com:600/json",
    ruby = "http://www.zafuswitchout.com:3001/ruby"
  )

  request <- POST(url, content_type("text/plain; charset=UTF-8"), body = code)
  if(request$status_code == 200){
    prettyCode <- URLdecode(content(request, "text"))
  }else{
    stop("Failed to prettify.")
  }

  prettyCode

}
