/**
 * @fileoverview Prevent using lodash map method with arrays in favor of the native Array#map
 * @author Iurii Demidov
 */

'use strict';

// ------------------------------------------------------------------------------
// Rule Definition
// ------------------------------------------------------------------------------

function fixMapCallWithArrayLiteral(fixer, errorNode) {
  return [
    fixer.replaceTextRange([errorNode.callee.range[0], errorNode.callee.range[1] + 1], ''),
    fixer.replaceTextRange([errorNode.arguments[0].range[1], errorNode.arguments[1].range[0]], '.map(')
  ];
}

function fixMapCallWithIdentifier(fixer, errorNode) {
  const firstArgName = errorNode.arguments[0].name;
  return fixer.insertTextBefore(errorNode, `Array.isArray(${firstArgName}) ? ${firstArgName}.map(${errorNode.arguments[1].name}) : `);
}

module.exports = {
  meta: {
    docs: {
      description: 'Disallow lodash map method with arrays in favor of the native Array#map',
      category: 'Best Practices',
      recommended: true,
      suggestion: true
    },
    fixable: 'code',
    messages: {
      noLodashMapWithArray: `Do not use _.map with arrays`
    }
  },

  create: context => {
    let errorNodes = [];
    let programCheckRangeEnd = null;
    return {
      AssignmentExpression: node => {
        if (node.left.name === '_') {
          programCheckRangeEnd = programCheckRangeEnd || node.range[0];
        }
      },
      CallExpression: node => {
        if (node.callee.object.name === '_' && node.callee.property.name === 'map') {
          errorNodes.push(node);
        }
      },
      'Program:exit'() {
        if (!errorNodes.length) {
          return;
        }
        errorNodes.forEach(errorNode => {
          if (programCheckRangeEnd && errorNode.range[0] > programCheckRangeEnd) {
            return;
          }
          const firstArg = errorNode.arguments[0];

          if (firstArg.type === 'ArrayExpression' || firstArg.type === 'NewExpression' && firstArg.callee.name === 'Array') {
            context.report({
              messageId: 'noLodashMapWithArray',
              node: errorNode,
              fix: fixer => fixMapCallWithArrayLiteral(fixer, errorNode)
            });
          } else if (firstArg.type === 'Identifier') {
            context.report({
              messageId: 'noLodashMapWithArray',
              node: errorNode,
              fix: fixer => fixMapCallWithIdentifier(fixer, errorNode)
            });
          }
        });
      }
    }
  }
};
