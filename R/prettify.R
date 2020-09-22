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
    rhtml = "rhtml",
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
  code <- paste0(context[["contents"]], collapse = "\n")
  options(prettify.context = context)
  options(prettify.code = code)
  options(prettify.language = language)
  options(prettify.theme = theme)
  options(prettify.dark = dark)
  options(prettify.action = "prettify")
  options(prettify.codemirror = FALSE)
  runGadget(
    shinyAppDir(
      system.file("shinyApp", package = "prettifyAddins")
    ),
    stopOnCancel = FALSE
  )
}

indentify <- function(){
  context <- getSourceEditorContext()
  ext <- file_ext(context[["path"]])
  language <- switch(
    tolower(ext),
    css = "css",
    html = "html",
    rhtml = "rhtml",
    js = "javascript",
    jsx = "jsx",
    scss = "scss",
    c = "text/x-csrc",
    cpp = "text/x-c++src",
    "c++" = "text/x-c++src",
    h = "text/x-csrc",
    hpp = "text/x-c++src",
    java = "text/x-java",
    jl = "julia",
    py = "python",
    sas = "sas",
    sh = "shell",
    sql = "sql"
  )
  if(is.null(language)){
    message("Unrecognized or unsupported language.")
    return(invisible())
  }
  themeInfo <- getThemeInfo()
  theme <- gsub(" ", "_", tolower(themeInfo[["editor"]]))
  dark <- themeInfo[["dark"]]
  code <- paste0(context[["contents"]], collapse = "\n")
  options(prettify.context = context)
  options(prettify.code = code)
  options(prettify.language = language)
  options(prettify.theme = theme)
  options(prettify.dark = dark)
  options(prettify.action = "indentify")
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
