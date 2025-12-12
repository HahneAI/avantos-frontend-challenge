import { DataSource, DataField, Form, GlobalData } from '../types';

/**
 * Registry for managing data sources using the Strategy pattern
 * This enables extensibility - new data sources can be added without modifying existing code
 *
 * @example
 * const registry = new DataSourceRegistry();
 * registry.register(new FormDataSource('form-a', formData));
 * registry.register(new GlobalDataSource(globalData));
 * const allSources = registry.getAll();
 */
export class DataSourceRegistry {
  private sources: Map<string, DataSource> = new Map();

  /**
   * Register a new data source
   * @param source - The data source to register
   */
  register(source: DataSource): void {
    this.sources.set(source.id, source);
  }

  /**
   * Get all registered data sources
   * @returns Array of all data sources
   */
  getAll(): DataSource[] {
    return Array.from(this.sources.values());
  }

  /**
   * Get a specific data source by ID
   * @param id - The data source ID
   * @returns The data source or undefined if not found
   */
  get(id: string): DataSource | undefined {
    return this.sources.get(id);
  }

  /**
   * Clear all registered data sources
   */
  clear(): void {
    this.sources.clear();
  }

  /**
   * Get data sources by type
   * @param type - The type to filter by
   * @returns Array of data sources matching the type
   */
  getByType(type: DataSource['type']): DataSource[] {
    return this.getAll().filter(source => source.type === type);
  }
}

/**
 * Data source implementation for form-based data
 * Provides fields from a specific form as a data source
 */
export class FormDataSource implements DataSource {
  public readonly type = 'form' as const;

  constructor(
    public readonly id: string,
    public readonly name: string,
    private readonly form: Form
  ) { }

  /**
   * Get all fields from this form as data fields
   * @returns Array of data fields with full paths
   */
  getFields(): DataField[] {
    return this.form.fields.map(field => ({
      id: field.id,
      label: field.label,
      type: field.type,
      path: `${this.name}.${field.label}`,
    }));
  }
}

/**
 * Data source implementation for global action properties
 * Provides system-wide action properties as a data source
 */
export class GlobalDataSource implements DataSource {
  public readonly id = 'global-action-properties';
  public readonly name = 'Action Properties';
  public readonly type = 'global' as const;

  constructor(private readonly globalData: GlobalData) { }

  /**
   * Get all action properties as data fields
   * @returns Array of data fields for action properties
   */
  getFields(): DataField[] {
    return this.globalData.actionProperties.map(prop => ({
      id: prop,
      label: this.formatPropertyName(prop),
      type: 'text' as const,
      path: `Action.${this.formatPropertyName(prop)}`,
    }));
  }

  /**
   * Format snake_case property names to Title Case
   * @param prop - The property name in snake_case
   * @returns Formatted property name
   */
  private formatPropertyName(prop: string): string {
    return prop
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}

/** MANUAL TASK 1 BELOW */

export class OrganizationDataSource implements DataSource {
  public readonly id = 'global-org-properties';
  public readonly name = 'Organization Properties';
  public readonly type = 'global' as const;

  constructor(private readonly globalData: GlobalData) { }

  getFields(): DataField[] {
    return this.globalData.clientOrgProperties.map(prop => ({
      id: prop,
      label: this.formatPropertyName(prop),
      type: 'text' as const,
      path: `clientOrg.${this.formatPropertyName(prop)}`,
    }));
  }

  private formatPropertyName(prop: string): string {
    return prop
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}