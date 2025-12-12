import { useState } from 'react';
import { FormList } from './components/FormList';
import { PrefillConfiguration } from './components/PrefillConfiguration';
import { DataSourceModal } from './components/DataSourceModal';
import { useForms } from './hooks/useForms';
import { usePrefillMappings } from './hooks/usePrefillMappings';
import { useDataSources } from './hooks/useDataSources';
import { FormField } from './types';

/**
 * Main application component
 * Manages the overall layout and state for the prefill mapping UI
 */
function App() {
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<FormField | null>(null);

  // Fetch forms data
  const { forms, formGraph, globalData, loading, error } = useForms();

  // Manage prefill mappings
  const {
    getMappingsForForm,
    getMapping: getMappingForField,
    setMapping,
    clearMapping,
    clearAllMappingsForForm,
  } = usePrefillMappings();

  // Get data sources for the selected form
  const dataSources = useDataSources(selectedFormId, formGraph, globalData);

  const selectedForm = selectedFormId ? formGraph[selectedFormId] : null;
  const formMappings = selectedFormId ? getMappingsForForm(selectedFormId) : [];

  const handleOpenModal = (fieldId: string) => {
    if (!selectedForm) return;

    const field = selectedForm.fields.find(f => f.id === fieldId);
    if (!field) return;

    setSelectedField(field);
    setIsModalOpen(true);
  };

  const handleSelectMapping = (partialMapping: Omit<typeof setMapping extends (arg: infer T) => void ? T : never, 'targetFormId'>) => {
    if (!selectedFormId) return;

    setMapping({
      ...partialMapping,
      targetFormId: selectedFormId,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4"></div>
          <p className="text-gray-600">Loading forms...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <svg
            className="w-16 h-16 text-red-500 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Forms</h2>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <svg
              className="w-8 h-8 text-primary-500"
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
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Form Prefill Mapper
              </h1>
              <p className="text-sm text-gray-600">
                Configure how downstream forms get prefilled from upstream data
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel: Form List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <FormList
              forms={forms}
              selectedFormId={selectedFormId}
              onSelectForm={setSelectedFormId}
            />
          </div>

          {/* Right Panel: Prefill Configuration */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <PrefillConfiguration
              form={selectedForm}
              mappings={formMappings}
              getMapping={(fieldId) =>
                selectedFormId ? getMappingForField(selectedFormId, fieldId) : undefined
              }
              onOpenModal={handleOpenModal}
              onClearMapping={(fieldId) => {
                if (selectedFormId) {
                  clearMapping(selectedFormId, fieldId);
                }
              }}
              onClearAllMappings={() => {
                if (selectedFormId) {
                  clearAllMappingsForForm(selectedFormId);
                }
              }}
            />
          </div>
        </div>
      </main>

      {/* Data Source Modal */}
      <DataSourceModal
        isOpen={isModalOpen}
        targetField={selectedField}
        formName={selectedForm?.name || ''}
        directDependencies={dataSources.directDependencies}
        transitiveDependencies={dataSources.transitiveDependencies}
        globalSources={dataSources.globalSources}
        onSelectField={handleSelectMapping}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedField(null);
        }}
      />
    </div>
  );
}

export default App;
