const { VibeSDK } = require('./lib/vibesdk.ts');

const sdk = new VibeSDK();
console.log('parseFullStackPrompt method exists:', typeof sdk.parseFullStackPrompt === 'function');
console.log('generateFullStackProject method exists:', typeof sdk.generateFullStackProject === 'function');
console.log('analyzeProjectStructure method exists:', typeof sdk.analyzeProjectStructure === 'function');

// Test basic parsing
try {
  const result = sdk.parseFullStackPrompt("Create an NFT collection");
  console.log('Parsing result:', result);
} catch (error) {
  console.error('Error:', error.message);
}