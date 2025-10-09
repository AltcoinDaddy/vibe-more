# Intelligent Fallback Generation System

## Overview

The Intelligent Fallback Generation System provides guaranteed-working Cadence smart contracts when AI generation fails or produces low-quality code. This system ensures that users always receive syntactically correct, functionally complete contracts that can be deployed immediately.

## Key Features

### 1. Contract Type Detection
- **Automatic Detection**: Analyzes user prompts to determine contract type (NFT, fungible token, marketplace, DAO, DeFi, utility)
- **Confidence Scoring**: Provides confidence levels for type detection
- **Complexity Assessment**: Determines contract complexity (simple, intermediate, advanced) based on prompt analysis
- **Feature Extraction**: Identifies specific features requested in the prompt

### 2. Template-Based Generation
- **Curated Templates**: Uses proven, migrated Cadence 1.0 templates from the main template library
- **Smart Selection**: Selects the most appropriate template based on contract type and features
- **Customization**: Automatically customizes templates with user-specified contract names
- **Quality Guarantee**: All templates are pre-validated and guaranteed to be syntactically correct

### 3. Fallback Strategies
- **Primary Fallback**: Uses appropriate templates for detected contract types
- **Generic Fallback**: Provides basic working contracts for unknown types
- **Emergency Fallback**: Minimal working contract for critical failures
- **Minimal Contracts**: Creates simple, working contracts for basic requirements

### 4. Quality Validation
- **Syntax Validation**: Ensures balanced braces, parentheses, and proper structure
- **Cadence 1.0 Compliance**: Validates modern access modifiers and syntax
- **Completeness Checks**: Verifies presence of required elements (init functions, proper declarations)
- **Undefined Value Prevention**: Guarantees no undefined values in generated code

## Architecture

```
User Prompt
     ↓
Contract Type Detection
     ↓
Template Selection
     ↓
Template Customization
     ↓
Quality Validation
     ↓
Fallback Contract
```

## API Reference

### Core Classes

#### `FallbackGenerator`
Main class for generating fallback contracts.

```typescript
class FallbackGenerator {
  // Generate fallback contract from prompt
  async generateFallbackContract(prompt: string, context?: GenerationContext): Promise<FallbackGenerationResult>
  
  // Detect contract type from prompt
  detectContractType(prompt: string): ContractTypeDetectionResult
  
  // Get template-based fallback
  getTemplateBasedFallback(requirements: { category: string; features?: string[] }): string
  
  // Create minimal working contract
  createMinimalWorkingContract(basicRequirements: { name?: string; category?: string }): string
  
  // Validate fallback quality
  async validateFallbackQuality(code: string): Promise<boolean>
}
```

#### Key Interfaces

```typescript
interface FallbackGenerationResult {
  code: string
  templateUsed: string
  confidence: number
  contractType: ContractType
  reasoning: string
  success: boolean
}

interface ContractType {
  category: 'nft' | 'fungible-token' | 'utility' | 'dao' | 'marketplace' | 'generic'
  complexity: 'simple' | 'intermediate' | 'advanced'
  features: string[]
}
```

## Usage Examples

### Basic Usage

```typescript
import { fallbackGenerator } from './fallback-generator'

// Generate NFT contract fallback
const result = await fallbackGenerator.generateFallbackContract('Create an NFT collection')

if (result.success) {
  console.log('Generated contract:', result.code)
  console.log('Template used:', result.templateUsed)
  console.log('Contract type:', result.contractType.category)
}
```

### Advanced Usage with Context

```typescript
const context: GenerationContext = {
  userPrompt: 'Create an advanced NFT marketplace',
  contractType: { category: 'marketplace', complexity: 'advanced', features: ['royalties', 'auctions'] },
  previousAttempts: [],
  qualityRequirements: {
    minimumQualityScore: 90,
    requiredFeatures: ['royalties'],
    prohibitedPatterns: ['undefined'],
    performanceRequirements: {
      maxGenerationTime: 30000,
      maxValidationTime: 5000,
      maxRetryAttempts: 3
    }
  },
  userExperience: 'expert'
}

const result = await fallbackGenerator.generateFallbackContract(
  'Create an NFT marketplace with royalties',
  context
)
```

