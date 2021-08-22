library(miniUI)
library(shinyAce)
library(shinythemes)
library(rstudioapi)

dark <- getOption("prettify.dark")
theme <- ifelse(dark, "cyborg", "cosmo")

codemirror <- getOption("prettify.codemirror")

tabSize <- getOption("prettify.tabSize")


shinyUI(miniPage(

  theme = shinytheme(theme),

  tags$head(
    if(dark){
      tags$style(
        HTML(
          ".gadget-title {background-color: rgb(21,21,21)}",
          ".btn-primary {background-color: crimson; border-color: crimson}"
        )
      )
    }else{
      tags$style(HTML(".gadget-title {background-color: #f5f5f5}"))
    },
    tags$style(HTML(".btn {width: 45%}")),
    if(codemirror){
      theme <- ifelse(dark, "cobalt", "xq-light")
      tagList(
        tags$script(src = "codemirror/lib/codemirror.js"),
        tags$link(rel = "stylesheet", media = "all", href = "codemirror/lib/codemirror.css"),
        tags$script(src = "codemirror/formatting.js"),
        tags$script(HTML(sprintf("var theme = '%s';", theme))),
        tags$link(
          rel = "stylesheet",
          href = sprintf("codemirror/theme/%s.css", theme)
        ),
        tags$script(src = "codemirror/mode/meta.js"),
        tags$script(src = "codemirror/mode/clike/clike.js"),
        tags$script(src = "codemirror/mode/fortran/fortran.js"),
        tags$script(src = "codemirror/mode/julia/julia.js"),
        tags$script(src = "codemirror/mode/python/python.js"),
        tags$script(src = "codemirror/mode/sas/sas.js"),
        tags$script(src = "codemirror/mode/shell/shell.js"),
        tags$script(src = "codemirror/mode/sql/sql.js"),
        tags$script(src = "autoFormatRange.js"),
        tags$link(rel = "stylesheet", href = "prettify.css")
      )
    }else{
      tagList(
        tags$script(src = "prettier/standalone.js"),
        tags$script(src = "prettier/parser-babel.js"),
        tags$script(src = "prettier/parser-html.js"),
        tags$script(src = "prettier/parser-markdown.js"),
        tags$script(src = "prettier/parser-postcss.js"),
        tags$script(src = "prettier/parser-yaml.js"),
        tags$script(src = "prettier/parser-typescript.js"),
        tags$script(src = "indent/indent.min.js"),
        tags$script(src = "prettify.js")
      )
    }
  ),

  gadgetTitleBar(""),

  miniContentPanel(

    if(codemirror){
      tags$textarea(
        id = "editor",
        getOption("prettify.code")
      )
    }else{
      aceEditor(
        "editor",
        value = "",
        mode = "plain_text",
        theme = getOption("prettify.theme"),
        fontSize = 12,
        height = "80vh",
        tabSize = tabSize
      )
    }

  )

))
