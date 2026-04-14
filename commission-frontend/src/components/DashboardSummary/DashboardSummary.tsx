import React from 'react';

export interface SummaryData {
  total_sales_value: number;
  total_commissions_paid: number;
  total_bonuses_paid: number;
  total_clawbacks_value: number;
  agent_count: number;
}

interface DashboardSummaryProps {
  summary: SummaryData | null;
  loading: boolean;
}

const formatCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return '$--';
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const StatCard: React.FC<{
  title: string;
  value: string | number;
  color?: string;
}> = ({ title, value, color = 'text-gray-900' }) => (
  <div className="bg-white overflow-hidden shadow rounded-lg">
    <div className="px-4 py-5 sm:p-6">
      <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
      <dd className={`mt-1 text-3xl font-semibold tracking-tight ${color}`}>
        {value}
      </dd>
    </div>
  </div>
);

const DashboardSummary: React.FC<DashboardSummaryProps> = ({
  summary,
  loading,
}) => {
  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-md mb-6 text-center text-gray-500">
        Loading summary data...
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-md mb-6 text-center text-red-500">
        Could not load summary data.
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">
        Dashboard Summary
      </h2>
      <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Total Agents" value={summary.agent_count} />
        <StatCard
          title="Total Sales Value"
          value={formatCurrency(summary.total_sales_value)}
        />
        <StatCard
          title="Commissions Paid"
          value={formatCurrency(summary.total_commissions_paid)}
          color="text-green-600"
        />
        <StatCard
          title="Bonuses Paid"
          value={formatCurrency(summary.total_bonuses_paid)}
          color="text-blue-600"
        />
        {summary.total_clawbacks_value !== 0 && (
          <StatCard
            title="Total Clawbacks"
            value={formatCurrency(Math.abs(summary.total_clawbacks_value))}
            color="text-red-600"
          />
        )}
        {summary.total_clawbacks_value === 0 && (
          <StatCard
            title="Total Clawbacks"
            value={formatCurrency(0)}
            color="text-gray-500"
          />
        )}
      </dl>
    </div>
  );
};

export default DashboardSummary;
