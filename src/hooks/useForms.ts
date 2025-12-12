import { useState, useEffect } from 'react';
import { Form, GlobalData, FormGraph } from '../types';
import { fetchFormBlueprint } from '../services/apiService';

interface UseFormsResult {
  /** Array of all forms */
  forms: Form[];
  /** Form graph for easy lookup */
  formGraph: FormGraph;
  /** Global data sources */
  globalData: GlobalData | null;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: Error | null;
  /** Refetch function */
  refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch and manage form data
 * Fetches the form blueprint from the API on mount
 *
 * @returns Object containing forms, loading state, and error state
 *
 * @example
 * function MyComponent() {
 *   const { forms, loading, error } = useForms();
 *
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *
 *   return <div>{forms.length} forms loaded</div>;
 * }
 */
export function useForms(): UseFormsResult {
  const [forms, setForms] = useState<Form[]>([]);
  const [formGraph, setFormGraph] = useState<FormGraph>({});
  const [globalData, setGlobalData] = useState<GlobalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadForms = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchFormBlueprint();

      setForms(data.forms);
      setGlobalData(data.globalData);

      // Create form graph for easy lookup
      const graph: FormGraph = {};
      data.forms.forEach(form => {
        graph[form.id] = form;
      });
      setFormGraph(graph);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch forms'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForms();
  }, []);

  return {
    forms,
    formGraph,
    globalData,
    loading,
    error,
    refetch: loadForms,
  };
}
