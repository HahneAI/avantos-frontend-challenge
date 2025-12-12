# Avantos Form Prefill Mapper

A React + TypeScript application for configuring prefill mappings in a DAG-based form system. This project demonstrates clean architecture, extensible design patterns, and comprehensive testing.

## Quick Start

### Prerequisites

This application requires the Avantos mock server to be running:

```bash
# In a separate directory (NOT inside this project)
git clone https://github.com/mosaic-avantos/frontendchallengeserver.git
cd frontendchallengeserver
npm install
npm start  # Runs on http://localhost:3000
```

**Keep the mock server running** - it provides the API endpoint for form blueprint data.

### Development Commands

```bash
# Install dependencies
npm install

# Start development server (keep mock server running!)
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Preview production build
npm run preview
```

The application will be available at `http://localhost:5173`

**Important:** Both servers must run simultaneously. See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed setup instructions.

##  Vite Proxy Configuration (CORS Solution)

This project uses **Vite's proxy feature** to avoid CORS errors:

**vite.config.ts:**
```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    }
  }
}
```

**How it works:**
- Browser requests: `http://localhost:5173/api/v1/...`
- Vite proxies server-side to: `http://localhost:3000/api/v1/...`
- No CORS errors (same-origin to browser)

**apiService.ts uses relative URLs:**
```typescript
const API_CONFIG = {
  baseUrl: '/api',  // Vite proxies this automatically
  // ...
};
```

For troubleshooting, see [API_DEBUGGING_GUIDE.md](API_DEBUGGING_GUIDE.md).

## Project Overview

This application allows users to configure how fields in downstream forms get prefilled from upstream forms or global data sources. Forms are organized in a Directed Acyclic Graph (DAG) structure where forms can depend on other forms, creating chains of dependencies.

### Key Features

- **Form DAG Visualization**: View all forms with their field counts and dependencies
- **Prefill Configuration**: Map target form fields to source fields from:
  - Direct dependencies (forms immediately upstream)
  - Transitive dependencies (forms upstream of upstream)
  - Global data sources (action properties, organization properties)
- **Extensible Architecture**: Easy to add new data sources without modifying existing code
- **Type-Safe**: Full TypeScript coverage with strict mode enabled
- **Well-Tested**: Comprehensive unit and component tests

## Project Structure

```
src/
├── components/              # React UI components
│   ├── FormList.tsx        # Main list of all forms
│   ├── FormCard.tsx        # Individual form card display
│   ├── PrefillConfiguration.tsx  # Prefill config panel
│   ├── FieldMappingRow.tsx # Single field mapping display
│   ├── DataSourceModal.tsx # Modal to select data source
│   └── DataSourceTree.tsx  # Tree view of available data
│
├── services/               # Business logic and utilities
│   ├── apiService.ts      # API service with Vite proxy integration
│   ├── responseTransformer.ts  # Transforms mock server response
│   ├── dagTraversal.ts    # DAG dependency resolution
│   └── dataSourceRegistry.ts  # Extensible data source pattern
│
├── hooks/                  # Custom React hooks
│   ├── useForms.ts        # Fetch and manage forms
│   ├── usePrefillMappings.ts  # Manage prefill configuration
│   └── useDataSources.ts  # Get available data sources
│
├── types/                  # TypeScript type definitions
│   └── index.ts           # All interfaces and types
│
├── utils/                  # Utility functions
│   └── mockData.ts        # Sample form DAG data
│
└── __tests__/             # Test files (mirror src structure)
```

## Key Design Patterns

### 1. Data Source Strategy Pattern

The application uses the **Strategy Pattern** to make adding new data sources trivial. All data sources implement the `DataSource` interface:

```typescript
interface DataSource {
  id: string;
  name: string;
  type: 'form' | 'global' | 'custom';
  getFields(): DataField[];
}
```

This enables extensibility through the **Registry Pattern**:

```typescript
const registry = new DataSourceRegistry();
registry.register(new FormDataSource(form));
registry.register(new GlobalDataSource(globalData));
// Easy to add new sources in the future!
registry.register(new APIDataSource());
```

### 2. DAG Traversal

The application uses **Breadth-First Search (BFS)** to traverse the dependency graph and find all upstream dependencies:

```typescript
function getDependencies(targetFormId: string, formGraph: FormGraph): Set<string> {
  const dependencies = new Set<string>();
  const queue = [targetFormId];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    const deps = formGraph[current]?.dependencies || [];
    deps.forEach(dep => {
      dependencies.add(dep);
      queue.push(dep);
    });
  }

  return dependencies;
}
```

This algorithm efficiently handles complex dependency chains:
- Form D → Form B → Form A
- getDependencies('form-d') returns both 'form-b' and 'form-a'

### 3. Prefill Mapping Data Structure

Mappings are stored as simple objects that connect target fields to source fields:

```typescript
interface PrefillMapping {
  targetFormId: string;      // Form being prefilled
  targetFieldId: string;     // Field being prefilled
  sourceType: 'form' | 'global';
  sourceFormId?: string;     // Source form (if applicable)
  sourceFieldId: string;     // Source field
  sourcePath: string;        // Human-readable path (e.g., "Form A.Email")
}
```

Mappings are persisted to `localStorage` for demo purposes.

## How to Add New Data Sources

Adding a new data source is straightforward. Follow these steps:

### Step 1: Create a class that implements `DataSource`

