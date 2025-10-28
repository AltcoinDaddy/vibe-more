// Simple test to verify the methods were added correctly
import { VibeSDK } from './lib/vibesdk'

const sdk = new VibeSDK()

// Test that the methods exist
console.log('parseFullStackPrompt exists:', typeof sdk.parseFullStackPrompt === 'function')
console.log('generateFullStackProject exists:', typeof sdk.generateFullStackProject === 'function')
console.log('analyzeProjectStructure exists:', typeof sdk.analyzeProjectStructure === 'function')

// Test basic parsing functionality
try {
  const result = sdk.parseFullStackPrompt("Create an NFT collection for digital art")
  console.log('Project type identified:', result.projectType)
  console.log('Backend contract types:', result.backendRequirements.contractTypes)
  console.log('Frontend pages:', result.frontendRequirements.pages)
  console.log('Confidence score:', result.confidence)
} catch (error) {
  console.error('Error during parsing:', error)
}

console.log('✅ Basic functionality test completed')