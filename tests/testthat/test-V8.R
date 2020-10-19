test_that("V8 prettify JavaScript with default `tabSize`", {
  skip_if_not_installed("V8")
  code <- c(
    "function f(x){",
    "var y= x+1",
    "console.log('y:',y) ;",
    "}"
  )
  prettyCode <- prettify_V8(code, "javascript")
  expect_equal(
    prettyCode,
    "function f(x) {\n  var y = x + 1;\n  console.log(\"y:\", y);\n}\n"
  )
})

test_that("V8 prettify JavaScript with given `tabSize`", {
  skip_if_not_installed("V8")
  code <- c(
    "function f(x){",
    "var y= x+1",
    "console.log('y:',y) ;",
    "}"
  )
  prettyCode <- prettify_V8(code, "javascript", tabSize = 4)
  expect_equal(
    prettyCode,
    "function f(x) {\n    var y = x + 1;\n    console.log(\"y:\", y);\n}\n"
  )
})

test_that("V8 reindent JavaScript with default `tabSize`", {
  skip_if_not_installed("V8")
  code <- c(
    "function f(x){",
    "var y= x+1",
    "console.log('y:',y) ;",
    "}"
  )
  prettyCode <- reindent_V8(code, "javascript")
  expect_equal(
    prettyCode,
    "function f(x){\r\n  var y= x+1\r\n  console.log('y:',y) ;\r\n}"
  )
})

test_that("V8 reindent JavaScript with given `tabSize`", {
  skip_if_not_installed("V8")
  code <- c(
    "function f(x){",
    "var y= x+1",
    "console.log('y:',y) ;",
    "}"
  )
  prettyCode <- reindent_V8(code, "javascript", tabSize = 4)
  expect_equal(
    prettyCode,
    "function f(x){\r\n    var y= x+1\r\n    console.log('y:',y) ;\r\n}"
  )
})

