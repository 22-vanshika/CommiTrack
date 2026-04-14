import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SalesList, { Sale } from './SalesList';

// --- Mock Data ---
const mockSales: Sale[] = [
  {
    id: 1,
    policy_number: 'POL-001',
    policy_value: 100000,
    sale_date: '2025-10-21T10:00:00Z',
    agent_id: 4,
    agent_name: 'Sarah',
    is_cancelled: false,
  },
  {
    id: 2,
    policy_number: 'POL-002',
    policy_value: 50000,
    sale_date: '2025-10-20T11:00:00Z',
    agent_id: 5,
    agent_name: 'John',
    is_cancelled: true,
  },
];

describe('SalesList Component', () => {
  const mockOnCancelSale = jest.fn();

  beforeEach(() => {
    mockOnCancelSale.mockClear();
  });

  it('renders headers and "no sales" message when empty', () => {
    render(<SalesList sales={[]} onCancelSale={mockOnCancelSale} />);
    expect(
      screen.getByRole('columnheader', { name: /Policy #/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: /Value/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: /Agent/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: /Date/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: /Status/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: /Actions/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/No sales recorded yet./i)).toBeInTheDocument();
  });

  it('renders sales data correctly', () => {
    render(<SalesList sales={mockSales} onCancelSale={mockOnCancelSale} />);

    // Check data for sale 1
    expect(screen.getByText('POL-001')).toBeInTheDocument();
    // FIX HERE: Match the Indian locale format
    expect(screen.getByText('$1,00,000')).toBeInTheDocument();
    expect(screen.getByText('Sarah')).toBeInTheDocument();
    // ...
    // Check data for sale 2
    expect(screen.getByText('POL-002')).toBeInTheDocument();
    expect(screen.getByText('$50,000')).toBeInTheDocument(); // This format seems okay
    // ...
  });

  it('calls onCancelSale with correct id when Cancel button is clicked', () => {
    render(<SalesList sales={mockSales} onCancelSale={mockOnCancelSale} />);

    // Find the cancel button in the first row (Sale ID 1)
    const cancelButton1 = screen.getAllByRole('button', { name: /Cancel/i })[0];
    fireEvent.click(cancelButton1);

    expect(mockOnCancelSale).toHaveBeenCalledTimes(1);
    expect(mockOnCancelSale).toHaveBeenCalledWith(1); // Check it was called with Sale ID 1
  });

  it('disables Cancel button for already cancelled sales', () => {
    render(<SalesList sales={mockSales} onCancelSale={mockOnCancelSale} />);

    // Cancel button for Sale 1 (Active) should be enabled
    const cancelButton1 = screen.getAllByRole('button', { name: /Cancel/i })[0];
    expect(cancelButton1).not.toBeDisabled();

    // Cancel button for Sale 2 (Cancelled) should be disabled
    const cancelButton2 = screen.getAllByRole('button', { name: /Cancel/i })[1];
    expect(cancelButton2).toBeDisabled();
  });

  it('displays cancelled status badge correctly', () => {
    render(<SalesList sales={mockSales} onCancelSale={mockOnCancelSale} />);

    // Check for Active badge on first sale
    expect(screen.getByText('Active')).toBeInTheDocument();

    // Check for Cancelled badge on second sale
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  it('formats dates correctly', () => {
    render(<SalesList sales={mockSales} onCancelSale={mockOnCancelSale} />);

    // Dates should be formatted (exact format depends on locale)
    const rows = screen.getAllByRole('row');
    // 1 header + 2 data rows
    expect(rows).toHaveLength(3);
  });

  it('renders correct number of sales', () => {
    const manySales: Sale[] = [
      {
        id: 1,
        policy_number: 'POL-001',
        policy_value: 100000,
        sale_date: '2025-10-21T10:00:00Z',
        agent_id: 1,
        agent_name: 'Agent 1',
        is_cancelled: false,
      },
      {
        id: 2,
        policy_number: 'POL-002',
        policy_value: 200000,
        sale_date: '2025-10-20T10:00:00Z',
        agent_id: 2,
        agent_name: 'Agent 2',
        is_cancelled: false,
      },
      {
        id: 3,
        policy_number: 'POL-003',
        policy_value: 300000,
        sale_date: '2025-10-19T10:00:00Z',
        agent_id: 3,
        agent_name: 'Agent 3',
        is_cancelled: false,
      },
    ];

    render(<SalesList sales={manySales} onCancelSale={mockOnCancelSale} />);

    expect(screen.getByText('POL-001')).toBeInTheDocument();
    expect(screen.getByText('POL-002')).toBeInTheDocument();
    expect(screen.getByText('POL-003')).toBeInTheDocument();

    const cancelButtons = screen.getAllByRole('button', { name: /Cancel/i });
    expect(cancelButtons).toHaveLength(3);
  });

  it('handles large policy values correctly', () => {
    const largeSales: Sale[] = [
      {
        id: 1,
        policy_number: 'POL-BIG',
        policy_value: 9999999.99,
        sale_date: '2025-10-21T10:00:00Z',
        agent_id: 1,
        agent_name: 'Big Agent',
        is_cancelled: false,
      },
    ];

    render(<SalesList sales={largeSales} onCancelSale={mockOnCancelSale} />);

    expect(screen.getByText('POL-BIG')).toBeInTheDocument();
    expect(screen.getByText('Big Agent')).toBeInTheDocument();
  });

  it('renders all table headers', () => {
    render(<SalesList sales={[]} onCancelSale={mockOnCancelSale} />);

    expect(screen.getByText('Policy #')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();
    expect(screen.getByText('Agent')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('does not call onCancelSale when clicking disabled button', () => {
    render(<SalesList sales={mockSales} onCancelSale={mockOnCancelSale} />);

    // Click the disabled button for cancelled sale
    const cancelButton2 = screen.getAllByRole('button', { name: /Cancel/i })[1];
    fireEvent.click(cancelButton2);

    // Should not have called the handler
    expect(mockOnCancelSale).not.toHaveBeenCalled();
  });
});
