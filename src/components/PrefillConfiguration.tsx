import { Form, PrefillMapping } from '../types';
import { FieldMappingRow } from './FieldMappingRow';

interface PrefillConfigurationProps {
  /** The form being configured */
  form: Form | null;
  /** Mappings for this form */
  mappings: PrefillMapping[];
  /** Get mapping for a specific field */
  getMapping: (fieldId: string) => PrefillMapping | undefined;
  /** Callback when opening modal to set a mapping */
  onOpenModal: (fieldId: string) => void;
  /** Callback when clearing a mapping */
  onClearMapping: (fieldId: string) => void;
  /** Callback when clearing all mappings */
  onClearAllMappings: () => void;
}

/**
 * PrefillConfiguration component displays and manages prefill mappings for a selected form
 * Shows all fields with their current mappings and controls to edit/clear
 */
export function PrefillConfiguration({
  form,
  mappings,
  getMapping,
  onOpenModal,
  onClearMapping,
  onClearAllMappings,
}: PrefillConfigurationProps) {
  if (!form) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <svg
            className="w-20 h-20 mx-auto mb-4 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
            />
          </svg>
          <p className="text-lg font-medium">No form selected</p>
          <p className="text-sm mt-1">Select a form from the list to configure prefill mappings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Prefill Configuration</h2>
          <p className="text-sm text-gray-600 mt-1">Configure field mappings for <strong>{form.name}</strong></p>
        </div>
        {mappings.length > 0 && (
          <button
            onClick={onClearAllMappings}
            className="px-3 py-1.5 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50 transition-colors"
          >
            Clear All Mappings
          </button>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium">Prefill Mapping</p>
            <p className="mt-1">Click "Set Mapping" to configure how each field should be prefilled from upstream forms or global data sources.</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900">Fields ({form.fields.length})</h3>
          <div className="text-sm text-gray-600">
            {mappings.length} of {form.fields.length} mapped
          </div>
        </div>

        {form.fields.map(field => (
          <FieldMappingRow
            key={field.id}
            field={field}
            mapping={getMapping(field.id)}
            onOpenModal={onOpenModal}
            onClearMapping={onClearMapping}
          />
        ))}
      </div>
    </div>
  );
}
