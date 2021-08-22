language <- getOption("prettify.language")
code <- getOption("prettify.code")
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
    scss = "css",
    yaml = "yaml",
    typescript = "typescript"
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
      scss = "css",
      typescript = "ts"
    )
  }
}


shinyServer(function(input, output, session){

  observeEvent(input[["cancel"]], {
    stopApp()
  })

  observeEvent(input[["done"]], {
    stopApp(input[["prettyCode"]])
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
