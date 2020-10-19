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
