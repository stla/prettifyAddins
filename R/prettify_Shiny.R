#' @importFrom shiny shinyAppDir runGadget
#' @importFrom rstudioapi isAvailable
#' @importFrom tools file_ext
#' @export
prettify_Shiny <- function(
  contents = NA, language = NA, tabSize = NULL, themeInfo = NULL
){
  if(is.na(contents) && isAvailable()){
    context <- RStudioContext()
    if(is.na(language)){
      ext <- file_ext(context[["path"]])
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
  }else if(is.na(contents)){
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



#' @importFrom shiny shinyAppDir runGadget
#' @importFrom rstudioapi isAvailable
#' @importFrom tools file_ext
#' @export
indentify_Shiny <- function(
  contents = NA, language = NA, tabSize = NULL, themeInfo = NULL
){
  languages <- c(Languages()[["indentify"]], Languages()[["codemirror"]])
  if(is.na(contents) && isAvailable()){
    context <- RStudioContext()
    if(is.na(language)){
      ext <- file_ext(context[["path"]])
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
  }else if(is.na(contents)){
    stop("You have to provide something for the `contents` argument.")
  }else{
    if(is.na(language)){
      if(!isFile(contents)){
        stop("You have to set a language.")
      }
      ext <- tolower(file_ext(contents))
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
