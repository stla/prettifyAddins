library(rstudioapi)

context <- getOption("prettify.context")
language <- getOption("prettify.language")
code <- getOption("prettify.code")
id <- context[["id"]]
codemirror <- getOption("prettify.codemirror")

action <- getOption("prettify.action")

tabSize <- getOption("prettify.tabSize")

if(action == "prettify"){
  parser <- switch(
    language,
    css = "css",
    html = "html",
    rhtml = "html",
    javascript = "babel",
    jsx = "babel",
    markdown = "markdown",
    scss = "css"
  )
}else{
  if(codemirror){
    parser <- language
  }else{
    parser <- switch(
      language,
      css = "css",
      html = "html",
      rhtml = "html",
      javascript = "js",
      jsx = "js",
      scss = "css"
    )
  }
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
    list(code = code, parser = parser, tabSize = tabSize)
  )

  observeEvent(input[["prettifyError"]], {
    message("An error occured. This is possibly due to invalid code.")
    stopApp()
  })

  observeEvent(input[["prettyCode"]], {
    req(!codemirror)
    updateAceEditor(
      session, "editor",
      mode = language, value = input[["prettyCode"]]
    )
  })

})
