# Supabase Edge Functions for Multizlogin API

This directory contains Supabase Edge Functions that provide an interface to call the Multizlogin API endpoints.

## Available Functions

### find-user-by-account

This function calls the `/api/findUserByAccount` endpoint to find a user by their phone number using a specific Zalo account.

**Endpoint:** `/functions/v1/find-user-by-account`

**Request Body:**
```json
{
  "phone": "0123456789",
  "accountSelection": "first"
}
```

**Parameters:**
- `phone` (required): The phone number to search for
- `accountSelection` (optional): Which Zalo account to use for the search. Options:
  - `"first"` - Use the first available account (default)
  - `"last"` - Use the last available account  
  - `"random"` - Use a random account
  - `"phone:0123456789"` - Use account with specific phone number
  - `"index:0"` - Use account at specific index

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "data": {
      // User data from Zalo API
    },
    "usedAccount": {
      "ownId": "account_id",
      "phoneNumber": "account_phone"
    }
  },
  "timestamp": "2023-12-01T10:00:00.000Z"
}
```

## Setup

1. **Environment Configuration**
   
   Copy the example environment file and configure your API base URL:
   ```bash
   cp supabase/.env.example supabase/.env.local
   ```
   
   Edit `supabase/.env.local`:
   ```env
   API_BASE_URL=http://localhost:3000
   ```

2. **Deploy Functions**
   
   If you have Supabase CLI installed:
   ```bash
   supabase functions deploy find-user-by-account
   ```

3. **Test the Function**
   
   You can test the function locally using the Supabase CLI:
   ```bash
   supabase functions serve
   ```
   
   Then make a POST request to:
   ```
   http://localhost:54321/functions/v1/find-user-by-account
   ```

## Usage Examples

### Using curl

```bash
curl -X POST \
  'http://localhost:54321/functions/v1/find-user-by-account' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  -d '{
    "phone": "0123456789",
    "accountSelection": "first"
  }'
```

### Using JavaScript/TypeScript

```typescript
const { data, error } = await supabase.functions.invoke('find-user-by-account', {
  body: {
    phone: '0123456789',
    accountSelection: 'first'
  }
})

if (error) {
  console.error('Error calling function:', error)
} else {
  console.log('User found:', data)
}
```

### Using Python

```python
import requests

url = 'http://localhost:54321/functions/v1/find-user-by-account'
headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_SUPABASE_ANON_KEY'
}
data = {
    'phone': '0123456789',
    'accountSelection': 'first'
}

response = requests.post(url, headers=headers, json=data)
result = response.json()
print(result)
```

## Error Handling

The function returns appropriate HTTP status codes and error messages:

- `400 Bad Request`: Missing required parameters
- `500 Internal Server Error`: API call failed or function error
- `200 OK`: Successful response

Error response format:
```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details (if available)",
  "timestamp": "2023-12-01T10:00:00.000Z"
}
```

## Security Notes

- The function includes CORS headers to allow cross-origin requests
- Ensure your API server is properly secured and accessible to the Supabase function
- Consider implementing authentication/authorization as needed for your use case
- Sensitive data like API keys should be stored in Supabase Vault or environment variables