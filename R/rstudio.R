#' @importFrom rstudioapi hasFun readRStudioPreference
#' @noRd
RStudioTabSize <- function(){
  if(hasFun("readRStudioPreference")){
    readRStudioPreference("num_spaces_for_tab", 2)
  }else{
    2
  }
}

#' @importFrom rstudioapi hasFun getThemeInfo
#' @noRd
RStudioThemeInfo <- function(){
  if(hasFun("getThemeInfo")){
    getThemeInfo()
  }else{
    list(editor = "cobalt", dark = TRUE)
  }
}

#' @importFrom rstudioapi hasFun getSourceEditorContext
#' @noRd
RStudioContext <- function(){
  if(hasFun("getSourceEditorContext")){
    getSourceEditorContext()
  }else{
    stop("This version of RStudio is too old!")
  }
}
