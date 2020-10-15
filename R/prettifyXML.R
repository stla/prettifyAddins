#' @importFrom rstudioapi getSourceEditorContext setDocumentContents
#' @importFrom tools file_ext
#' @importFrom xml2 read_xml
NULL

prettifyXML <- function(){
  context <- getSourceEditorContext()
  ext <- tolower(file_ext(context[["path"]]))
  if(!is.element(ext, c("xml", "svg"))){
    message("Looks like this file is not a XML file.")
    return(invisible())
  }
  code <- paste0(context[["contents"]], collapse = "\n")
  prettyCode <- tryCatch({
    as.character(read_xml(code))
  }, error = function(e){
    NULL
  })
  if(is.null(prettyCode)){
    message(
      "Something went wrong. ",
      "Probably the code is not valid."
    )
  }else{
    setDocumentContents(text = prettyCode, id = context[["id"]])
  }
  return(invisible())
}
