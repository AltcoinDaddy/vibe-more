#!/usr/bin/env tsx

// Test the API endpoint directly
async function testAPIEndpoint() {
  console.log('🧪 Testing API Endpoint Directly...\n')
  
  const testPrompt = 'Create a simple fungible token contract'
  
  try {
    console.log('📤 Sending request to /api/generate...')
    console.log('Prompt:', testPrompt)
    
    const response = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: testPrompt,
        validateCode: true,
        includeAnalysis: true,
        allowLegacySyntax: false
      })
    })
    
    if (!response.ok) {
      console.log('❌ API Response Error:', response.status, response.statusText)
      const errorText = await response.text()
      console.log('Error details:', errorText)
      return
    }
    
    const data = await response.json()
    
    console.log('✅ API Response received')
    console.log('📊 Response summary:')
    console.log('- Code length:', data.code?.length || 0, 'characters')
    console.log('- Has legacy patterns:', data.validation?.hasLegacyPatterns || false)
    console.log('- Is valid:', data.validation?.isValid || false)
    console.log('- Rejected:', data.rejected || false)
    console.log('- Fallback used:', data.fallbackUsed || false)
    console.log('- Auto-modernized:', data.autoModernized || false)
    
    if (data.code) {
      console.log('\n📝 Generated code preview:')
      console.log(data.code.substring(0, 200) + '...')
      
      // Check for legacy patterns
      const hasLegacyPub = data.code.includes('pub ')
      const hasLegacyStorage = data.code.includes('account.save')
      const hasUndefined = data.code.includes('undefined')
      
      console.log('\n🔍 Legacy pattern check:')
      console.log('- Contains "pub ":', hasLegacyPub ? '❌ YES' : '✅ NO')
      console.log('- Contains "account.save":', hasLegacyStorage ? '❌ YES' : '✅ NO')
      console.log('- Contains "undefined":', hasUndefined ? '❌ YES' : '✅ NO')
      
      if (hasLegacyPub || hasLegacyStorage || hasUndefined) {
        console.log('\n🚨 ISSUE FOUND: API is still returning legacy/broken code!')
        console.log('This suggests a problem with the API implementation or caching.')
      } else {
        console.log('\n✅ SUCCESS: API is returning modern Cadence 1.0 code!')
      }
    }
    
    if (data.validation) {
      console.log('\n📋 Validation details:')
      console.log('- Validation time:', data.validation.validationTime + 'ms')
      console.log('- Pattern count:', data.validation.patterns?.length || 0)
      console.log('- Confidence:', data.validation.confidence || 0)
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error instanceof Error ? error.message : 'Unknown error')
    console.log('\n💡 Make sure the development server is running:')
    console.log('   npm run dev')
  }
}

console.log('🚀 Starting API endpoint test...')
console.log('Make sure your development server is running on http://localhost:3000\n')

testAPIEndpoint().catch(console.error)