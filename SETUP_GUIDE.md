# Complete Setup Guide

A comprehensive guide to setting up and running the Avantos Form Prefill Mapper with the mock server.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Step 1: Set Up Mock Server](#step-1-set-up-mock-server)
4. [Step 2: Vite Proxy Configuration](#step-2-vite-proxy-configuration)
5. [Step 3: Verification](#step-3-verification)
6. [Understanding the Data Flow](#understanding-the-data-flow)
7. [Troubleshooting](#troubleshooting)
8. [API Data Structure Reference](#api-data-structure-reference)

---

## Overview

This application requires two servers running simultaneously:

| Server | Port | Purpose |
|--------|------|---------|
| **Mock Server** | 3000 | Provides the action blueprint graph API |
| **Vite Dev Server** | 5173 | Serves the React application |

The Vite server is configured with a **proxy** to forward API requests to the mock server, avoiding CORS issues.

---

## Prerequisites

- **Node.js** 18+ installed
- **npm** or **yarn** package manager
- **Git** for cloning repositories
- Two terminal windows/tabs

---

## Step 1: Set Up Mock Server

### 1.1 Clone the Repository

```bash
# Navigate to a parent directory (NOT inside this project)
cd ..

# Clone the mock server
git clone https://github.com/mosaic-avantos/frontendchallengeserver.git

# Navigate into the repository
cd frontendchallengeserver
```

### 1.2 Install Dependencies

```bash
npm install
```

### 1.3 Start the Server

```bash
npm start
```

You should see:
```
Server is running on http://localhost:3000
```

**Keep this terminal window open** - the server must stay running.

### 1.4 Verify the Server

Open a browser or use curl to test the endpoint:

```bash
curl http://localhost:3000/api/v1/t_01jk71bxfsewajm2vb41twnk2h/actions/blueprints/ab_01jk7at9w9eweev3fq8rrv3sbv/graph
```

You should see a JSON response with form blueprint data (~18,000 characters).

**Common Issues:**
- ❌ **Port 3000 already in use**: Kill the process using port 3000 or change the port in `index.js`
- ❌ **`{"error":"Resource not found!"}`**: Check the URL format (see [API_DEBUGGING_GUIDE.md](API_DEBUGGING_GUIDE.md))

---

## Step 2: Vite Proxy Configuration

**Good news:** The proxy is already configured in this project! Here's how it works.

### 2.1 Proxy Configuration (vite.config.ts)

The Vite config includes a proxy that forwards `/api` requests to the mock server:

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  },
  // ... rest of config
});
```

**What this does:**
- Requests to `http://localhost:5173/api/...` are proxied to `http://localhost:3000/api/...`
- The browser thinks it's talking to the same origin (no CORS)
- The Vite server acts as a middleman

### 2.2 API Service Configuration (src/services/apiService.ts)

The API service uses **relative URLs** so the proxy works:

```typescript
const API_CONFIG = {
  baseUrl: '/api',  // Relative path - Vite proxies this automatically
  tenantId: 't_01jk71bxfsewajm2vb41twnk2h',
  blueprintId: 'ab_01jk7at9w9eweev3fq8rrv3sbv',
};

function getApiUrl(): string {
  const { baseUrl, tenantId, blueprintId } = API_CONFIG;
  return `${baseUrl}/v1/${tenantId}/actions/blueprints/${blueprintId}/graph`;
}
```

**Result:** Fetch calls use `/api/v1/...` which Vite proxies to `http://localhost:3000/api/v1/...`

### 2.3 Data Transformation (src/services/responseTransformer.ts)

The mock server returns a different data structure than the app expects, so we transform it:

```typescript
export function transformMockServerResponse(mockData: MockServerResponse): FormBlueprintResponse {
  // Transform nodes to forms
  const forms: Form[] = mockData.nodes.map(node => ({
    id: node.id,
    name: node.data.name,
    fields: extractFieldsFromTemplate(node.data.component_id, mockData.forms),
    dependencies: node.data.prerequisites,
  }));

  // Generate global data
  const globalData: GlobalData = {
    actionProperties: ['status', 'created_at', 'assignee', 'priority'],
    clientOrgProperties: ['org_name', 'org_id', 'plan_type', 'industry'],
  };

  return { forms, globalData };
}
```

---

## Step 3: Verification

### 3.1 Start the Application

In a **second terminal window** (keep mock server running in the first):

```bash
# Navigate to the project directory
cd avantos-challenge-playground

# Install dependencies (if not already done)
npm install

# Start the development server
npm run dev
```

You should see:
```
VITE v5.0.8  ready in 234 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 3.2 Open the Application

Navigate to http://localhost:5173 in your browser.

**Expected Result:**
- ✅ 6 forms display (Form A, Form B, Form C, Form D, Form E, Form F)
- ✅ No errors in browser console
- ✅ Forms show correct dependency counts
- ✅ You can select a form and configure prefill mappings

### 3.3 Check Network Tab

Open Browser DevTools (F12) → Network tab:

1. Refresh the page
2. Look for a request to `/api/v1/.../graph`
3. Should show **Status: 200 OK**
4. Response should contain the form blueprint data

**What you should see:**
```
Request URL: http://localhost:5173/api/v1/t_01jk71bxfsewajm2vb41twnk2h/actions/blueprints/ab_01jk7at9w9eweev3fq8rrv3sbv/graph
Status Code: 200 OK
```

**Proxy in Action:**
- Browser makes request to `localhost:5173/api/...`
- Vite forwards it to `localhost:3000/api/...`
- Response comes back through Vite to the browser
- No CORS errors!

### 3.4 Test Prefill Configuration

1. Click on **Form D** in the form list
2. Click **"Set Mapping"** on any field
3. The modal should show:
   - **Direct Dependencies**: Form B
   - **Transitive Dependencies**: Form A
   - **Global Sources**: Action Properties, Client Org Properties
4. Select a field from Form B
5. Verify the mapping appears in the UI

---

## Understanding the Data Flow

### Request Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Browser (http://localhost:5173)                            │
│                                                              │
│  fetch('/api/v1/.../graph')                                │
│         │                                                    │
│         ↓                                                    │
│  ┌────────────────────────────────────────────────┐        │
│  │ Vite Dev Server (Port 5173)                    │        │
│  │                                                 │        │
│  │  Proxy sees '/api' prefix                      │        │
│  │  ↓                                              │        │
│  │  Forwards to http://localhost:3000/api/...     │        │
│  └────────────────────────────────────────────────┘        │
│         │                                                    │
└─────────┼────────────────────────────────────────────────────┘
          │
          ↓
┌─────────────────────────────────────────────────────────────┐
│ Mock Server (Port 3000)                                     │
│                                                              │
│  GET /api/v1/.../graph                                      │
│  ↓                                                          │
│  Returns graph.json (18KB of form blueprint data)          │
│  ↓                                                          │
│  Response flows back through Vite to browser               │
└─────────────────────────────────────────────────────────────┘
```

### Data Transformation Flow

```
Mock Server Response              →   Application Data
├─ nodes: [6 items]              →   forms: [6 items]
│  ├─ id                          →   id
│  ├─ data.name                   →   name
│  ├─ data.prerequisites          →   dependencies
│  └─ data.component_id           →   (lookup in forms array)
│
├─ forms: [3 templates]           →   (used to extract fields)
│  └─ field_schema.properties     →   fields: []
│
└─ edges: [6 connections]         →   (redundant, use prerequisites)

Generated:
globalData:
  ├─ actionProperties
  └─ clientOrgProperties
```

---

## Troubleshooting

### Issue: "Failed to fetch form blueprint"

**Symptoms:**
- Error in browser console
- Empty form list
- Network tab shows failed request

**Solutions:**
1. ✅ Check mock server is running (Terminal 1)
2. ✅ Verify URL in Network tab matches expected format
3. ✅ Try accessing mock server URL directly in browser
4. ✅ Restart both servers

### Issue: CORS Errors

**Symptoms:**
- Console shows `blocked by CORS policy` error
- Request fails with CORS-related message

**Solutions:**
1. ✅ Verify `vite.config.ts` has proxy configuration
2. ✅ Ensure `apiService.ts` uses relative URL (`/api`)
3. ✅ Restart Vite dev server (config changes require restart)
4. ✅ Clear browser cache

### Issue: Empty Form List

**Symptoms:**
- API request succeeds (200 OK)
- But no forms display

**Solutions:**
1. ✅ Check browser console for errors
2. ✅ Verify response transformation in `responseTransformer.ts`
3. ✅ Check if `forms` array has items in the response
4. ✅ Look for errors in React component rendering

### Issue: Port 3000 Already in Use

**Symptoms:**
- Mock server fails to start
- Error: `EADDRINUSE: address already in use`

**Solutions:**
1. Find what's using port 3000:
   - Windows: `netstat -ano | findstr :3000`
   - Mac/Linux: `lsof -i :3000`
2. Kill the process using port 3000
3. OR change mock server port:
   ```javascript
   // In frontendchallengeserver/index.js, line 41
   server.listen(3001, () => {
     console.log('Server is running on http://localhost:3001');
   });
   ```
4. Update `vite.config.ts` proxy target to match new port

### Issue: Vite Dev Server Won't Start

**Symptoms:**
- `npm run dev` fails
- Port 5173 already in use

**Solutions:**
1. Kill process on port 5173
2. OR change Vite port in `vite.config.ts`:
   ```typescript
   server: {
     port: 5174,
     proxy: { ... }
   }
   ```

---

## API Data Structure Reference

### Top-Level Response

```json
{
  "id": "bp_01jk766tckfwx84xjcxazggzyc",
  "tenant_id": "1",
  "name": "Onboard Customer 0",
  "description": "Automated test action",
  "category": "Category 4",
  "nodes": [...],     // 6 forms
  "edges": [...],     // 6 connections
  "forms": [...],     // 3 templates
  "branches": [],
  "triggers": []
}
```

### Node Structure (Form)

```json
{
  "id": "form-47c61d17-62b0-4c42-8ca2-0eff641c9d88",
  "type": "form",
  "position": { "x": 494, "y": 269 },
  "data": {
    "id": "bp_c_01jka1e3k0ewha8jbgeayz4cwp",
    "component_key": "form-47c61d17-62b0-4c42-8ca2-0eff641c9d88",
    "component_type": "form",
    "component_id": "f_01jk7ap2r3ewf9gx6a9r09gzjv",  // Link to template
    "name": "Form A",
    "prerequisites": [],  // Dependencies (empty = root form)
    "permitted_roles": [],
    "input_mapping": {},
    "sla_duration": { "number": 0, "unit": "minutes" },
    "approval_required": false
  }
}
```

### Form Template Structure

```json
{
  "id": "f_01jk7ap2r3ewf9gx6a9r09gzjv",
  "name": "test form",
  "field_schema": {
    "type": "object",
    "properties": {
      "email": {
        "avantos_type": "short-text",
        "format": "email",
        "title": "Email",
        "type": "string"
      },
      "name": {
        "avantos_type": "short-text",
        "title": "Name",
        "type": "string"
      }
      // ... 6 more fields
    },
    "required": ["id", "name", "email"]
  }
}
```

### The 6 Forms and Their Dependencies

| Form | Dependencies | Description |
|------|--------------|-------------|
| Form A | None | Root form |
| Form B | Form A | Depends on A |
| Form C | Form A | Depends on A |
| Form D | Form B | Depends on B (transitively on A) |
| Form E | Form C | Depends on C (transitively on A) |
| Form F | Form D, Form E | Depends on D and E (transitively on B, C, A) |

**Dependency Graph:**
```
        Form A (root)
        /    \
       /      \
    Form B   Form C
      |        |
   Form D   Form E
      \      /
       \    /
       Form F
```

### Field Types in Templates

Each form has 8 fields:

1. **id** - Short text (string)
2. **name** - Short text (string)
3. **email** - Email (string with format validation)
4. **notes** - Multi-line text (string)
5. **button** - Button (object)
6. **dynamic_checkbox_group** - Checkbox group (array)
7. **dynamic_object** - Dynamic object (object)
8. **multi_select** - Multi-select (array)

---

## Next Steps

After completing setup:

1. ✅ Explore the application UI
2. ✅ Configure prefill mappings
3. ✅ Run the test suite: `npm test`
4. ✅ Read [SYSTEM_GUIDE.md](SYSTEM_GUIDE.md) for in-depth code explanations
5. ✅ Check [ARCHITECTURE.md](ARCHITECTURE.md) for system diagrams

**For development:**
- See [API_DEBUGGING_GUIDE.md](API_DEBUGGING_GUIDE.md) for troubleshooting
- See [SYSTEM_GUIDE.md](SYSTEM_GUIDE.md) for code patterns and architecture

---

**Setup Complete!** 🎉

Both servers should be running, and the application should display 6 forms with working prefill configuration.
