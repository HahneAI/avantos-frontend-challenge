import { useState, useEffect, useCallback } from 'react';
import { PrefillMapping } from '../types';

const STORAGE_KEY = 'prefill-mappings';

interface UsePrefillMappingsResult {
  /** All prefill mappings */
  mappings: PrefillMapping[];
  /** Get mappings for a specific form */
  getMappingsForForm: (formId: string) => PrefillMapping[];
  /** Get a specific mapping for a form field */
  getMapping: (formId: string, fieldId: string) => PrefillMapping | undefined;
  /** Set a mapping for a form field */
  setMapping: (mapping: PrefillMapping) => void;
  /** Clear a mapping for a form field */
  clearMapping: (formId: string, fieldId: string) => void;
  /** Clear all mappings for a form */
  clearAllMappingsForForm: (formId: string) => void;
  /** Clear all mappings */
  clearAllMappings: () => void;
}

/**
 * Custom hook to manage prefill mappings
 * Persists mappings to localStorage for demo purposes
 *
 * @returns Object with mappings and functions to manage them
 *
 * @example
 * function MyComponent() {
 *   const { mappings, setMapping, clearMapping } = usePrefillMappings();
 *
 *   const handleSetMapping = () => {
 *     setMapping({
 *       targetFormId: 'form-d',
 *       targetFieldId: 'email',
 *       sourceType: 'form',
 *       sourceFormId: 'form-a',
 *       sourceFieldId: 'email',
 *       sourcePath: 'Form A.Email',
 *     });
 *   };
 * }
 */
export function usePrefillMappings(): UsePrefillMappingsResult {
  const [mappings, setMappings] = useState<PrefillMapping[]>(() => {
    // Load from localStorage on mount
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persist to localStorage whenever mappings change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mappings));
    } catch (err) {
      console.error('Failed to save mappings to localStorage:', err);
    }
  }, [mappings]);

  /**
   * Get all mappings for a specific form
   */
  const getMappingsForForm = useCallback(
    (formId: string): PrefillMapping[] => {
      return mappings.filter(m => m.targetFormId === formId);
    },
    [mappings]
  );

  /**
   * Get a specific mapping for a form field
   */
  const getMapping = useCallback(
    (formId: string, fieldId: string): PrefillMapping | undefined => {
      return mappings.find(
        m => m.targetFormId === formId && m.targetFieldId === fieldId
      );
    },
    [mappings]
  );

  /**
   * Set a mapping for a form field
   * Replaces existing mapping if one exists
   */
  const setMapping = useCallback((mapping: PrefillMapping) => {
    setMappings(prev => {
      // Remove existing mapping for this field if it exists
      const filtered = prev.filter(
        m =>
          !(
            m.targetFormId === mapping.targetFormId &&
            m.targetFieldId === mapping.targetFieldId
          )
      );
      return [...filtered, mapping];
    });
  }, []);

  /**
   * Clear a specific mapping
   */
  const clearMapping = useCallback((formId: string, fieldId: string) => {
    setMappings(prev =>
      prev.filter(
        m => !(m.targetFormId === formId && m.targetFieldId === fieldId)
      )
    );
  }, []);

  /**
   * Clear all mappings for a form
   */
  const clearAllMappingsForForm = useCallback((formId: string) => {
    setMappings(prev => prev.filter(m => m.targetFormId !== formId));
  }, []);

  /**
   * Clear all mappings
   */
  const clearAllMappings = useCallback(() => {
    setMappings([]);
  }, []);

  return {
    mappings,
    getMappingsForForm,
    getMapping,
    setMapping,
    clearMapping,
    clearAllMappingsForForm,
    clearAllMappings,
  };
}
