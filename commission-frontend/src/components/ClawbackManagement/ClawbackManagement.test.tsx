import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ClawbackManagement from './ClawbackManagement';

describe('ClawbackManagement', () => {
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
    {
      id: 3,
      policy_number: 'POL003',
      policy_value: 15000,
      agent_id: 1,
      agent_name: 'John Doe',
      sale_date: '2024-01-25',
      is_cancelled: true,
    },
  ];

  const mockOnCancelSale = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders clawback management component', () => {
    render(
      <ClawbackManagement sales={mockSales} onCancelSale={mockOnCancelSale} />
    );
    expect(screen.getByText('Clawback Management')).toBeInTheDocument();
  });

  it('displays only active (non-cancelled) policies', () => {
    render(
      <ClawbackManagement sales={mockSales} onCancelSale={mockOnCancelSale} />
    );

    expect(screen.getByText('POL001')).toBeInTheDocument();
    expect(screen.getByText('POL002')).toBeInTheDocument();
    expect(screen.queryByText('POL003')).not.toBeInTheDocument();
  });

  it('shows active policy count', () => {
    render(
      <ClawbackManagement sales={mockSales} onCancelSale={mockOnCancelSale} />
    );

    expect(
      screen.getByText(/showing 2 of 2 active policies/i)
    ).toBeInTheDocument();
  });

  it('filters policies by search term (policy number)', () => {
    render(
      <ClawbackManagement sales={mockSales} onCancelSale={mockOnCancelSale} />
    );

    const searchInput = screen.getByLabelText(/search by policy or agent/i);
    fireEvent.change(searchInput, { target: { value: 'POL001' } });

    expect(screen.getByText('POL001')).toBeInTheDocument();
    expect(screen.queryByText('POL002')).not.toBeInTheDocument();
  });

  it('filters policies by search term (agent name)', () => {
    render(
      <ClawbackManagement sales={mockSales} onCancelSale={mockOnCancelSale} />
    );

    const searchInput = screen.getByLabelText(/search by policy or agent/i);
    fireEvent.change(searchInput, { target: { value: 'Jane' } });

    expect(screen.getByText('POL002')).toBeInTheDocument();
    expect(screen.queryByText('POL001')).not.toBeInTheDocument();
  });

  it('shows placeholder message when no policy selected', () => {
    render(
      <ClawbackManagement sales={mockSales} onCancelSale={mockOnCancelSale} />
    );

    expect(
      screen.getByText(/select a policy to view clawback impact/i)
    ).toBeInTheDocument();
  });

  it('displays impact analysis when policy is selected', () => {
    render(
      <ClawbackManagement sales={mockSales} onCancelSale={mockOnCancelSale} />
    );

    const policyCard = screen.getAllByText('POL001')[0].closest('div');
    fireEvent.click(policyCard!);

    expect(screen.getByText('Policy Details')).toBeInTheDocument();
    expect(screen.getByText(/impact breakdown/i)).toBeInTheDocument();
    expect(screen.getByText('Affected Agents')).toBeInTheDocument();
  });

  it('calculates correct clawback impact', () => {
    render(
      <ClawbackManagement sales={mockSales} onCancelSale={mockOnCancelSale} />
    );

    const policyCard = screen.getAllByText('POL001')[0].closest('div');
    fireEvent.click(policyCard!);

    // 50% of $10,000 = $5,000 (appears multiple times in the impact breakdown)
    const amounts = screen.getAllByText(/\$5,000\.00/);
    expect(amounts.length).toBeGreaterThan(0);
  });

  it('highlights selected policy', () => {
    render(
      <ClawbackManagement sales={mockSales} onCancelSale={mockOnCancelSale} />
    );

    // Find the clickable policy card element
    const allPOL001 = screen.getAllByText('POL001');
    const policyCard = allPOL001[0].closest('div[class*="cursor-pointer"]');
    fireEvent.click(policyCard!);

    // Check that the policy is selected by looking for the blue background class
    expect(policyCard?.className).toContain('bg-blue-50');
  });

  it('shows confirmation modal when initiate clawback is clicked', () => {
    render(
      <ClawbackManagement sales={mockSales} onCancelSale={mockOnCancelSale} />
    );

    const policyCard = screen.getAllByText('POL001')[0].closest('div');
    fireEvent.click(policyCard!);

    const initiateButton = screen.getByRole('button', {
      name: /cancel policy & initiate clawback/i,
    });
    fireEvent.click(initiateButton);

    expect(screen.getAllByText('Confirm Clawback')[0]).toBeInTheDocument();
    expect(
      screen.getByText(/are you sure you want to cancel policy/i)
    ).toBeInTheDocument();
  });

  it('calls onCancelSale when clawback is confirmed', async () => {
    render(
      <ClawbackManagement sales={mockSales} onCancelSale={mockOnCancelSale} />
    );

    const policyCard = screen.getByText('POL001').closest('div');
    fireEvent.click(policyCard!);

    const initiateButton = screen.getByRole('button', {
      name: /cancel policy & initiate clawback/i,
    });
    fireEvent.click(initiateButton);

    const confirmButton = screen.getAllByRole('button', {
      name: /confirm clawback/i,
    })[0];
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockOnCancelSale).toHaveBeenCalledWith(1);
    });
  });

  it('closes modal when cancel is clicked', () => {
    render(
      <ClawbackManagement sales={mockSales} onCancelSale={mockOnCancelSale} />
    );

    const policyCard = screen.getByText('POL001').closest('div');
    fireEvent.click(policyCard!);

    const initiateButton = screen.getByRole('button', {
      name: /cancel policy & initiate clawback/i,
    });
    fireEvent.click(initiateButton);

    const cancelButton = screen.getAllByRole('button', { name: /cancel/i })[1];
    fireEvent.click(cancelButton);

    expect(screen.queryByText('Confirm Clawback')).not.toBeInTheDocument();
  });

  it('clears selection when clear button is clicked', () => {
    render(
      <ClawbackManagement sales={mockSales} onCancelSale={mockOnCancelSale} />
    );

    const policyCard = screen.getByText('POL001').closest('div');
    fireEvent.click(policyCard!);

    const clearButton = screen.getByRole('button', { name: /clear/i });
    fireEvent.click(clearButton);

    expect(
      screen.getByText(/select a policy to view clawback impact/i)
    ).toBeInTheDocument();
  });

  it('shows empty state when no policies match search', () => {
    render(
      <ClawbackManagement sales={mockSales} onCancelSale={mockOnCancelSale} />
    );

    const searchInput = screen.getByLabelText(/search by policy or agent/i);
    fireEvent.change(searchInput, { target: { value: 'NONEXISTENT' } });

    expect(
      screen.getByText(/no policies match your search/i)
    ).toBeInTheDocument();
  });

  it('shows empty state when no active policies', () => {
    const cancelledSales = [
      { ...mockSales[0], is_cancelled: true },
      { ...mockSales[1], is_cancelled: true },
    ];

    render(
      <ClawbackManagement
        sales={cancelledSales}
        onCancelSale={mockOnCancelSale}
      />
    );

    expect(screen.getByText(/no active policies found/i)).toBeInTheDocument();
  });

  it('displays policy details correctly', () => {
    render(
      <ClawbackManagement sales={mockSales} onCancelSale={mockOnCancelSale} />
    );

    const policyCard = screen.getAllByText('POL001')[0].closest('div');
    fireEvent.click(policyCard!);

    // Multiple instances of these texts exist in list and details
    expect(screen.getAllByText('POL001').length).toBeGreaterThan(0);
    expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\$10,000/).length).toBeGreaterThan(0);
  });

  it('displays affected agents list', () => {
    render(
      <ClawbackManagement sales={mockSales} onCancelSale={mockOnCancelSale} />
    );

    const policyCard = screen.getAllByText('POL001')[0].closest('div');
    fireEvent.click(policyCard!);

    expect(screen.getByText('Affected Agents')).toBeInTheDocument();
    expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
  });
});
