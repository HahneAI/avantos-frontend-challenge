import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePrefillMappings } from '../usePrefillMappings';
import { PrefillMapping } from '../../types';

/**
 * Comprehensive tests for usePrefillMappings hook
 * Tests localStorage persistence, CRUD operations, and edge cases
 */
describe('usePrefillMappings', () => {
  // Create a simple in-memory storage for testing
  let storage: { [key: string]: string } = {};

  beforeEach(() => {
    // Reset storage
    storage = {};

    // Mock localStorage methods to use our in-memory storage
    vi.mocked(localStorage.getItem).mockImplementation((key: string) => {
      return storage[key] || null;
    });

    vi.mocked(localStorage.setItem).mockImplementation((key: string, value: string) => {
      storage[key] = value;
    });

    vi.mocked(localStorage.removeItem).mockImplementation((key: string) => {
      delete storage[key];
    });

    vi.mocked(localStorage.clear).mockImplementation(() => {
      storage = {};
    });
  });

  afterEach(() => {
    // Clean up mocks
    vi.clearAllMocks();
  });

  describe('localStorage Persistence', () => {
    it('should load existing mappings from localStorage on mount', () => {
      const existingMappings: PrefillMapping[] = [
        {
          targetFormId: 'form-d',
          targetFieldId: 'email',
          sourceType: 'form',
          sourceFormId: 'form-a',
          sourceFieldId: 'email',
          sourcePath: 'Form A.Email',
        },
        {
          targetFormId: 'form-d',
          targetFieldId: 'name',
          sourceType: 'global',
          sourceFieldId: 'org_name',
          sourcePath: 'Organization.Org Name',
        },
      ];

      // Pre-populate our in-memory storage
      storage['prefill-mappings'] = JSON.stringify(existingMappings);

      const { result } = renderHook(() => usePrefillMappings());

      expect(result.current.mappings).toEqual(existingMappings);
      expect(result.current.mappings).toHaveLength(2);
    });

    it('should save mappings to localStorage when updated', () => {
      const { result } = renderHook(() => usePrefillMappings());

      const newMapping: PrefillMapping = {
        targetFormId: 'form-b',
        targetFieldId: 'completed_at',
        sourceType: 'global',
        sourceFieldId: 'created_at',
        sourcePath: 'Action.Created At',
      };

      act(() => {
        result.current.setMapping(newMapping);
      });

      // Check that storage was updated
      const storedData = storage['prefill-mappings'];
      expect(storedData).toBeDefined();
      const parsed = JSON.parse(storedData);
      expect(parsed).toEqual([newMapping]);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      // Set invalid JSON in storage
      storage['prefill-mappings'] = 'invalid-json-{[}]';

      const { result } = renderHook(() => usePrefillMappings());

      // Should initialize with empty array
      expect(result.current.mappings).toEqual([]);
      expect(result.current.mappings).toHaveLength(0);
    });

    it('should handle missing localStorage data gracefully', () => {
      // localStorage is empty (default state)
      const { result } = renderHook(() => usePrefillMappings());

      expect(result.current.mappings).toEqual([]);
      expect(result.current.mappings).toHaveLength(0);
    });

    it('should handle localStorage setItem errors gracefully', () => {
      // Spy on console.error before setting up the error
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock setItem to throw an error
      vi.mocked(localStorage.setItem).mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      const { result } = renderHook(() => usePrefillMappings());

      const newMapping: PrefillMapping = {
        targetFormId: 'form-a',
        targetFieldId: 'email',
        sourceType: 'global',
        sourceFieldId: 'assignee',
        sourcePath: 'Action.Assignee',
      };

      // Should not throw an error
      expect(() => {
        act(() => {
          result.current.setMapping(newMapping);
        });
      }).not.toThrow();

      // Mapping should still be in state even if localStorage fails
      expect(result.current.mappings).toContainEqual(newMapping);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('CRUD Operations', () => {
    it('should add new mapping with setMapping', () => {
      const { result } = renderHook(() => usePrefillMappings());

      const mapping: PrefillMapping = {
        targetFormId: 'form-d',
        targetFieldId: 'email',
        sourceType: 'form',
        sourceFormId: 'form-a',
        sourceFieldId: 'email',
        sourcePath: 'Form A.Email',
      };

      act(() => {
        result.current.setMapping(mapping);
      });

      expect(result.current.mappings).toContainEqual(mapping);
      expect(result.current.mappings).toHaveLength(1);
    });

    it('should update existing mapping for same field with setMapping', () => {
      const { result } = renderHook(() => usePrefillMappings());

      const initialMapping: PrefillMapping = {
        targetFormId: 'form-d',
        targetFieldId: 'email',
        sourceType: 'form',
        sourceFormId: 'form-a',
        sourceFieldId: 'email',
        sourcePath: 'Form A.Email',
      };

      const updatedMapping: PrefillMapping = {
        targetFormId: 'form-d',
        targetFieldId: 'email',
        sourceType: 'global',
        sourceFieldId: 'assignee',
        sourcePath: 'Action.Assignee',
      };

      act(() => {
        result.current.setMapping(initialMapping);
      });

      expect(result.current.mappings).toHaveLength(1);

      act(() => {
        result.current.setMapping(updatedMapping);
      });

      // Should have only one mapping (the updated one)
      expect(result.current.mappings).toHaveLength(1);
      expect(result.current.mappings[0]).toEqual(updatedMapping);
      expect(result.current.mappings).not.toContainEqual(initialMapping);
    });

    it('should retrieve correct mapping with getMapping', () => {
      const { result } = renderHook(() => usePrefillMappings());

      const mapping1: PrefillMapping = {
        targetFormId: 'form-d',
        targetFieldId: 'email',
        sourceType: 'form',
        sourceFormId: 'form-a',
        sourceFieldId: 'email',
        sourcePath: 'Form A.Email',
      };

      const mapping2: PrefillMapping = {
        targetFormId: 'form-d',
        targetFieldId: 'name',
        sourceType: 'global',
        sourceFieldId: 'org_name',
        sourcePath: 'Organization.Org Name',
      };

      act(() => {
        result.current.setMapping(mapping1);
        result.current.setMapping(mapping2);
      });

      const retrieved = result.current.getMapping('form-d', 'email');
      expect(retrieved).toEqual(mapping1);

      const retrieved2 = result.current.getMapping('form-d', 'name');
      expect(retrieved2).toEqual(mapping2);
    });

    it('should remove specific mapping with clearMapping', () => {
      const { result } = renderHook(() => usePrefillMappings());

      const mapping1: PrefillMapping = {
        targetFormId: 'form-d',
        targetFieldId: 'email',
        sourceType: 'form',
        sourceFormId: 'form-a',
        sourceFieldId: 'email',
        sourcePath: 'Form A.Email',
      };

      const mapping2: PrefillMapping = {
        targetFormId: 'form-d',
        targetFieldId: 'name',
        sourceType: 'global',
        sourceFieldId: 'org_name',
        sourcePath: 'Organization.Org Name',
      };

      act(() => {
        result.current.setMapping(mapping1);
        result.current.setMapping(mapping2);
      });

      expect(result.current.mappings).toHaveLength(2);

      act(() => {
        result.current.clearMapping('form-d', 'email');
      });

      expect(result.current.mappings).toHaveLength(1);
      expect(result.current.mappings).toContainEqual(mapping2);
      expect(result.current.mappings).not.toContainEqual(mapping1);
    });

    it('should remove all mappings for a form with clearAllMappingsForForm', () => {
      const { result } = renderHook(() => usePrefillMappings());

      const mappingD1: PrefillMapping = {
        targetFormId: 'form-d',
        targetFieldId: 'email',
        sourceType: 'form',
        sourceFormId: 'form-a',
        sourceFieldId: 'email',
        sourcePath: 'Form A.Email',
      };

      const mappingD2: PrefillMapping = {
        targetFormId: 'form-d',
        targetFieldId: 'name',
        sourceType: 'global',
        sourceFieldId: 'org_name',
        sourcePath: 'Organization.Org Name',
      };

      const mappingB: PrefillMapping = {
        targetFormId: 'form-b',
        targetFieldId: 'completed_at',
        sourceType: 'global',
        sourceFieldId: 'created_at',
        sourcePath: 'Action.Created At',
      };

      act(() => {
        result.current.setMapping(mappingD1);
        result.current.setMapping(mappingD2);
        result.current.setMapping(mappingB);
      });

      expect(result.current.mappings).toHaveLength(3);

      act(() => {
        result.current.clearAllMappingsForForm('form-d');
      });

      expect(result.current.mappings).toHaveLength(1);
      expect(result.current.mappings).toContainEqual(mappingB);
      expect(result.current.mappings).not.toContainEqual(mappingD1);
      expect(result.current.mappings).not.toContainEqual(mappingD2);
    });

    it('should return all mappings for a specific form with getMappingsForForm', () => {
      const { result } = renderHook(() => usePrefillMappings());

      const mappingD1: PrefillMapping = {
        targetFormId: 'form-d',
        targetFieldId: 'email',
        sourceType: 'form',
        sourceFormId: 'form-a',
        sourceFieldId: 'email',
        sourcePath: 'Form A.Email',
      };

      const mappingD2: PrefillMapping = {
        targetFormId: 'form-d',
        targetFieldId: 'name',
        sourceType: 'global',
        sourceFieldId: 'org_name',
        sourcePath: 'Organization.Org Name',
      };

      const mappingB: PrefillMapping = {
        targetFormId: 'form-b',
        targetFieldId: 'completed_at',
        sourceType: 'global',
        sourceFieldId: 'created_at',
        sourcePath: 'Action.Created At',
      };

      act(() => {
        result.current.setMapping(mappingD1);
        result.current.setMapping(mappingD2);
        result.current.setMapping(mappingB);
      });

      const formDMappings = result.current.getMappingsForForm('form-d');
      expect(formDMappings).toHaveLength(2);
      expect(formDMappings).toContainEqual(mappingD1);
      expect(formDMappings).toContainEqual(mappingD2);
      expect(formDMappings).not.toContainEqual(mappingB);
    });

    it('should clear all mappings with clearAllMappings', () => {
      const { result } = renderHook(() => usePrefillMappings());

      const mapping1: PrefillMapping = {
        targetFormId: 'form-d',
        targetFieldId: 'email',
        sourceType: 'form',
        sourceFormId: 'form-a',
        sourceFieldId: 'email',
        sourcePath: 'Form A.Email',
      };

      const mapping2: PrefillMapping = {
        targetFormId: 'form-b',
        targetFieldId: 'completed_at',
        sourceType: 'global',
        sourceFieldId: 'created_at',
        sourcePath: 'Action.Created At',
      };

      act(() => {
        result.current.setMapping(mapping1);
        result.current.setMapping(mapping2);
      });

      expect(result.current.mappings).toHaveLength(2);

      act(() => {
        result.current.clearAllMappings();
      });

      expect(result.current.mappings).toHaveLength(0);
      expect(result.current.mappings).toEqual([]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle non-existent form IDs in getMapping', () => {
      const { result } = renderHook(() => usePrefillMappings());

      const mapping: PrefillMapping = {
        targetFormId: 'form-d',
        targetFieldId: 'email',
        sourceType: 'form',
        sourceFormId: 'form-a',
        sourceFieldId: 'email',
        sourcePath: 'Form A.Email',
      };

      act(() => {
        result.current.setMapping(mapping);
      });

      const nonExistent = result.current.getMapping('non-existent-form', 'email');
      expect(nonExistent).toBeUndefined();
    });

    it('should handle non-existent field IDs in getMapping', () => {
      const { result } = renderHook(() => usePrefillMappings());

      const mapping: PrefillMapping = {
        targetFormId: 'form-d',
        targetFieldId: 'email',
        sourceType: 'form',
        sourceFormId: 'form-a',
        sourceFieldId: 'email',
        sourcePath: 'Form A.Email',
      };

      act(() => {
        result.current.setMapping(mapping);
      });

      const nonExistent = result.current.getMapping('form-d', 'non-existent-field');
      expect(nonExistent).toBeUndefined();
    });

    it('should return empty array when no mappings exist for getMappingsForForm', () => {
      const { result } = renderHook(() => usePrefillMappings());

      const mappingsForEmptyForm = result.current.getMappingsForForm('form-a');
      expect(mappingsForEmptyForm).toEqual([]);
      expect(mappingsForEmptyForm).toHaveLength(0);
    });

    it('should handle clearing non-existent mapping gracefully', () => {
      const { result } = renderHook(() => usePrefillMappings());

      const mapping: PrefillMapping = {
        targetFormId: 'form-d',
        targetFieldId: 'email',
        sourceType: 'form',
        sourceFormId: 'form-a',
        sourceFieldId: 'email',
        sourcePath: 'Form A.Email',
      };

      act(() => {
        result.current.setMapping(mapping);
      });

      expect(result.current.mappings).toHaveLength(1);

      // Clear a non-existent mapping
      act(() => {
        result.current.clearMapping('form-b', 'non-existent-field');
      });

      // Original mapping should still exist
      expect(result.current.mappings).toHaveLength(1);
      expect(result.current.mappings).toContainEqual(mapping);
    });

    it('should handle clearing all mappings for non-existent form gracefully', () => {
      const { result } = renderHook(() => usePrefillMappings());

      const mapping: PrefillMapping = {
        targetFormId: 'form-d',
        targetFieldId: 'email',
        sourceType: 'form',
        sourceFormId: 'form-a',
        sourceFieldId: 'email',
        sourcePath: 'Form A.Email',
      };

      act(() => {
        result.current.setMapping(mapping);
      });

      expect(result.current.mappings).toHaveLength(1);

      // Clear mappings for non-existent form
      act(() => {
        result.current.clearAllMappingsForForm('non-existent-form');
      });

      // Original mapping should still exist
      expect(result.current.mappings).toHaveLength(1);
      expect(result.current.mappings).toContainEqual(mapping);
    });

    it('should handle multiple mappings to the same source field', () => {
      const { result } = renderHook(() => usePrefillMappings());

      const mappingD: PrefillMapping = {
        targetFormId: 'form-d',
        targetFieldId: 'email',
        sourceType: 'form',
        sourceFormId: 'form-a',
        sourceFieldId: 'email',
        sourcePath: 'Form A.Email',
      };

      const mappingB: PrefillMapping = {
        targetFormId: 'form-b',
        targetFieldId: 'user_email',
        sourceType: 'form',
        sourceFormId: 'form-a',
        sourceFieldId: 'email',
        sourcePath: 'Form A.Email',
      };

      act(() => {
        result.current.setMapping(mappingD);
        result.current.setMapping(mappingB);
      });

      // Both should exist (same source, different targets)
      expect(result.current.mappings).toHaveLength(2);
      expect(result.current.mappings).toContainEqual(mappingD);
      expect(result.current.mappings).toContainEqual(mappingB);
    });
  });

  describe('Function Stability (useCallback)', () => {
    it('should maintain stable function references between renders', () => {
      const { result, rerender } = renderHook(() => usePrefillMappings());

      const initialGetMapping = result.current.getMapping;
      const initialSetMapping = result.current.setMapping;
      const initialClearMapping = result.current.clearMapping;
      const initialGetMappingsForForm = result.current.getMappingsForForm;
      const initialClearAllMappingsForForm = result.current.clearAllMappingsForForm;
      const initialClearAllMappings = result.current.clearAllMappings;

      // Trigger a state change
      act(() => {
        result.current.setMapping({
          targetFormId: 'form-a',
          targetFieldId: 'email',
          sourceType: 'global',
          sourceFieldId: 'assignee',
          sourcePath: 'Action.Assignee',
        });
      });

      rerender();

      // Functions should maintain their references (useCallback working)
      expect(result.current.setMapping).toBe(initialSetMapping);
      expect(result.current.clearMapping).toBe(initialClearMapping);
      expect(result.current.clearAllMappingsForForm).toBe(initialClearAllMappingsForForm);
      expect(result.current.clearAllMappings).toBe(initialClearAllMappings);

      // These depend on mappings state, so they should update
      expect(result.current.getMapping).not.toBe(initialGetMapping);
      expect(result.current.getMappingsForForm).not.toBe(initialGetMappingsForForm);
    });
  });
});
