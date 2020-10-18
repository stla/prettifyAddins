#' @importFrom rstudioapi isAvailable
#' @importFrom tools file_ext
#' @export
prettifyCLANG <- function(contents = NA, tabSize = NULL){
  if(Sys.which("clang-format") == ""){
    stop(
      "This function requires `clang-format`. ",
      "Either it is not installed, or it is not found. ",
      "To reindent C/C++/Java code, you can use the 'Indent' addin."
    )
  }
  if(is.na(contents) && isAvailable()){
    context <- RStudioContext()
    ext <- tolower(file_ext(context[["path"]]))
    if(!is.element(ext, c("c", "cpp", "c++", "h", "hpp", "java"))){
      stop("Looks like this file is not a C/C++/Java file.")
    }
    if(is.null(tabSize)){
      tabSize <- RStudioTabSize()
    }
    contents <- context[["contents"]]
  }else if(is.na(contents)){
    stop("You have to provide something for the `contents` argument.")
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
      ext <- tolower(file_ext(contents))
      if(!is.element(ext, c("c", "cpp", "c++", "h", "hpp", "java"))){
        stop("Looks like this file is not a C/C++/Java file.")
      }
      contents <- suppressWarnings(readLines(contents))
    }
  }
  tmpDir <- tempdir()
  writeLines(.clangFormat(tabSize), file.path(tmpDir, ".clang-format"))
  tmpFile <- tempfile(fileext = paste0(".", ext))
  writeLines("contents", tmpFile)
  prettyCode <- suppressWarnings(system2(
    "clang-format", tmpFile,
    stdout = TRUE, stderr = TRUE
  ))
  if(!is.null(attr(prettyCode, "status"))){
    stop(
      "Something went wrong. ",
      "Probably the code is not valid."
    )
  }
  prettyCode
}
