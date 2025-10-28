/**
 * Test script for full-stack API endpoints
 * Run with: npx tsx test-fullstack-endpoints.ts
 */

const BASE_URL = 'http://localhost:3000'

async function testEndpoint(endpoint: string, method: string = 'GET', body?: any) {
  try {
    console.log(`\n🧪 Testing ${method} ${endpoint}`)
    
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    }
    
    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(body)
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options)
    const data = await response.json()
    
    console.log(`✅ Status: ${response.status}`)
    console.log(`📄 Response:`, JSON.stringify(data, null, 2).substring(0, 500) + '...')
    
    return { success: response.ok, status: response.status, data }
  } catch (error) {
    console.log(`❌ Error:`, error)
    return { success: false, error }
  }
}

async function runTests() {
  console.log('🚀 Testing Full-Stack API Endpoints')
  console.log('=====================================')
  
  // Test project templates endpoint
  await testEndpoint('/api/project-templates')
  await testEndpoint('/api/project-templates?category=nft&complexity=beginner')
  await testEndpoint('/api/project-templates?action=templates')
  
  // Test generate component endpoint
  await testEndpoint('/api/generate-component', 'POST', {
    name: 'TestButton',
    type: 'interaction',
    description: 'A simple test button component',
    styling: {
      framework: 'tailwind',
      theme: 'auto'
    },
    features: {
      typescript: true,
      errorHandling: true
    }
  })
  
  // Test generate API route endpoint
  await testEndpoint('/api/generate-api-route', 'POST', {
    path: '/test-endpoint',
    methods: ['GET', 'POST'],
    description: 'A test API endpoint',
    contractCalls: [
      {
        contractName: 'TestContract',
        functionName: 'testFunction',
        parameters: [
          { name: 'param1', type: 'string', required: true }
        ],
        returnType: 'string'
      }
    ],
    features: {
      typescript: true,
      validation: true,
      documentation: true
    }
  })
  
  // Test generate fullstack endpoint (basic request)
  await testEndpoint('/api/generate-fullstack', 'POST', {
    projectName: 'Test dApp',
    description: 'A simple test dApp for validation',
    features: [
      {
        type: 'nft',
        specifications: { standard: 'NonFungibleToken' },
        priority: 'high'
      }
    ],
    uiRequirements: {
      pages: [
        { name: 'Home', route: '/', purpose: 'Landing page', contractInteractions: [] }
      ],
      components: [
        { name: 'NFTCard', type: 'display', contractFunctions: ['getNFT'] }
      ]
    }
  })
  
  console.log('\n✨ All tests completed!')
}

// Only run if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error)
}

export { testEndpoint, runTests }