import { Form } from '../types';
import { FormCard } from './FormCard';

interface FormListProps {
  /** List of forms to display */
  forms: Form[];
  /** Currently selected form ID */
  selectedFormId: string | null;
  /** Callback when a form is selected */
  onSelectForm: (formId: string) => void;
}

/**
 * FormList component displays all available forms in a grid layout
 * Each form is clickable to select it for prefill configuration
 */
export function FormList({ forms, selectedFormId, onSelectForm }: FormListProps) {
  if (forms.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p>No forms available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Available Forms</h2>
      <div className="space-y-2">
        {forms.map(form => (
          <FormCard
            key={form.id}
            form={form}
            isSelected={selectedFormId === form.id}
            onClick={() => onSelectForm(form.id)}
          />
        ))}
      </div>
    </div>
  );
}
