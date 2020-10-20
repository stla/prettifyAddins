#' Prettify code using Shiny
#' @description Prettify some code using a Shiny app.
#'
#' @param contents the code to be prettified; there are three possibilities for
#'   this argument:
#'   \code{NA} (default), to use the file currently opened in RStudio;
#'   the path to a file;
#'   or the code given as a character vector
#' @param language the language of the code, such as \code{"javascript"} or
#'   \code{"JavaScript"};
#'   see \code{\link{getPrettifiableLanguages}};
#'   if the contents are read from a file and \code{language=NA}, then the
#'   language is guessed from the file extension
#' @param tabSize number of spaces of the indentation (usually \code{2} or
#'   \code{4});
#'   if \code{NULL} (the default), there are two possibilities:
#'   if the contents are read from the current file in RStudio, then the
#'   number of spaces will be the one you use in RStudio;
#'   otherwise it is set to \code{2}
#' @param themeInfo this argument is not important, it controls the theme of
#'   the Shiny app;
#'   it must be \code{NULL} or a list with two fields: \code{editor}, the name
#'   of a theme, and \code{dark}, a logical value, which tells whether the
#'   theme is dark
#'
#' @return The pretty code in a character string.
#'
#' @importFrom shiny shinyAppDir runGadget
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
#' if(interactive()){
#'   cat(prettify_Shiny(code, "javascript"))
#' }
prettify_Shiny <- function(
  contents = NA, language = NA, tabSize = NULL, themeInfo = NULL
){

  language <- tolower(language)

  if(isNA(contents) && isAvailable()){
    context <- RStudioContext()
    if(is.na(language)){
      ext <- tolower(file_ext(context[["path"]]))
      if(ext %in% names(Languages()[["prettify"]])){
        language <- Languages()[["prettify"]][[ext]]
      }else{
        stop("Unrecognized or unsupported language.")
      }
    }else{
      if(!is.element(language, Languages()[["prettify"]])){
        stop("Unrecognized or unsupported language.")
      }
    }
    if(is.null(themeInfo)){
      themeInfo <- RStudioThemeInfo()
      theme <- gsub(" ", "_", tolower(themeInfo[["editor"]]))
      dark <- themeInfo[["dark"]]
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
      if(ext %in% names(Languages()[["prettify"]])){
        language <- Languages()[["prettify"]][[ext]]
      }else{
        stop("Unrecognized or unsupported language.")
      }
    }else if(!is.element(language, Languages()[["prettify"]])){
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
    if(is.null(themeInfo)){
      if(isAvailable()){
        themeInfo <- RStudioThemeInfo()
        theme <- gsub(" ", "_", tolower(themeInfo[["editor"]]))
        dark <- themeInfo[["dark"]]
      }else{
        theme <- "cobalt"
        dark <- "true"
      }
    }
  }
  code <- paste0(contents, collapse = "\n")
  options(prettify.code = code)
  options(prettify.language = language)
  options(prettify.theme = theme)
  options(prettify.dark = dark)
  options(prettify.action = "prettify")
  options(prettify.codemirror = FALSE)
  options(prettify.tabSize = tabSize)
  runGadget(
    shinyAppDir(
      system.file("shinyApp", package = "prettifyAddins")
    ),
    stopOnCancel = FALSE
  )
}


#' Reindent code using Shiny
#' @description Reindent some code using a Shiny app.
#'
#' @param contents the code to be reindented; there are three possibilities for
#'   this argument:
#'   \code{NA} (default), to use the file currently opened in RStudio;
#'   the path to a file;
#'   or the code given as a character vector
#' @param language the language of the code, such as \code{"javascript"};
#'   see \code{\link{getPrettifiableLanguages}};
#'   if the contents are read from a file and \code{language=NA}, then the
#'   language is guessed from the file extension
#' @param tabSize number of spaces of the indentation (usually \code{2} or
#'   \code{4});
#'   if \code{NULL} (the default), there are two possibilities:
#'   if the contents are read from the current file in RStudio, then the
#'   number of spaces will be the one you use in RStudio;
#'   otherwise it is set to \code{2}
#' @param themeInfo this argument is not important, it controls the theme of
#'   the Shiny app;
#'   it must be \code{NULL} or a list with two fields: \code{editor}, the name
#'   of a theme, and \code{dark}, a logical value, which tells whether the
#'   theme is dark
#'
#' @return The reindented code in a character string.
#'
#' @importFrom shiny shinyAppDir runGadget
#' @importFrom rstudioapi isAvailable
#' @importFrom tools file_ext
#' @export
reindent_Shiny <- function(
  contents = NA, language = NA, tabSize = NULL, themeInfo = NULL
){

  language <- tolower(language)

  if(!is.na(language) && language %in% c("c","cpp","c++","java","scala")){
    language <- switch(
      language,
      c = "text/x-csrc",
      cpp = "text/x-c++src",
      "c++" = "text/x-c++src",
      java = "text/x-java",
      scala = "text/x-scala"
    )
  }

  languages <- c(Languages()[["indentify"]], Languages()[["codemirror"]])

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
    if(is.null(themeInfo)){
      themeInfo <- RStudioThemeInfo()
      theme <- gsub(" ", "_", tolower(themeInfo[["editor"]]))
      dark <- themeInfo[["dark"]]
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
      ext <- tolower(fileExt(contents))
      if(ext %in% names(languages)){
        language <- languages[[ext]]
      }else{
        stop("Unrecognized or unsupported language.")
      }
    }else if(!is.element(language, languages)){
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
    if(is.null(themeInfo)){
      if(isAvailable()){
        themeInfo <- RStudioThemeInfo()
        theme <- gsub(" ", "_", tolower(themeInfo[["editor"]]))
        dark <- themeInfo[["dark"]]
      }else{
        theme <- "cobalt"
        dark <- "true"
      }
    }
  }
  code <- paste0(contents, collapse = "\n")
  options(prettify.code = code)
  options(prettify.language = language)
  options(prettify.theme = theme)
  options(prettify.dark = dark)
  options(prettify.action = "indentify")
  options(prettify.tabSize = tabSize)
  codemirror = !is.element(
    language, c("css", "html", "javascript", "jsx", "scss")
  )
  options(prettify.codemirror = codemirror)
  runGadget(
    shinyAppDir(
      system.file("shinyApp", package = "prettifyAddins")
    ),
    stopOnCancel = FALSE
  )
}
