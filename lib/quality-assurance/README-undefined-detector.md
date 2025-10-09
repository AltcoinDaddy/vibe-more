# UndefinedValueDetector

The UndefinedValueDetector is a comprehensive pre-validation scanner that identifies undefined values and related quality issues in AI-generated Cadence smart contracts.

## Features

### 1. Literal Undefined Detection
- Detects explicit "undefined" keywords in code
- Case-insensitive detection (undefined, UNDEFINED, Undefined)
- Ignores undefined in comments and string literals
- Provides type-appropriate default value suggestions

### 2. Incomplete Declaration Detection
- Identifies variable declarations without initialization values
- Detects incomplete assignment statements
- Suggests appropriate default values based on variable types
- Handles complex Cadence types (arrays, dictionaries, optionals)

### 3. Missing Return Statement Detection
- Scans functions with return types for missing return statements
- Handles complex return types including nested arrays and dictionaries
- Ignores "return" keywords in comments
- Provides appropriate default return values

### 4. Missing Parameter Defaults Detection
- Identifies optional parameters that could benefit from default values
- Provides warnings (not critical errors) for better usability
- Focuses on optional parameters (ending with ?)

### 5. Severity Classification System
- **Critical**: Literal undefined, incomplete declarations, missing returns
- **Warning**: Missing parameter defaults
- **Info**: General suggestions

### 6. Auto-Fix Capabilities
- Identifies which issues can be automatically corrected
- Provides specific suggested fixes with reasoning
- Supports type-aware default value generation

## Supported Cadence Types

The detector provides appropriate default values for:

- **Basic Types**: String (""), Int/UInt (0), Bool (false), Address (0x0)
- **Numeric Types**: All integer variants, UFix64/Fix64 (0.0)
- **Collection Types**: Arrays ([]), Dictionaries ({})
- **Optional Types**: nil for optional types
- **Complex Types**: Nested arrays and dictionaries

## Usage Example

```typescript
import { UndefinedValueDetector } from '@/lib/quality-assurance'

const detector = new UndefinedValueDetector()
const result = detector.scanForUndefinedValues(cadenceCode)

if (result.hasBlockingIssues) {
  console.log(`Found ${result.criticalIssues} critical issues`)
  
  result.issues.forEach(issue => {
    if (issue.severity === 'critical') {
      console.log(`${issue.message} - Suggested fix: ${issue.suggestedFix}`)
    }
  })
}
```

## Integration

The UndefinedValueDetector is designed to be the first step in the quality assurance pipeline:

1. **Pre-validation**: Scan generated code for obvious issues
2. **Auto-correction**: Apply suggested fixes for auto-fixable issues
3. **Regeneration**: Trigger regeneration if critical issues remain
4. **Fallback**: Use template-based generation if all else fails

## Test Coverage

The detector includes comprehensive test coverage:

- **Unit Tests**: 25 tests covering all detection scenarios
- **Integration Tests**: 4 tests with realistic Cadence contract examples
- **Edge Cases**: Handles empty code, comments, string literals
- **Type Accuracy**: Validates correct default value suggestions

## Performance

- Optimized for sub-100ms validation times
- Efficient regex patterns for pattern matching
- Minimal memory footprint for large code files
- Suitable for real-time validation in development environments