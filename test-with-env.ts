#!/usr/bin/env tsx

// Test with explicit environment variable
process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'AIzaSyAJdVH_imureQ_2DWDSiXprw7X8Uz2vb9Y'

import { VibeSDK } from './lib/vibesdk'

async function testWithGemini() {
  console.log('🧪 Testing with Google Gemini API...\n')
  
  const vibeSDK = new VibeSDK()
  
  console.log('🔑 API Key configured:', process.env.GOOGLE_GENERATIVE_AI_API_KEY ? 'Yes' : 'No')
  
  try {
    console.log('📤 Generating code with prompt: "Create a simple NFT contract"')
    
    const result = await vibeSDK.generateCodeWithValidation({
      prompt: 'Create a simple NFT contract',
      context: 'Make it production-ready with modern Cadence 1.0 syntax'
    })
    
    console.log('\n📊 Generation Results:')
    console.log('- Code length:', result.code.length, 'characters')
    console.log('- Validation passed:', result.validation.isValid)
    console.log('- Has legacy patterns:', result.validation.errors.length > 0)
    console.log('- Rejected:', result.rejected)
    console.log('- Rejection reason:', result.rejectionReason || 'None')
    
    console.log('\n🔍 Code Analysis:')
    const hasLegacyPub = result.code.includes('pub ')
    const hasModernAccess = result.code.includes('access(all)')
    const hasLegacyStorage = result.code.includes('account.save(')
    const hasModernStorage = result.code.includes('account.storage.save')
    const hasUndefined = result.code.includes('undefined')
    
    console.log('- Contains "pub ":', hasLegacyPub ? '❌ YES' : '✅ NO')
    console.log('- Contains "access(all)":', hasModernAccess ? '✅ YES' : '❌ NO')
    console.log('- Contains legacy storage:', hasLegacyStorage ? '❌ YES' : '✅ NO')
    console.log('- Contains modern storage:', hasModernStorage ? '✅ YES' : '❌ NO')
    console.log('- Contains "undefined":', hasUndefined ? '❌ YES' : '✅ NO')
    
    if (hasLegacyPub || hasLegacyStorage || hasUndefined) {
      console.log('\n🚨 ISSUE: Generated code still contains legacy patterns!')
      console.log('This means the AI model is ignoring our strict prompts.')
      console.log('\n📝 Code preview:')
      console.log(result.code.substring(0, 300) + '...')
    } else {
      console.log('\n✅ SUCCESS: Generated code is modern Cadence 1.0!')
      console.log('\n📝 Code preview:')
      console.log(result.code.substring(0, 300) + '...')
    }
    
    if (result.validation.errors.length > 0) {
      console.log('\n⚠️ Validation Errors:')
      result.validation.errors.forEach(error => console.log('  -', error))
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error instanceof Error ? error.message : 'Unknown error')
  }
}

testWithGemini().catch(console.error)