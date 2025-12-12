import {
  MockServerResponse,
  MockServerNode,
  MockServerFormTemplate,
  FormBlueprintResponse,
  Form,
  FormField,
  FieldType,
  GlobalData,
} from '../types';

/**
 * Maps Avantos field types to our application's field types
 */
function mapFieldType(avantosType: string): FieldType {
  const typeMap: Record<string, FieldType> = {
    'short-text': 'text',
    'multi-line-text': 'text',
    'email': 'email',
    'date': 'date',
    'checkbox-group': 'checkbox',
    'multi-select': 'checkbox',
    'button': 'button',
    'object-enum': 'object',
    'number': 'number',
  };

  return typeMap[avantosType] || 'text';
}

/**
 * Extracts fields from a form template's field schema
 */
function extractFields(formTemplate: MockServerFormTemplate): FormField[] {
  const properties = formTemplate.field_schema.properties;

  return Object.keys(properties).map((fieldId) => {
    const fieldDef = properties[fieldId];
    return {
      id: fieldId,
      label: fieldDef.title || fieldId,
      type: mapFieldType(fieldDef.avantos_type),
    };
  });
}

/**
 * Finds the form template for a given component ID
 */
function findFormTemplate(
  componentId: string,
  templates: MockServerFormTemplate[]
): MockServerFormTemplate | undefined {
  return templates.find((template) => template.id === componentId);
}

/**
 * Converts a mock server node to our Form interface
 */
function transformNode(
  node: MockServerNode,
  formTemplates: MockServerFormTemplate[]
): Form | null {
  const formTemplate = findFormTemplate(node.data.component_id, formTemplates);

  if (!formTemplate) {
    console.warn(`No form template found for component_id: ${node.data.component_id}`);
    return null;
  }

  return {
    id: node.id,
    name: node.data.name,
    fields: extractFields(formTemplate),
    dependencies: node.data.prerequisites,
  };
}

/**
 * Creates global data structure
 * For now, we use hardcoded values as the mock server doesn't provide this
 */
function createGlobalData(): GlobalData {
  return {
    actionProperties: [
      'status',
      'created_at',
      'updated_at',
      'assignee',
      'priority',
      'due_date',
    ],
    clientOrgProperties: [
      'org_name',
      'org_id',
      'plan_type',
      'industry',
      'created_date',
      'contact_email',
    ],
  };
}

/**
 * Transforms the mock server API response into our application's expected format
 *
 * @param mockResponse - The raw response from the mock server
 * @returns The transformed data in our application's format
 */
export function transformMockServerResponse(
  mockResponse: MockServerResponse
): FormBlueprintResponse {
  // Transform each node into a Form
  const forms: Form[] = mockResponse.nodes
    .map((node) => transformNode(node, mockResponse.forms))
    .filter((form): form is Form => form !== null); // Remove any null values

  // Create global data (hardcoded for now)
  const globalData = createGlobalData();

  return {
    forms,
    globalData,
  };
}
