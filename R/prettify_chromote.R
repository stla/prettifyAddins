#' Reindent code using chromote
#' @description Reindent some code using chromote.
#'
#' @param contents the code to be reindented; there are three possibilities for
#'   this argument:
#'   \code{NA} (default), to use the file currently opened in RStudio;
#'   the path to a file;
#'   or the code given as a character vector
#' @param language the language of the code, such as \code{"python"};
#'   see \code{\link{getPrettifiableLanguages}};
#'   if the contents are read from a file and \code{language=NA}, then the
#'   language is guessed from the file extension
#' @param tabSize number of spaces of the indentation (usually \code{2} or
#'   \code{4});
#'   if \code{NULL} (the default), there are two possibilities:
#'   if the contents are read from the current file in RStudio, then the
#'   number of spaces will be the one you use in RStudio;
#'   otherwise it is set to \code{2}
#'
#' @return The reindented code in a character string.
#'
#' @note This function requires 'Chrome' and the executable file 'chrome'
#'   must be in the system path.
#'
#' @importFrom rstudioapi isAvailable
#' @importFrom tools file_ext
#' @import chromote
#' @export
#'
#' @examples library(prettifyAddins)
#'
#' code <- c(
#'   'if test == 1:',
#'   'print "it is one"',
#'   'else:',
#'   'print "it is not one"'
#' )
#'
#' \donttest{
#' cat(reindent_chromote(code, "python"))}
reindent_chromote <- function(contents = NA, language = NA, tabSize = NULL){

  if(Sys.which("chrome") == ""){
    stop(
      "This function requires 'Chrome' and the executable file ",
      "'chrome' must be in the path."
    )
  }

  language <- tolower(language)

  languages <- Languages()[["codemirror"]]
  languages <- c(
    names(languages[grepl("/", languages)]), languages[!grepl("/", languages)]
  )

  if(isNA(contents) && isAvailable()){
    context <- RStudioContext()
    if(is.na(language)){
      ext <- tolower(fileExt(context[["path"]]))
      if(ext %in% names(Languages()[["codemirror"]])){
        language <- Languages()[["codemirror"]][[ext]]
      }else{
        stop("Unrecognized or unsupported language.")
      }
    }else{
      if(!is.element(language, languages)){
        stop("Unrecognized or unsupported language.")
      }
    }
    if(is.null(tabSize)){
      tabSize <- RStudioTabSize()
    }
    contents <- context[["contents"]]
  }else if(isNA(contents)){
    stop("You have to provide something for the `contents` argument.")
  }else{
    if(is.na(language)){
      if(!isFile(contents)){
        stop("You have to set a language.")
      }
      ext <- tolower(fileExt(contents))
      if(ext %in% names(Languages()[["codemirror"]])){
        language <- Languages()[["codemirror"]][[ext]]
      }else{
        stop("Unrecognized or unsupported language.")
      }
    }else if(!isFile(contents) && !is.element(language, Languages()[["codemirror"]])){
      language <- as.list(Languages()[["codemirror"]])[[language]]
      # works before ext=language !
      if(is.null(language)){
        stop("Unrecognized or unsupported language.")
      }
    }
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

  code <- paste0(contents, collapse = "\n")

  folder <-
    system.file("shinyApp", "www", "codemirror", package = "prettifyAddins")
  codemirror <- file.path(folder, "lib", "codemirror.js")
  formatting <- file.path(folder, "formatting.js")
  meta <- file.path(folder, "mode", "meta.js")
  if(grepl("/", language)){
    mode <- "clike"
  }else{
    mode <- language
  }
  mode <- file.path(folder, "mode", mode, paste0(mode, ".js"))

  chrm <- Chrome$new(
    path = "chrome",
    args = "--disable-gpu --headless --remote-debugging-port=9222"
  )
  chromote <- Chromote$new(browser = chrm)
  session  <- ChromoteSession$new(parent = chromote)
  ids <- session$Page$navigate("about:blank")

  script <- paste0(readLines(codemirror), collapse = "\n")
  . <- session$Runtime$evaluate(script)
  script <- paste0(readLines(formatting), collapse = "\n")
  . <- session$Runtime$evaluate(script)
  script <- paste0(readLines(meta), collapse = "\n")
  . <- session$Runtime$evaluate(script)
  script <- paste0(readLines(mode), collapse = "\n")
  . <- session$Runtime$evaluate(script)

  . <- session$Page$setDocumentContent(
    ids[["frameId"]],
    html = sprintf("<textarea id='editor'>%s</textarea>", code)
  )

  . <- session$Runtime$evaluate(sprintf('
var editor = CodeMirror.fromTextArea(
  document.getElementById("editor"),
  {
    mode: "%s",
    tabSize: %d,
    indentUnit: %d
  }
);
CodeMirror.commands.selectAll(editor);
editor.autoFormatRange(
  editor.getCursor(true),
  editor.getCursor(false)
);
editor.setCursor(0);
', language, tabSize, tabSize))

  result <- session$Runtime$evaluate("editor.getValue();")

  . <- session$close()

  result$result$value
}
