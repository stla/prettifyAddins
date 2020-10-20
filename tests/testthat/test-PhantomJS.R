test_that("PhantomJS reindent C++ with default `tabSize`", {
  skip_if(Sys.which("phantomjs") == "", message = "'phantomjs' not found")
  code <- c(
    "double f(double x){",
    "double y= x+1;",
    "return y ;",
    "  }"
  )
  prettyCode <- reindent_PhantomJS(code, language = "c++")
  expect_equal(
    prettyCode,
    "double f(double x){\n  double y= x+1;\n  return y ;\n}\n"
  )
})

test_that("PhantomJS reindent C++ with given `tabSize`", {
  skip_if(Sys.which("phantomjs") == "", message = "'phantomjs' not found")
  code <- c(
    "double f(double x){",
    "double y= x+1;",
    "return y ;",
    "  }"
  )
  prettyCode <- reindent_PhantomJS(code, language = "c++", tabSize = 4)
  expect_equal(
    prettyCode,
    "double f(double x){\n    double y= x+1;\n    return y ;\n}\n"
  )
})

test_that("PhantomJS reindent C++ from a file", {
  skip_if(Sys.which("phantomjs") == "", message = "'phantomjs' not found")
  code <- c(
    "double f(double x){",
    "double y= x+1;",
    "return y ;",
    "  }"
  )
  tmpFile <- tempfile(fileext = ".c++")
  writeLines(code, tmpFile)
  prettyCode <- reindent_PhantomJS(tmpFile)
  expect_equal(
    prettyCode,
    "double f(double x){\n  double y= x+1;\n  return y ;\n}\n"
  )
})

test_that("PhantomJS reindent Julia with default `tabSize`", {
  skip_if(Sys.which("phantomjs") == "", message = "'phantomjs' not found")
  code <- c(
    "function mandelbrot(a)",
    "z = 0",
    "for i=1:50",
    "z = z^2 + a",
    "end",
    "return z",
    "end"
  )
  prettyCode <- reindent_PhantomJS(code, language = "julia")
  expect_equal(
    prettyCode,
    "function mandelbrot(a)\n  z = 0\n  for i=1:50\n    z = z^2 + a\n  end\n  return z\nend\n"
  )
})
