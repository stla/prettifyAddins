#' @importFrom rstudioapi hasFun readRStudioPreference
#' @keywords internal
getTabSize <- function(){
  if(hasFun("readRStudioPreference")){
    readRStudioPreference("num_spaces_for_tab", 2)
  }else{
    2
  }
}
