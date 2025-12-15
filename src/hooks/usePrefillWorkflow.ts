import { useState, useCallback } from 'react';
import { FormField, PrefillMapping, Form } from '../types';

/**
 * Custom hook to manage the prefill workflow state and interactions
 * Handles modal visibility, field selection, and mapping submission
 *
 * This hook separates UI orchestration logic from the main App component,
 * making the code more maintainable and testable.
 */
export function usePrefillWorkflow(
  selectedForm: Form | null,
  selectedFormId: string | null,
  setMapping: (mapping: PrefillMapping) => void
) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<FormField | null>(null);

  /**
   * Opens the data source modal for a specific field
   * @param fieldId - The ID of the field to configure
   */
  const handleOpenModal = useCallback((fieldId: string) => {
    if (!selectedForm) return;

    const field = selectedForm.fields.find(f => f.id === fieldId);
    if (!field) return;

    setSelectedField(field);
    setIsModalOpen(true);
  }, [selectedForm]);

  /**
   * Closes the modal and resets selected field
   */
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedField(null);
  }, []);

  /**
   * Handles field selection from the data source modal
   * Creates a complete mapping and submits it
   * @param partialMapping - Mapping data without targetFormId
   */
  const handleSelectMapping = useCallback((
    partialMapping: Omit<PrefillMapping, 'targetFormId'>
  ) => {
    if (!selectedFormId) return;

    setMapping({
      ...partialMapping,
      targetFormId: selectedFormId,
    });

    handleCloseModal();
  }, [selectedFormId, setMapping, handleCloseModal]);

  return {
    isModalOpen,
    selectedField,
    handleOpenModal,
    handleCloseModal,
    handleSelectMapping,
  };
}
