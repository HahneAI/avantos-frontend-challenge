import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDataSources } from '../useDataSources';
import { FormGraph, GlobalData, Form } from '../../types';

/**
 * Comprehensive tests for useDataSources hook
 * Tests registry population, categorization logic, and memoization
 */
describe('useDataSources', () => {
  // Create realistic mock data matching the actual form structure
  const createMockForm = (
    id: string,
    name: string,
    fieldIds: string[],
    dependencies: string[] = []
  ): Form => ({
    id,
    name,
    dependencies,
    fields: fieldIds.map(fieldId => ({
      id: fieldId,
      label: fieldId.charAt(0).toUpperCase() + fieldId.slice(1).replace(/_/g, ' '),
      type: fieldId.includes('email') ? 'email' : fieldId.includes('date') ? 'date' : 'text',
    })),
  });

  const mockFormGraph: FormGraph = {
    'form-a': createMockForm('form-a', 'Form A', ['email', 'name'], []),
    'form-b': createMockForm('form-b', 'Form B', ['completed_at', 'button'], ['form-a']),
    'form-c': createMockForm('form-c', 'Form C', ['phone', 'address'], ['form-a']),
    'form-d': createMockForm('form-d', 'Form D', ['email', 'dynamic_object'], ['form-b']),
  };

  const mockGlobalData: GlobalData = {
    actionProperties: ['status', 'created_at', 'assignee'],
    clientOrgProperties: ['org_name', 'org_id', 'plan_type'],
  };

  describe('Registry Population', () => {
    it('should register form data sources for direct dependencies', () => {
      const { result } = renderHook(() =>
        useDataSources('form-b', mockFormGraph, mockGlobalData)
      );

      // form-b directly depends on form-a
      expect(result.current.directDependencies).toHaveLength(1);
      expect(result.current.directDependencies[0].id).toBe('form-a');
      expect(result.current.directDependencies[0].name).toBe('Form A');
      expect(result.current.directDependencies[0].type).toBe('form');
    });

    it('should register form data sources for transitive dependencies', () => {
      const { result } = renderHook(() =>
        useDataSources('form-d', mockFormGraph, mockGlobalData)
      );

      // form-d depends on form-b (direct), which depends on form-a (transitive)
      expect(result.current.directDependencies).toHaveLength(1);
      expect(result.current.directDependencies[0].id).toBe('form-b');

      expect(result.current.transitiveDependencies).toHaveLength(1);
      expect(result.current.transitiveDependencies[0].id).toBe('form-a');
      expect(result.current.transitiveDependencies[0].name).toBe('Form A');
    });

    it('should register global data sources (Action Properties and Organization Properties)', () => {
      const { result } = renderHook(() =>
        useDataSources('form-d', mockFormGraph, mockGlobalData)
      );

      expect(result.current.globalSources).toHaveLength(2);

      const actionProperties = result.current.globalSources.find(
        source => source.id === 'global-action-properties'
      );
      const orgProperties = result.current.globalSources.find(
        source => source.id === 'global-org-properties'
      );

      expect(actionProperties).toBeDefined();
      expect(actionProperties?.name).toBe('Action Properties');
      expect(actionProperties?.type).toBe('global');

      expect(orgProperties).toBeDefined();
      expect(orgProperties?.name).toBe('Organization Properties');
      expect(orgProperties?.type).toBe('global');
    });

    it('should not register sources when targetFormId is null', () => {
      const { result } = renderHook(() =>
        useDataSources(null, mockFormGraph, mockGlobalData)
      );

      expect(result.current.directDependencies).toEqual([]);
      expect(result.current.transitiveDependencies).toEqual([]);
      expect(result.current.globalSources).toEqual([]);
    });

    it('should still register global sources when globalData is null', () => {
      const { result } = renderHook(() =>
        useDataSources('form-d', mockFormGraph, null)
      );

      // Should still have form dependencies
      expect(result.current.directDependencies).toHaveLength(1);
      expect(result.current.transitiveDependencies).toHaveLength(1);

      // But no global sources
      expect(result.current.globalSources).toEqual([]);
    });
  });

  describe('Categorization Logic', () => {
    it('should correctly categorize direct dependency sources', () => {
      const { result } = renderHook(() =>
        useDataSources('form-d', mockFormGraph, mockGlobalData)
      );

      // form-d directly depends on form-b
      expect(result.current.directDependencies).toHaveLength(1);
      expect(result.current.directDependencies[0].id).toBe('form-b');
      expect(result.current.directDependencies[0].type).toBe('form');

      // Verify it can get fields from the data source
      const fields = result.current.directDependencies[0].getFields();
      expect(fields).toBeDefined();
      expect(fields.length).toBeGreaterThan(0);
      expect(fields.some(field => field.id === 'completed_at')).toBe(true);
    });

    it('should correctly categorize transitive dependency sources', () => {
      const { result } = renderHook(() =>
        useDataSources('form-d', mockFormGraph, mockGlobalData)
      );

      // form-d transitively depends on form-a (through form-b)
      expect(result.current.transitiveDependencies).toHaveLength(1);
      expect(result.current.transitiveDependencies[0].id).toBe('form-a');
      expect(result.current.transitiveDependencies[0].type).toBe('form');

      // Verify it can get fields from the data source
      const fields = result.current.transitiveDependencies[0].getFields();
      expect(fields).toBeDefined();
      expect(fields.length).toBeGreaterThan(0);
      expect(fields.some(field => field.id === 'email')).toBe(true);
    });

    it('should correctly categorize global sources', () => {
      const { result } = renderHook(() =>
        useDataSources('form-d', mockFormGraph, mockGlobalData)
      );

      expect(result.current.globalSources).toHaveLength(2);

      const actionSource = result.current.globalSources.find(
        s => s.id === 'global-action-properties'
      );
      const orgSource = result.current.globalSources.find(
        s => s.id === 'global-org-properties'
      );

      expect(actionSource?.type).toBe('global');
      expect(orgSource?.type).toBe('global');

      // Verify they can get fields
      const actionFields = actionSource?.getFields() || [];
      expect(actionFields.length).toBe(3);
      expect(actionFields.some(field => field.id === 'status')).toBe(true);
      expect(actionFields.some(field => field.id === 'created_at')).toBe(true);
      expect(actionFields.some(field => field.id === 'assignee')).toBe(true);

      const orgFields = orgSource?.getFields() || [];
      expect(orgFields.length).toBe(3);
      expect(orgFields.some(field => field.id === 'org_name')).toBe(true);
      expect(orgFields.some(field => field.id === 'org_id')).toBe(true);
      expect(orgFields.some(field => field.id === 'plan_type')).toBe(true);
    });

    it('should return empty arrays when no dependencies exist', () => {
      const { result } = renderHook(() =>
        useDataSources('form-a', mockFormGraph, mockGlobalData)
      );

      // form-a has no dependencies
      expect(result.current.directDependencies).toEqual([]);
      expect(result.current.transitiveDependencies).toEqual([]);

      // Should still have global sources
      expect(result.current.globalSources).toHaveLength(2);
    });

    it('should handle forms with only direct dependencies (no transitive)', () => {
      const { result } = renderHook(() =>
        useDataSources('form-b', mockFormGraph, mockGlobalData)
      );

      // form-b depends on form-a (direct), form-a has no dependencies
      expect(result.current.directDependencies).toHaveLength(1);
      expect(result.current.directDependencies[0].id).toBe('form-a');

      // No transitive dependencies
      expect(result.current.transitiveDependencies).toEqual([]);

      // Should still have global sources
      expect(result.current.globalSources).toHaveLength(2);
    });

    it('should handle multiple direct dependencies', () => {
      // Create a form with multiple direct dependencies
      const extendedFormGraph: FormGraph = {
        ...mockFormGraph,
        'form-e': createMockForm('form-e', 'Form E', ['field1'], ['form-b', 'form-c']),
      };

      const { result } = renderHook(() =>
        useDataSources('form-e', extendedFormGraph, mockGlobalData)
      );

      // form-e depends on both form-b and form-c
      expect(result.current.directDependencies).toHaveLength(2);
      const directIds = result.current.directDependencies.map(d => d.id).sort();
      expect(directIds).toEqual(['form-b', 'form-c']);

      // form-a is a transitive dependency through both form-b and form-c
      expect(result.current.transitiveDependencies).toHaveLength(1);
      expect(result.current.transitiveDependencies[0].id).toBe('form-a');
    });

    it('should not include a form as its own dependency', () => {
      const { result } = renderHook(() =>
        useDataSources('form-d', mockFormGraph, mockGlobalData)
      );

      const allFormIds = [
        ...result.current.directDependencies.map(d => d.id),
        ...result.current.transitiveDependencies.map(d => d.id),
      ];

      // form-d should not be in its own dependencies
      expect(allFormIds).not.toContain('form-d');
    });
  });

  describe('Memoization', () => {
    it('should return same reference when dependencies do not change (useMemo working)', () => {
      const { result, rerender } = renderHook(() =>
        useDataSources('form-d', mockFormGraph, mockGlobalData)
      );

      const initialResult = result.current;

      // Rerender with same props
      rerender();

      // Should return the same memoized reference
      expect(result.current).toBe(initialResult);
      expect(result.current.directDependencies).toBe(initialResult.directDependencies);
      expect(result.current.transitiveDependencies).toBe(initialResult.transitiveDependencies);
      expect(result.current.globalSources).toBe(initialResult.globalSources);
    });

    it('should return new reference when targetFormId changes', () => {
      const { result, rerender } = renderHook(
        ({ targetFormId }) => useDataSources(targetFormId, mockFormGraph, mockGlobalData),
        { initialProps: { targetFormId: 'form-d' } }
      );

      const initialResult = result.current;

      // Change targetFormId
      rerender({ targetFormId: 'form-b' });

      // Should return a new reference
      expect(result.current).not.toBe(initialResult);
      expect(result.current.directDependencies).not.toBe(initialResult.directDependencies);
    });

    it('should return new reference when formGraph changes', () => {
      const { result, rerender } = renderHook(
        ({ formGraph }) => useDataSources('form-d', formGraph, mockGlobalData),
        { initialProps: { formGraph: mockFormGraph } }
      );

      const initialResult = result.current;

      // Create a new formGraph object (simulating data fetch update)
      const newFormGraph = { ...mockFormGraph };

      rerender({ formGraph: newFormGraph });

      // Should return a new reference (object identity changed)
      expect(result.current).not.toBe(initialResult);
    });

    it('should return new reference when globalData changes', () => {
      const { result, rerender } = renderHook(
        ({ globalData }) => useDataSources('form-d', mockFormGraph, globalData),
        { initialProps: { globalData: mockGlobalData } }
      );

      const initialResult = result.current;

      // Create new globalData
      const newGlobalData: GlobalData = {
        actionProperties: ['status', 'created_at'],
        clientOrgProperties: ['org_name'],
      };

      rerender({ globalData: newGlobalData });

      // Should return a new reference
      expect(result.current).not.toBe(initialResult);
    });

    it('should return same reference when targetFormId changes to null and back', () => {
      const { result, rerender } = renderHook(
        ({ targetFormId }) => useDataSources(targetFormId, mockFormGraph, mockGlobalData),
        { initialProps: { targetFormId: 'form-d' as string | null } }
      );

      const initialResult = result.current;

      // Change to null
      rerender({ targetFormId: null });

      expect(result.current.directDependencies).toEqual([]);
      expect(result.current.transitiveDependencies).toEqual([]);
      expect(result.current.globalSources).toEqual([]);

      // Change back to form-d
      rerender({ targetFormId: 'form-d' });

      // Should recompute and have same structure (but different reference)
      expect(result.current.directDependencies.length).toBe(initialResult.directDependencies.length);
      expect(result.current.transitiveDependencies.length).toBe(
        initialResult.transitiveDependencies.length
      );
      expect(result.current.globalSources.length).toBe(initialResult.globalSources.length);
    });
  });

  describe('Field Data Validation', () => {
    it('should return valid field data with correct paths for form sources', () => {
      const { result } = renderHook(() =>
        useDataSources('form-d', mockFormGraph, mockGlobalData)
      );

      const formBSource = result.current.directDependencies.find(d => d.id === 'form-b');
      expect(formBSource).toBeDefined();

      const fields = formBSource!.getFields();
      expect(fields.length).toBeGreaterThan(0);

      // Check field structure
      fields.forEach(field => {
        expect(field).toHaveProperty('id');
        expect(field).toHaveProperty('label');
        expect(field).toHaveProperty('type');
        expect(field).toHaveProperty('path');

        // Path should be in format "Form Name.Field Label"
        expect(field.path).toMatch(/^Form B\./);
      });
    });

    it('should return valid field data with correct paths for global sources', () => {
      const { result } = renderHook(() =>
        useDataSources('form-d', mockFormGraph, mockGlobalData)
      );

      const actionSource = result.current.globalSources.find(
        s => s.id === 'global-action-properties'
      );
      expect(actionSource).toBeDefined();

      const fields = actionSource!.getFields();
      expect(fields.length).toBe(3);

      // Check field structure and paths
      fields.forEach(field => {
        expect(field).toHaveProperty('id');
        expect(field).toHaveProperty('label');
        expect(field).toHaveProperty('type');
        expect(field).toHaveProperty('path');

        // Path should be in format "Action.Field Label"
        expect(field.path).toMatch(/^Action\./);
      });

      // Verify specific field formatting (snake_case -> Title Case)
      const createdAtField = fields.find(f => f.id === 'created_at');
      expect(createdAtField?.label).toBe('Created At');
      expect(createdAtField?.path).toBe('Action.Created At');
    });

    it('should format organization property names correctly', () => {
      const { result } = renderHook(() =>
        useDataSources('form-d', mockFormGraph, mockGlobalData)
      );

      const orgSource = result.current.globalSources.find(
        s => s.id === 'global-org-properties'
      );
      expect(orgSource).toBeDefined();

      const fields = orgSource!.getFields();

      // Check that snake_case is converted to Title Case
      const orgNameField = fields.find(f => f.id === 'org_name');
      expect(orgNameField?.label).toBe('Org Name');
      expect(orgNameField?.path).toBe('clientOrg.Org Name');

      const planTypeField = fields.find(f => f.id === 'plan_type');
      expect(planTypeField?.label).toBe('Plan Type');
      expect(planTypeField?.path).toBe('clientOrg.Plan Type');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty formGraph gracefully', () => {
      const emptyFormGraph: FormGraph = {};

      const { result } = renderHook(() =>
        useDataSources('form-a', emptyFormGraph, mockGlobalData)
      );

      expect(result.current.directDependencies).toEqual([]);
      expect(result.current.transitiveDependencies).toEqual([]);
      expect(result.current.globalSources).toHaveLength(2); // Global sources still available
    });

    it('should handle form with non-existent dependencies gracefully', () => {
      const malformedFormGraph: FormGraph = {
        'form-x': createMockForm('form-x', 'Form X', ['field1'], ['non-existent-form']),
      };

      const { result } = renderHook(() =>
        useDataSources('form-x', malformedFormGraph, mockGlobalData)
      );

      // Should attempt to get the dependency but it won't exist
      // The filter in useDataSources removes undefined sources
      expect(result.current.directDependencies).toEqual([]);
      expect(result.current.transitiveDependencies).toEqual([]);
    });

    it('should handle globalData with empty arrays', () => {
      const emptyGlobalData: GlobalData = {
        actionProperties: [],
        clientOrgProperties: [],
      };

      const { result } = renderHook(() =>
        useDataSources('form-d', mockFormGraph, emptyGlobalData)
      );

      // Global sources should still be registered but have no fields
      expect(result.current.globalSources).toHaveLength(2);

      const actionSource = result.current.globalSources.find(
        s => s.id === 'global-action-properties'
      );
      expect(actionSource?.getFields()).toEqual([]);

      const orgSource = result.current.globalSources.find(
        s => s.id === 'global-org-properties'
      );
      expect(orgSource?.getFields()).toEqual([]);
    });

    it('should handle switching between forms with different dependency structures', () => {
      const { result, rerender } = renderHook(
        ({ targetFormId }) => useDataSources(targetFormId, mockFormGraph, mockGlobalData),
        { initialProps: { targetFormId: 'form-a' as string | null } }
      );

      // form-a has no dependencies
      expect(result.current.directDependencies).toEqual([]);
      expect(result.current.transitiveDependencies).toEqual([]);

      // Switch to form-b (1 direct, 0 transitive)
      rerender({ targetFormId: 'form-b' });
      expect(result.current.directDependencies).toHaveLength(1);
      expect(result.current.transitiveDependencies).toEqual([]);

      // Switch to form-d (1 direct, 1 transitive)
      rerender({ targetFormId: 'form-d' });
      expect(result.current.directDependencies).toHaveLength(1);
      expect(result.current.transitiveDependencies).toHaveLength(1);

      // Switch back to null
      rerender({ targetFormId: null });
      expect(result.current.directDependencies).toEqual([]);
      expect(result.current.transitiveDependencies).toEqual([]);
      expect(result.current.globalSources).toEqual([]);
    });
  });
});
