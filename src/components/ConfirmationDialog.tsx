import { useEffect, useRef } from 'react';

interface ConfirmationDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Warning message to display */
  message: string;
  /** Source data type */
  sourceType: string;
  /** Target field type */
  targetType: string;
  /** Callback when user clicks Continue */
  onConfirm: () => void;
  /** Callback when user clicks Cancel or closes */
  onCancel: () => void;
}

/**
 * ConfirmationDialog displays a custom confirmation modal
 * Replaces browser's window.confirm for better UX and styling consistency
 * Uses the same CSS patterns as DataSourceModal
 *
 * Features:
 * - ESC key to cancel
 * - Auto-focus on confirm button
 * - Focus returns to previous element on close
 * - Full ARIA labels for accessibility
 * - Click backdrop to cancel
 */
export function ConfirmationDialog({
  isOpen,
  message,
  sourceType,
  targetType,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Handle ESC key press
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation(); // Prevent parent modals from also handling ESC
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onCancel]);

  // Focus management: store previous focus, focus confirm button, restore on close
  useEffect(() => {
    if (isOpen) {
      // Store what was focused before dialog opened
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Focus the confirm button
      confirmButtonRef.current?.focus();
    } else {
      // Return focus to previous element when dialog closes
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[60] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-title"
      aria-describedby="confirmation-description"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg w-full max-w-md modal-enhanced">
          {/* Header */}
          <div className="flex items-center justify-between modal-header">
            <div className="flex items-center gap-3">
              {/* Warning Icon */}
              <div className="flex-shrink-0">
                <svg
                  className="w-6 h-6 text-yellow-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h2 id="confirmation-title" className="text-lg font-semibold text-gray-900">
                Type Mismatch Warning
              </h2>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-red-100 rounded-lg transition-colors"
              aria-label="Close dialog"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="modal-content">
            <div className="space-y-4">
              {/* Warning Message */}
              <p id="confirmation-description" className="text-gray-700">
                {message}
              </p>

              {/* Type Comparison */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Source Type:</span>
                    <code className="px-2 py-1 bg-white border border-gray-300 rounded text-sm font-mono text-red-600">
                      {sourceType}
                    </code>
                  </div>
                  <div className="flex items-center justify-center text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                      />
                    </svg>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Target Type:</span>
                    <code className="px-2 py-1 bg-white border border-gray-300 rounded text-sm font-mono text-green-600">
                      {targetType}
                    </code>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <p className="text-sm text-gray-600">
                Proceeding with mismatched types may result in unexpected behavior or data
                conversion errors. Consider selecting a field with a matching type.
              </p>
            </div>
          </div>

          {/* Footer with Action Buttons */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              ref={confirmButtonRef}
              onClick={onConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 border border-transparent rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
            >
              Continue Anyway
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
