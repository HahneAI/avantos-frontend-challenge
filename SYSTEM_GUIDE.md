# Avantos Form Prefill Mapper - Complete System Guide

> A beginner-friendly guide to understanding the entire application

## Table of Contents
1. [Introduction](#introduction)
2. [Big Picture - How Everything Works Together](#big-picture)
3. [Data Flow - How Information Moves](#data-flow)
4. [File-by-File Guide](#file-by-file-guide)
5. [Key Concepts Explained](#key-concepts-explained)
6. [How to Read the Code](#how-to-read-the-code)
7. [Common Questions](#common-questions)

---

## Introduction

### What Does This App Do?

Imagine you're filling out a series of forms online. You type your email address in Form A, then later in Form D, it asks for your email again. Wouldn't it be nice if Form D could automatically remember your email from Form A?

**That's exactly what this app helps you configure.**

This application is a tool for **administrators** to set up "prefill mappings" - basically telling the system: "When someone reaches Form D, automatically fill in the email field using the email they entered in Form A."

### Real-World Example

Think of it like a medical clinic visit:

1. **Form A (Contact Information)**: You enter your name, email, phone number
2. **Form B (Preferences Survey)**: You answer some questions
3. **Form D (Advanced Configuration)**: Needs your email for notifications

Instead of asking you to type your email again in Form D, the administrator uses this tool to map: "Form D's email field should get its value from Form A's email field."

### Who Uses This?

- **Administrators/Developers**: Use this tool to configure which fields get prefilled
- **End Users**: Don't see this tool - they just benefit from forms that auto-fill

---

## Big Picture

### How Everything Works Together

Here's a visual diagram of how the application is structured:

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                            (App.tsx)                            │
├─────────────────────────────────┬───────────────────────────────┤
│                                 │                               │
│   ┌─────────────────┐          │        ┌──────────────────┐  │
│   │   Form List     │          │        │    Prefill       │  │
│   │   Component     │◄─────Selection────►│  Configuration   │  │
│   │                 │          │        │   Component      │  │
│   │ (Shows all      │          │        │                  │  │
│   │  available      │          │        │ (Shows fields &  │  │
│   │  forms)         │          │        │  their mappings) │  │
│   └─────────────────┘          │        └──────────┬───────┘  │
│                                 │                   │          │
│                                 │                   │          │
│                                 │        ┌──────────▼───────┐  │
│                                 │        │  Data Source     │  │
│                                 │        │    Modal         │  │
│                                 │        │                  │  │
│                                 │        │ (Choose where to │  │
│                                 │        │  prefill from)   │  │
│                                 │        └──────────────────┘  │
└─────────────────────────────────┴───────────────────────────────┘
                                  │
                ┌─────────────────┴──────────────────┐
                │                                    │
         ┌──────▼────────┐                  ┌───────▼────────┐
         │ Custom Hooks  │                  │   Services     │
         │               │                  │                │
         │ • useForms    │                  │ • API Service  │
         │ • usePrefill  │◄────Calls───────►│ • DAG Traversal│
         │   Mappings    │                  │ • Data Source  │
         │ • useData     │                  │   Registry     │
         │   Sources     │                  │                │
         └───────┬───────┘                  └────────┬───────┘
                 │                                   │
                 └───────────────┬───────────────────┘
                                 │
                          ┌──────▼──────┐
                          │  Mock Data  │
                          │             │
                          │ (Fake forms │
                          │  for demo)  │
                          └─────────────┘
```

### The Three Main Sections You See

When you open the app, you see:

1. **Left Panel**: List of all forms (Form A, Form B, etc.)
2. **Right Panel**: When you click a form, you see its fields and current mappings
3. **Modal (Popup)**: When you click "Set Mapping" on a field, a popup shows where you can pull data from

### How the Code is Organized

The codebase is organized into folders by purpose:

```
src/
├── components/       ← Visual parts users see (buttons, lists, etc.)
├── hooks/           ← Reusable logic for components
├── services/        ← Business logic (data processing)
├── types/           ← TypeScript definitions (data shapes)
└── utils/           ← Helper functions and mock data
```

---

## Data Flow

### How Information Moves Through the App

Think of data flow like water flowing through pipes. Here's the journey:

#### Step 1: App Starts

```
1. User opens the app
2. App.tsx loads
3. useForms() hook runs
4. Calls fetchFormBlueprint() from API service
5. Gets mock data (5 forms + global data)
6. Stores forms in component state
```

**In Simple Terms**: When the app loads, it asks "What forms do we have?" and gets a list back.

#### Step 2: User Selects a Form

```
1. User clicks "Form D" in the left panel
2. onClick event fires
3. setSelectedFormId('form-d') updates state
4. React re-renders the right panel
5. PrefillConfiguration component receives form-d data
```

**In Simple Terms**: Clicking a form tells the app "Show me details about this form."

#### Step 3: User Opens Mapping Modal

```
1. User clicks "Set Mapping" for email field
2. handleOpenModal(fieldId) runs
3. setIsModalOpen(true) updates state
4. useDataSources() calculates available data sources
5. Modal appears with three sections:
   - Direct Dependencies (forms this form directly depends on)
   - Transitive Dependencies (indirect dependencies)
   - Global Sources (system-wide data)
```

**In Simple Terms**: Clicking "Set Mapping" asks "What data sources can I use to fill this field?"

#### Step 4: User Selects a Source Field

```
1. User clicks on "Form A → Email" in the modal
2. handleSelectMapping() creates a mapping object:
   {
     targetFormId: 'form-d',
     targetFieldId: 'email',
     sourceFormId: 'form-a',
     sourceFieldId: 'email',
     sourcePath: 'Contact Information Form.Email Address'
   }
3. setMapping() saves this to localStorage
4. Modal closes
5. UI updates to show "Mapped from: ..."
```

**In Simple Terms**: Clicking a source field creates a rule: "Fill Form D's email from Form A's email."

#### Data Flow Diagram

```
┌──────────────┐
│   Browser    │
│  localStorage│  ← Mappings saved here permanently
└──────▲───────┘
       │
       │ Save/Load
       │
┌──────┴──────────────────────────────────────────────┐
│              React Component State                  │
│                                                      │
│  • forms: Form[]                                    │
│  • selectedFormId: string                           │
│  • mappings: PrefillMapping[]                       │
│  • isModalOpen: boolean                             │
└──────▲──────────────────────────────────────────────┘
       │
       │ Update State
       │
┌──────┴──────────────────────────────────────────────┐
│                  User Actions                        │
│                                                      │
│  • Click form → setSelectedFormId()                 │
│  • Click "Set Mapping" → setIsModalOpen(true)       │
│  • Select source → setMapping()                      │
│  • Click X → clearMapping()                          │
└──────────────────────────────────────────────────────┘
```

---

## File-by-File Guide

Let's walk through what each file does and why it exists. Files are organized by folder.

### 📁 `/src/types/`

#### [index.ts](src/types/index.ts) - Type Definitions

**What it does**: Defines the "shape" of all data in the app.

**Why it exists**: TypeScript needs to know what properties each object has. This file is like a blueprint.

**Analogy**: Like a form template that says "Name goes here, Email goes here" - it defines structure without data.

**Key Types**:

```typescript
// What a form looks like
interface Form {
  id: string;              // Unique ID like "form-a"
  name: string;            // Display name like "Contact Form"
  fields: FormField[];     // Array of fields in this form
  dependencies: string[];  // Forms this depends on
}

// What a field looks like
interface FormField {
  id: string;      // Unique ID like "email"
  label: string;   // Display text like "Email Address"
  type: FieldType; // Type like "text", "email", "date"
}

// What a mapping looks like
interface PrefillMapping {
  targetFormId: string;    // Form being filled
  targetFieldId: string;   // Field being filled
  sourceFormId?: string;   // Where data comes from
  sourceFieldId: string;   // Which field to copy from
  sourcePath: string;      // Human-readable path
}
```

**When to look at this file**: When you see TypeScript errors or want to know what properties an object has.

---

### 📁 `/src/utils/`

#### [mockData.ts](src/utils/mockData.ts) - Sample Data

**What it does**: Provides fake form data for the demo.

**Why it exists**: In a real app, this would come from a server. For this demo, we hard-code sample data.

**Analogy**: Like a practice test with pre-filled answers - not real data, just for demonstration.

**The Form Structure**:

```
Form A (Contact Information)
   ↓ (Form B depends on Form A)
Form B (Preferences Survey)
   ↓ (Form D depends on Form B)
Form D (Advanced Configuration)

Form C (Address Collection)
   ↓ (depends on Form A)
Form E (Follow-up Notes)
```

This creates a **Directed Acyclic Graph (DAG)** - a fancy term for "forms connected in a tree where you can't go in circles."

**Example Data**:

```typescript
{
  id: 'form-a',
  name: 'Contact Information Form',
  fields: [
    { id: 'email', label: 'Email Address', type: 'email' },
    { id: 'name', label: 'Full Name', type: 'text' }
  ],
  dependencies: []  // No dependencies - it's a root form
}
```

---

### 📁 `/src/services/`

#### [apiService.ts](src/services/apiService.ts) - API Communication

**What it does**: Pretends to fetch data from a server.

**Why it exists**: Separates data fetching logic from UI components. In a real app, this would make HTTP requests.

**Analogy**: Like a waiter going to the kitchen to get your food - the component asks for data, this service gets it.

**Code Example**:

```typescript
export async function fetchFormBlueprint(): Promise<FormBlueprintResponse> {
  // Simulate network delay (like waiting for server response)
  await new Promise(resolve => setTimeout(resolve, 500));

  // Return mock data
  return {
    forms: mockForms,
    globalData: mockGlobalData,
  };
}
```

**Why the delay?**: Makes it realistic - real network requests take time. This lets us show loading spinners.

---

#### [dagTraversal.ts](src/services/dagTraversal.ts) - Dependency Graph Logic

**What it does**: Figures out which forms depend on which other forms.

**Why it exists**: To show users all available data sources (direct and indirect dependencies).

**Analogy**: Like a family tree - finding not just your parents (direct), but also grandparents (indirect).

**Key Functions**:

1. **`getDependencies()`** - Finds ALL forms this form depends on

```typescript
// If Form D depends on Form B, which depends on Form A:
getDependencies('form-d', formGraph)
// Returns: Set(['form-b', 'form-a'])
```

2. **`getDirectDependencies()`** - Finds only immediate dependencies

```typescript
getDirectDependencies('form-d', formGraph)
// Returns: Set(['form-b'])  // Only direct parent
```

3. **`getTransitiveDependencies()`** - Finds indirect dependencies

```typescript
getTransitiveDependencies('form-d', formGraph)
// Returns: Set(['form-a'])  // Everything except direct
```

**How it works**: Uses **Breadth-First Search (BFS)**, a graph algorithm:

```
Start with Form D
1. Add Form D to queue
2. Check Form D's dependencies → finds Form B
3. Add Form B to result set
4. Add Form B to queue
5. Check Form B's dependencies → finds Form A
6. Add Form A to result set
7. Queue is empty → done!
```

---

#### [dataSourceRegistry.ts](src/services/dataSourceRegistry.ts) - Data Source Pattern

**What it does**: Manages different types of data sources (forms, global data, etc.) in a consistent way.

**Why it exists**: Makes it easy to add new data source types without changing existing code.

**Analogy**: Like different apps on your phone - they all work differently inside, but all have a consistent "app icon" and "open" button.

**The Pattern** (Strategy Pattern):

```typescript
// Every data source must follow this contract
interface DataSource {
  id: string;
  name: string;
  type: 'form' | 'global' | 'custom';
  getFields(): DataField[];  // All must implement this
}
```

**Why this matters**: To add a new data source type, you just:
1. Create a class that implements `DataSource`
2. Register it with the registry
3. Done! No changes to existing code needed

**Example Implementation**:

```typescript
class FormDataSource implements DataSource {
  constructor(
    public readonly id: string,
    public readonly name: string,
    private readonly form: Form
  ) {}

  getFields(): DataField[] {
    return this.form.fields.map(field => ({
      id: field.id,
      label: field.label,
      type: field.type,
      path: `${this.name}.${field.label}`
    }));
  }
}
```

**Registry Pattern**:

```typescript
const registry = new DataSourceRegistry();
registry.register(new FormDataSource('form-a', 'Contact Form', formAData));
registry.register(new GlobalDataSource(globalData));

// Later, get all sources
const allSources = registry.getAll();  // Returns both form and global sources
```

---

### 📁 `/src/hooks/`

Hooks are **reusable pieces of logic** that components can use. Think of them as helper functions that can manage state.

#### [useForms.ts](src/hooks/useForms.ts) - Form Data Management

**What it does**: Fetches form data when the app loads and provides it to components.

**Why it exists**: Separates data fetching logic from UI rendering.

**Analogy**: Like an assistant who goes and gets your files when you need them, and keeps them organized.

**What it returns**:

```typescript
const {
  forms,        // Array of all forms
  formGraph,    // Forms organized by ID for quick lookup
  globalData,   // Global data sources
  loading,      // True while fetching data
  error,        // Error if fetch fails
  refetch       // Function to reload data
} = useForms();
```

**How it works**:

```typescript
export function useForms() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This runs once when component mounts
    async function loadForms() {
      setLoading(true);
      const data = await fetchFormBlueprint();
      setForms(data.forms);
      setLoading(false);
    }
    loadForms();
  }, []); // Empty array = run once on mount

  return { forms, loading, ... };
}
```

---

#### [usePrefillMappings.ts](src/hooks/usePrefillMappings.ts) - Mapping Management

**What it does**: Manages all prefill mappings (create, read, update, delete).

**Why it exists**: Keeps mapping logic in one place, and persists mappings to localStorage.

**Analogy**: Like a notebook where you write down all your mappings, and it auto-saves.

**Key Functions**:

```typescript
const {
  mappings,                      // All mappings
  getMappingsForForm,            // Get all mappings for one form
  getMapping,                    // Get specific field mapping
  setMapping,                    // Create/update a mapping
  clearMapping,                  // Delete one mapping
  clearAllMappingsForForm,       // Delete all for a form
} = usePrefillMappings();
```

**localStorage Integration**:

```typescript
// On mount, load from localStorage
const [mappings, setMappings] = useState<PrefillMapping[]>(() => {
  const stored = localStorage.getItem('prefill-mappings');
  return stored ? JSON.parse(stored) : [];
});

// Whenever mappings change, save to localStorage
useEffect(() => {
  localStorage.setItem('prefill-mappings', JSON.stringify(mappings));
}, [mappings]);
```

**Why localStorage?**: So your mappings persist even if you refresh the page or close the browser.

---

#### [useDataSources.ts](src/hooks/useDataSources.ts) - Available Sources Calculation

**What it does**: Calculates which data sources are available for a selected form.

**Why it exists**: Keeps the complex dependency logic out of components.

**Analogy**: Like a librarian who knows which books you're allowed to check out based on your membership level.

**How it works**:

```typescript
export function useDataSources(targetFormId, formGraph, globalData) {
  return useMemo(() => {
    // Only recalculate when inputs change
    const registry = new DataSourceRegistry();

    // Register all forms as data sources
    Object.values(formGraph).forEach(form => {
      registry.register(new FormDataSource(form.id, form.name, form));
    });

    // Register global sources
    registry.register(new GlobalDataSource(globalData));

    // Figure out dependencies
    const directDeps = getDirectDependencies(targetFormId, formGraph);
    const transitiveDeps = getTransitiveDependencies(targetFormId, formGraph);

    return {
      directDependencies: [...directDeps].map(id => registry.get(id)),
      transitiveDependencies: [...transitiveDeps].map(id => registry.get(id)),
      globalSources: registry.getByType('global')
    };
  }, [targetFormId, formGraph, globalData]);
}
```

**useMemo**: Only recalculates when `targetFormId`, `formGraph`, or `globalData` changes. Otherwise, returns cached result. This is a performance optimization.

---

### 📁 `/src/components/`

Components are the **visual pieces** of the UI. They're like LEGO blocks - small, reusable pieces that fit together.

#### [App.tsx](src/App.tsx) - Main Application

**What it does**: The root component that holds everything together.

**Why it exists**: Every React app needs a root component.

**Analogy**: Like the main stage of a theater production - it coordinates all the actors and scenes.

**Structure**:

```typescript
function App() {
  // STATE: What the app remembers
  const [selectedFormId, setSelectedFormId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // DATA: Get data from hooks
  const { forms, formGraph, globalData, loading, error } = useForms();
  const { setMapping, clearMapping } = usePrefillMappings();
  const dataSources = useDataSources(selectedFormId, formGraph, globalData);

  // HANDLERS: What happens when users interact
  const handleOpenModal = (fieldId) => { ... };
  const handleSelectMapping = (mapping) => { ... };

  // RENDER: What users see
  return (
    <div>
      <FormList ... />
      <PrefillConfiguration ... />
      <DataSourceModal ... />
    </div>
  );
}
```

**Three States**:

1. **Loading**: Shows spinner while fetching data
2. **Error**: Shows error message if fetch fails
3. **Success**: Shows main UI with forms and mappings

---

#### [FormList.tsx](src/components/FormList.tsx) - Form List Display

**What it does**: Displays all available forms in a list.

**Why it exists**: Separates the form list logic from the main app.

**Analogy**: Like a menu at a restaurant - shows all available options.

**Props it receives**:

```typescript
interface FormListProps {
  forms: Form[];                    // All forms to display
  selectedFormId: string | null;    // Which form is selected
  onSelectForm: (formId) => void;   // What to do when form clicked
}
```

**What it renders**:

```typescript
<div>
  <h2>Available Forms</h2>
  {forms.map(form => (
    <FormCard
      key={form.id}
      form={form}
      isSelected={selectedFormId === form.id}
      onClick={() => onSelectForm(form.id)}
    />
  ))}
</div>
```

---

#### [FormCard.tsx](src/components/FormCard.tsx) - Single Form Card

**What it does**: Displays one form as a clickable card.

**Why it exists**: Reusable component for displaying a form. Makes FormList cleaner.

**Analogy**: Like a business card - compact display of key information.

**What it shows**:

- Form name
- Number of fields
- Number of dependencies
- Checkmark if selected

**Styling logic**:

```typescript
className={`
  ${isSelected
    ? 'border-primary-500 bg-primary-50'    // Selected styling
    : 'border-gray-200 bg-white'            // Normal styling
  }
  hover:shadow-md                           // Hover effect
`}
```

---

#### [PrefillConfiguration.tsx](src/components/PrefillConfiguration.tsx) - Field Mapping UI

**What it does**: Shows all fields in the selected form and their mappings.

**Why it exists**: Main interface for viewing and editing mappings.

**Analogy**: Like a control panel showing all the connections you've set up.

**What it displays**:

1. Form name
2. Number of fields
3. "Clear All Mappings" button (if mappings exist)
4. List of all fields with their mappings

**Empty state**:

```typescript
if (!form) {
  return <div>No form selected - pick one from the list</div>;
}
```

**Field list**:

```typescript
{form.fields.map(field => (
  <FieldMappingRow
    field={field}
    mapping={getMapping(field.id)}
    onOpenModal={onOpenModal}
    onClearMapping={onClearMapping}
  />
))}
```

---

#### [FieldMappingRow.tsx](src/components/FieldMappingRow.tsx) - Single Field Row

**What it does**: Displays one field and its prefill mapping.

**Why it exists**: Reusable component for each field row.

**Analogy**: Like a row in a spreadsheet showing one item's details.

**What it shows**:

```
┌────────────────────────────────────────────────────┐
│ Field Label [type badge]                           │
│ ✓ Mapped from: Form A.Email    [X] [Edit Mapping] │
└────────────────────────────────────────────────────┘
```

**Two states**:

1. **Mapped**: Shows green checkmark and source path
2. **Not mapped**: Shows gray X and "Not mapped" text

**Color-coded badges**:

```typescript
const fieldTypeColors = {
  text: 'bg-blue-100 text-blue-800',
  email: 'bg-purple-100 text-purple-800',
  date: 'bg-green-100 text-green-800',
  // ... etc
};
```

---

#### [DataSourceModal.tsx](src/components/DataSourceModal.tsx) - Source Selection Popup

**What it does**: Shows a popup where users select which data source to map from.

**Why it exists**: Keeps the mapping selection UI separate from the main view.

**Analogy**: Like a file picker dialog when you click "Open File" - a separate window for choosing.

**Three sections**:

1. **Direct Dependencies**: Forms this form directly depends on
2. **Transitive Dependencies**: Forms that dependencies depend on
3. **Global Sources**: System-wide data (action properties, org properties)

**Search feature**:

```typescript
const [searchTerm, setSearchTerm] = useState('');

<input
  type="text"
  placeholder="Search fields..."
  value={searchTerm}
  onChange={e => setSearchTerm(e.target.value)}
/>
```

**Incomplete tasks** (intentional for video coding):

```typescript
// TODO: Add field type validation
if (field.type !== targetField.type) {
  const proceed = confirm("Type mismatch. Continue?");
  if (!proceed) return;
}
```

---

#### [DataSourceTree.tsx](src/components/DataSourceTree.tsx) - Hierarchical Source Display

**What it does**: Displays data sources in a collapsible tree view.

**Why it exists**: Makes it easier to browse through many sources and fields.

**Analogy**: Like a folder tree in File Explorer - click to expand/collapse.

**Expandable behavior**:

```typescript
const [expandedSources, setExpandedSources] = useState(
  new Set(dataSources.map(s => s.id))  // All expanded by default
);

const toggleSource = (sourceId) => {
  setExpandedSources(prev => {
    const next = new Set(prev);
    if (next.has(sourceId)) {
      next.delete(sourceId);  // Collapse
    } else {
      next.add(sourceId);     // Expand
    }
    return next;
  });
};
```

**Tree structure**:

```
▼ Contact Information Form (3 fields)
  • Email Address [email]
  • Full Name [text]
  • Phone Number [text]

▼ Preferences Survey (4 fields)
  • Completion Date [date]
  • Submit Button [button]
  ...
```

---

## Key Concepts Explained

Let's break down important programming concepts used in this project.

### 1. React Hooks

**What are they?**: Special functions that let components "hook into" React features.

**Why use them?**: To manage state and side effects in functional components.

**Common hooks in this project**:

#### `useState` - Remember Things

```typescript
const [count, setCount] = useState(0);
//     ^       ^              ^
//     |       |              |
//  current   function to   initial
//  value     update value   value
```

**Example**:

```typescript
const [selectedFormId, setSelectedFormId] = useState(null);

// Reading the value
console.log(selectedFormId);  // null

// Updating the value
setSelectedFormId('form-a');  // Now selectedFormId is 'form-a'
```

**Analogy**: Like a sticky note on your desk - you write something down and can change it later.

---

#### `useEffect` - Do Things When Stuff Changes

```typescript
useEffect(() => {
  // This code runs when dependencies change
  fetchData();
}, [dependency1, dependency2]);
```

**Example**:

```typescript
useEffect(() => {
  // Runs once when component mounts
  fetchFormBlueprint();
}, []);  // Empty array = run only once

useEffect(() => {
  // Runs whenever mappings change
  localStorage.setItem('mappings', JSON.stringify(mappings));
}, [mappings]);  // Run when mappings changes
```

**Analogy**: Like an automatic task - "When the door opens, turn on the light."

---

#### `useMemo` - Remember Expensive Calculations

```typescript
const expensiveValue = useMemo(() => {
  // Only recalculate if dependencies change
  return doExpensiveCalculation(data);
}, [data]);
```

**Example**:

```typescript
const dataSources = useMemo(() => {
  // This only runs when targetFormId changes
  return calculateDataSources(targetFormId);
}, [targetFormId]);
```

**Analogy**: Like memorizing your times tables instead of recalculating 7×8 every time.

**Why use it?**: If calculating data sources takes 100ms, and the component re-renders 10 times but targetFormId doesn't change, we save 900ms.

---

#### `useCallback` - Remember Functions

```typescript
const handleClick = useCallback(() => {
  // This function is only recreated if dependencies change
  doSomething(value);
}, [value]);
```

**Why use it?**: Functions are recreated on every render. If you pass a function as a prop, it can cause child components to re-render unnecessarily.

---

### 2. TypeScript Concepts

#### Interfaces - Define Object Shapes

```typescript
interface Person {
  name: string;
  age: number;
  email?: string;  // Optional (can be undefined)
}

// Valid
const john: Person = { name: 'John', age: 30 };

// Invalid - TypeScript error
const invalid: Person = { name: 'Jane' };  // Missing 'age'
```

**Why use them?**: Catch errors at compile time instead of runtime.

---

#### Union Types - Multiple Possibilities

```typescript
type Status = 'pending' | 'success' | 'error';

let status: Status = 'pending';  // OK
status = 'success';              // OK
status = 'loading';              // Error! Not one of the allowed values
```

---

#### Generics - Flexible Types

```typescript
function identity<T>(value: T): T {
  return value;
}

identity<string>('hello');  // Returns string
identity<number>(42);       // Returns number
```

**In our code**:

```typescript
useState<string | null>(null);
//       ^^^^^^^^^^^^^^^
// Generic type parameter - "this state holds a string or null"
```

---

### 3. Design Patterns

#### Strategy Pattern (Data Source Registry)

**Problem**: We have different types of data sources (forms, global data, etc.) that need to be treated the same way.

**Solution**: Define a common interface all sources must implement.

```typescript
interface DataSource {
  getFields(): DataField[];
}

class FormDataSource implements DataSource {
  getFields() { /* return form fields */ }
}

class GlobalDataSource implements DataSource {
  getFields() { /* return global fields */ }
}

// Both can be used interchangeably
const sources: DataSource[] = [
  new FormDataSource(...),
  new GlobalDataSource(...)
];

sources.forEach(source => {
  const fields = source.getFields();  // Works for both!
});
```

**Why this matters**: To add a new data source type, just create a new class. No changes to existing code needed.

---

#### Registry Pattern

**Problem**: We need to manage multiple instances of data sources.

**Solution**: Create a registry to store and retrieve them.

```typescript
class DataSourceRegistry {
  private sources = new Map<string, DataSource>();

  register(source: DataSource) {
    this.sources.set(source.id, source);
  }

  get(id: string) {
    return this.sources.get(id);
  }

  getAll() {
    return Array.from(this.sources.values());
  }
}
```

**Analogy**: Like a library catalog - you register books, and can look them up by ID.

---

### 4. Graph Algorithms (DAG Traversal)

#### What is a DAG?

**DAG** = Directed Acyclic Graph

- **Directed**: Arrows point in one direction (Form D → Form B → Form A)
- **Acyclic**: No loops (Form A can't depend on Form D if D depends on A)
- **Graph**: Nodes (forms) connected by edges (dependencies)

**Our DAG**:

```
     Form A
     ↙    ↘
  Form B   Form C
     ↓       ↓
  Form D   Form E
```

---

#### Breadth-First Search (BFS)

**What it does**: Explores all neighbors before going deeper.

**How it works**:

```typescript
function getDependencies(targetFormId) {
  const queue = [targetFormId];
  const dependencies = new Set();
  const visited = new Set();

  while (queue.length > 0) {
    const current = queue.shift();  // Get next from queue

    if (visited.has(current)) continue;
    visited.add(current);

    // Add all dependencies to queue
    formGraph[current].dependencies.forEach(dep => {
      dependencies.add(dep);
      queue.push(dep);
    });
  }

  return dependencies;
}
```

**Step-by-step for Form D**:

```
Initial: queue = ['form-d'], dependencies = {}, visited = {}

Step 1: Process 'form-d'
  - Dependencies: ['form-b']
  - Add 'form-b' to dependencies and queue
  - Result: queue = ['form-b'], dependencies = {'form-b'}, visited = {'form-d'}

Step 2: Process 'form-b'
  - Dependencies: ['form-a']
  - Add 'form-a' to dependencies and queue
  - Result: queue = ['form-a'], dependencies = {'form-b', 'form-a'}, visited = {'form-d', 'form-b'}

Step 3: Process 'form-a'
  - Dependencies: []
  - Nothing to add
  - Result: queue = [], dependencies = {'form-b', 'form-a'}, visited = {'form-d', 'form-b', 'form-a'}

Queue is empty - done!
Final result: Set(['form-b', 'form-a'])
```

---

### 5. State Management

**What is state?**: Data that changes over time and affects what users see.

**Types of state in this app**:

1. **Local State** (useState): Lives in one component
   ```typescript
   const [isModalOpen, setIsModalOpen] = useState(false);
   ```

2. **Derived State** (useMemo): Calculated from other state
   ```typescript
   const dataSources = useMemo(() => {
     return calculateDataSources(selectedFormId);
   }, [selectedFormId]);
   ```

3. **Persistent State** (localStorage): Survives page refreshes
   ```typescript
   useEffect(() => {
     localStorage.setItem('mappings', JSON.stringify(mappings));
   }, [mappings]);
   ```

---

### 6. Component Composition

**What is it?**: Building complex UIs from simple, reusable components.

**Example**:

```
App
├── FormList
│   └── FormCard (×5, one per form)
└── PrefillConfiguration
    └── FieldMappingRow (×3, one per field)
```

**Why?**: Each component has one job. Makes code easier to understand, test, and reuse.

**Props flow down**:

```typescript
<FormList
  forms={forms}
  onSelectForm={setSelectedFormId}
/>
```

**Events flow up**:

```typescript
// In FormList
<FormCard onClick={() => onSelectForm(form.id)} />

// When clicked, calls parent's setSelectedFormId
```

---

## How to Read the Code

### Start Here: The Data Flow Path

When learning this codebase, follow the data flow for a specific feature:

#### Example: "How does selecting a form work?"

1. **Start**: User clicks FormCard in FormList
2. **Event Handler**: `onClick={() => onSelectForm(form.id)}`
3. **Trace back**: Where does `onSelectForm` come from?
   - FormList receives it as a prop: `onSelectForm: (formId) => void`
   - App.tsx passes it: `onSelectForm={setSelectedFormId}`
4. **State Update**: `setSelectedFormId('form-d')` updates state
5. **Re-render**: App.tsx re-renders with new selectedFormId
6. **Effect**: PrefillConfiguration receives new form data
7. **UI Update**: Right panel shows Form D's fields

**Visual trace**:

```
User clicks Form D card
    ↓
FormCard onClick fires
    ↓
Calls onSelectForm(form.id)
    ↓
Bubbles up to FormList
    ↓
Bubbles up to App.tsx
    ↓
Calls setSelectedFormId('form-d')
    ↓
App state updates
    ↓
React re-renders
    ↓
PrefillConfiguration receives new props
    ↓
Right panel updates to show Form D
```

---

### Reading TypeScript Types

When you see:

```typescript
const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
```

**Break it down**:

- `const [..., ...] =` - Array destructuring
- `useState` - React hook for state
- `<string | null>` - Type parameter (can be string OR null)
- `(null)` - Initial value

**Hover in VSCode**: Hover over variables to see their types.

---

### Understanding JSX/TSX

JSX looks like HTML but it's JavaScript:

```typescript
<button
  onClick={() => onSelectForm(form.id)}
  className={`
    ${isSelected ? 'border-blue-500' : 'border-gray-200'}
  `}
>
  {form.name}
</button>
```

**Breaks down to**:

- `onClick={...}` - Event handler (JavaScript expression in braces)
- `className={...}` - Dynamic class names (template literal)
- `{form.name}` - Variable interpolation

**Remember**:
- Use `className` not `class`
- Use `onClick` not `onclick`
- Braces `{}` for JavaScript expressions

---

### Following Props

**Props flow**: Parent → Child

To understand what a component needs:

```typescript
interface FormCardProps {
  form: Form;           // The data to display
  isSelected: boolean;  // Whether this is selected
  onClick: () => void;  // What to do when clicked
}
```

**Where to find this?**: Look at the interface above the component definition.

---

### Tracing Hooks

To understand where data comes from:

```typescript
const { forms, loading } = useForms();
```

1. Find the hook definition: `hooks/useForms.ts`
2. Look at what it returns:
   ```typescript
   return {
     forms,
     loading,
     error,
     ...
   };
   ```
3. Trace where that data comes from:
   ```typescript
   const [forms, setForms] = useState([]);
   const data = await fetchFormBlueprint();
   setForms(data.forms);
   ```

---

## Common Questions

### Q1: Why separate components, hooks, and services?

**A**: Separation of concerns.

- **Components**: What users see (presentation)
- **Hooks**: Reusable stateful logic (state management)
- **Services**: Business logic and data fetching (logic)

**Analogy**: Like a restaurant:
- **Components**: Dining room (where customers are)
- **Hooks**: Waiters (connect customers to kitchen)
- **Services**: Kitchen (where food is prepared)

**Benefits**:
- Easier to test (test services without UI)
- Easier to reuse (use same hook in different components)
- Easier to understand (each file has one purpose)

---

### Q2: What is the difference between `const` and `let`?

**`const`**: Can't reassign

```typescript
const name = 'John';
name = 'Jane';  // Error!

const person = { name: 'John' };
person.name = 'Jane';  // OK! Object contents can change
person = {};           // Error! Can't reassign
```

**`let`**: Can reassign

```typescript
let count = 0;
count = 1;  // OK
```

**Rule of thumb**: Use `const` by default. Only use `let` if you need to reassign.

---

### Q3: Why use TypeScript instead of JavaScript?

**A**: Catch errors early.

**JavaScript** (no error until runtime):

```javascript
function greet(person) {
  return `Hello ${person.name}`;
}

greet({ age: 30 });  // Runtime error: name is undefined
```

**TypeScript** (error in editor):

```typescript
interface Person {
  name: string;
}

function greet(person: Person) {
  return `Hello ${person.name}`;
}

greet({ age: 30 });  // Editor shows red squiggly: missing 'name'
```

**Benefits**:
- Autocomplete in editor
- Refactoring is safer
- Documentation built-in (types describe what functions expect)

---

### Q4: What is `null` vs `undefined`?

**`null`**: Intentional absence of value

```typescript
const selectedFormId = null;  // "No form is selected"
```

**`undefined`**: Variable not initialized or property doesn't exist

```typescript
let x;  // undefined
const obj = {};
obj.name;  // undefined
```

**In practice**:
- Use `null` when you intentionally want "no value"
- `undefined` typically means "hasn't been set yet"

---

### Q5: Why use arrow functions `() => {}`?

**Benefits**:

1. **Shorter syntax**:
   ```typescript
   // Old way
   function add(a, b) { return a + b; }

   // Arrow function
   const add = (a, b) => a + b;
   ```

2. **Lexical `this`** (doesn't create new `this` binding):
   ```typescript
   class Component {
     value = 42;

     // Arrow function keeps 'this' from class
     handleClick = () => {
       console.log(this.value);  // 42
     }

     // Regular function would have different 'this'
     handleClick2() {
       console.log(this.value);  // might be undefined
     }
   }
   ```

3. **Common in callbacks**:
   ```typescript
   forms.map(form => form.name)
   forms.filter(form => form.dependencies.length > 0)
   ```

---

### Q6: What does `...` (spread operator) do?

**Array spreading**:

```typescript
const arr1 = [1, 2, 3];
const arr2 = [...arr1, 4, 5];  // [1, 2, 3, 4, 5]
```

**Object spreading**:

```typescript
const person = { name: 'John', age: 30 };
const employee = { ...person, role: 'Developer' };
// { name: 'John', age: 30, role: 'Developer' }
```

**Common use**: Updating state immutably

```typescript
setMappings(prev => [...prev, newMapping]);  // Add to array
setMappings(prev => prev.filter(m => m.id !== id));  // Remove from array
```

---

### Q7: What is `async/await`?

**A**: Makes asynchronous code look synchronous.

**Without async/await** (callback hell):

```typescript
fetchData((data) => {
  processData(data, (result) => {
    saveResult(result, () => {
      console.log('Done!');
    });
  });
});
```

**With async/await**:

```typescript
async function doEverything() {
  const data = await fetchData();
  const result = await processData(data);
  await saveResult(result);
  console.log('Done!');
}
```

**Key points**:
- `async` function returns a Promise
- `await` pauses execution until Promise resolves
- Much easier to read and reason about

---

### Q8: Why use a Set instead of an Array?

**Set**: No duplicates, fast lookups

```typescript
const set = new Set(['a', 'b', 'c']);
set.add('a');  // No effect, 'a' already exists
set.has('b');  // true (O(1) - instant)
```

**Array**: Can have duplicates, slower lookups

```typescript
const arr = ['a', 'b', 'c'];
arr.push('a');  // Now ['a', 'b', 'c', 'a']
arr.includes('b');  // true (O(n) - must search entire array)
```

**When to use Set**:
- Unique values only
- Need fast "does this exist?" checks
- In our code: `Set<string>` for dependency IDs (no duplicates)

---

### Q9: What is localStorage?

**A**: Browser storage that persists across page refreshes.

```typescript
// Save
localStorage.setItem('key', 'value');

// Load
const value = localStorage.getItem('key');

// Remove
localStorage.removeItem('key');
```

**Limitations**:
- Only stores strings (must JSON.stringify objects)
- Limited to ~5-10MB per domain
- Synchronous (blocks UI if storing large data)

**In our app**:

```typescript
// Save mappings
localStorage.setItem('prefill-mappings', JSON.stringify(mappings));

// Load mappings
const stored = localStorage.getItem('prefill-mappings');
const mappings = stored ? JSON.parse(stored) : [];
```

---

### Q10: How do I add a new data source type?

**Steps**:

1. **Create a class** that implements `DataSource`:

```typescript
export class ApiDataSource implements DataSource {
  public readonly id = 'api-users';
  public readonly name = 'User API';
  public readonly type = 'custom' as const;

  constructor(private readonly apiEndpoint: string) {}

  getFields(): DataField[] {
    // Fetch from API and transform to DataField[]
    return [
      {
        id: 'username',
        label: 'Username',
        type: 'text',
        path: 'User API.Username'
      }
    ];
  }
}
```

2. **Register it** in `useDataSources`:

```typescript
if (apiEnabled) {
  registry.register(new ApiDataSource('https://api.example.com/users'));
}
```

3. **Done!** It will automatically appear in the modal.

**Why this is easy**: The Strategy Pattern means existing code doesn't need to change.

---

### Q11: What does `map()`, `filter()`, and `find()` do?

**`map()`**: Transform each item

```typescript
const names = forms.map(form => form.name);
// ['Contact Form', 'Preferences Survey', ...]
```

**`filter()`**: Keep only items that match condition

```typescript
const hasFields = forms.filter(form => form.fields.length > 0);
```

**`find()`**: Get first item that matches

```typescript
const formA = forms.find(form => form.id === 'form-a');
```

**All three**:
- Don't modify original array
- Return new array (or single item for `find()`)
- Chainable:
  ```typescript
  forms
    .filter(form => form.dependencies.length > 0)
    .map(form => form.name)
    .join(', ')
  ```

---

### Q12: How does React know when to re-render?

**A**: React re-renders when state or props change.

**State change**:

```typescript
const [count, setCount] = useState(0);
setCount(1);  // Triggers re-render
```

**Props change**:

```typescript
// Parent re-renders
<Child value={count} />
// Child re-renders because prop changed
```

**What doesn't trigger re-render**:

```typescript
let x = 0;
x = 1;  // Regular variable - doesn't trigger re-render

const obj = { count: 0 };
obj.count = 1;  // Mutating object - doesn't trigger re-render
```

**Rule**: Only `setState` calls trigger re-renders.

---

### Q13: What is the virtual DOM?

**A**: React's optimization technique.

**How it works**:

1. You call `setState`
2. React creates new virtual DOM (JavaScript object tree)
3. React compares new virtual DOM to old one (diffing)
4. React updates only changed parts of real DOM

**Why this matters**: DOM operations are slow. React minimizes them.

**Example**:

```
Old virtual DOM:        New virtual DOM:
<div>                   <div>
  <h1>Count: 0</h1>       <h1>Count: 1</h1>  ← Changed!
  <button>+</button>      <button>+</button>  ← Same
</div>                  </div>

React only updates the <h1> text node, not the whole tree.
```

---

### Q14: When should I use `useCallback` vs `useMemo`?

**`useMemo`**: Memoize values

```typescript
const expensiveValue = useMemo(() => {
  return calculateSomething(data);
}, [data]);
```

**`useCallback`**: Memoize functions

```typescript
const handleClick = useCallback(() => {
  doSomething(data);
}, [data]);
```

**Equivalent**:

```typescript
// These are the same:
const handleClick = useCallback(() => doSomething(), []);
const handleClick = useMemo(() => () => doSomething(), []);
```

**When to use**:
- `useMemo`: Expensive calculations
- `useCallback`: Functions passed as props (prevents child re-renders)

---

## Next Steps

### Learning Path

1. **Beginner**: Understand the UI flow
   - Click through the app
   - Read component files to see what they render
   - Don't worry about hooks/services yet

2. **Intermediate**: Understand data flow
   - Trace how clicking a button updates the UI
   - Read hooks to see state management
   - Understand the DAG traversal algorithm

3. **Advanced**: Understand the patterns
   - Study the Strategy Pattern
   - Implement the incomplete tasks
   - Add a new data source type

### Practice Exercises

**Easy**:
1. Add a new field to Form A in mockData.ts
2. Change the color scheme in tailwind config
3. Add a "Select All" button to FormList

**Medium**:
1. Implement the `OrganizationDataSource` class
2. Add field type validation in the modal
3. Add a "Duplicate mapping to all fields" feature

**Hard**:
1. Add undo/redo for mappings
2. Export mappings as JSON
3. Add drag-and-drop to reorder forms

### Resources

**React**:
- [React Docs - Thinking in React](https://react.dev/learn/thinking-in-react)
- [React Hooks Guide](https://react.dev/reference/react)

**TypeScript**:
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript for React Developers](https://react-typescript-cheatsheet.netlify.app/)

**Algorithms**:
- [Graph Traversal Visualizations](https://visualgo.net/en/dfsbfs)
- [Design Patterns](https://refactoring.guru/design-patterns)

---

## Glossary

**Component**: Reusable piece of UI (like a LEGO block)

**DAG**: Directed Acyclic Graph - a tree-like structure without cycles

**Hook**: Special React function that lets you use state and other features

**Interface**: TypeScript definition of an object's shape

**JSX**: JavaScript XML - lets you write HTML-like code in JavaScript

**Mapping**: Configuration that says "field X gets its value from field Y"

**Props**: Properties passed from parent component to child

**State**: Data that can change over time in a component

**Strategy Pattern**: Design pattern where different implementations share same interface

**Virtual DOM**: React's in-memory representation of the UI

---

## Credits

**Built with**:
- React 18.3
- TypeScript 5.3
- Vite 5.0
- Tailwind CSS 3.4
- Vitest 1.1

**Created for**: Avantos Coding Challenge

**Last Updated**: 2024

---

## Need Help?

**Stuck on a concept?**:
1. Search this document (Ctrl+F)
2. Read the code comments
3. Use TypeScript hover tooltips in VSCode
4. Console.log liberally to see values

**Debugging tips**:
```typescript
console.log('selectedFormId:', selectedFormId);
console.log('mappings:', mappings);
console.log('dataSources:', dataSources);
```

**Remember**: Everyone starts as a beginner. Take it one concept at a time.
