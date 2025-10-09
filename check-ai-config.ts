#!/usr/bin/env tsx

// Check AI provider configuration
console.log('🔍 Checking AI Provider Configuration...\n')

const providers = [
  { name: 'OpenAI', key: 'OPENAI_API_KEY', env: process.env.OPENAI_API_KEY },
  { name: 'Google Gemini', key: 'GOOGLE_GENERATIVE_AI_API_KEY', env: process.env.GOOGLE_GENERATIVE_AI_API_KEY },
  { name: 'Anthropic', key: 'ANTHROPIC_API_KEY', env: process.env.ANTHROPIC_API_KEY },
  { name: 'Vercel AI Gateway', key: 'AI_GATEWAY_API_KEY', env: process.env.AI_GATEWAY_API_KEY },
  { name: 'Vercel OIDC', key: 'VERCEL_OIDC_TOKEN', env: process.env.VERCEL_OIDC_TOKEN }
]

let hasProvider = false

providers.forEach(provider => {
  const isConfigured = provider.env && provider.env.length > 0
  console.log(`${isConfigured ? '✅' : '❌'} ${provider.name}: ${isConfigured ? 'Configured' : 'Not configured'}`)
  if (isConfigured) {
    hasProvider = true
    console.log(`   Key length: ${provider.env!.length} characters`)
  }
})

console.log('\n📋 Summary:')
if (hasProvider) {
  console.log('✅ At least one AI provider is configured')
  console.log('🤖 The system should use AI generation with legacy prevention')
} else {
  console.log('❌ No AI providers configured')
  console.log('🔄 The system will use mock responses (which should be modern)')
  console.log('\n💡 To fix this, add one of these environment variables:')
  console.log('   - OPENAI_API_KEY=your_openai_key')
  console.log('   - GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_key')
  console.log('   - ANTHROPIC_API_KEY=your_claude_key')
}

console.log('\n🔧 Next steps:')
console.log('1. Add an AI provider API key to your environment')
console.log('2. Restart the development server')
console.log('3. Test code generation again')
console.log('4. If still getting legacy code, the AI model needs stronger prompts')