### Template-Based Fallback

```typescript
// Get specific template-based fallback
const nftCode = fallbackGenerator.getTemplateBasedFallback({
  category: 'nft',
  features: ['royalties', 'metadata']
})

// Create minimal working contract
const minimalCode = fallbackGenerator.createMinimalWorkingContract({
  name: 'MyToken',
  category: 'fungible-token'
})
```

## Contract Type Detection

The system uses pattern matching to detect contract types from user prompts:

### Detection Patterns

- **NFT**: `nft`, `non-fungible`, `collectible`, `art`, `collection`, `mint`, `metadata`
- **Fungible Token**: `fungible`, `token`, `coin`, `currency`, `transfer`, `balance`, `supply`
- **Marketplace**: `marketplace`, `market`, `trading`, `buy`, `sell`, `auction`, `listing`
- **DAO**: `dao`, `governance`, `voting`, `proposal`, `vote`, `ballot`, `decision`
- **DeFi**: `defi`, `staking`, `yield`, `farming`, `liquidity`, `pool`, `swap`, `reward`
- **Utility**: `utility`, `tool`, `helper`, `multi-sig`, `wallet`, `escrow`, `oracle`

### Complexity Detection

- **Simple**: `basic`, `simple`, `minimal`, `easy`, `starter`
- **Intermediate**: `standard`, `complete`, `full`, `comprehensive`
- **Advanced**: `advanced`, `complex`, `sophisticated`, `enterprise`, `custom`, `multi`

## Quality Assurance

### Validation Checks

1. **Syntax Validation**
   - Balanced braces, parentheses, and brackets
   - Proper contract declaration
   - Valid init function
   - Correct access modifiers

2. **Cadence 1.0 Compliance**
   - Modern `access(all)` syntax
   - No legacy `pub` keywords
   - Proper resource and interface definitions

3. **Completeness Validation**
   - No undefined values
   - Complete variable declarations
   - Proper function implementations
   - Required contract elements

### Error Handling

The system provides multiple fallback levels:

1. **Template Selection**: Choose best matching template
2. **Generic Fallback**: Use basic working template
3. **Emergency Fallback**: Minimal contract that always works
4. **Error Recovery**: Graceful handling of all edge cases

## Performance

- **Fast Generation**: Sub-second response times
- **Concurrent Support**: Handles multiple simultaneous requests
- **Memory Efficient**: Minimal resource usage
- **Scalable**: Supports high-volume usage

## Testing

The system includes comprehensive tests:

- **Unit Tests**: 39 tests covering all functionality
- **Integration Tests**: 11 tests for system integration
- **Edge Case Tests**: Handles empty prompts, special characters, long prompts
- **Performance Tests**: Validates response times and concurrency
- **Quality Tests**: Ensures all generated contracts pass validation

### Running Tests

```bash
# Run fallback generator tests
npx vitest run lib/quality-assurance/__tests__/fallback-generator.test.ts

# Run integration tests
npx vitest run lib/quality-assurance/__tests__/fallback-integration.test.ts
```

## Integration with Quality Assurance Pipeline

The Fallback Generator integrates seamlessly with the broader Quality Assurance system:

1. **Trigger Conditions**: Activated when AI generation fails or produces low-quality code
2. **Quality Gates**: Provides guaranteed-passing contracts for quality thresholds
3. **Error Recovery**: Serves as final safety net in the generation pipeline
4. **Metrics Collection**: Reports usage and success metrics for monitoring

## Future Enhancements

- **Dynamic Template Updates**: Automatically incorporate new templates
- **User Feedback Integration**: Learn from user preferences and corrections
- **Advanced Customization**: More sophisticated template customization
- **Performance Optimization**: Further speed improvements for high-volume usage
- **Extended Contract Types**: Support for additional contract categories

## Conclusion

The Intelligent Fallback Generation System ensures that the VibeMore platform can always provide working Cadence contracts to users, even when AI generation fails. By combining intelligent contract type detection, curated templates, and comprehensive quality validation, the system maintains high reliability while preserving the user experience.