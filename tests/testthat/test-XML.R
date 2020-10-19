test_that("XML with default `tabSize`", {
  skip_if(Sys.which("xmllint") == "", message = "'xmllint' not found")
  code <- c(
    "<item>",
    "<link>https://google.com</link>",
    "  </item>"
  )
  prettyCode <- prettifyXML(code)
  expect_equal(
    prettyCode,
    "<?xml version=\"1.0\"?>\n<item>\n  <link>https://google.com</link>\n</item>"
  )
})

test_that("XML with given `tabSize`", {
  skip_if(Sys.which("xmllint") == "", message = "'xmllint' not found")
  code <- c(
    "<item>",
    "<link>https://google.com</link>",
    "  </item>"
  )
  prettyCode <- prettifyXML(code, tabSize = 4)
  expect_equal(
    prettyCode,
    "<?xml version=\"1.0\"?>\n<item>\n    <link>https://google.com</link>\n</item>"
  )
})

test_that("XML from a file", {
  skip_if(Sys.which("xmllint") == "", message = "'xmllint' not found")
  code <- c(
    "<item>",
    "<link>https://google.com</link>",
    "  </item>"
  )
  tmpFile <- tempfile(fileext = ".xml")
  writeLines(code, tmpFile)
  prettyCode <- prettifyXML(tmpFile)
  expect_equal(
    prettyCode,
    "<?xml version=\"1.0\"?>\n<item>\n  <link>https://google.com</link>\n</item>"
  )
})
