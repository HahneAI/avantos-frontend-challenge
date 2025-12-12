import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FieldMappingRow } from '../FieldMappingRow';
import { FormField, PrefillMapping } from '../../types';

describe('FieldMappingRow', () => {
  const mockField: FormField = {
    id: 'email',
    label: 'Email Address',
    type: 'email',
  };

  const mockMapping: PrefillMapping = {
    targetFormId: 'form-d',
    targetFieldId: 'email',
    sourceType: 'form',
    sourceFormId: 'form-a',
    sourceFieldId: 'email',
    sourcePath: 'Form A.Email Address',
  };

  it('should display field name and type', () => {
    const onOpenModal = vi.fn();
    const onClearMapping = vi.fn();

    render(
      <FieldMappingRow
        field={mockField}
        mapping={undefined}
        onOpenModal={onOpenModal}
        onClearMapping={onClearMapping}
      />
    );

    expect(screen.getByText('Email Address')).toBeInTheDocument();
    expect(screen.getByText('email')).toBeInTheDocument();
  });

  it('should display "Not mapped" when no mapping exists', () => {
    const onOpenModal = vi.fn();
    const onClearMapping = vi.fn();

    render(
      <FieldMappingRow
        field={mockField}
        mapping={undefined}
        onOpenModal={onOpenModal}
        onClearMapping={onClearMapping}
      />
    );

    expect(screen.getByText('Not mapped')).toBeInTheDocument();
    expect(screen.getByText('Set Mapping')).toBeInTheDocument();
  });

  it('should display mapping source when mapping exists', () => {
    const onOpenModal = vi.fn();
    const onClearMapping = vi.fn();

    render(
      <FieldMappingRow
        field={mockField}
        mapping={mockMapping}
        onOpenModal={onOpenModal}
        onClearMapping={onClearMapping}
      />
    );

    expect(screen.getByText(/Form A.Email Address/)).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  it('should show clear button when mapping exists', () => {
    const onOpenModal = vi.fn();
    const onClearMapping = vi.fn();

    render(
      <FieldMappingRow
        field={mockField}
        mapping={mockMapping}
        onOpenModal={onOpenModal}
        onClearMapping={onClearMapping}
      />
    );

    const clearButton = screen.getByTitle('Clear mapping');
    expect(clearButton).toBeInTheDocument();
  });

  it('should call onOpenModal when Set Mapping button is clicked', () => {
    const onOpenModal = vi.fn();
    const onClearMapping = vi.fn();

    render(
      <FieldMappingRow
        field={mockField}
        mapping={undefined}
        onOpenModal={onOpenModal}
        onClearMapping={onClearMapping}
      />
    );

    fireEvent.click(screen.getByText('Set Mapping'));

    expect(onOpenModal).toHaveBeenCalledWith('email');
  });

  it('should call onClearMapping when clear button is clicked', () => {
    const onOpenModal = vi.fn();
    const onClearMapping = vi.fn();

    render(
      <FieldMappingRow
        field={mockField}
        mapping={mockMapping}
        onOpenModal={onOpenModal}
        onClearMapping={onClearMapping}
      />
    );

    fireEvent.click(screen.getByTitle('Clear mapping'));

    expect(onClearMapping).toHaveBeenCalledWith('email');
  });

  it('should not show clear button when no mapping exists', () => {
    const onOpenModal = vi.fn();
    const onClearMapping = vi.fn();

    render(
      <FieldMappingRow
        field={mockField}
        mapping={undefined}
        onOpenModal={onOpenModal}
        onClearMapping={onClearMapping}
      />
    );

    const clearButton = screen.queryByTitle('Clear mapping');
    expect(clearButton).not.toBeInTheDocument();
  });
});
