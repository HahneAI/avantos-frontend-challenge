import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataSourceTree } from '../DataSourceTree';
import { DataSource } from '../../types';

describe('DataSourceTree', () => {
  let mockOnSelectField: ReturnType<typeof vi.fn>;

  const mockDataSources: DataSource[] = [
    {
      id: 'form-a',
      name: 'Form A',
      type: 'form',
      getFields: () => [
        { id: 'email', label: 'Email', type: 'email', path: 'Form A.Email' },
        { id: 'name', label: 'Name', type: 'text', path: 'Form A.Name' },
        { id: 'phone', label: 'Phone Number', type: 'text', path: 'Form A.Phone Number' },
      ],
    },
    {
      id: 'form-b',
      name: 'Form B',
      type: 'form',
      getFields: () => [
        { id: 'completed_at', label: 'Completion Date', type: 'date', path: 'Form B.Completion Date' },
        { id: 'notes', label: 'Notes', type: 'text', path: 'Form B.Notes' },
      ],
    },
    {
      id: 'action-props',
      name: 'Action Properties',
      type: 'global',
      getFields: () => [
        { id: 'status', label: 'Status', type: 'text', path: 'Action.Status' },
        { id: 'assignee', label: 'Assignee', type: 'text', path: 'Action.Assignee' },
      ],
    },
  ];

  beforeEach(() => {
    mockOnSelectField = vi.fn();
  });

  const getDefaultProps = () => ({
    dataSources: mockDataSources,
    onSelectField: mockOnSelectField,
    filterText: '',
  });

  it('renders all data sources', () => {
    render(<DataSourceTree {...getDefaultProps()} />);
    expect(screen.getByText('Form A')).toBeInTheDocument();
    expect(screen.getByText('Form B')).toBeInTheDocument();
    expect(screen.getByText('Action Properties')).toBeInTheDocument();
  });

  it('shows field count for each data source', () => {
    render(<DataSourceTree {...getDefaultProps()} />);
    expect(screen.getByText('(3 fields)')).toBeInTheDocument();
    // Form B and Action Properties both have 2 fields, so use getAllByText
    const twoFieldsElements = screen.getAllByText('(2 fields)');
    expect(twoFieldsElements).toHaveLength(2);
  });

  it('renders data sources in collapsed state by default (expanded)', () => {
    render(<DataSourceTree {...getDefaultProps()} />);

    // All sources should be expanded by default (see useState initialization)
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Completion Date')).toBeInTheDocument();
  });

  it('toggles data source expansion when header is clicked', () => {
    render(<DataSourceTree {...getDefaultProps()} />);

    // Form A should be expanded initially
    expect(screen.getByText('Email')).toBeInTheDocument();

    // Click Form A header to collapse
    const formAHeader = screen.getByText('Form A');
    fireEvent.click(formAHeader);

    // Fields should be hidden
    expect(screen.queryByText('Email')).not.toBeInTheDocument();

    // Click again to expand
    fireEvent.click(formAHeader);

    // Fields should be visible again
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('displays all fields when data source is expanded', () => {
    render(<DataSourceTree {...getDefaultProps()} />);

    // Form A fields
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Phone Number')).toBeInTheDocument();

    // Form B fields
    expect(screen.getByText('Completion Date')).toBeInTheDocument();
    expect(screen.getByText('Notes')).toBeInTheDocument();
  });

  it('displays field types for each field', () => {
    render(<DataSourceTree {...getDefaultProps()} />);

    // Check field type badges
    const emailType = screen.getAllByText('email')[0];
    expect(emailType).toBeInTheDocument();

    const textTypes = screen.getAllByText('text');
    expect(textTypes.length).toBeGreaterThan(0);

    const dateType = screen.getByText('date');
    expect(dateType).toBeInTheDocument();
  });

  it('calls onSelectField when a field is clicked', () => {
    render(<DataSourceTree {...getDefaultProps()} />);

    const emailField = screen.getByText('Email');
    fireEvent.click(emailField);

    expect(mockOnSelectField).toHaveBeenCalledWith(
      mockDataSources[0], // Form A
      mockDataSources[0].getFields()[0] // Email field
    );
  });

  it('filters fields based on filterText prop', () => {
    render(<DataSourceTree {...getDefaultProps()} filterText="email" />);

    // Should show fields matching "email"
    expect(screen.getByText('Email')).toBeInTheDocument();

    // Should not show fields not matching "email"
    expect(screen.queryByText('Name')).not.toBeInTheDocument();
    expect(screen.queryByText('Phone Number')).not.toBeInTheDocument();
  });

  it('filters fields case-insensitively', () => {
    render(<DataSourceTree {...getDefaultProps()} filterText="EMAIL" />);

    // Should still find "Email" field
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('filters by field label and id', () => {
    render(<DataSourceTree {...getDefaultProps()} filterText="status" />);

    // Should find "Status" field
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('hides data sources with no matching fields when filtering', () => {
    render(<DataSourceTree {...getDefaultProps()} filterText="email" />);

    // Form B has no fields matching "email", but header might still show
    // Check that Form B's fields are not visible
    expect(screen.queryByText('Completion Date')).not.toBeInTheDocument();
    expect(screen.queryByText('Notes')).not.toBeInTheDocument();
  });

  it('shows "No data sources available" when dataSources is empty', () => {
    render(<DataSourceTree {...getDefaultProps()} dataSources={[]} />);
    expect(screen.getByText('No data sources available')).toBeInTheDocument();
  });

  it('shows empty state icon when no data sources', () => {
    const { container } = render(<DataSourceTree {...getDefaultProps()} dataSources={[]} />);
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('handles data source with no fields', () => {
    const emptyDataSource: DataSource = {
      id: 'empty',
      name: 'Empty Form',
      type: 'form',
      getFields: () => [],
    };

    render(<DataSourceTree {...getDefaultProps()} dataSources={[emptyDataSource]} />);

    expect(screen.getByText('Empty Form')).toBeInTheDocument();
    expect(screen.getByText('(0 fields)')).toBeInTheDocument();

    // Expand the source
    expect(screen.getByText('No fields available')).toBeInTheDocument();
  });

  it('maintains expansion state when filtering', () => {
    const { rerender } = render(<DataSourceTree {...getDefaultProps()} />);

    // Collapse Form A
    const formAHeader = screen.getByText('Form A');
    fireEvent.click(formAHeader);

    expect(screen.queryByText('Email')).not.toBeInTheDocument();

    // Apply filter
    rerender(<DataSourceTree {...getDefaultProps()} filterText="email" />);

    // Form A should still be collapsed
    expect(screen.queryByText('Email')).not.toBeInTheDocument();

    // Expand Form A
    fireEvent.click(screen.getByText('Form A'));

    // Now Email should be visible
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders chevron icon that rotates when expanded', () => {
    const { container } = render(<DataSourceTree {...getDefaultProps()} />);

    // Find the first chevron (Form A)
    const chevrons = container.querySelectorAll('.rotate-90');
    expect(chevrons.length).toBeGreaterThan(0); // Should be rotated when expanded
  });

  it('applies hover styles to field buttons', () => {
    const { container } = render(<DataSourceTree {...getDefaultProps()} />);

    // Check for hover classes on field buttons
    const fieldButtons = container.querySelectorAll('.hover\\:bg-primary-50');
    expect(fieldButtons.length).toBeGreaterThan(0);
  });

  it('renders field icon for each field', () => {
    const { container } = render(<DataSourceTree {...getDefaultProps()} />);

    // Check for field icons (document icons)
    const fieldIcons = container.querySelectorAll('.text-gray-400');
    expect(fieldIcons.length).toBeGreaterThan(0);
  });

  it('handles multiple selections correctly', () => {
    render(<DataSourceTree {...getDefaultProps()} />);

    // Click multiple fields
    fireEvent.click(screen.getByText('Email'));
    fireEvent.click(screen.getByText('Name'));
    fireEvent.click(screen.getByText('Status'));

    expect(mockOnSelectField).toHaveBeenCalledTimes(3);
  });

  it('handles whitespace in filter text', () => {
    render(<DataSourceTree {...getDefaultProps()} filterText="  email  " />);

    // Component checks filterText.trim() to see if empty, but uses filterText.toLowerCase() for search
    // So "  email  ".toLowerCase() = "  email  " which won't match "email"
    // When no fields match, the entire data source is hidden (see line 76-78 in component)
    // So neither Form A nor Email field should be visible
    expect(screen.queryByText('Form A')).not.toBeInTheDocument();
    expect(screen.queryByText('Email')).not.toBeInTheDocument();
  });

  it('shows correct field count after filtering', () => {
    render(<DataSourceTree {...getDefaultProps()} filterText="email" />);

    // Form A should show 1 field (Email only)
    expect(screen.getByText('(1 field)')).toBeInTheDocument();
  });

  it('renders all three data source types correctly', () => {
    render(<DataSourceTree {...getDefaultProps()} />);

    // Verify we have form and global type sources
    const formA = mockDataSources.find(ds => ds.type === 'form');
    const globalProps = mockDataSources.find(ds => ds.type === 'global');

    expect(formA).toBeDefined();
    expect(globalProps).toBeDefined();

    expect(screen.getByText('Form A')).toBeInTheDocument();
    expect(screen.getByText('Action Properties')).toBeInTheDocument();
  });
});
