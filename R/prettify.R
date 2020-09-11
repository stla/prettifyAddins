#' @importFrom shiny shinyAppDir runGadget
#' @importFrom rstudioapi getSourceEditorContext getThemeInfo
#' @importFrom tools file_ext
NULL

prettify <- function(){
  context <- getSourceEditorContext()
  ext <- file_ext(context[["path"]])
  language <- switch(
    tolower(ext),
    css = "css",
    html = "html",
    js = "javascript",
    jsx = "jsx",
    md = "markdown",
    markdown = "markdown",
    rmd = "markdown",
    scss = "scss"
  )
  if(is.null(language)){
    message("Unrecognized or unsupported language.")
    return(invisible())
  }
  themeInfo <- getThemeInfo()
  theme <- gsub(" ", "_", tolower(themeInfo[["editor"]]))
  dark <- themeInfo[["dark"]]
  options(prettify.context = context)
  options(prettify.language = language)
  options(prettify.theme = theme)
  options(prettify.dark = dark)
  options(prettify.action = "prettify")
  runGadget(
    shinyAppDir(
      system.file("shinyApp", package = "prettifyAddins")
    )
  )
}

indentify <- function(){
  context <- getSourceEditorContext()
  ext <- file_ext(context[["path"]])
  language <- switch(
    tolower(ext),
    css = "css",
    html = "html",
    js = "javascript",
    jsx = "jsx",
    scss = "scss"
  )
  if(is.null(language)){
    message("Unrecognized or unsupported language.")
    return(invisible())
  }
  themeInfo <- getThemeInfo()
  theme <- gsub(" ", "_", tolower(themeInfo[["editor"]]))
  dark <- themeInfo[["dark"]]
  options(prettify.context = context)
  options(prettify.language = language)
  options(prettify.theme = theme)
  options(prettify.dark = dark)
  options(prettify.action = "indentify")
  runGadget(
    shinyAppDir(
      system.file("shinyApp", package = "prettifyAddins")
    )
  )
}
