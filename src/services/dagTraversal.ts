import { FormGraph } from '../types';

/**
 * Finds all forms that a target form depends on (both direct and transitive)
 * Uses breadth-first search (BFS) to traverse the dependency graph
 *
 * @param targetFormId - The form to find dependencies for
 * @param formGraph - The complete graph of all forms
 * @returns Set of form IDs that the target depends on (excluding itself)
 *
 * @example
 * // If Form D depends on Form B, which depends on Form A:
 * getDependencies('form-d', graph) // Returns Set(['form-b', 'form-a'])
 */
export function getDependencies(
  targetFormId: string,
  formGraph: FormGraph
): Set<string> {
  const dependencies = new Set<string>();
  const queue: string[] = [targetFormId];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const currentFormId = queue.shift()!;

    // Skip if already visited to prevent infinite loops
    if (visited.has(currentFormId)) {
      continue;
    }
    visited.add(currentFormId);

    const currentForm = formGraph[currentFormId];
    if (!currentForm) {
      continue;
    }

    // Add all direct dependencies
    currentForm.dependencies.forEach(depId => {
      dependencies.add(depId);
      queue.push(depId);
    });
  }

  return dependencies;
}

/**
 * Finds only the direct dependencies of a form (one level deep)
 *
 * @param targetFormId - The form to find direct dependencies for
 * @param formGraph - The complete graph of all forms
 * @returns Set of form IDs that the target directly depends on
 *
 * @example
 * // If Form D depends on Form B (which depends on Form A):
 * getDirectDependencies('form-d', graph) // Returns Set(['form-b'])
 */
export function getDirectDependencies(
  targetFormId: string,
  formGraph: FormGraph
): Set<string> {
  const form = formGraph[targetFormId];
  if (!form) {
    return new Set();
  }

  return new Set(form.dependencies);
}

/**
 * Finds only the transitive dependencies of a form (excluding direct ones)
 *
 * @param targetFormId - The form to find transitive dependencies for
 * @param formGraph - The complete graph of all forms
 * @returns Set of form IDs that the target transitively depends on
 *
 * @example
 * // If Form D depends on Form B, which depends on Form A:
 * getTransitiveDependencies('form-d', graph) // Returns Set(['form-a'])
 */
export function getTransitiveDependencies(
  targetFormId: string,
  formGraph: FormGraph
): Set<string> {
  const allDependencies = getDependencies(targetFormId, formGraph);
  const directDependencies = getDirectDependencies(targetFormId, formGraph);

  // Remove direct dependencies to get only transitive ones
  directDependencies.forEach(depId => {
    allDependencies.delete(depId);
  });

  return allDependencies;
}

/**
 * Detects if there are any circular dependencies in the graph
 *
 * @param formGraph - The complete graph of all forms
 * @returns true if circular dependencies exist, false otherwise
 */
export function hasCircularDependencies(formGraph: FormGraph): boolean {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function hasCycle(formId: string): boolean {
    visited.add(formId);
    recursionStack.add(formId);

    const form = formGraph[formId];
    if (!form) {
      recursionStack.delete(formId);
      return false;
    }

    for (const depId of form.dependencies) {
      if (!visited.has(depId)) {
        if (hasCycle(depId)) {
          return true;
        }
      } else if (recursionStack.has(depId)) {
        return true;
      }
    }

    recursionStack.delete(formId);
    return false;
  }

  for (const formId of Object.keys(formGraph)) {
    if (!visited.has(formId)) {
      if (hasCycle(formId)) {
        return true;
      }
    }
  }

  return false;
}
