#' Prettifiable languages
#' @description Returns the list of languages that are supported by this
#'   package.
#'
#' @export
getPrettifiableLanguages <- function(){
  list(
    Shiny = list(
      Prettify = c("HTML", "CSS", "SCSS", "JavaScript", "JSX", "Markdown",
                   "YAML"),
      Indent = c("HTML", "CSS", "SCSS", "JavaScript", "JSX", "C(++)", "Fortran",
                 "Java", "Julia", "Python", "SAS", "Shell", "SQL")
    ),
    V8 = list(
      Prettify = c("HTML", "CSS", "SCSS", "JavaScript", "JSX", "Markdown",
                   "YAML"),
      Indent = c("HTML", "CSS", "SCSS", "JavaScript", "JSX")
    ),
    CLANG = c("C(++)", "Java"),
    XML = c("XML", "SVG"),
    PhantomJS = c("C(++)", "Fortran", "Java", "Julia", "Python", "SAS",
                  "Shell", "SQL"),
    LaTeX = c("LaTeX", "Sweave"),
    Julia = "Julia",
    Python = "Python",
    FCA = c("Java", "JSON", "Ruby")
  )
}

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
      scss = "scss",
      yaml = "yaml",
      yml = "yaml"
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
      f = "fortran",
      f90 = "fortran",
      h = "text/x-csrc",
      hpp = "text/x-c++src",
      java = "text/x-java",
      jl = "julia",
      py = "python",
      sas = "sas",
      scala = "text/x-scala",
      sh = "shell",
      sql = "sql"
    ),
    FCA = c(
      java = "java",
      json = "json",
      ru = "ruby",
      ruby = "ruby"
    )
  )
}

#' @importFrom tools file_ext
#' @noRd
fileExt <- function(x){
  if(grepl("\\.c\\+\\+$", tolower(x))){
    "c++"
  }else{
    file_ext(x)
  }
}

isFile <- function(x){
  length(x) == 1L && !is.na(x) && file.exists(x)
}

isNA <- function(x){
  length(x) == 1L && is.na(x)
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
