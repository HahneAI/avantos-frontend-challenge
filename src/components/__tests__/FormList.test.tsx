import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormList } from '../FormList';
import { Form } from '../../types';

describe('FormList', () => {
  const mockForms: Form[] = [
    {
      id: 'form-a',
      name: 'Form A',
      fields: [
        { id: 'email', label: 'Email', type: 'email' },
        { id: 'name', label: 'Name', type: 'text' },
      ],
      dependencies: [],
    },
    {
      id: 'form-b',
      name: 'Form B',
      fields: [{ id: 'status', label: 'Status', type: 'text' }],
      dependencies: ['form-a'],
    },
  ];

  it('should render all forms', () => {
    const onSelectForm = vi.fn();

    render(
      <FormList
        forms={mockForms}
        selectedFormId={null}
        onSelectForm={onSelectForm}
      />
    );

    expect(screen.getByText('Form A')).toBeInTheDocument();
    expect(screen.getByText('Form B')).toBeInTheDocument();
  });

  it('should display field count for each form', () => {
    const onSelectForm = vi.fn();

    render(
      <FormList
        forms={mockForms}
        selectedFormId={null}
        onSelectForm={onSelectForm}
      />
    );

    expect(screen.getByText('2 fields')).toBeInTheDocument();
    expect(screen.getByText('1 field')).toBeInTheDocument();
  });

  it('should display dependency count for each form', () => {
    const onSelectForm = vi.fn();

    render(
      <FormList
        forms={mockForms}
        selectedFormId={null}
        onSelectForm={onSelectForm}
      />
    );

    expect(screen.getByText('0 dependencies')).toBeInTheDocument();
    expect(screen.getByText('1 dependency')).toBeInTheDocument();
  });

  it('should call onSelectForm when a form is clicked', () => {
    const onSelectForm = vi.fn();

    render(
      <FormList
        forms={mockForms}
        selectedFormId={null}
        onSelectForm={onSelectForm}
      />
    );

    fireEvent.click(screen.getByText('Form A'));

    expect(onSelectForm).toHaveBeenCalledWith('form-a');
  });

  it('should highlight selected form', () => {
    const onSelectForm = vi.fn();

    const { container } = render(
      <FormList
        forms={mockForms}
        selectedFormId="form-a"
        onSelectForm={onSelectForm}
      />
    );

    const selectedCard = container.querySelector('.border-primary-500');
    expect(selectedCard).toBeInTheDocument();
  });

  it('should display empty state when no forms', () => {
    const onSelectForm = vi.fn();

    render(
      <FormList forms={[]} selectedFormId={null} onSelectForm={onSelectForm} />
    );

    expect(screen.getByText('No forms available')).toBeInTheDocument();
  });
});
