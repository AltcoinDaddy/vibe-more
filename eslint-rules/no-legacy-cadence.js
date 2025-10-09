/**
 * ESLint rule to prevent legacy Cadence syntax patterns
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow legacy Cadence syntax patterns',
      category: 'Possible Errors',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      legacyPubKeyword: 'Legacy "pub" keyword detected. Use "access(all)" instead.',
      legacyPubSetKeyword: 'Legacy "pub(set)" keyword detected. Use "access(all)" with setter restrictions instead.',
      legacyStorageAPI: 'Legacy storage API "{{api}}" detected. Use "account.storage.{{api}}" instead.',
      legacyAccountLink: 'Legacy "account.link()" detected. Use "account.capabilities.storage.issue()" instead.',
      legacyAccountBorrow: 'Legacy "account.borrow()" detected. Use "account.capabilities.borrow()" instead.',
      legacyInterfaceConformance: 'Legacy interface conformance syntax detected. Use "&" instead of "," to separate interfaces.',
    },
  },

  create(context) {
    const sourceCode = context.getSourceCode();

    // Legacy patterns to detect
    const legacyPatterns = [
      {
        regex: /\bpub\s+(?:var|let|fun|resource|struct|contract|interface)/g,
        messageId: 'legacyPubKeyword',
        fix: (fixer, node, match) => {
          const start = match.index;
          const end = start + 3; // length of "pub"
          return fixer.replaceTextRange([start, end], 'access(all)');
        }
      },
      {
        regex: /\bpub\(set\)\s+/g,
        messageId: 'legacyPubSetKeyword',
        fix: (fixer, node, match) => {
          const start = match.index;
          const end = start + 8; // length of "pub(set)"
          return fixer.replaceTextRange([start, end], 'access(all)');
        }
      },
      {
        regex: /account\.(save|load)\(/g,
        messageId: 'legacyStorageAPI',
        data: (match) => ({ api: match[1] }),
        fix: (fixer, node, match) => {
          const start = match.index;
          const end = start + match[0].length - 1; // exclude the opening parenthesis
          return fixer.replaceTextRange([start, end], `account.storage.${match[1]}`);
        }
      },
      {
        regex: /account\.link\(/g,
        messageId: 'legacyAccountLink',
        fix: (fixer, node, match) => {
          const start = match.index;
          const end = start + 12; // length of "account.link"
          return fixer.replaceTextRange([start, end], 'account.capabilities.storage.issue');
        }
      },
      {
        regex: /account\.borrow\(/g,
        messageId: 'legacyAccountBorrow',
        fix: (fixer, node, match) => {
          const start = match.index;
          const end = start + 14; // length of "account.borrow"
          return fixer.replaceTextRange([start, end], 'account.capabilities.borrow');
        }
      },
      {
        regex: /:\s*[A-Z][a-zA-Z0-9]*\s*,\s*[A-Z][a-zA-Z0-9]*\s*\{/g,
        messageId: 'legacyInterfaceConformance',
        fix: (fixer, node, match) => {
          const start = match.index;
          const end = start + match[0].length - 1; // exclude the opening brace
          const modernSyntax = match[0].replace(/,\s*/g, ' & ').slice(0, -1); // replace commas with & and remove brace
          return fixer.replaceTextRange([start, end], modernSyntax);
        }
      }
    ];

    function checkNode(node) {
      // Only check string literals and template literals that might contain Cadence code
      if (node.type !== 'Literal' && node.type !== 'TemplateLiteral') {
        return;
      }

      let text = '';
      let startOffset = 0;

      if (node.type === 'Literal' && typeof node.value === 'string') {
        text = node.value;
        startOffset = node.range[0] + 1; // +1 to skip opening quote
      } else if (node.type === 'TemplateLiteral') {
        // For template literals, check each quasi (string part)
        node.quasis.forEach((quasi, index) => {
          text = quasi.value.raw;
          startOffset = quasi.range[0] + 1; // +1 to skip opening backtick or ${}
          checkTextForLegacyPatterns(text, startOffset, node);
        });
        return;
      }

      checkTextForLegacyPatterns(text, startOffset, node);
    }

    function checkTextForLegacyPatterns(text, startOffset, node) {
      // Skip if this looks like it's intentionally showing legacy patterns
      if (text.includes('NEVER use') || text.includes('Legacy') || text.includes('DO NOT USE')) {
        return;
      }

      legacyPatterns.forEach(pattern => {
        let match;
        pattern.regex.lastIndex = 0; // Reset regex state

        while ((match = pattern.regex.exec(text)) !== null) {
          const absoluteStart = startOffset + match.index;
          const absoluteEnd = absoluteStart + match[0].length;

          const data = pattern.data ? pattern.data(match) : {};

          context.report({
            node,
            messageId: pattern.messageId,
            data,
            loc: {
              start: sourceCode.getLocFromIndex(absoluteStart),
              end: sourceCode.getLocFromIndex(absoluteEnd),
            },
            fix: pattern.fix ? (fixer) => pattern.fix(fixer, node, match) : null,
          });
        }
      });
    }

    return {
      Literal: checkNode,
      TemplateLiteral: checkNode,
    };
  },
};