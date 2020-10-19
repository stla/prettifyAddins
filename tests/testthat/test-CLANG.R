test_that("CLANG prettify C++ with default `tabSize`", {
  skip_if(Sys.which("clang-format") == "")
  code <- c(
    "double f(double x){",
    "double y= x+1;",
    "return y ;",
    "  }"
  )
  prettyCode <- prettifyCLANG(code, language = "c++")
  expect_equal(
    prettyCode,
    "double f(double x) {\n  double y = x + 1;\n  return y;\n}"
  )
})

test_that("CLANG prettify C++ with given `tabSize`", {
  skip_if(Sys.which("clang-format") == "")
  code <- c(
    "double f(double x){",
    "double y= x+1;",
    "return y ;",
    "  }"
  )
  prettyCode <- prettifyCLANG(code, language = "c++", tabSize = 4)
  expect_equal(
    prettyCode,
    "double f(double x) {\n    double y = x + 1;\n    return y;\n}"
  )
})
