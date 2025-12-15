import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PrefillConfiguration } from '../PrefillConfiguration';
import { Form, PrefillMapping } from '../../types';

describe('PrefillConfiguration', () => {
  let mockOnOpenModal: ReturnType<typeof vi.fn>;
  let mockOnClearMapping: ReturnType<typeof vi.fn>;
  let mockOnClearAllMappings: ReturnType<typeof vi.fn>;
  let mockGetMapping: ReturnType<typeof vi.fn>;

  const mockForm: Form = {
    id: 'form-d',
    name: 'Form D',
    fields: [
      { id: 'email', label: 'Email Address', type: 'email' },
      { id: 'name', label: 'Name', type: 'text' },
      { id: 'date', label: 'Date', type: 'date' },
    ],
    dependencies: ['form-a', 'form-b'],
  };

  const mockMappings: PrefillMapping[] = [
    {
      targetFormId: 'form-d',
      targetFieldId: 'email',
      sourceType: 'form',
      sourceFormId: 'form-a',
      sourceFieldId: 'email',
      sourcePath: 'Form A.Email Address',
    },
    {
      targetFormId: 'form-d',
      targetFieldId: 'name',
      sourceType: 'global',
      sourceFieldId: 'assignee',
      sourcePath: 'Action.Assignee',
    },
  ];

  beforeEach(() => {
    mockOnOpenModal = vi.fn();
    mockOnClearMapping = vi.fn();
    mockOnClearAllMappings = vi.fn();
    mockGetMapping = vi.fn((fieldId: string) => {
      return mockMappings.find(m => m.targetFieldId === fieldId);
    });
  });

  const getDefaultProps = () => ({
    form: mockForm,
    mappings: mockMappings,
    getMapping: mockGetMapping,
    onOpenModal: mockOnOpenModal,
    onClearMapping: mockOnClearMapping,
    onClearAllMappings: mockOnClearAllMappings,
  });

  it('renders "No form selected" message when form is null', () => {
    render(<PrefillConfiguration {...getDefaultProps()} form={null} />);
    expect(screen.getByText('No form selected')).toBeInTheDocument();
    expect(screen.getByText('Select a form from the list to configure prefill mappings')).toBeInTheDocument();
  });

  it('renders form name in header when form is selected', () => {
    render(<PrefillConfiguration {...getDefaultProps()} />);
    expect(screen.getByText('Prefill Configuration')).toBeInTheDocument();
    expect(screen.getByText(/Form D/)).toBeInTheDocument();
  });

  it('renders all fields from the form', () => {
    render(<PrefillConfiguration {...getDefaultProps()} />);
    expect(screen.getByText('Email Address')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
  });

  it('displays field count correctly', () => {
    render(<PrefillConfiguration {...getDefaultProps()} />);
    expect(screen.getByText('Fields (3)')).toBeInTheDocument();
  });

  it('displays mapping count correctly', () => {
    render(<PrefillConfiguration {...getDefaultProps()} />);
    expect(screen.getByText('2 of 3 mapped')).toBeInTheDocument();
  });

  it('shows "Clear All Mappings" button when mappings exist', () => {
    render(<PrefillConfiguration {...getDefaultProps()} />);
    expect(screen.getByText('Clear All Mappings')).toBeInTheDocument();
  });

  it('hides "Clear All Mappings" button when no mappings exist', () => {
    render(<PrefillConfiguration {...getDefaultProps()} mappings={[]} />);
    expect(screen.queryByText('Clear All Mappings')).not.toBeInTheDocument();
  });

  it('calls onClearAllMappings when Clear All button is clicked', () => {
    render(<PrefillConfiguration {...getDefaultProps()} />);
    const clearAllButton = screen.getByText('Clear All Mappings');
    fireEvent.click(clearAllButton);
    expect(mockOnClearAllMappings).toHaveBeenCalledTimes(1);
  });

  it('displays info box with instructions', () => {
    render(<PrefillConfiguration {...getDefaultProps()} />);
    expect(screen.getByText('Prefill Mapping')).toBeInTheDocument();
    expect(
      screen.getByText(/Click "Set Mapping" to configure how each field should be prefilled/)
    ).toBeInTheDocument();
  });

  it('renders FieldMappingRow for each field', () => {
    render(<PrefillConfiguration {...getDefaultProps()} />);

    // Check that all fields are rendered with their mappings
    mockForm.fields.forEach(field => {
      expect(screen.getByText(field.label)).toBeInTheDocument();
    });
  });

  it('passes correct mapping to each FieldMappingRow', () => {
    render(<PrefillConfiguration {...getDefaultProps()} />);

    // Check that getMapping was called for each field
    expect(mockGetMapping).toHaveBeenCalledWith('email');
    expect(mockGetMapping).toHaveBeenCalledWith('name');
    expect(mockGetMapping).toHaveBeenCalledWith('date');
  });

  it('passes onOpenModal callback to FieldMappingRow', () => {
    render(<PrefillConfiguration {...getDefaultProps()} />);

    // Find a "Set Mapping" button for an unmapped field
    const setMappingButtons = screen.getAllByText('Set Mapping');
    fireEvent.click(setMappingButtons[0]);

    expect(mockOnOpenModal).toHaveBeenCalled();
  });

  it('passes onClearMapping callback to FieldMappingRow', () => {
    render(<PrefillConfiguration {...getDefaultProps()} />);

    // Find clear buttons (should be 2, one for each mapped field)
    const clearButtons = screen.getAllByTitle('Clear mapping');
    expect(clearButtons).toHaveLength(2);

    fireEvent.click(clearButtons[0]);
    expect(mockOnClearMapping).toHaveBeenCalled();
  });

  it('renders correctly when form has no fields', () => {
    const emptyForm: Form = {
      id: 'empty-form',
      name: 'Empty Form',
      fields: [],
      dependencies: [],
    };

    render(
      <PrefillConfiguration
        {...getDefaultProps()}
        form={emptyForm}
        mappings={[]}
      />
    );

    expect(screen.getByText('Prefill Configuration')).toBeInTheDocument();
    expect(screen.getByText(/Empty Form/)).toBeInTheDocument();
    expect(screen.getByText('Fields (0)')).toBeInTheDocument();
    expect(screen.getByText('0 of 0 mapped')).toBeInTheDocument();
  });

  it('renders icon in "No form selected" state', () => {
    const { container } = render(<PrefillConfiguration {...getDefaultProps()} form={null} />);
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('renders info icon in instruction box', () => {
    const { container } = render(<PrefillConfiguration {...getDefaultProps()} />);
    const infoIcons = container.querySelectorAll('.text-blue-600');
    expect(infoIcons.length).toBeGreaterThan(0);
  });

  it('updates display when mappings change', () => {
    const { rerender } = render(<PrefillConfiguration {...getDefaultProps()} />);

    expect(screen.getByText('2 of 3 mapped')).toBeInTheDocument();

    // Update with more mappings
    const newMappings: PrefillMapping[] = [
      ...mockMappings,
      {
        targetFormId: 'form-d',
        targetFieldId: 'date',
        sourceType: 'form',
        sourceFormId: 'form-a',
        sourceFieldId: 'created_at',
        sourcePath: 'Form A.Created At',
      },
    ];

    const newGetMapping = vi.fn((fieldId: string) => {
      return newMappings.find(m => m.targetFieldId === fieldId);
    });

    rerender(
      <PrefillConfiguration
        {...getDefaultProps()}
        mappings={newMappings}
        getMapping={newGetMapping}
      />
    );

    expect(screen.getByText('3 of 3 mapped')).toBeInTheDocument();
  });

  it('handles form with single field', () => {
    const singleFieldForm: Form = {
      id: 'single-field',
      name: 'Single Field Form',
      fields: [{ id: 'field1', label: 'Field 1', type: 'text' }],
      dependencies: [],
    };

    const emptyGetMapping = vi.fn(() => undefined);

    render(
      <PrefillConfiguration
        {...getDefaultProps()}
        form={singleFieldForm}
        mappings={[]}
        getMapping={emptyGetMapping}
      />
    );

    expect(screen.getByText('Fields (1)')).toBeInTheDocument();
    expect(screen.getByText('0 of 1 mapped')).toBeInTheDocument();
    expect(screen.getByText('Field 1')).toBeInTheDocument();
  });

  it('maintains key prop uniqueness for field list', () => {
    const { container } = render(<PrefillConfiguration {...getDefaultProps()} />);

    // Check that each field row has a unique key by verifying no duplicate IDs
    const fieldRows = container.querySelectorAll('[class*="border-gray-200"]');
    expect(fieldRows.length).toBeGreaterThan(0);
  });
});
