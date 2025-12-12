import { Form, GlobalData } from '../types';

/**
 * Mock form data representing a realistic DAG structure
 *
 * Dependency structure:
 * - Form A: No dependencies (root node)
 * - Form B: Depends on A
 * - Form C: Depends on A
 * - Form D: Depends on B (transitively depends on A)
 * - Form E: Depends on C (transitively depends on A)
 */

export const mockForms: Form[] = [
  {
    id: 'form-a',
    name: 'Contact Information Form',
    fields: [
      { id: 'email', label: 'Email Address', type: 'email' },
      { id: 'name', label: 'Full Name', type: 'text' },
      { id: 'phone', label: 'Phone Number', type: 'text' },
    ],
    dependencies: [],
  },
  {
    id: 'form-b',
    name: 'Preferences Survey',
    fields: [
      { id: 'completed_at', label: 'Completion Date', type: 'date' },
      { id: 'button', label: 'Submit Button', type: 'button' },
      { id: 'dynamic_checkbox_group', label: 'Preference Options', type: 'checkbox' },
      { id: 'status', label: 'Survey Status', type: 'text' },
    ],
    dependencies: ['form-a'],
  },
  {
    id: 'form-c',
    name: 'Address Collection Form',
    fields: [
      { id: 'address', label: 'Street Address', type: 'text' },
      { id: 'city', label: 'City', type: 'text' },
      { id: 'state', label: 'State', type: 'text' },
    ],
    dependencies: ['form-a'],
  },
  {
    id: 'form-d',
    name: 'Advanced Configuration',
    fields: [
      { id: 'dynamic_checkbox_group', label: 'Configuration Options', type: 'checkbox' },
      { id: 'dynamic_object', label: 'Custom Data Object', type: 'object' },
      { id: 'email', label: 'Notification Email', type: 'email' },
    ],
    dependencies: ['form-b'],
  },
  {
    id: 'form-e',
    name: 'Follow-up Notes',
    fields: [
      { id: 'notes', label: 'Additional Notes', type: 'text' },
      { id: 'submit_date', label: 'Submission Date', type: 'date' },
    ],
    dependencies: ['form-c'],
  },
];

/**
 * Mock global data sources
 * These represent system-wide properties that can be used for prefilling
 */
export const mockGlobalData: GlobalData = {
  actionProperties: [
    'status',
    'created_at',
    'assignee',
    'priority',
    'due_date',
  ],
  clientOrgProperties: [
    'org_name',
    'org_id',
    'plan_type',
    'industry',
    'employee_count',
  ],
};
