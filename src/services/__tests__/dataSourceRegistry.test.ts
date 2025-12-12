import { describe, it, expect, beforeEach } from 'vitest';
import {
  DataSourceRegistry,
  FormDataSource,
  GlobalDataSource,
} from '../dataSourceRegistry';
import { Form, GlobalData } from '../../types';

describe('DataSourceRegistry', () => {
  let registry: DataSourceRegistry;

  beforeEach(() => {
    registry = new DataSourceRegistry();
  });

  describe('register', () => {
    it('should register a data source', () => {
      const mockForm: Form = {
        id: 'form-a',
        name: 'Form A',
        fields: [{ id: 'email', label: 'Email', type: 'email' }],
        dependencies: [],
      };

      const source = new FormDataSource('form-a', 'Form A', mockForm);
      registry.register(source);

      const retrieved = registry.get('form-a');
      expect(retrieved).toBe(source);
    });

    it('should replace existing source with same ID', () => {
      const mockForm: Form = {
        id: 'form-a',
        name: 'Form A',
        fields: [{ id: 'email', label: 'Email', type: 'email' }],
        dependencies: [],
      };

      const source1 = new FormDataSource('form-a', 'Form A v1', mockForm);
      const source2 = new FormDataSource('form-a', 'Form A v2', mockForm);

      registry.register(source1);
      registry.register(source2);

      const retrieved = registry.get('form-a');
      expect(retrieved?.name).toBe('Form A v2');
    });
  });

  describe('getAll', () => {
    it('should return empty array when no sources registered', () => {
      const sources = registry.getAll();
      expect(sources).toEqual([]);
    });

    it('should return all registered sources', () => {
      const mockForm: Form = {
        id: 'form-a',
        name: 'Form A',
        fields: [],
        dependencies: [],
      };

      const mockGlobalData: GlobalData = {
        actionProperties: ['status'],
        clientOrgProperties: ['org_name'],
      };

      const formSource = new FormDataSource('form-a', 'Form A', mockForm);
      const globalSource = new GlobalDataSource(mockGlobalData);

      registry.register(formSource);
      registry.register(globalSource);

      const sources = registry.getAll();
      expect(sources).toHaveLength(2);
      expect(sources).toContain(formSource);
      expect(sources).toContain(globalSource);
    });
  });

  describe('get', () => {
    it('should return undefined for non-existent source', () => {
      const retrieved = registry.get('non-existent');
      expect(retrieved).toBeUndefined();
    });

    it('should retrieve registered source by ID', () => {
      const mockForm: Form = {
        id: 'form-a',
        name: 'Form A',
        fields: [],
        dependencies: [],
      };

      const source = new FormDataSource('form-a', 'Form A', mockForm);
      registry.register(source);

      const retrieved = registry.get('form-a');
      expect(retrieved).toBe(source);
    });
  });

  describe('clear', () => {
    it('should remove all sources', () => {
      const mockForm: Form = {
        id: 'form-a',
        name: 'Form A',
        fields: [],
        dependencies: [],
      };

      const source = new FormDataSource('form-a', 'Form A', mockForm);
      registry.register(source);

      expect(registry.getAll()).toHaveLength(1);

      registry.clear();

      expect(registry.getAll()).toHaveLength(0);
    });
  });

  describe('getByType', () => {
    it('should filter sources by type', () => {
      const mockForm: Form = {
        id: 'form-a',
        name: 'Form A',
        fields: [],
        dependencies: [],
      };

      const mockGlobalData: GlobalData = {
        actionProperties: ['status'],
        clientOrgProperties: ['org_name'],
      };

      const formSource = new FormDataSource('form-a', 'Form A', mockForm);
      const globalSource = new GlobalDataSource(mockGlobalData);

      registry.register(formSource);
      registry.register(globalSource);

      const formSources = registry.getByType('form');
      expect(formSources).toHaveLength(1);
      expect(formSources[0]).toBe(formSource);

      const globalSources = registry.getByType('global');
      expect(globalSources).toHaveLength(1);
      expect(globalSources[0]).toBe(globalSource);
    });

    it('should return empty array when no sources match type', () => {
      const sources = registry.getByType('custom');
      expect(sources).toEqual([]);
    });
  });
});

describe('FormDataSource', () => {
  it('should return fields with proper paths', () => {
    const mockForm: Form = {
      id: 'form-a',
      name: 'Contact Form',
      fields: [
        { id: 'email', label: 'Email Address', type: 'email' },
        { id: 'name', label: 'Full Name', type: 'text' },
      ],
      dependencies: [],
    };

    const source = new FormDataSource('form-a', 'Contact Form', mockForm);
    const fields = source.getFields();

    expect(fields).toHaveLength(2);
    expect(fields[0]).toEqual({
      id: 'email',
      label: 'Email Address',
      type: 'email',
      path: 'Contact Form.Email Address',
    });
    expect(fields[1]).toEqual({
      id: 'name',
      label: 'Full Name',
      type: 'text',
      path: 'Contact Form.Full Name',
    });
  });
});

describe('GlobalDataSource', () => {
  it('should format property names correctly', () => {
    const mockGlobalData: GlobalData = {
      actionProperties: ['created_at', 'assignee', 'status'],
      clientOrgProperties: [],
    };

    const source = new GlobalDataSource(mockGlobalData);
    const fields = source.getFields();

    expect(fields).toHaveLength(3);
    expect(fields[0]).toEqual({
      id: 'created_at',
      label: 'Created At',
      type: 'text',
      path: 'Action.Created At',
    });
    expect(fields[1]).toEqual({
      id: 'assignee',
      label: 'Assignee',
      type: 'text',
      path: 'Action.Assignee',
    });
  });

  it('should have correct properties', () => {
    const mockGlobalData: GlobalData = {
      actionProperties: ['status'],
      clientOrgProperties: [],
    };

    const source = new GlobalDataSource(mockGlobalData);

    expect(source.id).toBe('global-action-properties');
    expect(source.name).toBe('Action Properties');
    expect(source.type).toBe('global');
  });
});
