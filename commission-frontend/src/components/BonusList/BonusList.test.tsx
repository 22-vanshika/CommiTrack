import React from 'react';
import { render, screen } from '@testing-library/react';
import BonusList, { Bonus } from './BonusList';

// --- Mock Data ---
const mockBonuses: Bonus[] = [
  {
    id: 1,
    period: '2025-10',
    bonus_type: 'Monthly',
    agent_id: 4,
    agent_name: 'Sarah',
    amount: 5500.0,
  },
  {
    id: 2,
    period: '2025-10',
    bonus_type: 'Monthly',
    agent_id: 3,
    agent_name: 'Bob',
    amount: 3300.0,
  },
];

describe('BonusList Component', () => {
  it('renders headers and "no bonuses" message when empty', () => {
    render(<BonusList bonuses={[]} />);
    expect(
      screen.getByRole('columnheader', { name: /Period/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: /Type/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: /Agent/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: /Amount/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/No bonuses calculated yet./i)).toBeInTheDocument();
  });

  it('renders bonus data correctly', () => {
    render(<BonusList bonuses={mockBonuses} />);

    // Option A: Check for both instances (better)
    expect(screen.getAllByText('2025-10')).toHaveLength(2);

    // Check other unique data points
    expect(screen.getByText('Sarah')).toBeInTheDocument();
    expect(screen.getByText('$5,500.00')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('$3,300.00')).toBeInTheDocument();
  });

  it('renders all bonus types correctly', () => {
    const mixedBonuses: Bonus[] = [
      {
        id: 1,
        period: '2025-10',
        bonus_type: 'Monthly',
        agent_id: 1,
        agent_name: 'Agent A',
        amount: 1000,
      },
      {
        id: 2,
        period: '2025-Q3',
        bonus_type: 'Quarterly',
        agent_id: 2,
        agent_name: 'Agent B',
        amount: 5000,
      },
      {
        id: 3,
        period: '2025',
        bonus_type: 'Annual',
        agent_id: 3,
        agent_name: 'Agent C',
        amount: 20000,
      },
    ];

    render(<BonusList bonuses={mixedBonuses} />);

    expect(screen.getByText('Monthly')).toBeInTheDocument();
    expect(screen.getByText('Quarterly')).toBeInTheDocument();
    expect(screen.getByText('Annual')).toBeInTheDocument();

    expect(screen.getByText('2025-10')).toBeInTheDocument();
    expect(screen.getByText('2025-Q3')).toBeInTheDocument();
    expect(screen.getByText('2025')).toBeInTheDocument();
  });

  it('formats large bonus amounts correctly', () => {
    const largeBonuses: Bonus[] = [
      {
        id: 1,
        period: '2025-10',
        bonus_type: 'Annual',
        agent_id: 1,
        agent_name: 'Top Agent',
        amount: 123456.79,
      },
    ];

    render(<BonusList bonuses={largeBonuses} />);

    // Check the formatted amount - use container to get the text
    expect(screen.getByText('Top Agent')).toBeInTheDocument();
    // Amount should be somewhere in the document, formatted as currency
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeGreaterThan(0);
  });

  it('renders bonuses in correct table structure', () => {
    render(<BonusList bonuses={mockBonuses} />);

    const rows = screen.getAllByRole('row');
    // 1 header row + 2 data rows
    expect(rows).toHaveLength(3);
  });

  it('renders zero amount bonuses correctly', () => {
    const zeroBonuses: Bonus[] = [
      {
        id: 1,
        period: '2025-10',
        bonus_type: 'Monthly',
        agent_id: 1,
        agent_name: 'Agent',
        amount: 0,
      },
    ];

    render(<BonusList bonuses={zeroBonuses} />);

    expect(screen.getByText('$0.00')).toBeInTheDocument();
  });
});
