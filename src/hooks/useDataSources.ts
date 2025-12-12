import { useMemo } from 'react';
import { FormGraph, GlobalData, CategorizedDataSources } from '../types';
import {
  DataSourceRegistry,
  FormDataSource,
  GlobalDataSource,
  OrganizationDataSource,
} from '../services/dataSourceRegistry';
import {
  getDirectDependencies,
  getTransitiveDependencies,
} from '../services/dagTraversal';

/**
 * Custom hook to get available data sources for a target form
 * Categorizes sources into direct dependencies, transitive dependencies, and global sources
 *
 * @param targetFormId - The form to get data sources for
 * @param formGraph - The complete form graph
 * @param globalData - Global data sources
 * @returns Categorized data sources
 *
 * @example
 * function MyComponent() {
 *   const { formGraph, globalData } = useForms();
 *   const dataSources = useDataSources('form-d', formGraph, globalData);
 *
 *   console.log(dataSources.directDependencies); // [Form B]
 *   console.log(dataSources.transitiveDependencies); // [Form A]
 *   console.log(dataSources.globalSources); // [Action Props, Org Props]
 * }
 */
export function useDataSources(
  targetFormId: string | null,
  formGraph: FormGraph,
  globalData: GlobalData | null
): CategorizedDataSources {
  return useMemo(() => {
    const registry = new DataSourceRegistry();

    // If no form is selected, return empty sources
    if (!targetFormId) {
      return {
        directDependencies: [],
        transitiveDependencies: [],
        globalSources: [],
      };
    }

    // Register all forms as data sources
    Object.values(formGraph).forEach(form => {
      registry.register(new FormDataSource(form.id, form.name, form));
    });

    // Register global data sources
    if (globalData) {
      registry.register(new GlobalDataSource(globalData));
      registry.register(new OrganizationDataSource(globalData));
    }

    // Get dependencies for the target form
    const directDeps = getDirectDependencies(targetFormId, formGraph);
    const transitiveDeps = getTransitiveDependencies(targetFormId, formGraph);

    // Categorize data sources
    const directDependencies = Array.from(directDeps)
      .map(depId => registry.get(depId))
      .filter((source): source is NonNullable<typeof source> => source !== undefined);

    const transitiveDependencies = Array.from(transitiveDeps)
      .map(depId => registry.get(depId))
      .filter((source): source is NonNullable<typeof source> => source !== undefined);

    const globalSources = registry.getByType('global');

    return {
      directDependencies,
      transitiveDependencies,
      globalSources,
    };
  }, [targetFormId, formGraph, globalData]);
}
