/* eslint-disable no-undef */
// Do not run this module, it is just a sample to generate a documentation
// Show a module definition and 2 functions definition, one minimal and the other with notes / tags / expectations
const assert = require('assert')

/**
 * @testModule Demo Module A
 * @testFeature Array test
 * @testNote This module is the demo module
 */
describe('Array', function () {
  /**
   * @testCase Specific length
   * @testResult Sample length computed correctly (2)
   * @testTag Array
   */
  describe('custom array length computation', function () {
    it('get 2 as the correct array length', function () {
      let length = 0
      const arr = ['x', 'y']

      // eslint-disable-next-line no-unused-vars
      for (const i of arr) {
        length++
      }

      assert.equal(length, 2)
    })
  })

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
  describe('#indexOf()', function () {
    it('should return -1 when the value is not present', function () {
      assert.equal([1, 2, 3].indexOf(4), -1)
    })
  })
})
