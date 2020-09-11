library(miniUI)
library(shinyAce)
library(shinythemes)

dark <- getOption("prettify.dark")
theme <- ifelse(dark, "cyborg", "cosmo")

shinyUI(miniPage(

  theme = shinytheme(theme),

  tags$head(
    if(dark){
      tags$style(HTML(".gadget-title {background-color: rgb(21,21,21)}"))
    }else{
      tags$style(HTML(".gadget-title {background-color: #f5f5f5}"))
    },
    tags$script(src = "prettier/standalone.js"),
    tags$script(src = "prettier/parser-babel.js"),
    tags$script(src = "prettier/parser-html.js"),
    tags$script(src = "prettier/parser-markdown.js"),
    tags$script(src = "prettier/parser-postcss.js"),
    tags$script(src = "indent/indent.min.js"),
    tags$script(src = "prettify.js")
  ),

  gadgetTitleBar(""),

  miniContentPanel(

    aceEditor(
      "editor",
      value = "",
      mode = "plain_text",
      theme = getOption("prettify.theme"),
      fontSize = 12,
      height = "80vh",
      tabSize = 2
    )

  )

))