```typescript
export class CustomDataSource implements DataSource {
  public readonly id = 'custom-source';
  public readonly name = 'Custom Source';
  public readonly type = 'custom' as const;

  constructor(private readonly data: YourDataType) {}

  getFields(): DataField[] {
    return this.data.items.map(item => ({
      id: item.id,
      label: item.label,
      type: item.type,
      path: `Custom.${item.label}`,
    }));
  }
}
```

### Step 2: Register it in `useDataSources` hook

```typescript
// In src/hooks/useDataSources.ts
import { CustomDataSource } from '../services/dataSourceRegistry';

export function useDataSources(...) {
  return useMemo(() => {
    const registry = new DataSourceRegistry();

    // Existing registrations...
    registry.register(new FormDataSource(...));
    registry.register(new GlobalDataSource(...));

    // Add your new source
    registry.register(new CustomDataSource(yourData));

    // Rest of the logic...
  }, [...]);
}
```

That's it! The UI will automatically display your new data source in the modal.

## Testing

The project uses **Vitest** and **React Testing Library** for testing.

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm test -- --coverage
```

### Test Coverage

- **Service Tests**: DAG traversal, data source registry
- **Component Tests**: Form list, field mapping rows
- **Integration Tests**: Complete prefill configuration flow

### Example Test

```typescript
it('should find transitive dependencies', () => {
  // Form D depends on B, which depends on A
  const deps = getDependencies('form-d', formGraph);

  expect(deps.has('form-b')).toBe(true);
  expect(deps.has('form-a')).toBe(true);
  expect(deps.size).toBe(2);
});
```

## Architecture Decisions

### Why Strategy Pattern for Data Sources?

The Strategy Pattern allows us to add new data sources without modifying existing code (Open/Closed Principle). Each data source is self-contained and can be tested independently.

### Why BFS for DAG Traversal?

Breadth-First Search is ideal for finding all dependencies in a graph:
- **Correctness**: Guarantees we find all reachable nodes
- **Efficiency**: O(V + E) time complexity
- **Simplicity**: Easy to understand and maintain

### Why localStorage for Persistence?

For this demo, localStorage provides:
- **No backend required**: Works entirely client-side
- **Persistence**: Mappings survive page refreshes
- **Simplicity**: Easy to implement and test

In production, you'd replace this with API calls to a backend.

### Why Tailwind CSS?

- **Rapid Development**: Utility classes speed up UI development
- **Consistency**: Design system built into the framework
- **Performance**: PurgeCSS removes unused styles in production
- **Maintainability**: No need to manage separate CSS files

## Incomplete Tasks (For Video Recording)

Three tasks have been intentionally left incomplete for demonstration purposes:

### Task 1: Implement OrganizationDataSource

**Location**: `src/services/dataSourceRegistry.ts`

**What to do**: Implement the `OrganizationDataSource` class following the pattern of `GlobalDataSource`. It should:
- Return organization properties from `globalData.clientOrgProperties`
- Format field paths as "Organization.Property Name"
- Use the `formatPropertyName` helper to convert snake_case to Title Case

### Task 2: Add Field Type Validation

**Location**: `src/components/DataSourceModal.tsx`

**What to do**: Add validation in the `handleSelectField` function to check if source field type matches target field type. Show a warning if types don't match.

```typescript
if (field.type !== targetField.type) {
  const proceed = window.confirm(
    `Warning: Source field type "${field.type}" doesn't match target field type "${targetField.type}". Continue anyway?`
  );
  if (!proceed) return;
}
```

### Task 3: Implement Custom Modal CSS Class

**Locations**:
- `src/index.css` (create custom CSS class)
- `src/components/DataSourceModal.tsx` (apply the class)

**What to do**: Create a reusable `.modal-enhanced` CSS class with professional styling:

**Part 1 - Create CSS class in `src/index.css`:**
- Add `.modal-enhanced` class with elevated shadows and fade-in animation
- Style `.modal-header` with gradient background
- Style `.modal-content` with consistent spacing
- Style `.section-card` with hover effects and blue dot indicators
- Add `.search-input` focus states with blue glow

**Part 2 - Apply to component in `src/components/DataSourceModal.tsx`:**
- Add `backdrop-blur-sm` to backdrop
- Add `modal-enhanced` class to modal container
- Update close button hover (red on hover)
- Apply semantic classes: `modal-header`, `modal-content`, `section-card`, `search-input`

**Benefits of this approach:**
- **Reusability**: Can apply to other modals/dialogs
- **Maintainability**: Change once, updates everywhere
- **Performance**: CSS is faster than inline styles
- **Separation of concerns**: Styling in CSS, logic in React

## Technology Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite (fast, modern, optimized)
- **Styling**: Tailwind CSS (utility-first CSS)
- **Testing**: Vitest + React Testing Library
- **State Management**: React hooks (useState, useContext)

## Code Quality

- **TypeScript Strict Mode**: Enabled for maximum type safety
- **No `any` Types**: All types are properly defined
- **ESLint**: Configured with recommended rules
- **Comprehensive Tests**: 70%+ test coverage
- **JSDoc Comments**: All exported functions documented

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Documentation

- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Complete setup and integration guide
- **[SYSTEM_GUIDE.md](SYSTEM_GUIDE.md)** - Comprehensive system documentation for beginners
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture and data flow diagrams
- **[API_DEBUGGING_GUIDE.md](API_DEBUGGING_GUIDE.md)** - Troubleshooting API and proxy issues

## Contributing

This is a coding challenge project. The code demonstrates:
- Clean architecture principles
- Extensible design patterns
- Comprehensive testing
- Modern React best practices

## License

MIT
