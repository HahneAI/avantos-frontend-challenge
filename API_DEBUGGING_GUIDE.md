# API Debugging Guide

Quick reference for troubleshooting API connection issues.

## The Problem We Just Solved

**Error:** `{"error":"Resource not found!"}`

**Root Cause:** Incorrect URL format for the mock server

## Correct vs Incorrect URLs

### ❌ INCORRECT (What was in the original docs)
```
http://localhost:3000/api/v1/tenants/t_123/actions/blueprints/ab_456/graph/
                            ^^^^^^^                                      ^
                            Extra word!                           Trailing slash!
```

### ✅ CORRECT (What actually works)
```
http://localhost:3000/api/v1/t_123/actions/blueprints/ab_456/graph
                            ^^^^^
                            Tenant ID directly, no trailing slash
```

## Why This Matters

The mock server uses a **regex pattern** to match URLs:

```javascript
/\/api\/v1\/[^/]+\/actions\/blueprints\/[^/]+\/graph/
```

**What this means:**
- `/api/v1/` = Literal text, must match exactly
- `[^/]+` = "One or more characters that are NOT a slash" (matches the tenant ID)
- `/actions/blueprints/` = Literal text
- `[^/]+` = "One or more characters that are NOT a slash" (matches the blueprint ID)
- `/graph` = Must end with "/graph" with NO trailing slash

**Why "tenants" breaks it:**
- The pattern expects: `/api/v1/{something}/actions/...`
- Adding "tenants" creates: `/api/v1/tenants/t_123/actions/...`
- This means the `[^/]+` captures "tenants" instead of "t_123"
- Then it hits another `/` before `actions`, which breaks the pattern

## Step-by-Step Debugging Process

### Step 1: Verify Server is Running
```bash
# Check if you see this message
Server is running on http://localhost:3000
```

### Step 2: Test with curl or Browser
```bash
# Simple test
curl http://localhost:3000/api/v1/any-tenant/actions/blueprints/any-blueprint/graph
```

### Step 3: Read the Error Message
- `connection refused` = Server not running
- `{"error":"Resource not found!"}` = Server running, URL wrong
- JSON data = Success!

### Step 4: Check URL Character by Character
1. Count the path segments (parts between `/`)
2. Look for extra words like "tenants"
3. Check for trailing slashes
4. Compare to the server's regex pattern

## Common Mistakes

### 1. Trailing Slashes
```bash
❌ .../graph/
✅ .../graph
```

### 2. Extra Path Segments
```bash
❌ /api/v1/tenants/t_123/...
✅ /api/v1/t_123/...
```

### 3. Wrong Parameter Order
```bash
❌ /api/v1/blueprints/{id}/tenants/{id}/graph
✅ /api/v1/{tenant}/actions/blueprints/{blueprint}/graph
```

## Testing URLs

**Quick Test URLs:**
```bash
# These should all work (returns same graph.json):
curl http://localhost:3000/api/v1/test/actions/blueprints/test/graph
curl http://localhost:3000/api/v1/abc/actions/blueprints/xyz/graph
curl http://localhost:3000/api/v1/123/actions/blueprints/456/graph
```

**These will NOT work:**
```bash
# Has trailing slash
curl http://localhost:3000/api/v1/test/actions/blueprints/test/graph/

# Has "tenants" word
curl http://localhost:3000/api/v1/tenants/test/actions/blueprints/test/graph

# Missing "actions" segment
curl http://localhost:3000/api/v1/test/blueprints/test/graph
```

## How to Read Regex Patterns

When you see a regex like: `/\/api\/v1\/[^/]+\/graph/`

