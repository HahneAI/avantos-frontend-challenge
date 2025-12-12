# Complete Architecture with Mock Server

This document shows how the mock server integrates with the Form Prefill Mapper application.

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         YOUR MACHINE                             │
│                                                                  │
│  ┌─────────────────────┐          ┌──────────────────────────┐ │
│  │  Mock Server        │          │  React Application       │ │
│  │  (Terminal 1)       │          │  (Terminal 2)            │ │
│  │                     │          │                          │ │
│  │  Port: 3000        │◄─────────┤  Port: 5173             │ │
│  │                     │   HTTP   │                          │ │
│  │  ┌──────────────┐  │  Fetch   │  ┌────────────────────┐ │ │
│  │  │ graph.json   │  │          │  │   Components       │ │ │
│  │  │              │  │          │  │   - FormList       │ │ │
│  │  │ 6 forms:     │  │          │  │   - DataSourceModal│ │ │
│  │  │ A, B, C,     │  │          │  │   - etc.           │ │ │
│  │  │ D, E, F      │  │          │  └────────────────────┘ │ │
│  │  └──────────────┘  │          │                          │ │
│  │                     │          │  ┌────────────────────┐ │ │
│  │  Endpoint:          │          │  │   Services         │ │ │
│  │  /api/v1/.../graph/ │          │  │   - apiService     │ │ │
│  │                     │          │  │   - transformer    │ │ │
│  └─────────────────────┘          │  │   - dagTraversal   │ │ │
│                                    │  └────────────────────┘ │ │
│                                    └──────────────────────────┘ │
│                                                                  │
│  Browser (http://localhost:5173)                                │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │  [Form List]              [Prefill Configuration]      │    │
│  │  - Form A (0 deps)        Select form to configure     │    │
│  │  - Form B (1 dep)                                       │    │
│  │  - Form C (1 dep)                                       │    │
│  │  - Form D (1 dep)                                       │    │
│  │  - Form E (1 dep)                                       │    │
│  │  - Form F (2 deps)                                      │    │
│  │                                                         │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Startup Sequence

```
1. User starts mock server
   cd frontendchallengeserver
   npm start
   → Mock server listening on port 3000

2. User starts React app
   cd avantos-challenge
   npm run dev
   → Vite dev server starts on port 5173

3. User opens browser
   → Navigates to http://localhost:5173

4. App.tsx mounts
   → useForms() hook is called

5. useForms hook executes
   → useEffect runs on mount
   → Calls fetchFormBlueprint()

6. fetchFormBlueprint() executes
   → fetch('http://localhost:3000/api/v1/.../graph/')
   → Mock server returns graph.json

7. Response transformation
   → transformBlueprintResponse() processes the data
   → Converts nodes → forms
   → Generates fields for each form
   → Adds globalData

8. State updates
   → setForms(transformedData.forms)
   → setGlobalData(transformedData.globalData)
   → setLoading(false)

9. UI renders
   → FormList displays 6 forms
   → User can now interact with the app
```

## API Response Transformation

### What the Mock Server Returns

```json
{
  "id": "ab_01jk7at9w9eweev3fq8rrv3sbv",
  "name": "Onboard Customer 0",
  "tenant_id": "t_01jk71bxfsewajm2vb41twnk2h",
  "nodes": [
    {
      "id": "abn_01jk7at9w9eweey69f9hm0kty2",
      "name": "Form A",
      "form_template_id": "f_01jk7ap2r3ewf9gx6a9r09gzjv",
      "dependencies": [],
      "x": 275,
      "y": 105
    },
    {
      "id": "abn_01jk7at9w9ewf54ngz5e4xb40k",
      "name": "Form B",
      "form_template_id": "f_01jk7awbhqewgbkbgk8rjm7bv7",
      "dependencies": ["abn_01jk7at9w9eweey69f9hm0kty2"],
      "x": 150,
      "y": 255
    }
    // ... more nodes
  ]
}
```

### What Our App Needs

```json
{
  "forms": [
    {
      "id": "abn_01jk7at9w9eweey69f9hm0kty2",
      "name": "Form A",
      "fields": [
        { "id": "id", "label": "ID", "type": "text" },
        { "id": "name", "label": "Name", "type": "text" },
        { "id": "email", "label": "Email", "type": "email" }
      ],
      "dependencies": []
    },
    {
      "id": "abn_01jk7at9w9ewf54ngz5e4xb40k",
      "name": "Form B",
      "fields": [...],
      "dependencies": ["abn_01jk7at9w9eweey69f9hm0kty2"]
    }
  ],
  "globalData": {
    "actionProperties": ["status", "created_at", "assignee"],
    "clientOrgProperties": ["org_name", "org_id", "plan_type"]
  }
}
```

### The Transformation Process

```typescript
// responseTransformer.ts

export function transformBlueprintResponse(
  apiResponse: ActionBlueprintGraphResponse
): FormBlueprintResponse {

  // Step 1: Map each node to a form
  const forms: Form[] = apiResponse.nodes.map(node => ({
    id: node.id,                    // Keep the node ID
    name: node.name,                // Keep the node name
    fields: generateFieldsForNode(node),  // Generate fields
    dependencies: node.dependencies  // Keep dependencies as-is
  }));

  // Step 2: Generate global data (mock server doesn't provide this)
  const globalData: GlobalData = {
    actionProperties: [...],
    clientOrgProperties: [...]
  };

  return { forms, globalData };
}
```

## File Structure with New Files

```
src/
├── services/
│   ├── apiService.ts           ← MODIFIED: Now fetches from mock server
│   ├── responseTransformer.ts  ← NEW: Transforms API response
│   ├── dagTraversal.ts         (unchanged)
│   ├── dataSourceRegistry.ts   (unchanged)
│   └── __tests__/
│       ├── apiService.test.ts  ← NEW: Tests for API integration
│       ├── dagTraversal.test.ts
│       └── dataSourceRegistry.test.ts
│
├── types/
│   └── index.ts                ← MODIFIED: Added API response types
│
├── utils/
│   └── mockData.ts             ← KEPT: Can use as fallback
│
└── ... (other files unchanged)
```

## Environment Variables (Optional)

```env
# .env file

VITE_MOCK_SERVER_URL=http://localhost:3000
VITE_TENANT_ID=t_01jk71bxfsewajm2vb41twnk2h
VITE_BLUEPRINT_ID=ab_01jk7at9w9eweev3fq8rrv3sbv
```

## Code Path: User Clicks "Set Mapping"

```
1. User clicks "Set Mapping" button
   ↓
2. FieldMappingRow calls onOpenModal(fieldId)
   ↓
3. App.tsx's handleOpenModal() executes
   ↓
4. setIsModalOpen(true)
   ↓
5. DataSourceModal renders
   ↓
6. useDataSources hook provides categorized sources
   ↓
7. Hook uses dagTraversal to find dependencies
   ↓
8. Modal shows:
   - Direct dependencies (from direct deps)
   - Transitive dependencies (from BFS traversal)
   - Global sources (from globalData)
   ↓
9. User selects a field
   ↓
10. onSelectField callback fires
   ↓
11. usePrefillMappings.setMapping() called
   ↓
12. Mapping saved to localStorage
   ↓
13. UI updates to show mapping
```

## Testing Strategy

### Manual Testing Checklist

```
1. Start mock server
   ✓ No errors in console
   ✓ Can access endpoint in browser

2. Start application
   ✓ No TypeScript errors
   ✓ No build errors

3. Check browser console
   ✓ No errors
   ✓ Network tab shows successful fetch

4. Verify forms load
   ✓ See 6 forms: A, B, C, D, E, F
   ✓ Dependencies are correct:
     - A: 0 dependencies
     - B: 1 dependency (A)
     - C: 1 dependency (A)
     - D: 1 dependency (B)
     - E: 1 dependency (C)
     - F: 2 dependencies (D, E)

5. Test prefill mapping
   ✓ Select Form D
   ✓ Click "Set Mapping" on a field
   ✓ Modal shows Direct Deps (Form B)
   ✓ Modal shows Transitive Deps (Form A)
   ✓ Modal shows Global Sources
   ✓ Can select a field and save mapping

6. Test persistence
   ✓ Refresh page
   ✓ Mappings are still there (localStorage)
```

### Automated Tests

```bash
npm test

Expected output:
✓ src/services/__tests__/dagTraversal.test.ts (19 tests)
✓ src/services/__tests__/dataSourceRegistry.test.ts (15 tests)
✓ src/services/__tests__/apiService.test.ts (3 tests) ← NEW
✓ src/components/__tests__/FormList.test.tsx (6 tests)
✓ src/components/__tests__/FieldMappingRow.test.tsx (7 tests)

Total: 50 tests passed
```

## Dependency Graph from Mock Server

```
         Form A (root)
           /    \
          /      \
      Form B    Form C
         |         |
         |         |
      Form D    Form E
          \      /
           \    /
           Form F
```

**Transitive Dependencies:**
- Form D depends on B, and transitively depends on A
- Form E depends on C, and transitively depends on A
- Form F depends on D and E, and transitively depends on B, C, and A

## Key Differences: Old vs New

### Before (Local Mock)

```typescript
// apiService.ts
export async function fetchFormBlueprint() {
  await new Promise(resolve => setTimeout(resolve, 500));
  return {
    forms: mockForms,        // Hardcoded local data
    globalData: mockGlobalData
  };
}
```

**Issues:**
- Not using the required mock server
- Doesn't match real-world API integration
- Doesn't test HTTP requests

### After (Mock Server)

```typescript
// apiService.ts
export async function fetchFormBlueprint() {
  const response = await fetch(MOCK_SERVER_URL + '/api/v1/.../graph/');
  const apiResponse = await response.json();
  return transformBlueprintResponse(apiResponse);  // Transform to our format
}
```

**Benefits:**
- ✅ Uses the required mock server
- ✅ Tests real HTTP requests
- ✅ Handles response transformation
- ✅ Matches production API pattern
- ✅ Meets Avantos requirements

## Summary

The integration adds:
1. **Real API calls** to the mock server
2. **Response transformation** to match our data structure
3. **Error handling** for network issues
4. **Tests** for the API integration

**Files to create:**
- `src/services/responseTransformer.ts`
- `src/services/__tests__/apiService.test.ts`

**Files to modify:**
- `src/types/index.ts` (add API types)
- `src/services/apiService.ts` (replace with fetch logic)
- `README.md` (add mock server setup)

**Total time:** ~35 minutes
