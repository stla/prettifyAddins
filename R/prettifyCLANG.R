#' @importFrom rstudioapi getSourceEditorContext setDocumentContents
#' @importFrom tools file_ext
NULL

prettifyCLANG <- function(){
  if(Sys.which("clang-format") == ""){
    message(
      "This addin requires `clang-format`. ",
      "Either it is not installed, or it is not found. ",
      "To reindent C/C++/Java code, you can use the 'Indent' addin."
    )
  }
  context <- getSourceEditorContext()
  ext <- tolower(file_ext(context[["path"]]))
  if(!is.element(ext, c("c", "cpp", "c++", "h", "hpp", "java"))){
    message("Looks like this file is not a C/C++/Java file.")
    return(invisible())
  }
  tmpDir <- tempdir()
  file.copy(
    system.file("clang-format.txt", package = "prettifyAddins"),
    file.path(tmpDir, ".clang-format"),
    overwrite = TRUE
  )
  tmpFile <- tempfile(fileext = paste0(".", ext))
  writeLines(context[["contents"]], tmpFile)
  prettyCode <- suppressWarnings(system2(
    "clang-format", tmpFile,
    stdout = TRUE, stderr = TRUE
  ))
  if(!is.null(attr(prettyCode, "status"))){
    message(
      "Something went wrong. ",
      "Probably the code is not valid."
    )
  }else{
    setDocumentContents(
      text = paste0(prettyCode, collapse = "\n"), id = context[["id"]]
    )
  }
  return(invisible())
}