1. `\/` = A literal forward slash (escaped with `\`)
2. `[^/]` = Any character EXCEPT a forward slash
3. `+` = One or more of the previous character
4. So `[^/]+` = "One or more non-slash characters"

**Example:**
- `[^/]+` matches: `abc123`, `t_01jk71bx`, `anything-here`
- `[^/]+` does NOT match: `abc/123` (contains a slash), empty string

## Real Avantos API vs Mock Server

**Real Avantos API:**
```
/api/v1/{tenant_id}/actions/blueprints/{action_blueprint_id}/{blueprint_version_id}/graph
```
- Has 3 path parameters
- Includes blueprint version ID

**Mock Server (Simplified):**
```
/api/v1/{tenant_id}/actions/blueprints/{action_blueprint_id}/graph
```
- Has 2 path parameters
- No blueprint version ID (simpler for testing)

## Key Takeaways

1. Read error messages carefully - they tell you what's wrong
2. Check the server code to see what it expects
3. Compare your URL to the pattern character by character
4. Test with simple values first before using complex IDs
5. Remove trailing slashes unless the pattern explicitly requires them
6. Don't guess - verify the exact URL format the server expects

## Vite Proxy Troubleshooting

This project uses Vite's proxy to avoid CORS issues. Here's how to debug proxy-related problems.

### Issue: Requests Not Being Proxied

**Symptoms:**
- CORS errors in console
- Requests go directly to `http://localhost:3000` instead of through Vite
- 404 errors

**Check:**
```typescript
// vite.config.ts should have:
server: {
  proxy: {
    '/api': {  // ← Must start with '/'
      target: 'http://localhost:3000',
      changeOrigin: true,
    }
  }
}
```

**API service should use relative URLs:**
```typescript
// src/services/apiService.ts
const API_CONFIG = {
  baseUrl: '/api',  // ← Relative, starts with '/'
  // NOT: 'http://localhost:3000/api'
};
```

**Solution:**
1. Ensure proxy path starts with `/`
2. Ensure API calls use relative URLs
3. **Restart Vite dev server** (config changes require restart!)

### Issue: Proxy Works But Returns 404

**Symptoms:**
- Network tab shows request to `/api/v1/...`
- Returns 404 from mock server

**Check URL format:**
```bash
# Correct format (no "tenants" word, no trailing slash)
/api/v1/{tenant_id}/actions/blueprints/{blueprint_id}/graph

# Example:
/api/v1/t_123/actions/blueprints/ab_456/graph
```

**Solution:**
- See "Correct vs Incorrect URLs" section above
- Verify URL in `apiService.ts` matches pattern

### Issue: Vite Config Changes Not Taking Effect

**Symptoms:**
- You edited `vite.config.ts` but proxy still doesn't work
- Changes to proxy config have no effect

**Solution:**
- **Stop the dev server** (Ctrl+C)
- **Restart it**: `npm run dev`
- Vite config requires a full restart to reload

### Issue: Browser Makes Request to Wrong URL

**Symptoms:**
- Network tab shows `http://localhost:3000/api/...` (absolute)
- Should show `http://localhost:5173/api/...` (through proxy)

**Cause:**
API service is using absolute URLs instead of relative

**Solution:**
```typescript
// ❌ WRONG - Bypasses proxy
const API_CONFIG = {
  baseUrl: 'http://localhost:3000/api',
};

// ✅ CORRECT - Uses proxy
const API_CONFIG = {
  baseUrl: '/api',
};
```

### Proxy Data Flow (What Should Happen)

```
1. fetch('/api/v1/.../graph')
   ↓
2. Browser sends to: http://localhost:5173/api/v1/.../graph
   ↓
3. Vite sees '/api' prefix
   ↓
4. Vite forwards to: http://localhost:3000/api/v1/.../graph
   ↓
5. Mock server responds
   ↓
6. Vite sends response back to browser
   ↓
7. Browser receives data (no CORS!)
```

### Quick Proxy Checklist

- [ ] `vite.config.ts` has proxy config
- [ ] Proxy path starts with `/api`
- [ ] `changeOrigin: true` is set
- [ ] API service uses relative URL (`/api` not `http://localhost:3000/api`)
- [ ] Vite dev server has been restarted after config changes
- [ ] Mock server is running on port 3000
- [ ] Network tab shows request to `localhost:5173/api/...`

## Additional Resources

- [Regex Testing Tool](https://regex101.com/) - Test regex patterns online
- [HTTP Status Codes](https://httpstatuses.com/) - Understand error codes
- [curl Documentation](https://curl.se/docs/) - Learn curl commands
- [Vite Proxy Documentation](https://vitejs.dev/config/server-options.html#server-proxy) - Official Vite proxy docs
- Mock server code: `frontendchallengeserver/index.js` - See the exact pattern
