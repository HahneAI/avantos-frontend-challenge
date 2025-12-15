# Testing Quick Reference

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- src/hooks/__tests__/usePrefillMappings.test.ts

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run tests matching pattern
npm test -- --grep "localStorage"
```

## Test File Structure

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

describe('ComponentName or HookName', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  describe('Feature Category', () => {
    it('should do something specific', () => {
      // Arrange
      const initialData = {};

      // Act
      const result = someFunction(initialData);

      // Assert
      expect(result).toBe(expectedValue);
    });
  });
});
```

## Testing Custom Hooks

### Basic Hook Test
```typescript
const { result } = renderHook(() => useCustomHook());

// Access hook return values
expect(result.current.someValue).toBe(expected);
```

### Hook with Props
```typescript
const { result, rerender } = renderHook(
  ({ propValue }) => useCustomHook(propValue),
  { initialProps: { propValue: 'initial' } }
);

// Change props and re-render
rerender({ propValue: 'updated' });
```

### Hook with State Updates
```typescript
const { result } = renderHook(() => useCustomHook());

// Wrap state updates in act()
act(() => {
  result.current.updateFunction(newValue);
});

expect(result.current.stateValue).toBe(newValue);
```

## Testing localStorage

### Mock Implementation
```typescript
let storage: { [key: string]: string } = {};

beforeEach(() => {
  storage = {};

  vi.mocked(localStorage.getItem).mockImplementation((key) => {
    return storage[key] || null;
  });

  vi.mocked(localStorage.setItem).mockImplementation((key, value) => {
    storage[key] = value;
  });
});
```

### Testing Persistence
```typescript
// Pre-populate
storage['key'] = JSON.stringify(data);

// Verify loaded
const { result } = renderHook(() => useHook());
expect(result.current.data).toEqual(data);

// Verify saved
act(() => result.current.save(newData));
expect(JSON.parse(storage['key'])).toEqual(newData);
```

## Common Assertions

```typescript
// Equality
expect(value).toBe(expected);              // Strict equality (===)
expect(value).toEqual(expected);           // Deep equality
expect(value).not.toBe(unexpected);        // Negation

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeDefined();
expect(value).toBeUndefined();
expect(value).toBeNull();

// Numbers
expect(value).toBeGreaterThan(10);
expect(value).toBeLessThan(10);
expect(array).toHaveLength(5);

// Arrays
expect(array).toContain(item);
expect(array).toContainEqual(object);

// Objects
expect(obj).toHaveProperty('key');
expect(obj).toMatchObject({ key: 'value' });

// Functions
expect(fn).toHaveBeenCalled();
expect(fn).toHaveBeenCalledWith(arg1, arg2);
expect(fn).toHaveBeenCalledTimes(3);

// Exceptions
expect(() => fn()).toThrow();
expect(() => fn()).not.toThrow();
```

## Mocking Functions

```typescript
// Create mock
const mockFn = vi.fn();

// Mock implementation
const mockFn = vi.fn((x) => x * 2);

// Mock return value
const mockFn = vi.fn().mockReturnValue(42);

// Mock resolved promise
const mockFn = vi.fn().mockResolvedValue(data);

// Mock rejected promise
const mockFn = vi.fn().mockRejectedValue(error);

// Clear mock calls
vi.clearAllMocks();

// Restore original implementation
mockFn.mockRestore();
```

## Testing React Components

```typescript
import { render, screen, fireEvent } from '@testing-library/react';

// Render component
render(<MyComponent prop="value" />);

// Query elements
const button = screen.getByText('Click me');
const input = screen.getByPlaceholderText('Enter name');
const heading = screen.getByRole('heading');

// Interact
fireEvent.click(button);
fireEvent.change(input, { target: { value: 'John' } });

// Assert
expect(screen.getByText('Result')).toBeInTheDocument();
```

## Best Practices

### 1. Test Organization
- Group related tests with `describe`
- Use descriptive test names: "should do X when Y"
- Follow AAA pattern: Arrange, Act, Assert

### 2. Test Independence
- Each test should run independently
- Clean up after tests (afterEach)
- Don't rely on test execution order

### 3. Mock External Dependencies
- Mock APIs, localStorage, third-party libraries
- Use in-memory implementations when possible
- Reset mocks between tests

### 4. Edge Cases
- Test null/undefined inputs
- Test empty arrays/objects
- Test error scenarios
- Test boundary conditions

### 5. Memoization Testing
```typescript
const { result, rerender } = renderHook(() => useHook());

const initialRef = result.current.memoizedValue;

// No prop change - should be same reference
rerender();
expect(result.current.memoizedValue).toBe(initialRef);

// Prop change - should be new reference
rerender({ propChanged: true });
expect(result.current.memoizedValue).not.toBe(initialRef);
```

## Common Patterns

### Testing Async Operations
```typescript
import { waitFor } from '@testing-library/react';

await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});
```

### Testing Error Handling
```typescript
const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

// Code that logs error

expect(consoleError).toHaveBeenCalled();
consoleError.mockRestore();
```

### Testing useCallback Stability
```typescript
const { result, rerender } = renderHook(() => useHook());

const initialCallback = result.current.callback;

// State change
act(() => result.current.setState(newValue));

// Callback should maintain reference
expect(result.current.callback).toBe(initialCallback);
```

## Debugging Tests

```bash
# Run single test
npm test -- -t "test name"

# Run with verbose output
npm test -- --reporter=verbose

# Run in debug mode
node --inspect-brk node_modules/.bin/vitest
```

## Coverage Reports

```bash
# Generate coverage
npm test -- --coverage

# View HTML report
open coverage/index.html
```

---

## Quick Tips

1. **Name tests descriptively**: "should load existing mappings from localStorage on mount"
2. **Test behavior, not implementation**: Focus on what the hook/component does, not how
3. **Keep tests simple**: One assertion per test when possible
4. **Use factories for test data**: Create helper functions for complex test objects
5. **Mock at the boundary**: Mock external systems (localStorage, APIs), not internal logic

## Example: Complete Hook Test

```typescript
describe('useCounter', () => {
  it('should increment count when increment is called', () => {
    // Arrange
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);

    // Act
    act(() => {
      result.current.increment();
    });

    // Assert
    expect(result.current.count).toBe(1);
  });

  it('should decrement count when decrement is called', () => {
    const { result } = renderHook(() => useCounter({ initialValue: 5 }));

    act(() => {
      result.current.decrement();
    });

    expect(result.current.count).toBe(4);
  });
});
```
