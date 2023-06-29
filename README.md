# **prettifyAddins**

<!-- badges: start -->
[![R-CMD-check](https://github.com/stla/prettifyAddins/actions/workflows/R-CMD-check.yaml/badge.svg)](https://github.com/stla/prettifyAddins/actions/workflows/R-CMD-check.yaml)
<!-- badges: end -->

### RStudio addins to prettify JavaScript / HTML / CSS / Markdown / C++ and more.

**JavaScript example:**

![](https://raw.githubusercontent.com/stla/prettifyAddins/master/inst/screenshots/prettifyAddins_js.gif)

The **Markdown** prettifier also prettifies the code blocks:

![](https://raw.githubusercontent.com/stla/prettifyAddins/master/inst/screenshots/prettifyAddins_md.gif)


## NEWS

- As of **version 1.0.0**, there are six addins:

![](https://raw.githubusercontent.com/stla/prettifyAddins/master/inst/screenshots/addins_1-0-0.png)

The 'shiny' addins are the ones you can see on the above GIFs. The other ones 
are not interactive. The *'Prettify C/C++/Java'* addin requires `clang-format` 
(it is possible to reindent C/C++/Java (and more) with the *'Indent (shiny)'* 
addin).

- As of **version 2.0.0**, there are five new addins: 
  - *'Indent (PhantomJS)':* allows to reindent code for some languages which 
  were supported by the *'Indent (shiny)'* addin only, whereas this addin does 
  not run a Shiny app; these languages are C, C++, Java, Fortran, Julia, Python, 
  SAS, Scala, Shell, and SQL. This addin requires `phantomjs` (the package 
  provides a function to install this software).
  - *'Prettify LaTeX':* to prettify LaTeX code; works for Sweave code. It 
  requires `latexindent`, which is included in MikTeX and TeX Live 
  distributions.
  - *'Prettify Julia':* to prettify Julia code. It requires Julia.
  - *'Prettify Python':* to prettify Python code. It requires 
  [black](https://github.com/psf/black).
  - *'Prettify (formatCodeApi)':* to prettify Java, JSON, and Ruby. 

Moreover, this version exports the functions used to prettify/reindent. 
For example:

```r
code <- c(
  "function f(x){",
  "return x+1",
  "}"
)
cat(prettify_V8(code, "javascript"))
```
gives
```js
function f(x) {
  return x + 1;
}
```

___

# __Copies of license agreements__

The 'prettifyAddins' package as a whole is distributed under GPL-3 (GNU
GENERAL PUBLIC LICENSE version 3).

It includes other open source software components:

- **Prettier**, https://github.com/prettier/prettier
- **indent.js**, https://github.com/zebzhao/indent.js
- **CodeMirror**, https://github.com/codemirror/CodeMirror
- **SQL Formatter**, https://github.com/zeroturnaround/sql-formatter
- **Prettydiff**, https://github.com/prettydiff/prettydiff

Full copies of the license agreements used by these components are included
in the file [LICENSE.note](https://github.com/stla/prettifyAddins/blob/master/LICENSE.note).
