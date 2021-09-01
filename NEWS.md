# prettifyAddins 2.2.0

Possibility to prettify or indent TypeScript (`.ts` and `.tsx` files).


# prettifyAddins 2.1.2

Defined JavaScript method `String.prototype.trimStart` for old versions of V8 
which do not support it.


# prettifyAddins 2.1.1

Defined JavaScript method `String.prototype.trimEnd` for old versions of V8 
which do not support it.


# prettifyAddins 2.1.0

Upgraded the 'Prettier' library.


# prettifyAddins 2.0.3

Fixed an issue with the CRAN checks.


# prettifyAddins 2.0.2

Fixed an issue with the CRAN checks.


# prettifyAddins 2.0.1

Fixed an issue with the CRAN checks.


# prettifyAddins 2.0.0

* Added a YAML prettifier. It obviously acts on YAML files, but also on the 
YAML metadata of (R)Markdown files.
* Added a LaTeX prettifier. It can be used for Sweave files. It requires the 
command-line utility `latexindent`, which is included in MikTeX and TeX Live.
* Added a Julia prettifier. It requires Julia and the Julia package 
`JuliaFormatter`.
* Added a Python prettifier. It requires [black](https://github.com/psf/black).
* Added another Java prettifier, a JSON prettifier and a Ruby prettifier 
(function `prettify_FCA`).
* Now the package provides some functions to prettify, which return the pretty 
code. The addins just call these functions and render the pretty code in 
RStudio.
* Among these functions, there is `reindent_PhantomJS`. It allows to reindent 
code for some languages which were supported by a Shiny addin only, whereas 
this function does not run a Shiny app. These languages are C, C++, Java, 
Fortran, Julia, Python, SAS, Scala, Shell, and SQL.


# prettifyAddins 1.0.0

* Added non-interactive versions of the addins, thanks to the V8 package.
* The number of spaces for the indentation is now based on the RStudio preference.
* Added a XML/SVG prettifier.
* Added a C/C++/Java prettifier, requiring `clang-format`.


# prettifyAddins 0.1.0

First release.
