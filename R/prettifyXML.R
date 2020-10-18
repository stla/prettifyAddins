#' @importFrom rstudioapi isAvailable
#' @importFrom tools file_ext
#' @importFrom xml2 read_xml
prettifyXML <- function(contents = NA, tabSize = NULL){
  if(is.na(contents) && isAvailable()){
    context <- RStudioContext()
    ext <- tolower(file_ext(context[["path"]]))
    if(!is.element(ext, c("xml", "svg"))){
      message("Looks like this file is not a XML file.")
      return(invisible())
    }
    if(is.null(tabSize)){
      tabSize <- RStudioTabSize()
    }
    contents <- context[["contents"]]
  }else if(is.na(contents)){
    message("You have to provide something for the `contents` argument.")
    return(invisible())
  }else{
    if(is.null(tabSize)){
      if(isAvailable()){
        tabSize <- RStudioTabSize()
      }else{
        tabSize <- 2
      }
    }
    if(file.exists(contents)){
      contents <- suppressWarnings(readLines(contents))
    }
  }
  if(Sys.which("xmllint") == ""){
    message(
      "`xmllint` not found --- using `xml2` (ignoring `tabSize`)"
    )
    prettyCode <- tryCatch({
      as.character(read_xml(paste0(contents, collapse = "\n")))
    }, error = function(e){
      NULL
    })
    if(is.null(prettyCode)){
      message(
        "Something went wrong. ",
        "Probably the code is not valid."
      )
      return(invisible())
    }
  }else{
    tmpFile <- tempfile(fileext = ".xml")
    writeLines(contents, tmpFile)
    Sys.setenv(XMLLINT_INDENT = tabSize)
    prettyCode <- suppressWarnings(system2(
      "xmllint", paste0("--format ", tmpFile), stdout = TRUE, stderr = TRUE
    ))
    if(!is.null(attr(prettyCode, "status"))){
      message(
        "Something went wrong. ",
        "Probably the code is not valid."
      )
      return(invisible())
    }
  }

  prettyCode
}

# todo: ligne de commande pour python? on verra RStudio 1.4
