import { useState, useEffect } from 'react';
import { DataSource, DataField, FormField, PrefillMapping } from '../types';
import { DataSourceTree } from './DataSourceTree';
import { ConfirmationDialog } from './ConfirmationDialog';

interface DataSourceModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** The target field being configured */
  targetField: FormField | null;
  /** Form name for display */
  formName: string;
  /** Direct dependency data sources */
  directDependencies: DataSource[];
  /** Transitive dependency data sources */
  transitiveDependencies: DataSource[];
  /** Global data sources */
  globalSources: DataSource[];
  /** Callback when a field is selected */
  onSelectField: (mapping: PrefillMapping) => void;
  /** Callback to close the modal */
  onClose: () => void;
}

/**
 * DataSourceModal displays available data sources for prefill mapping
 * Organized into three sections: direct dependencies, transitive dependencies, and global sources
 *
 * INCOMPLETE TASKS (for video):
 * 1. Task 2: Field type validation (add warning dialog for mismatched types)
 * 2. Task 3: Implement custom modal CSS class (create .modal-enhanced in index.css and apply)
 */
export function DataSourceModal({
  isOpen,
  targetField,
  formName,
  directDependencies,
  transitiveDependencies,
  globalSources,
  onSelectField,
  onClose,
}: DataSourceModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingMapping, setPendingMapping] = useState<{
    source: DataSource;
    field: DataField;
  } | null>(null);

  // Cleanup confirmation state when modal closes to prevent memory leaks
  useEffect(() => {
    if (!isOpen) {
      setShowConfirmation(false);
      setPendingMapping(null);
    }
  }, [isOpen]);

  if (!isOpen || !targetField) {
    return null;
  }

  const handleSelectField = (source: DataSource, field: DataField) => {
    /** TASK 2 COMPLETED: Custom confirmation dialog for type validation */
    if (field.type !== targetField.type) {
      // Store pending mapping and show confirmation dialog
      setPendingMapping({ source, field });
      setShowConfirmation(true);
      return;
    }

    // Types match, proceed immediately
    createMapping(source, field);
  };

  const createMapping = (source: DataSource, field: DataField) => {
    const mapping: PrefillMapping = {
      targetFormId: '', // Will be set by parent
      targetFieldId: targetField.id,
      sourceType: source.type === 'form' ? 'form' : 'global',
      sourceFormId: source.type === 'form' ? source.id : undefined,
      sourceFieldId: field.id,
      sourcePath: field.path,
    };

    onSelectField(mapping);
    onClose();
  };

  const handleConfirmTypeMismatch = () => {
    if (pendingMapping) {
      createMapping(pendingMapping.source, pendingMapping.field);
    }
    setShowConfirmation(false);
    setPendingMapping(null);
  };

  const handleCancelTypeMismatch = () => {
    setShowConfirmation(false);
    setPendingMapping(null);
  };

  const hasAnySources =
    directDependencies.length > 0 ||
    transitiveDependencies.length > 0 ||
    globalSources.length > 0;

  return (
    <>
      {/* Confirmation Dialog for Type Mismatch */}
      <ConfirmationDialog
        isOpen={showConfirmation}
        message={`Warning: The source data type does NOT match the target field type. Do you still wish to continue with the prefill?`}
        sourceType={pendingMapping?.field.type || ''}
        targetType={targetField.type}
        onConfirm={handleConfirmTypeMismatch}
        onCancel={handleCancelTypeMismatch}
      />

      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/** MANUAL TASK 3 BELOW */}

        {/* Backdrop - Closes confirmation dialog if open, otherwise closes modal */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
          onClick={showConfirmation ? handleCancelTypeMismatch : onClose}
          aria-hidden="true"
        />

        {/* Modal */}
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white rounded-lg w-full max-w-2xl modal-enhanced">
          {/* Header */}
          <div className="flex items-center justify-between modal-header">
            <div>
              <h2 className="text-lg font-semibold">Select Data Source</h2>
              <p className="text-sm text-gray-600">
                Configure prefill for <strong>{formName}</strong> → <strong>{targetField.label}</strong>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-red-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {/* Search */}
          <div className="p-4 border-b">
            <input
              type="text"
              placeholder="Search fields..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md search-input"
            />
          </div>

          {/* Content */}
          <div className="modal-content overflow-y-auto">
            {!hasAnySources ? (
              <div className="text-center py-8 text-gray-500">
                <p>No data sources available for this form</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Direct Dependencies */}
                {directDependencies.length > 0 && (
                  <div className="section-card">
                    <h3>Direct Dependencies</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Forms that this form directly depends on
                    </p>
                    <DataSourceTree
                      dataSources={directDependencies}
                      onSelectField={showConfirmation ? () => {} : handleSelectField}
                      filterText={searchTerm}
                    />
                  </div>
                )}

                {/* Transitive Dependencies */}
                {transitiveDependencies.length > 0 && (
                  <div className="section-card">
                    <h3>Transitive Dependencies</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Forms that upstream forms depend on
                    </p>
                    <DataSourceTree
                      dataSources={transitiveDependencies}
                      onSelectField={showConfirmation ? () => {} : handleSelectField}
                      filterText={searchTerm}
                    />
                  </div>
                )}

                {/* Global Sources */}
                {globalSources.length > 0 && (
                  <div className="section-card">
                    <h3>Global System Dependencies</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      System-wide properties and data
                    </p>
                    <DataSourceTree
                      dataSources={globalSources}
                      onSelectField={showConfirmation ? () => {} : handleSelectField}
                      filterText={searchTerm}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
