import { describe, it, expect } from 'vitest';
import {
  getDependencies,
  getDirectDependencies,
  getTransitiveDependencies,
  hasCircularDependencies,
} from '../dagTraversal';
import { FormGraph } from '../../types';

describe('dagTraversal', () => {
  const mockFormGraph: FormGraph = {
    'form-a': {
      id: 'form-a',
      name: 'Form A',
      fields: [],
      dependencies: [],
    },
    'form-b': {
      id: 'form-b',
      name: 'Form B',
      fields: [],
      dependencies: ['form-a'],
    },
    'form-c': {
      id: 'form-c',
      name: 'Form C',
      fields: [],
      dependencies: ['form-a'],
    },
    'form-d': {
      id: 'form-d',
      name: 'Form D',
      fields: [],
      dependencies: ['form-b'],
    },
    'form-e': {
      id: 'form-e',
      name: 'Form E',
      fields: [],
      dependencies: ['form-c', 'form-d'],
    },
  };

  describe('getDependencies', () => {
    it('should return empty set for form with no dependencies', () => {
      const deps = getDependencies('form-a', mockFormGraph);
      expect(deps.size).toBe(0);
    });

    it('should return direct dependencies', () => {
      const deps = getDependencies('form-b', mockFormGraph);
      expect(deps.has('form-a')).toBe(true);
      expect(deps.size).toBe(1);
    });

    it('should return both direct and transitive dependencies', () => {
      const deps = getDependencies('form-d', mockFormGraph);
      expect(deps.has('form-b')).toBe(true);
      expect(deps.has('form-a')).toBe(true);
      expect(deps.size).toBe(2);
    });

    it('should handle multiple dependency paths', () => {
      const deps = getDependencies('form-e', mockFormGraph);
      expect(deps.has('form-c')).toBe(true);
      expect(deps.has('form-d')).toBe(true);
      expect(deps.has('form-b')).toBe(true);
      expect(deps.has('form-a')).toBe(true);
      expect(deps.size).toBe(4);
    });

    it('should return empty set for non-existent form', () => {
      const deps = getDependencies('non-existent', mockFormGraph);
      expect(deps.size).toBe(0);
    });

    it('should handle empty graph', () => {
      const deps = getDependencies('form-a', {});
      expect(deps.size).toBe(0);
    });
  });

  describe('getDirectDependencies', () => {
    it('should return only direct dependencies', () => {
      const deps = getDirectDependencies('form-d', mockFormGraph);
      expect(deps.has('form-b')).toBe(true);
      expect(deps.has('form-a')).toBe(false);
      expect(deps.size).toBe(1);
    });

    it('should return empty set for form with no dependencies', () => {
      const deps = getDirectDependencies('form-a', mockFormGraph);
      expect(deps.size).toBe(0);
    });

    it('should handle multiple direct dependencies', () => {
      const deps = getDirectDependencies('form-e', mockFormGraph);
      expect(deps.has('form-c')).toBe(true);
      expect(deps.has('form-d')).toBe(true);
      expect(deps.size).toBe(2);
    });
  });

  describe('getTransitiveDependencies', () => {
    it('should return only transitive dependencies', () => {
      const deps = getTransitiveDependencies('form-d', mockFormGraph);
      expect(deps.has('form-a')).toBe(true);
      expect(deps.has('form-b')).toBe(false);
      expect(deps.size).toBe(1);
    });

    it('should return empty set for form with only direct dependencies', () => {
      const deps = getTransitiveDependencies('form-b', mockFormGraph);
      expect(deps.size).toBe(0);
    });

    it('should handle complex transitive dependencies', () => {
      const deps = getTransitiveDependencies('form-e', mockFormGraph);
      expect(deps.has('form-a')).toBe(true);
      expect(deps.has('form-b')).toBe(true);
      expect(deps.has('form-c')).toBe(false);
      expect(deps.has('form-d')).toBe(false);
      expect(deps.size).toBe(2);
    });
  });

  describe('hasCircularDependencies', () => {
    it('should return false for acyclic graph', () => {
      const result = hasCircularDependencies(mockFormGraph);
      expect(result).toBe(false);
    });

    it('should detect simple circular dependency', () => {
      const circularGraph: FormGraph = {
        'form-a': {
          id: 'form-a',
          name: 'Form A',
          fields: [],
          dependencies: ['form-b'],
        },
        'form-b': {
          id: 'form-b',
          name: 'Form B',
          fields: [],
          dependencies: ['form-a'],
        },
      };

      const result = hasCircularDependencies(circularGraph);
      expect(result).toBe(true);
    });

    it('should detect complex circular dependency', () => {
      const circularGraph: FormGraph = {
        'form-a': {
          id: 'form-a',
          name: 'Form A',
          fields: [],
          dependencies: ['form-b'],
        },
        'form-b': {
          id: 'form-b',
          name: 'Form B',
          fields: [],
          dependencies: ['form-c'],
        },
        'form-c': {
          id: 'form-c',
          name: 'Form C',
          fields: [],
          dependencies: ['form-a'],
        },
      };

      const result = hasCircularDependencies(circularGraph);
      expect(result).toBe(true);
    });

    it('should return false for empty graph', () => {
      const result = hasCircularDependencies({});
      expect(result).toBe(false);
    });
  });
});
