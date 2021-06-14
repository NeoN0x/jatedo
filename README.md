JaTeDo
======

JaTeDo - Javascript Test Documentator is a lightweight and dead simple solution to generate tests documentations usings easy jsdoc-like syntax.

It produces an HTML report in order.

The purpose is to maintain the test documentation alongside test scenarios. Please see example/moduleA for an use case.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/jatedo.svg)](https://npmjs.org/package/jatedo)
[![Downloads/week](https://img.shields.io/npm/dw/jatedo.svg)](https://npmjs.org/package/jatedo)
[![License](https://img.shields.io/npm/l/jatedo.svg)](https://github.com/NeoN0x/jatedo/blob/master/package.json)

* [Usage](#usage)
* [Commands](#commands)
* [TestDoc Specification](#testdoc)

# Usage

```sh-session
$ npm install -g jatedo
$ jatedo (--version)
jatedo/0.0.1 linux-x64 node-v14.4.0
$ jatedo --help
```

# Commands

Classic use

```sh-session
jatedo -i ./srcDirToScan -o ./outputDir -e .js
```

# TestDoc

## Specification

The generator use the following structure

```
module
  feature
    case
    case
  feature
    case
```

Each case represents tests with details.

Use JS Doc style (/** */) to document the tests with the following case.

  `@testModule XYZ`

(required) Describe the module (root).

  `@testFeature`

(required) Describe the feature

  `@testCase`

(required) Describe the case that is tested

  `@testResult`

(recommended) Describe the expected result, one result required per case.

  `@testExpectation`

(not required) Describe the expectations / outcome per test. Can be present multiple times.

  `@testTag`

(not required) Describe parts tested. Can be present multiple times. Could be semantic for parts involved in the test, eg "DB", "API".

  `@testNote`

(not required) Describe some specific things to know about the test.


## Simple example

At the beginning of file/module to document, include the module description.

```js
/**
 * @testModule Demo Module A
 * @testFeature Array test
 * @testNote This module is the demo module
 */
```

Then, at each use case, include the description.

```js
/**
 * @testCase indexOf return -1 when value is not present
 * @testResult array.indexOf works as expected
 * @testTag Array
 * @testTag JSCore
 * @testExpectation No console log displayed
 * @testExpectation No exception thrown
 * @testExpectation No additional checks done
 * @testNote This test a javascript standard function
 * @testNote This is a second note for this test case
 */
```
