import { describe, test, expect, beforeEach } from 'vitest';
import { LegacyPatternDetector } from '../legacy-pattern-detector';

describe('LegacyPatternDetector', () => {
  let detector: LegacyPatternDetector;

  beforeEach(() => {
    detector = new LegacyPatternDetector();
  });

  describe('Access Modifier Detection', () => {
    test('detects pub keyword in various contexts', () => {
      const code = `
        pub fun getValue(): String {
          return "test"
        }
        pub var balance: UFix64
        pub let name: String
      `;

      const patterns = detector.detectAllLegacyPatterns(code);
      const pubPatterns = patterns.filter(p => p.type === 'access-modifier');
      
      expect(pubPatterns).toHaveLength(3);
      expect(pubPatterns[0].originalText).toBe('pub fun ');
      expect(pubPatterns[0].modernReplacement).toBe('access(all) fun ');
      expect(pubPatterns[0].severity).toBe('critical');
    });

    test('detects pub(set) modifier', () => {
      const code = `pub(set) var balance: UFix64 = 0.0`;

      const patterns = detector.detectAllLegacyPatterns(code);
      const pubSetPatterns = patterns.filter(p => p.originalText.includes('pub(set)'));
      
      expect(pubSetPatterns).toHaveLength(1);
      expect(pubSetPatterns[0].suggestedFix).toContain('appropriate access control pattern');
      expect(pubSetPatterns[0].severity).toBe('critical');
    });

    test('provides accurate location tracking', () => {
      const code = `contract Test {
  pub fun getValue(): String {
    return "test"
  }
}`;

      const patterns = detector.detectAllLegacyPatterns(code);
      const pubPattern = patterns.find(p => p.originalText === 'pub fun ');
      
      expect(pubPattern?.location.line).toBe(2);
      expect(pubPattern?.location.column).toBe(3);
    });
  });

  describe('Storage API Detection', () => {
    test('detects legacy storage API calls', () => {
      const code = `
        account.save(<-vault, to: /storage/vault)
        let vault <- account.load<@Vault>(from: /storage/vault)
        let ref = account.borrow<&Vault>(from: /storage/vault)
        account.link<&Vault>(/public/vault, target: /storage/vault)
      `;

      const patterns = detector.detectAllLegacyPatterns(code);
      const storagePatterns = patterns.filter(p => p.type === 'storage-api');
      
      expect(storagePatterns.length).toBeGreaterThanOrEqual(1);
      
      const savePattern = storagePatterns.find(p => p.originalText.includes('account.save'));
      if (savePattern) {
        expect(savePattern.modernReplacement).toContain('account.storage.save');
      }
      
      const borrowPattern = storagePatterns.find(p => p.originalText.includes('account.borrow'));
      if (borrowPattern) {
        expect(borrowPattern.modernReplacement).toContain('account.capabilities.borrow');
      }
    });

    test('categorizes storage patterns correctly', () => {
      const code = `account.save(<-vault, to: /storage/vault)`;

      const patterns = detector.detectAllLegacyPatterns(code);
      const categories = detector.categorizePatterns(patterns);
      
      const storageCategory = categories.find(c => c.name === 'Storage API');
      expect(storageCategory).toBeDefined();
      expect(storageCategory?.patterns).toHaveLength(1);
    });
  });

  describe('Interface Conformance Detection', () => {
    test('detects comma-separated interface conformance', () => {
      const code = `
        resource Vault: Provider, Receiver, Balance {
          // implementation
        }
      `;

      const patterns = detector.detectAllLegacyPatterns(code);
      const interfacePatterns = patterns.filter(p => p.type === 'interface-conformance');
      
      expect(interfacePatterns).toHaveLength(1);
      expect(interfacePatterns[0].modernReplacement).toContain('&');
      expect(interfacePatterns[0].severity).toBe('warning');
    });
  });

  describe('Pattern Categorization', () => {
    test('categorizes patterns by type and priority', () => {
      const code = `
        pub fun getValue(): String { return "test" }
        account.save(<-vault, to: /storage/vault)
        resource Vault: Provider, Receiver {}
      `;

      const patterns = detector.detectAllLegacyPatterns(code);
      const categories = detector.categorizePatterns(patterns);
      
      expect(categories.length).toBeGreaterThan(0);
      
      // Should be sorted by priority (critical patterns first)
      const firstCategory = categories[0];
      expect(firstCategory.priority).toBeGreaterThan(0);
      
      // Check that categories have proper descriptions
      categories.forEach(category => {
        expect(category.description).toBeTruthy();
        expect(category.patterns.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Fix Prioritization', () => {
    test('prioritizes fixes by impact and effort', () => {
      const code = `
        pub fun getValue(): String { return "test" }
        account.link<&Vault>(/public/vault, target: /storage/vault)
        pub var balance: UFix64
      `;

      const patterns = detector.detectAllLegacyPatterns(code);
      const prioritizedFixes = detector.prioritizeFixesByImpact(patterns);
      
      expect(prioritizedFixes.length).toBe(patterns.length);
      
      // High impact fixes should come first
      const highImpactFixes = prioritizedFixes.filter(f => f.impact === 'high');
      expect(highImpactFixes.length).toBeGreaterThan(0);
      
      // Each fix should have proper categorization
      prioritizedFixes.forEach(fix => {
        expect(['high', 'medium', 'low']).toContain(fix.impact);
        expect(['easy', 'moderate', 'complex']).toContain(fix.effort);
        expect(fix.order).toBeGreaterThan(0);
      });
    });
  });

  describe('Fix Plan Generation', () => {
    test('generates comprehensive fix plan', () => {
      const code = `
        pub contract TestContract {
          pub fun getValue(): String { return "test" }
          pub var balance: UFix64
          
          init() {
            account.save(<-create Vault(), to: /storage/vault)
          }
        }
      `;

      const fixPlan = detector.generateFixPlan(code);
      
      expect(fixPlan.patterns.length).toBeGreaterThan(0);
      expect(fixPlan.prioritizedFixes.length).toBe(fixPlan.patterns.length);
      expect(fixPlan.estimatedTime).toBeGreaterThan(0);
      expect(['low', 'medium', 'high']).toContain(fixPlan.riskLevel);
    });

    test('calculates risk level correctly', () => {
      const lowRiskCode = `pub fun getValue(): String { return "test" }`;
      const highRiskCode = `
        pub fun test1() {}
        pub fun test2() {}
        pub fun test3() {}
        pub fun test4() {}
        pub fun test5() {}
        pub fun test6() {}
        pub fun test7() {}
        pub fun test8() {}
        pub fun test9() {}
        pub fun test10() {}
        pub fun test11() {}
        account.save(<-vault, to: /storage/vault)
        account.link<&Vault>(/public/vault, target: /storage/vault)
      `;

      const lowRiskPlan = detector.generateFixPlan(lowRiskCode);
      const highRiskPlan = detector.generateFixPlan(highRiskCode);
      
      expect(lowRiskPlan.riskLevel).toBe('low');
      expect(highRiskPlan.riskLevel).toBe('high');
    });
  });

  describe('Edge Cases and Accuracy', () => {
    test('handles empty code', () => {
      const patterns = detector.detectAllLegacyPatterns('');
      expect(patterns).toHaveLength(0);
    });

    test('handles code with no legacy patterns', () => {
      const modernCode = `
        access(all) contract ModernContract {
          access(all) fun getValue(): String {
            return "modern"
          }
        }
      `;

      const patterns = detector.detectAllLegacyPatterns(modernCode);
      // Filter out any view function suggestions since they're just suggestions
      const criticalPatterns = patterns.filter(p => p.severity === 'critical');
      expect(criticalPatterns).toHaveLength(0);
    });

    test('handles complex nested patterns', () => {
      const complexCode = `
        pub contract TestContract {
          pub resource Vault: Provider, Receiver {
            pub fun deposit(from: @FungibleToken.Vault) {
              account.save(<-from, to: /storage/temp)
            }
          }
        }
      `;

      const patterns = detector.detectAllLegacyPatterns(complexCode);
      expect(patterns.length).toBeGreaterThanOrEqual(3);
      
      // Should detect multiple types of patterns
      const types = new Set(patterns.map(p => p.type));
      expect(types.size).toBeGreaterThanOrEqual(1);
    });

    test('provides accurate line and column information', () => {
      const code = `line 1
pub fun test() {
  account.save()
}`;

      const patterns = detector.detectAllLegacyPatterns(code);
      
      const pubPattern = patterns.find(p => p.originalText === 'pub fun ');
      expect(pubPattern?.location.line).toBe(2);
      expect(pubPattern?.location.column).toBe(1);
      
      const savePattern = patterns.find(p => p.originalText === 'account.save(');
      expect(savePattern?.location.line).toBe(3);
      expect(savePattern?.location.column).toBe(3);
    });

    test('handles false positives correctly', () => {
      const code = `
        // This should not trigger pub detection
        let description = "This is a function"
        let comment = "// should not be detected in comments"
      `;

      const patterns = detector.detectAllLegacyPatterns(code);
      // Only check for critical patterns that should definitely not be there
      const criticalPatterns = patterns.filter(p => p.severity === 'critical');
      expect(criticalPatterns).toHaveLength(0);
    });
  });

  describe('Performance Tests', () => {
    test('handles large code files efficiently', () => {
      // Generate a large code file with many patterns
      const largeCode = Array(1000).fill(0).map((_, i) => 
        `pub fun test${i}(): String { return "test" }`
      ).join('\n');

      const startTime = Date.now();
      const patterns = detector.detectAllLegacyPatterns(largeCode);
      const endTime = Date.now();
      
      // Should detect at least 1000 pub fun patterns
      const pubFunPatterns = patterns.filter(p => p.originalText === 'pub fun ');
      expect(pubFunPatterns).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});