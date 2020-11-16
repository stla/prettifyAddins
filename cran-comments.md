# prettifyAddins 2.0.3

## Release summary

I'm feeling stupid. The CRAN checks still report an error and this is my fault.
The tests involving V8 are correctly skipped but there also are some examples
involving V8. So now I've enclosed them in `donttest{}`.


# prettifyAddins 2.0.2

## Release summary

This is a minor release. The CRAN checks still report an error. That's because I 
didn't pay attention enough: there are several tests involving V8, and I skipped 
only one in my previous fix. 

## Test environments

* ubuntu 18.04, R 3.6.3
* win-builder (devel & release)

## R CMD check results

OK


# prettifyAddins 2.0.1

## Release summary

This is a minor release. I just fixed the issue spotted by the CRAN checks. 
This issue is due to a too old version of the V8 engine installed on the 
system. So I check the version in the failing test and I skip it if the version 
is too old.

## Test environments

* ubuntu 18.04, R 3.6.3
* win-builder (devel & release)

## R CMD check results

OK
