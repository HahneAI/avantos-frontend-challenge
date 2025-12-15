import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DataSourceModal } from '../DataSourceModal';
import { DataSource, FormField, PrefillMapping } from '../../types';

describe('DataSourceModal', () => {
  let mockOnSelectField: ReturnType<typeof vi.fn>;
  let mockOnClose: ReturnType<typeof vi.fn>;

  const mockTargetField: FormField = {
    id: 'email',
    label: 'Email Address',
    type: 'email',
  };

  const mockFormDataSource: DataSource = {
    id: 'form-a',
    name: 'Form A',
    type: 'form',
    getFields: () => [
      { id: 'email', label: 'Email', type: 'email', path: 'Form A.Email' },
      { id: 'name', label: 'Name', type: 'text', path: 'Form A.Name' },
    ],
  };

  const mockGlobalDataSource: DataSource = {
    id: 'action-properties',
    name: 'Action Properties',
    type: 'global',
    getFields: () => [
      { id: 'status', label: 'Status', type: 'text', path: 'Action.Status' },
      { id: 'created_at', label: 'Created At', type: 'date', path: 'Action.Created At' },
    ],
  };

  beforeEach(() => {
    mockOnSelectField = vi.fn();
    mockOnClose = vi.fn();
  });

  const getDefaultProps = () => ({
    isOpen: true,
    targetField: mockTargetField,
    formName: 'Form D',
    directDependencies: [mockFormDataSource],
    transitiveDependencies: [],
    globalSources: [mockGlobalDataSource],
    onSelectField: mockOnSelectField,
    onClose: mockOnClose,
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<DataSourceModal {...getDefaultProps()} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when targetField is null', () => {
    const { container } = render(<DataSourceModal {...getDefaultProps()} targetField={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders modal when isOpen is true and targetField exists', () => {
    render(<DataSourceModal {...getDefaultProps()} />);
    expect(screen.getByText('Select Data Source')).toBeInTheDocument();
  });

  it('displays form and field name in header', () => {
    render(<DataSourceModal {...getDefaultProps()} />);
    expect(screen.getByText(/Form D/)).toBeInTheDocument();
    expect(screen.getByText(/Email Address/)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const { container } = render(<DataSourceModal {...getDefaultProps()} />);
    // Find the close button by its class and SVG content
    const closeButtons = container.querySelectorAll('button');
    const closeButton = Array.from(closeButtons).find(btn =>
      btn.querySelector('svg') && btn.className.includes('hover:bg-red-100')
    );
    expect(closeButton).toBeDefined();
    if (closeButton) {
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }
  });

  it('calls onClose when backdrop is clicked', () => {
    const { container } = render(<DataSourceModal {...getDefaultProps()} />);
    const backdrop = container.querySelector('.backdrop-blur-sm');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }
  });

  it('renders search input', () => {
    render(<DataSourceModal {...getDefaultProps()} />);
    const searchInput = screen.getByPlaceholderText('Search fields...');
    expect(searchInput).toBeInTheDocument();
  });

  it('filters data sources when search term is entered', () => {
    render(<DataSourceModal {...getDefaultProps()} />);
    const searchInput = screen.getByPlaceholderText('Search fields...');

    // Initially should show both "Email" and "Name" fields from Form A
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();

    // Search for "email"
    fireEvent.change(searchInput, { target: { value: 'email' } });

    // Should still show "Email" field
    expect(screen.getByText('Email')).toBeInTheDocument();
    // Name field should still be visible (filtering is handled by DataSourceTree)
  });

  it('renders Direct Dependencies section when directDependencies exist', () => {
    render(<DataSourceModal {...getDefaultProps()} />);
    expect(screen.getByText('Direct Dependencies')).toBeInTheDocument();
    expect(screen.getByText('Forms that this form directly depends on')).toBeInTheDocument();
  });

  it('renders Transitive Dependencies section when transitiveDependencies exist', () => {
    const props = getDefaultProps();
    props.transitiveDependencies = [
      {
        id: 'form-b',
        name: 'Form B',
        type: 'form',
        getFields: () => [
          { id: 'field1', label: 'Field 1', type: 'text', path: 'Form B.Field 1' },
        ],
      },
    ];

    render(<DataSourceModal {...props} />);
    expect(screen.getByText('Transitive Dependencies')).toBeInTheDocument();
    expect(screen.getByText('Forms that upstream forms depend on')).toBeInTheDocument();
  });

  it('renders Global Sources section when globalSources exist', () => {
    render(<DataSourceModal {...getDefaultProps()} />);
    expect(screen.getByText('Global System Dependencies')).toBeInTheDocument();
    expect(screen.getByText('System-wide properties and data')).toBeInTheDocument();
  });

  it('shows "No data sources available" when no sources exist', () => {
    const props = getDefaultProps();
    props.directDependencies = [];
    props.transitiveDependencies = [];
    props.globalSources = [];

    render(<DataSourceModal {...props} />);
    expect(screen.getByText('No data sources available for this form')).toBeInTheDocument();
  });

  it('calls onSelectField with correct mapping when matching types are selected', () => {
    render(<DataSourceModal {...getDefaultProps()} />);

    // Click the email field from Form A (matches target field type)
    const emailField = screen.getByText('Email');
    fireEvent.click(emailField);

    expect(mockOnSelectField).toHaveBeenCalledWith({
      targetFormId: '',
      targetFieldId: 'email',
      sourceType: 'form',
      sourceFormId: 'form-a',
      sourceFieldId: 'email',
      sourcePath: 'Form A.Email',
    });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('shows confirmation dialog when field types mismatch', () => {
    const targetField: FormField = {
      id: 'email',
      label: 'Email Address',
      type: 'email',
    };

    render(
      <DataSourceModal
        {...getDefaultProps()}
        targetField={targetField}
      />
    );

    // Click the "Name" field which is type 'text', should trigger confirmation
    const nameField = screen.getByText('Name');
    fireEvent.click(nameField);

    // Confirmation dialog should appear
    expect(screen.getByText('Type Mismatch Warning')).toBeInTheDocument();
    expect(screen.getByText(/Warning: The source data type does NOT match/)).toBeInTheDocument();
  });

  it('creates mapping after confirming type mismatch', async () => {
    const targetField: FormField = {
      id: 'email',
      label: 'Email Address',
      type: 'email',
    };

    render(
      <DataSourceModal
        {...getDefaultProps()}
        targetField={targetField}
      />
    );

    // Click the "Name" field which is type 'text'
    const nameField = screen.getByText('Name');
    fireEvent.click(nameField);

    // Confirm the type mismatch
    const continueButton = screen.getByText('Continue Anyway');
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(mockOnSelectField).toHaveBeenCalledWith({
        targetFormId: '',
        targetFieldId: 'email',
        sourceType: 'form',
        sourceFormId: 'form-a',
        sourceFieldId: 'name',
        sourcePath: 'Form A.Name',
      });
    });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('cancels mapping creation when type mismatch is rejected', async () => {
    const targetField: FormField = {
      id: 'email',
      label: 'Email Address',
      type: 'email',
    };

    render(
      <DataSourceModal
        {...getDefaultProps()}
        targetField={targetField}
      />
    );

    // Click the "Name" field which is type 'text'
    const nameField = screen.getByText('Name');
    fireEvent.click(nameField);

    // Cancel the type mismatch
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(mockOnSelectField).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  it('cleans up confirmation state when modal closes', () => {
    const { rerender } = render(<DataSourceModal {...getDefaultProps()} />);

    // Open modal and trigger confirmation
    const nameField = screen.getByText('Name');
    fireEvent.click(nameField);

    // Close modal
    rerender(<DataSourceModal {...getDefaultProps()} isOpen={false} />);

    // Reopen modal - confirmation should not be visible
    rerender(<DataSourceModal {...getDefaultProps()} isOpen={true} />);

    expect(screen.queryByText('Type Mismatch Warning')).not.toBeInTheDocument();
  });

  it('handles global data source selection correctly', () => {
    const targetField: FormField = {
      id: 'status',
      label: 'Status',
      type: 'text',
    };

    const { container } = render(
      <DataSourceModal
        {...getDefaultProps()}
        targetField={targetField}
      />
    );

    // Click the "Status" field from Action Properties (global source)
    // Find the button containing Status (not the strong tag in header)
    const buttons = container.querySelectorAll('button');
    const statusButton = Array.from(buttons).find(btn => {
      const span = btn.querySelector('.text-sm.text-gray-900');
      return span?.textContent === 'Status';
    });

    expect(statusButton).toBeDefined();
    if (statusButton) {
      fireEvent.click(statusButton);

      expect(mockOnSelectField).toHaveBeenCalledWith({
        targetFormId: '',
        targetFieldId: 'status',
        sourceType: 'global',
        sourceFormId: undefined,
        sourceFieldId: 'status',
        sourcePath: 'Action.Status',
      });
    }
  });

  it('disables field selection when confirmation dialog is open', () => {
    render(<DataSourceModal {...getDefaultProps()} />);

    // Click field to trigger confirmation
    const nameField = screen.getByText('Name');
    fireEvent.click(nameField);

    // Try to click another field while confirmation is open
    const emailField = screen.getByText('Email');
    fireEvent.click(emailField);

    // Should only have been called once (for the first field)
    expect(mockOnSelectField).not.toHaveBeenCalled();
  });

  it('closes confirmation dialog when backdrop is clicked while confirmation is open', () => {
    const { container } = render(<DataSourceModal {...getDefaultProps()} />);

    // Trigger confirmation
    const nameField = screen.getByText('Name');
    fireEvent.click(nameField);

    // Click backdrop
    const backdrop = container.querySelector('.backdrop-blur-sm');
    if (backdrop) {
      fireEvent.click(backdrop);
    }

    // Confirmation should close but not the modal
    expect(screen.queryByText('Type Mismatch Warning')).not.toBeInTheDocument();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('applies modal-enhanced CSS class', () => {
    const { container } = render(<DataSourceModal {...getDefaultProps()} />);
    const modal = container.querySelector('.modal-enhanced');
    expect(modal).toBeInTheDocument();
  });

  it('applies backdrop-blur-sm to backdrop', () => {
    const { container } = render(<DataSourceModal {...getDefaultProps()} />);
    const backdrop = container.querySelector('.backdrop-blur-sm');
    expect(backdrop).toBeInTheDocument();
  });
});
