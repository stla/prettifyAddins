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
