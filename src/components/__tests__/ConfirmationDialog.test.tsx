import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmationDialog } from '../ConfirmationDialog';

describe('ConfirmationDialog', () => {
  let mockOnConfirm: ReturnType<typeof vi.fn>;
  let mockOnCancel: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnConfirm = vi.fn();
    mockOnCancel = vi.fn();
  });

  const getDefaultProps = () => ({
    isOpen: true,
    message: 'Warning: Type mismatch detected',
    sourceType: 'date',
    targetType: 'text',
    onConfirm: mockOnConfirm,
    onCancel: mockOnCancel,
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<ConfirmationDialog {...getDefaultProps()} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders dialog with correct message when open', () => {
    render(<ConfirmationDialog {...getDefaultProps()} />);
    expect(screen.getByText('Type Mismatch Warning')).toBeInTheDocument();
    expect(screen.getByText('Warning: Type mismatch detected')).toBeInTheDocument();
  });

  it('displays source and target types correctly', () => {
    render(<ConfirmationDialog {...getDefaultProps()} />);
    expect(screen.getByText('date')).toBeInTheDocument();
    expect(screen.getByText('text')).toBeInTheDocument();
    expect(screen.getByText('Source Type:')).toBeInTheDocument();
    expect(screen.getByText('Target Type:')).toBeInTheDocument();
  });

  it('calls onConfirm when Continue button is clicked', () => {
    render(<ConfirmationDialog {...getDefaultProps()} />);
    const continueButton = screen.getByText('Continue Anyway');
    fireEvent.click(continueButton);
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when Cancel button is clicked', () => {
    render(<ConfirmationDialog {...getDefaultProps()} />);
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when close button (X) is clicked', () => {
    render(<ConfirmationDialog {...getDefaultProps()} />);
    const closeButton = screen.getByLabelText('Close dialog');
    fireEvent.click(closeButton);
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when backdrop is clicked', () => {
    const { container } = render(<ConfirmationDialog {...getDefaultProps()} />);
    const backdrop = container.querySelector('.backdrop-blur-sm');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    }
  });

  it('has correct z-index to appear above DataSourceModal', () => {
    const { container } = render(<ConfirmationDialog {...getDefaultProps()} />);
    const dialog = container.querySelector('.z-\\[60\\]');
    expect(dialog).toBeInTheDocument();
  });

  it('applies modal-enhanced CSS class', () => {
    const { container } = render(<ConfirmationDialog {...getDefaultProps()} />);
    const modal = container.querySelector('.modal-enhanced');
    expect(modal).toBeInTheDocument();
  });

  it('displays warning icon', () => {
    const { container } = render(<ConfirmationDialog {...getDefaultProps()} />);
    const warningIcon = container.querySelector('.text-yellow-600');
    expect(warningIcon).toBeInTheDocument();
  });

  it('shows additional warning information', () => {
    render(<ConfirmationDialog {...getDefaultProps()} />);
    expect(
      screen.getByText(/Proceeding with mismatched types may result in unexpected behavior/i)
    ).toBeInTheDocument();
  });
});
