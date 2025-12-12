import { Form } from '../types';

interface FormCardProps {
  /** The form to display */
  form: Form;
  /** Whether this form is currently selected */
  isSelected: boolean;
  /** Callback when the form is clicked */
  onClick: () => void;
}

/**
 * FormCard component displays a single form in a card layout
 * Shows form name, field count, and dependency count
 */
export function FormCard({ form, isSelected, onClick }: FormCardProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full p-4 rounded-lg border-2 text-left transition-all
        hover:shadow-md hover:scale-[1.02]
        ${
          isSelected
            ? 'border-primary-500 bg-primary-50 shadow-md'
            : 'border-gray-200 bg-white hover:border-primary-300'
        }
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-2">{form.name}</h3>
          <div className="flex gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span>{form.fields.length} fields</span>
            </div>
            <div className="flex items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span>{form.dependencies.length} dependencies</span>
            </div>
          </div>
        </div>
        {isSelected && (
          <div className="ml-2">
            <svg
              className="w-6 h-6 text-primary-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>
    </button>
  );
}
