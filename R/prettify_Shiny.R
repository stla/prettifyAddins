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
        message("Unrecognized or unsupported language.")
        return(invisible())
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
    code <- paste0(context[["contents"]], collapse = "\n")
  }else{
    if(!is.element(language, Languages()[["prettify"]])){
      message("Unrecognized or unsupported language.")
      return(invisible())
    }
    code <- paste0(contents, collapse = "\n")
    theme <- themeInfo[["editor"]]
    dark <- themeInfo[["dark"]]
  }
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
  if(is.na(contents) && isAvailable()){
    context <- RStudioContext()
    if(is.na(language)){
      ext <- file_ext(context[["path"]])
      if(ext %in% names(Languages()[["indentify"]])){
        language <- Languages()[["indentify"]][[ext]]
      }else{
        message("Unrecognized or unsupported language.")
        return(invisible())
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
    code <- paste0(context[["contents"]], collapse = "\n")
  }else{
    if(!is.element(language, Languages()[["indentify"]])){
      message("Unrecognized or unsupported language.")
      return(invisible())
    }
    code <- paste0(contents, collapse = "\n")
    theme <- themeInfo[["editor"]]
    dark <- themeInfo[["dark"]]
  }
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
