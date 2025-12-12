/**
 * Core type definitions for the Form Prefill Mapping system
 */

/**
 * Represents a field type in a form
 */
export type FieldType = 'text' | 'email' | 'date' | 'checkbox' | 'button' | 'object' | 'number';

/**
 * Represents a single field within a form
 */
export interface FormField {
  /** Unique identifier for the field */
  id: string;
  /** Human-readable label */
  label: string;
  /** Type of the field */
  type: FieldType;
}

/**
 * Represents a form in the DAG
 */
export interface Form {
  /** Unique identifier for the form */
  id: string;
  /** Human-readable name */
  name: string;
  /** List of fields in this form */
  fields: FormField[];
  /** List of form IDs that this form depends on (direct dependencies) */
  dependencies: string[];
}

/**
 * Graph structure representing all forms and their dependencies
 */
export interface FormGraph {
  [formId: string]: Form;
}

/**
 * Represents a data field from any data source
 */
export interface DataField {
  /** Unique identifier for the field */
  id: string;
  /** Human-readable label */
  label: string;
  /** Type of the field */
  type: FieldType;
  /** Full path to this field (e.g., "Form A.email") */
  path: string;
}

/**
 * Type of data source
 */
export type DataSourceType = 'form' | 'global' | 'custom';

/**
 * Interface that all data sources must implement
 * This enables the extensibility pattern - new data sources just implement this interface
 */
export interface DataSource {
  /** Unique identifier for this data source */
  id: string;
  /** Human-readable name */
  name: string;
  /** Type of data source */
  type: DataSourceType;
  /** Get all fields available from this data source */
  getFields(): DataField[];
}

/**
 * Represents a prefill mapping configuration
 * Maps a target form field to a source field from another form or global data
 */
export interface PrefillMapping {
  /** ID of the form being prefilled */
  targetFormId: string;
  /** ID of the field being prefilled */
  targetFieldId: string;
  /** Type of the source (form or global) */
  sourceType: 'form' | 'global';
  /** ID of the source form (if sourceType is 'form') */
  sourceFormId?: string;
  /** ID of the source field */
  sourceFieldId: string;
  /** Human-readable path to the source (e.g., "Form A.email") */
  sourcePath: string;
}

/**
 * Global data structure containing action and organization properties
 */
export interface GlobalData {
  /** Properties related to the action/journey */
  actionProperties: string[];
  /** Properties related to the client organization */
  clientOrgProperties: string[];
}

/**
 * API response structure for the form blueprint graph
 */
export interface FormBlueprintResponse {
  /** List of all forms in the system */
  forms: Form[];
  /** Global data sources */
  globalData: GlobalData;
}

/**
 * Categorized data sources for easier UI organization
 */
export interface CategorizedDataSources {
  /** Forms that the target form directly depends on */
  directDependencies: DataSource[];
  /** Forms that the target form transitively depends on */
  transitiveDependencies: DataSource[];
  /** Global data sources (action properties, org properties, etc.) */
  globalSources: DataSource[];
}

/**
 * Mock Server API Response Types
 * These represent the structure returned by the Avantos mock server
 */

/**
 * A node in the action blueprint graph (represents a form)
 */
export interface MockServerNode {
  id: string;
  type: string;
  position: {
    x: number;
    y: number;
  };
  data: {
    id: string;
    component_key: string;
    component_type: string;
    component_id: string;
    name: string;
    prerequisites: string[];
    permitted_roles: string[];
    input_mapping: Record<string, unknown>;
    sla_duration: {
      number: number;
      unit: string;
    };
    approval_required: boolean;
    approval_roles: string[];
  };
}

/**
 * A form template definition from the mock server
 */
export interface MockServerFormTemplate {
  id: string;
  name: string;
  description: string;
  is_reusable: boolean;
  field_schema: {
    type: string;
    properties: Record<string, {
      avantos_type: string;
      title: string;
      type: string;
      format?: string;
      items?: unknown;
      enum?: unknown;
    }>;
    required?: string[];
  };
  ui_schema?: unknown;
  dynamic_field_config?: unknown;
}

/**
 * An edge in the graph (represents a dependency)
 */
export interface MockServerEdge {
  source: string;
  target: string;
}

/**
 * The complete response from the mock server API
 */
export interface MockServerResponse {
  $schema?: string;
  id: string;
  tenant_id: string;
  name: string;
  description: string;
  category: string;
  nodes: MockServerNode[];
  edges: MockServerEdge[];
  forms: MockServerFormTemplate[];
  branches: unknown[];
  triggers: unknown[];
}
