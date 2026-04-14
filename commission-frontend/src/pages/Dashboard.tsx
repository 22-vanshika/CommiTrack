import React from 'react';
import SalesChart from '../components/SalesChart';
import { Sale } from '../components/SalesList';
import { SummaryData } from '../components/DashboardSummary';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

interface DashboardProps {
  summaryData: SummaryData | null;
  loading: boolean;
  sales: Sale[];
}

const Dashboard: React.FC<DashboardProps> = ({
  summaryData,
  loading,
  sales,
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const recentSales = sales.filter((sale) => !sale.is_cancelled).slice(0, 5);

  const stats = [
    {
      label: 'Total Sales Value',
      value: formatCurrency(summaryData?.total_sales_value || 0),
      change: '+12.5%',
      isPositive: true,
      subtext: `${sales.filter((s) => !s.is_cancelled).length} policies`,
    },
    {
      label: 'Commissions Paid',
      value: formatCurrency(summaryData?.total_commissions_paid || 0),
      change: '+8.2%',
      isPositive: true,
      subtext: 'FYC + Overrides',
    },
    {
      label: 'Bonuses Distributed',
      value: formatCurrency(summaryData?.total_bonuses_paid || 0),
      change: '+15.3%',
      isPositive: true,
      subtext: 'Volume based',
    },
    {
      label: 'Total Clawbacks',
      value: formatCurrency(Math.abs(summaryData?.total_clawbacks_value || 0)),
      change: '-2.1%',
      isPositive: false,
      subtext: 'Adjustments',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-b-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="backdrop-blur-md rounded-2xl p-6 bg-bgcard shadow-custom-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-textprimary">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-textmuted">
              Real-time commission system performance metrics
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="relative backdrop-blur-md rounded-xl p-5 transition-all duration-200 bg-bgcard shadow-custom-xl"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-textmuted">{stat.label}</p>
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium"
                style={{
                  backgroundColor: stat.isPositive
                    ? 'var(--color-successBg)'
                    : 'var(--color-dangerBg)',
                  color: stat.isPositive
                    ? 'var(--color-successLight)'
                    : 'var(--color-dangerLight)',
                }}
              >
                {stat.isPositive ? (
                  <ArrowUpIcon className="w-3 h-3 mr-0.5" />
                ) : (
                  <ArrowDownIcon className="w-3 h-3 mr-0.5" />
                )}
                {stat.change}
              </span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-textprimary">
                {stat.value}
              </h3>
              <p className="mt-1 text-xs text-textsubtl">{stat.subtext}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 backdrop-blur-md rounded-xl p-6 bg-bgcard shadow-custom-xl">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-textprimary">
              Sales Overview
            </h2>
            <p className="text-xs text-textmuted mt-1">Last 6 months</p>
          </div>
          <SalesChart sales={sales} />
        </div>

        <div className="backdrop-blur-md rounded-xl p-6 bg-bgcard shadow-custom-xl">
          <h2 className="text-lg font-semibold mb-5 text-textprimary">
            Quick Stats
          </h2>
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-textmuted">Active Agents</span>
                <span className="text-lg font-semibold text-textprimary">
                  {summaryData?.agent_count || 0}
                </span>
              </div>
              <div className="w-full rounded-full h-2 overflow-hidden bg-bginput">
                <div
                  className="h-2 rounded-full transition-all duration-500 bg-primary"
                  style={{ width: '75%' }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-textmuted">Policies Sold</span>
                <span className="text-lg font-semibold text-textprimary">
                  {sales.filter((s) => !s.is_cancelled).length}
                </span>
              </div>
              <div className="w-full rounded-full h-2 overflow-hidden bg-bginput">
                <div
                  className="h-2 rounded-full transition-all duration-500 bg-success"
                  style={{ width: '60%' }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-textmuted">Avg. Commission</span>
                <span className="text-lg font-semibold text-textprimary">
                  {formatCurrency(
                    sales.length > 0
                      ? (summaryData?.total_commissions_paid || 0) /
                      sales.length
                      : 0
                  )}
                </span>
              </div>
              <div className="w-full rounded-full h-2 overflow-hidden bg-bginput">
                <div
                  className="h-2 rounded-full transition-all duration-500 bg-info"
                  style={{ width: '85%' }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="backdrop-blur-md rounded-xl overflow-hidden bg-bgcard shadow-custom-xl">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-800/40 to-transparent">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-textprimary">
              Recent Transactions
            </h2>
            <span className="text-xs text-textsubtl">
              Latest {recentSales.length} entries
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-bgcard-hover">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-textmuted">
                  Agent
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-textmuted">
                  Policy Number
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-textmuted">
                  Date
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-textmuted">
                  Status
                </th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-textmuted">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-transparent">
              {recentSales.map((sale, index) => (
                <tr
                  key={sale.id}
                  className="transition-colors duration-150"
                  onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    'var(--color-bgCardHover)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = 'transparent')
                  }
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div
                        className="flex-shrink-0 h-9 w-9 rounded-lg flex items-center justify-center"
                        style={{
                          background:
                            'linear-gradient(to bottom right, rgba(59, 130, 246, 0.3), rgba(37, 99, 235, 0.2))',
                        }}
                      >
                        <span className="text-sm font-semibold text-primary-light">
                          {sale.agent_name.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-textsecondary">
                          {sale.agent_name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono text-textsecondary">
                      {sale.policy_number}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-textmuted">
                      {new Date(sale.sale_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-success-bg text-success-light">
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-textsecondary">
                    {formatCurrency(sale.policy_value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {recentSales.length === 0 && (
            <div className="text-center py-12 text-textmuted">
              <p className="text-sm">No transactions yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
