import React, { useState, useEffect } from 'react';

interface Commission {
  id: number;
  amount: number;
  commission_type: string;
  sale_id: number;
  agent_id: number;
  agent_name: string;
  policy_number: string;
  policy_value: number;
  payout_date: string;
}

interface CommissionReportsProps {
  sales: any[];
  bonuses: any[];
}

const CommissionReports: React.FC<CommissionReportsProps> = ({
  sales,
  bonuses,
}) => {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAgent, setFilterAgent] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [agents, setAgents] = useState<{ id: number; name: string }[]>([]);

  // Simulated commission data from sales
  useEffect(() => {
    const loadCommissions = () => {
      if (!sales || sales.length === 0) {
        setCommissions([]);
        setLoading(false);
        return;
      }

      // Convert sales to commission records
      const commissionData: Commission[] = [];

      sales.forEach((sale) => {
        // FYC Commission (50%)
        commissionData.push({
          id: commissionData.length + 1,
          amount: sale.policy_value * 0.5,
          commission_type: 'FYC',
          sale_id: sale.id,
          agent_id: sale.agent_id,
          agent_name: sale.agent_name,
          policy_number: sale.policy_number,
          policy_value: sale.policy_value,
          payout_date: sale.sale_date,
        });
      });

      setCommissions(commissionData);
      setLoading(false);
    };

    loadCommissions();
  }, [sales]);

  // Extract unique agents from commissions
  useEffect(() => {
    const uniqueAgents = Array.from(
      new Map(
        commissions.map((c) => [
          c.agent_id,
          { id: c.agent_id, name: c.agent_name },
        ])
      ).values()
    );
    setAgents(uniqueAgents);
  }, [commissions]);

  // Filter commissions
  const filteredCommissions = commissions.filter((comm) => {
    const agentMatch = !filterAgent || comm.agent_id.toString() === filterAgent;
    const typeMatch =
      filterType === 'all' || comm.commission_type === filterType;
    return agentMatch && typeMatch;
  });

  // Calculate totals
  const totalCommissions = filteredCommissions.reduce(
    (sum, comm) => sum + comm.amount,
    0
  );
  const totalBonuses = bonuses.reduce((sum, bonus) => sum + bonus.amount, 0);
  const grandTotal = totalCommissions + totalBonuses;

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      'Date',
      'Agent',
      'Type',
      'Policy',
      'Policy Value',
      'Commission Amount',
    ];
    const rows = filteredCommissions.map((comm) => [
      new Date(comm.payout_date).toLocaleDateString(),
      comm.agent_name,
      comm.commission_type,
      comm.policy_number,
      `$${comm.policy_value.toLocaleString()}`,
      `$${comm.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `commission-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div
        className="p-4 rounded-lg"
        style={{
          backgroundColor: 'var(--color-bgCard)',
          boxShadow: 'var(--shadow-xl)',
          color: 'var(--color-textPrimary)',
        }}
      >
        Loading commission reports...
      </div>
    );
  }

  return (
    <div
      className="p-4 rounded-lg"
      style={{
        backgroundColor: 'var(--color-bgCard)',
        boxShadow: 'var(--shadow-xl)',
      }}
    >
      <div className="flex justify-between items-center mb-4">
        <h2
          className="text-xl font-semibold"
          style={{ color: 'var(--color-textPrimary)' }}
        >
          Commission Reports
        </h2>
        <button
          onClick={exportToCSV}
          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2"
          style={{
            backgroundColor: 'var(--color-success)',
            color: 'var(--color-textPrimary)',
          }}
          disabled={filteredCommissions.length === 0}
        >
          📥 Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div
          className="p-4 rounded-lg"
          style={{ backgroundColor: 'var(--color-primaryBg)' }}
        >
          <dt
            className="text-sm font-medium"
            style={{ color: 'var(--color-primary)' }}
          >
            Total Commissions
          </dt>
          <dd
            className="mt-1 text-2xl font-semibold"
            style={{ color: 'var(--color-primaryLight)' }}
          >
            $
            {totalCommissions.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </dd>
        </div>
        <div
          className="p-4 rounded-lg"
          style={{ backgroundColor: 'var(--color-infoBg)' }}
        >
          <dt
            className="text-sm font-medium"
            style={{ color: 'var(--color-info)' }}
          >
            Total Bonuses
          </dt>
          <dd
            className="mt-1 text-2xl font-semibold"
            style={{ color: 'var(--color-infoLight)' }}
          >
            $
            {totalBonuses.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </dd>
        </div>
        <div
          className="p-4 rounded-lg"
          style={{ backgroundColor: 'var(--color-successBg)' }}
        >
          <dt
            className="text-sm font-medium"
            style={{ color: 'var(--color-success)' }}
          >
            Grand Total
          </dt>
          <dd
            className="mt-1 text-2xl font-semibold"
            style={{ color: 'var(--color-successLight)' }}
          >
            $
            {grandTotal.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </dd>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <label
            htmlFor="filterAgent"
            className="block text-sm font-medium mb-1"
            style={{ color: 'var(--color-textPrimary)' }}
          >
            Filter by Agent
          </label>
          <select
            id="filterAgent"
            value={filterAgent}
            onChange={(e) => setFilterAgent(e.target.value)}
            className="block w-full rounded-md shadow-sm focus:outline-none focus:ring-2 sm:text-sm"
            style={{
              backgroundColor: 'var(--color-bgInput)',
              color: 'var(--color-textPrimary)',
            }}
          >
            <option value="">All Agents</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id.toString()}>
                {agent.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label
            htmlFor="filterType"
            className="block text-sm font-medium mb-1"
            style={{ color: 'var(--color-textPrimary)' }}
          >
            Filter by Type
          </label>
          <select
            id="filterType"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="block w-full rounded-md shadow-sm focus:outline-none focus:ring-2 sm:text-sm"
            style={{
              backgroundColor: 'var(--color-bgInput)',
              color: 'var(--color-textPrimary)',
            }}
          >
            <option value="all">All Types</option>
            <option value="FYC">FYC Only</option>
            <option value="Override">Override Only</option>
          </select>
        </div>
      </div>

      {/* Commission Table */}
      <div className="overflow-x-auto">
        <table
          className="min-w-full"
          style={{ borderCollapse: 'separate', borderSpacing: 0 }}
        >
          <thead style={{ backgroundColor: 'var(--color-bgInput)' }}>
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                style={{ color: 'var(--color-textMuted)' }}
              >
                Date
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                style={{ color: 'var(--color-textMuted)' }}
              >
                Agent
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                style={{ color: 'var(--color-textMuted)' }}
              >
                Type
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                style={{ color: 'var(--color-textMuted)' }}
              >
                Policy
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                style={{ color: 'var(--color-textMuted)' }}
              >
                Policy Value
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                style={{ color: 'var(--color-textMuted)' }}
              >
                Commission
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredCommissions.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-4 text-center"
                  style={{ color: 'var(--color-textMuted)' }}
                >
                  No commissions found matching the filters.
                </td>
              </tr>
            ) : (
              filteredCommissions.map((comm) => (
                <tr key={comm.id}>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-sm"
                    style={{ color: 'var(--color-textPrimary)' }}
                  >
                    {new Date(comm.payout_date).toLocaleDateString()}
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-sm"
                    style={{ color: 'var(--color-textPrimary)' }}
                  >
                    {comm.agent_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor:
                          comm.commission_type === 'FYC'
                            ? 'var(--color-primaryBg)'
                            : 'var(--color-infoBg)',
                        color:
                          comm.commission_type === 'FYC'
                            ? 'var(--color-primary)'
                            : 'var(--color-info)',
                      }}
                    >
                      {comm.commission_type}
                    </span>
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-sm"
                    style={{ color: 'var(--color-textPrimary)' }}
                  >
                    {comm.policy_number}
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-sm"
                    style={{ color: 'var(--color-textPrimary)' }}
                  >
                    ${comm.policy_value.toLocaleString()}
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-sm font-medium"
                    style={{ color: 'var(--color-success)' }}
                  >
                    $
                    {comm.amount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Results Count */}
      <div className="mt-4 text-sm" style={{ color: 'var(--color-textMuted)' }}>
        Showing {filteredCommissions.length} of {commissions.length} commission
        records
      </div>
    </div>
  );
};

export default CommissionReports;
