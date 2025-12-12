import { useState } from 'react';
import { DataSource, DataField } from '../types';

interface DataSourceTreeProps {
  /** List of data sources to display */
  dataSources: DataSource[];
  /** Callback when a field is selected */
  onSelectField: (source: DataSource, field: DataField) => void;
  /** Optional filter text */
  filterText?: string;
}

/**
 * DataSourceTree displays a hierarchical tree of data sources and their fields
 * Each source is collapsible, and fields can be clicked to select them
 */
export function DataSourceTree({
  dataSources,
  onSelectField,
  filterText = '',
}: DataSourceTreeProps) {
  const [expandedSources, setExpandedSources] = useState<Set<string>>(
    new Set(dataSources.map(s => s.id))
  );

  const toggleSource = (sourceId: string) => {
    setExpandedSources(prev => {
      const next = new Set(prev);
      if (next.has(sourceId)) {
        next.delete(sourceId);
      } else {
        next.add(sourceId);
      }
      return next;
    });
  };

  const filterFields = (fields: DataField[]): DataField[] => {
    if (!filterText.trim()) return fields;
    const searchTerm = filterText.toLowerCase();
    return fields.filter(
      field =>
        field.label.toLowerCase().includes(searchTerm) ||
        field.id.toLowerCase().includes(searchTerm)
    );
  };

  if (dataSources.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg
          className="w-12 h-12 mx-auto mb-2 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <p>No data sources available</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {dataSources.map(source => {
        const fields = filterFields(source.getFields());
        const isExpanded = expandedSources.has(source.id);

        // Skip sources with no matching fields when filtering
        if (filterText && fields.length === 0) {
          return null;
        }

        return (
          <div key={source.id} className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSource(source.id)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <svg
                  className={`w-4 h-4 transition-transform ${
                    isExpanded ? 'rotate-90' : ''
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium text-gray-900">{source.name}</span>
                <span className="text-xs text-gray-500">({fields.length} fields)</span>
              </div>
            </button>

            {isExpanded && (
              <div className="p-2 bg-white">
                {fields.length === 0 ? (
                  <p className="text-sm text-gray-500 p-2">No fields available</p>
                ) : (
                  <div className="space-y-1">
                    {fields.map(field => (
                      <button
                        key={field.id}
                        onClick={() => onSelectField(source, field)}
                        className="w-full flex items-center justify-between p-2 rounded hover:bg-primary-50 hover:border-primary-300 border border-transparent transition-colors text-left"
                      >
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-gray-400"
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
                          <span className="text-sm text-gray-900">{field.label}</span>
                        </div>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {field.type}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
