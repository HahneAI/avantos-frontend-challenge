import { FormField, PrefillMapping } from '../types';

interface FieldMappingRowProps {
  /** The form field to display */
  field: FormField;
  /** The current mapping for this field (if any) */
  mapping: PrefillMapping | undefined;
  /** Callback when the user clicks to set/edit a mapping */
  onOpenModal: (fieldId: string) => void;
  /** Callback when the user clears a mapping */
  onClearMapping: (fieldId: string) => void;
}

/**
 * FieldMappingRow displays a single field and its prefill configuration
 * Shows field name, type, current mapping, and controls to edit/clear
 */
export function FieldMappingRow({
  field,
  mapping,
  onOpenModal,
  onClearMapping,
}: FieldMappingRowProps) {
  const fieldTypeColors: Record<string, string> = {
    text: 'bg-blue-100 text-blue-800',
    email: 'bg-purple-100 text-purple-800',
    date: 'bg-green-100 text-green-800',
    checkbox: 'bg-yellow-100 text-yellow-800',
    button: 'bg-gray-100 text-gray-800',
    object: 'bg-pink-100 text-pink-800',
    number: 'bg-indigo-100 text-indigo-800',
  };

  return (
    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-gray-900">{field.label}</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              fieldTypeColors[field.type] || 'bg-gray-100 text-gray-800'
            }`}
          >
            {field.type}
          </span>
        </div>
        {mapping ? (
          <div className="text-sm text-gray-600 flex items-center gap-2">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span>Mapped from: <strong>{mapping.sourcePath}</strong></span>
          </div>
        ) : (
          <div className="text-sm text-gray-400 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span>Not mapped</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 ml-4">
        {mapping && (
          <button
            onClick={() => onClearMapping(field.id)}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Clear mapping"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
        <button
          onClick={() => onOpenModal(field.id)}
          className="btn-avantos"
        >
          {mapping ? 'Edit' : 'Set Mapping'}
        </button>
      </div>
    </div>
  );
}
