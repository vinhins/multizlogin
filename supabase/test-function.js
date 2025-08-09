/**
 * Test script for the Supabase Edge Function
 * This script can be used to test the find-user-by-account function locally
 */

async function testSupabaseFunction() {
  const functionUrl = 'http://localhost:54321/functions/v1/find-user-by-account'
  
  // Test data
  const testCases = [
    {
      name: 'Valid request with phone number',
      data: {
        phone: '0123456789',
        accountSelection: 'first'
      },
      expectedStatus: 200
    },
    {
      name: 'Request without phone number (should fail)',
      data: {
        accountSelection: 'first'
      },
      expectedStatus: 400
    },
    {
      name: 'Request with different account selection',
      data: {
        phone: '0987654321',
        accountSelection: 'random'
      },
      expectedStatus: 200
    }
  ]

  console.log('🧪 Testing Supabase Edge Function: find-user-by-account')
  console.log('='.repeat(60))

  for (const testCase of testCases) {
    console.log(`\n📋 Test: ${testCase.name}`)
    console.log(`📤 Request:`, JSON.stringify(testCase.data, null, 2))
    
    try {
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-key' // Placeholder for testing
        },
        body: JSON.stringify(testCase.data)
      })

      const result = await response.json()
      
      console.log(`📊 Status: ${response.status} (expected: ${testCase.expectedStatus})`)
      console.log(`📥 Response:`, JSON.stringify(result, null, 2))
      
      if (response.status === testCase.expectedStatus) {
        console.log('✅ Test PASSED')
      } else {
        console.log('❌ Test FAILED - Status code mismatch')
      }
      
    } catch (error) {
      console.log(`❌ Test FAILED - Error: ${error.message}`)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('🏁 Test completed')
}

// Usage instructions
console.log('Supabase Function Test Script')
console.log('=============================')
console.log('')
console.log('Prerequisites:')
console.log('1. Ensure your Multizlogin API server is running on localhost:3000')
console.log('2. Ensure Supabase functions are running locally:')
console.log('   supabase functions serve')
console.log('')
console.log('Note: This test will fail if the API server is not running,')
console.log('but it will demonstrate the function structure and error handling.')
console.log('')

// Run the test if this script is executed directly
if (typeof window === 'undefined') {
  // Running in Node.js environment
  testSupabaseFunction().catch(console.error)
} else {
  // Running in browser environment
  console.log('To run the test, call: testSupabaseFunction()')
  window.testSupabaseFunction = testSupabaseFunction
}