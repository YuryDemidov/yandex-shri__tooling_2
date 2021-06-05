/**
 * @fileoverview Tests for lodash-to-native/map
 */

'use strict';

// -----------------------------------------------------------------------------
// Requirements
// -----------------------------------------------------------------------------

const RuleTester = require('eslint').RuleTester;
const rule = require('../../../lib/rules/map');

const parserOptions = {
  ecmaVersion: 2018,
  sourceType: 'module'
};

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

const ruleTester = new RuleTester({ parserOptions });

ruleTester.run('map', rule, {
  // Should not doing anything if _.map used with an object
  valid: [
    {
      code: `_.map({a: 1, b: 2}, fn);`
    },
    {
      code: `_.map(Object.create(null, { a: { writable: true, configurable: true, value: 1 } }), fn);`
    },
    {
      code: `_.map(new Object({a: 1}), fn);`
    }
  ],
  invalid: [
    // Should fix _.map call to native Array#map when it is used with array literal or Array constructor
    {
      code: `_.map([], fn);`,
      output: `[].map(fn);`,
      errors: [{ messageId: 'noLodashMapWithArray' }]
    },
    {
      code: `_.map([1, false, [3]], fn);`,
      output: `[1, false, [3]].map(fn);`,
      errors: [{ messageId: 'noLodashMapWithArray' }]
    },
    {
      code: `_.map(new Array(1, 2), fn)`,
      output: `new Array(1, 2).map(fn)`,
      errors: [{ messageId: 'noLodashMapWithArray' }]
    },

    // Should replace _.map call with variable with condition which checks if argument is an object or an array
    {
      code: `
        let a = [1, 2];
        _.map(a, fn);
      `,
      output: `
        let a = [1, 2];
        Array.isArray(a) ? a.map(fn) : _.map(a, fn);
      `,
      errors: [{ messageId: 'noLodashMapWithArray' }]
    },
    {
      code: `
        let a = new Array(1, 2);
        _.map(a, fn);
      `,
      output: `
        let a = new Array(1, 2);
        Array.isArray(a) ? a.map(fn) : _.map(a, fn);
      `,
      errors: [{ messageId: 'noLodashMapWithArray' }]
    },

    // Should not replace _.map calls after lodash shortcut reassigning
    {
      code: `
        var m1 = _.map([], fn);
        _ = {map: () => []};
        var m2 = _.map([], fn);
      `,
      output: `
        var m1 = [].map(fn);
        _ = {map: () => []};
        var m2 = _.map([], fn);
      `,
      errors: [{
        messageId: 'noLodashMapWithArray',
        line: 2
      }]
    },
    {
      code: `
        const a = [1, 2, 3];
        var m1 = _.map(a, fn);
        _ = {map: () => []};
        var m2 = _.map(a, fn);
      `,
      output: `
        const a = [1, 2, 3];
        var m1 = Array.isArray(a) ? a.map(fn) : _.map(a, fn);
        _ = {map: () => []};
        var m2 = _.map(a, fn);
      `,
      errors: [{
        messageId: 'noLodashMapWithArray',
        line: 3
      }]
    }
  ]
});
