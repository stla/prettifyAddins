library(rstudioapi)

context <- getOption("prettify.context")
language <- getOption("prettify.language")
contents <- context[["contents"]]
code <- paste0(contents, collapse = "\n")
id <- context[["id"]]

action <- getOption("prettify.action")

if(action == "prettify"){
  parser <- switch(
    language,
    css = "css",
    html = "html",
    javascript = "babel",
    jsx = "babel",
    markdown = "markdown",
    scss = "css"
  )
}else{
  parser <- switch(
    language,
    css = "css",
    html = "html",
    javascript = "js",
    jsx = "js",
    scss = "css"
  )
}


shinyServer(function(input, output, session){

  observeEvent(input[["cancel"]], {
    stopApp()
  })

  observeEvent(input[["done"]], {
    setDocumentContents(text = input[["prettyCode"]], id = id)
    stopApp()
  })

  session$sendCustomMessage(
    action,
    list(code = code, parser = parser)
  )

  observeEvent(input[["prettifyError"]], {
    message("An error occured. This is possibly due to invalid code.")
    stopApp()
  })

  observeEvent(input[["prettyCode"]], {
    updateAceEditor(
      session, "editor",
      mode = language, value = input[["prettyCode"]]
    )
  })

})
