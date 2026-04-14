import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CommissionReports from './CommissionReports';

describe('CommissionReports', () => {
  const mockSales = [
    {
      id: 1,
      policy_number: 'POL001',
      policy_value: 10000,
      agent_id: 1,
      agent_name: 'John Doe',
      sale_date: '2024-01-15',
      is_cancelled: false,
    },
    {
      id: 2,
      policy_number: 'POL002',
      policy_value: 20000,
      agent_id: 2,
      agent_name: 'Jane Smith',
      sale_date: '2024-01-20',
      is_cancelled: false,
    },
  ];

  const mockBonuses = [
    { id: 1, amount: 1000, type: 'Monthly', agent_id: 1 },
    { id: 2, amount: 2000, type: 'Quarterly', agent_id: 2 },
  ];

  it('renders commission reports component', () => {
    render(<CommissionReports sales={mockSales} bonuses={mockBonuses} />);
    expect(screen.getByText('Commission Reports')).toBeInTheDocument();
  });

  it('displays summary cards with totals', () => {
    render(<CommissionReports sales={mockSales} bonuses={mockBonuses} />);

    expect(screen.getByText('Total Commissions')).toBeInTheDocument();
    expect(screen.getByText('Total Bonuses')).toBeInTheDocument();
    expect(screen.getByText('Grand Total')).toBeInTheDocument();

    // Total commissions: 50% of (10000 + 20000) = 15000
    expect(screen.getByText('$15,000.00')).toBeInTheDocument();
    // Total bonuses: 1000 + 2000 = 3000
    expect(screen.getByText('$3,000.00')).toBeInTheDocument();
    // Grand total: 15000 + 3000 = 18000
    expect(screen.getByText('$18,000.00')).toBeInTheDocument();
  });

  it('displays commission records in table', () => {
    render(<CommissionReports sales={mockSales} bonuses={mockBonuses} />);

    expect(screen.getAllByText('POL001').length).toBeGreaterThan(0);
    expect(screen.getAllByText('POL002').length).toBeGreaterThan(0);
    expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Jane Smith').length).toBeGreaterThan(0);
  });

  it('filters commissions by agent', () => {
    render(<CommissionReports sales={mockSales} bonuses={mockBonuses} />);

    const agentFilter = screen.getByLabelText(/filter by agent/i);
    fireEvent.change(agentFilter, { target: { value: '1' } });

    // John Doe should appear in both the table and filter dropdown
    expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
    // Jane Smith still appears in the dropdown, but not in the commission table rows
    expect(
      screen.getByText(/showing 1 of 2 commission records/i)
    ).toBeInTheDocument();
  });

  it('filters commissions by type', () => {
    render(<CommissionReports sales={mockSales} bonuses={mockBonuses} />);

    const typeFilter = screen.getByLabelText(/filter by type/i);
    fireEvent.change(typeFilter, { target: { value: 'FYC' } });

    // All commissions should be FYC type in this test data
    expect(screen.getByText('POL001')).toBeInTheDocument();
    expect(screen.getByText('POL002')).toBeInTheDocument();
  });

  it('shows export CSV button', () => {
    render(<CommissionReports sales={mockSales} bonuses={mockBonuses} />);

    const exportButton = screen.getByRole('button', { name: /export csv/i });
    expect(exportButton).toBeInTheDocument();
    expect(exportButton).not.toBeDisabled();
  });

  it('disables export button when no data', () => {
    render(<CommissionReports sales={[]} bonuses={[]} />);

    const exportButton = screen.getByRole('button', { name: /export csv/i });
    expect(exportButton).toBeDisabled();
  });

  it('shows correct commission count', () => {
    render(<CommissionReports sales={mockSales} bonuses={mockBonuses} />);

    expect(
      screen.getByText(/showing 2 of 2 commission records/i)
    ).toBeInTheDocument();
  });

  it('shows empty state when no commissions', () => {
    render(<CommissionReports sales={[]} bonuses={[]} />);

    expect(
      screen.getByText(/no commissions found matching the filters/i)
    ).toBeInTheDocument();
  });

  it('calculates correct FYC commission amounts', () => {
    render(<CommissionReports sales={mockSales} bonuses={mockBonuses} />);

    // 50% of $10,000 = $5,000
    expect(screen.getByText('$5,000.00')).toBeInTheDocument();
    // 50% of $20,000 = $10,000
    expect(screen.getByText('$10,000.00')).toBeInTheDocument();
  });

  it('displays agent filter options', () => {
    render(<CommissionReports sales={mockSales} bonuses={mockBonuses} />);

    const agentFilter = screen.getByLabelText(/filter by agent/i);
    expect(agentFilter).toBeInTheDocument();

    // Check that "All Agents" option exists
    const allOption = screen.getByRole('option', { name: /all agents/i });
    expect(allOption).toBeInTheDocument();
  });

  it('updates totals when filter is applied', () => {
    render(<CommissionReports sales={mockSales} bonuses={mockBonuses} />);

    const agentFilter = screen.getByLabelText(/filter by agent/i);
    fireEvent.change(agentFilter, { target: { value: '1' } });

    // Should show only John Doe's commission (50% of $10,000 = $5,000)
    expect(
      screen.getByText(/showing 1 of 2 commission records/i)
    ).toBeInTheDocument();
  });
});
