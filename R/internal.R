Languages <- function(){
  list(
    prettify = c(
      css = "css",
      htm = "html",
      html = "html",
      rhtml = "rhtml",
      js = "javascript",
      jsx = "jsx",
      md = "markdown",
      markdown = "markdown",
      rmd = "markdown",
      scss = "scss"
    ),
    indentify = c(
      css = "css",
      htm = "html",
      html = "html",
      rhtml = "rhtml",
      js = "javascript",
      jsx = "jsx",
      scss = "scss"
    ),
    codemirror = c(
      c = "text/x-csrc",
      cpp = "text/x-c++src",
      "c++" = "text/x-c++src",
      h = "text/x-csrc",
      hpp = "text/x-c++src",
      java = "text/x-java",
      jl = "julia",
      py = "python",
      sas = "sas",
      sh = "shell",
      sql = "sql"
    )
  )
}

isFile <- function(x){
  length(x) == 1L && file.exists(x)
}

.clangFormat <- function(tabSize) {
  c(
    "---",
    "BasedOnStyle: Chromium",
    "ColumnLimit: '80'",
    sprintf("IndentWidth: '%d'", tabSize),
    "SpaceBeforeParens: Never",
    "SpaceInEmptyParentheses: 'false'",
    "SpacesInParentheses: 'false'",
    "UseTab: Never",
    "---",
    "Language: Cpp",
    "CompactNamespaces: 'false'",
    "NamespaceIndentation: All",
    "---",
    "Language: Java",
    "..."
  )
}
