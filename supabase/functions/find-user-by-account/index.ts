import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone, accountSelection } = await req.json()

    // Validate required parameters
    if (!phone) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Phone number is required' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // Get API base URL from environment variable
    const apiBaseUrl = Deno.env.get('API_BASE_URL') || 'http://localhost:3000'
    const apiEndpoint = `${apiBaseUrl}/api/findUserByAccount`

    // Prepare request body
    const requestBody = {
      phone,
      accountSelection: accountSelection || 'first' // default to first account if not specified
    }

    console.log(`Calling API: ${apiEndpoint}`)
    console.log(`Request body:`, requestBody)

    // Make request to the findUserByAccount API
    const apiResponse = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text()
      console.error(`API request failed: ${apiResponse.status} - ${errorText}`)
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `API request failed: ${apiResponse.status}`,
          details: errorText
        }),
        {
          status: apiResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const apiData = await apiResponse.json()
    console.log('API response:', apiData)

    return new Response(
      JSON.stringify({
        success: true,
        data: apiData,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )

  } catch (error) {
    console.error('Error in Supabase function:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})