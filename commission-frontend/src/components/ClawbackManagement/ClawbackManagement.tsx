import React, { useState } from 'react';
import { Sale } from '../SalesList';

interface ClawbackManagementProps {
  sales: Sale[];
  onCancelSale: (saleId: number) => void;
}

const ClawbackManagement: React.FC<ClawbackManagementProps> = ({
  sales,
  onCancelSale,
}) => {
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Filter active (non-cancelled) sales
  const activeSales = sales.filter((sale) => !sale.is_cancelled);

  // Search filter
  const filteredSales = activeSales.filter(
    (sale) =>
      sale.policy_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.agent_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate clawback impact
  const calculateImpact = (sale: Sale) => {
    const fycCommission = sale.policy_value * 0.5;
    // In real system, would also calculate override commissions
    return {
      directClawback: fycCommission,
      totalImpact: fycCommission,
      affectedAgents: [sale.agent_name],
    };
  };

  const handleSelectSale = (sale: Sale) => {
    setSelectedSale(sale);
  };

  const handleInitiateClawback = () => {
    if (selectedSale) {
      setShowConfirmModal(true);
    }
  };

  const handleConfirmClawback = () => {
    if (selectedSale) {
      onCancelSale(selectedSale.id);
      setSelectedSale(null);
      setShowConfirmModal(false);
    }
  };

  const handleCancelClawback = () => {
    setShowConfirmModal(false);
  };

  const impact = selectedSale ? calculateImpact(selectedSale) : null;

  return (
    <div
      className="p-4 rounded-lg"
      style={{
        backgroundColor: 'var(--color-bgCard)',
        boxShadow: 'var(--shadow-xl)',
      }}
    >
      <h2
        className="text-xl font-semibold mb-4"
        style={{ color: 'var(--color-textPrimary)' }}
      >
        Clawback Management
      </h2>

      <div className="mb-6">
        <p className="text-sm mb-4" style={{ color: 'var(--color-textMuted)' }}>
          Manage policy cancellations and commission clawbacks. Select a policy
          to analyze the impact before proceeding.
        </p>

        {/* Search */}
        <div className="mb-4">
          <label
            htmlFor="search"
            className="block text-sm font-medium mb-1"
            style={{ color: 'var(--color-textPrimary)' }}
          >
            Search by Policy or Agent
          </label>
          <input
            type="text"
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter policy number or agent name..."
            className="block w-full rounded-md shadow-sm focus:outline-none focus:ring-2 sm:text-sm px-3 py-2.5"
            style={{
              backgroundColor: 'var(--color-bgInput)',
              color: 'var(--color-textPrimary)',
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Policies List */}
        <div>
          <h3
            className="text-md font-semibold mb-3"
            style={{ color: 'var(--color-textPrimary)' }}
          >
            Active Policies
          </h3>
          <div className="rounded-lg max-h-96 overflow-y-auto">
            {filteredSales.length === 0 ? (
              <div
                className="p-4 text-center"
                style={{ color: 'var(--color-textMuted)' }}
              >
                {searchTerm
                  ? 'No policies match your search.'
                  : 'No active policies found.'}
              </div>
            ) : (
              <div style={{ borderColor: 'var(--color-border)' }}>
                {filteredSales.map((sale) => (
                  <div
                    key={sale.id}
                    onClick={() => handleSelectSale(sale)}
                    className="p-4 cursor-pointer transition"
                    style={{
                      backgroundColor:
                        selectedSale?.id === sale.id
                          ? 'var(--color-primaryBg)'
                          : 'transparent',
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p
                          className="font-medium"
                          style={{ color: 'var(--color-textPrimary)' }}
                        >
                          {sale.policy_number}
                        </p>
                        <p
                          className="text-sm"
                          style={{ color: 'var(--color-textMuted)' }}
                        >
                          Agent: {sale.agent_name}
                        </p>
                        <p
                          className="text-sm"
                          style={{ color: 'var(--color-textMuted)' }}
                        >
                          {new Date(sale.sale_date).toLocaleDateString()}
                        </p>
                      </div>
                      <p
                        className="font-semibold"
                        style={{ color: 'var(--color-textPrimary)' }}
                      >
                        ${sale.policy_value.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div
            className="mt-2 text-xs"
            style={{ color: 'var(--color-textMuted)' }}
          >
            Showing {filteredSales.length} of {activeSales.length} active
            policies
          </div>
        </div>

        {/* Impact Analysis */}
        <div>
          <h3
            className="text-md font-semibold mb-3"
            style={{ color: 'var(--color-textPrimary)' }}
          >
            Clawback Impact Analysis
          </h3>
          {!selectedSale ? (
            <div
              className="rounded-lg p-8 text-center"
              style={{
                backgroundColor: 'var(--color-bgInput)',
                color: 'var(--color-textMuted)',
              }}
            >
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                style={{ color: 'var(--color-textMuted)' }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <p className="mt-2">Select a policy to view clawback impact</p>
            </div>
          ) : (
            <div
              className="rounded-lg p-4"
              style={{ backgroundColor: 'var(--color-bgInput)' }}
            >
              {/* Selected Policy Details */}
              <div
                className="mb-4 p-3 rounded"
                style={{ backgroundColor: 'var(--color-bgCard)' }}
              >
                <h4
                  className="text-sm font-semibold mb-2"
                  style={{ color: 'var(--color-textPrimary)' }}
                >
                  Policy Details
                </h4>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt style={{ color: 'var(--color-textMuted)' }}>
                      Policy Number:
                    </dt>
                    <dd
                      className="font-medium"
                      style={{ color: 'var(--color-textPrimary)' }}
                    >
                      {selectedSale.policy_number}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt style={{ color: 'var(--color-textMuted)' }}>Agent:</dt>
                    <dd
                      className="font-medium"
                      style={{ color: 'var(--color-textPrimary)' }}
                    >
                      {selectedSale.agent_name}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt style={{ color: 'var(--color-textMuted)' }}>
                      Policy Value:
                    </dt>
                    <dd
                      className="font-medium"
                      style={{ color: 'var(--color-textPrimary)' }}
                    >
                      ${selectedSale.policy_value.toLocaleString()}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt style={{ color: 'var(--color-textMuted)' }}>
                      Sale Date:
                    </dt>
                    <dd
                      className="font-medium"
                      style={{ color: 'var(--color-textPrimary)' }}
                    >
                      {new Date(selectedSale.sale_date).toLocaleDateString()}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Impact Breakdown */}
              <div
                className="mb-4 p-3 rounded"
                style={{ backgroundColor: 'var(--color-dangerBg)' }}
              >
                <h4
                  className="text-sm font-semibold mb-2"
                  style={{ color: 'var(--color-danger)' }}
                >
                  ⚠️ Impact Breakdown
                </h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt style={{ color: 'var(--color-danger)' }}>
                      Direct FYC Clawback:
                    </dt>
                    <dd
                      className="font-semibold"
                      style={{ color: 'var(--color-danger)' }}
                    >
                      -$
                      {impact?.directClawback.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </dd>
                  </div>
                  <div className="flex justify-between pt-2">
                    <dt
                      className="font-medium"
                      style={{ color: 'var(--color-danger)' }}
                    >
                      Total Estimated Impact:
                    </dt>
                    <dd
                      className="font-bold text-base"
                      style={{ color: 'var(--color-danger)' }}
                    >
                      -$
                      {impact?.totalImpact.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Affected Agents */}
              <div
                className="mb-4 p-3 rounded"
                style={{ backgroundColor: 'var(--color-bgCard)' }}
              >
                <h4
                  className="text-sm font-semibold mb-2"
                  style={{ color: 'var(--color-textPrimary)' }}
                >
                  Affected Agents
                </h4>
                <ul className="space-y-1">
                  {impact?.affectedAgents.map((agent, idx) => (
                    <li
                      key={idx}
                      className="text-sm flex items-center"
                      style={{ color: 'var(--color-textMuted)' }}
                    >
                      <svg
                        className="h-4 w-4 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        style={{ color: 'var(--color-textMuted)' }}
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {agent}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleInitiateClawback}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: 'var(--color-danger)',
                    color: 'var(--color-textPrimary)',
                  }}
                >
                  <svg
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  Cancel Policy & Initiate Clawback
                </button>
                <button
                  onClick={() => setSelectedSale(null)}
                  className="px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2"
                  style={{
                    color: 'var(--color-textPrimary)',
                    backgroundColor: 'var(--color-bgInput)',
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div
            className="relative mx-auto p-6 w-full max-w-md shadow-lg rounded-md"
            style={{ backgroundColor: 'var(--color-bgCard)' }}
          >
            <div className="mt-3 text-center">
              <div
                className="mx-auto flex items-center justify-center h-12 w-12 rounded-full"
                style={{ backgroundColor: 'var(--color-dangerBg)' }}
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  style={{ color: 'var(--color-danger)' }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3
                className="text-lg leading-6 font-medium mt-4"
                style={{ color: 'var(--color-textPrimary)' }}
              >
                Confirm Clawback
              </h3>
              <div className="mt-2 px-7 py-3">
                <p
                  className="text-sm"
                  style={{ color: 'var(--color-textMuted)' }}
                >
                  Are you sure you want to cancel policy{' '}
                  <strong>{selectedSale.policy_number}</strong>?
                </p>
                <p
                  className="text-sm font-semibold mt-2"
                  style={{ color: 'var(--color-danger)' }}
                >
                  This will clawback $
                  {impact?.totalImpact.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  in commissions.
                </p>
                <p
                  className="text-xs mt-2"
                  style={{ color: 'var(--color-textMuted)' }}
                >
                  This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-3 px-4 py-3">
                <button
                  onClick={handleCancelClawback}
                  className="flex-1 px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: 'var(--color-bgInput)',
                    color: 'var(--color-textPrimary)',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmClawback}
                  className="flex-1 px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: 'var(--color-danger)',
                    color: 'var(--color-textPrimary)',
                  }}
                >
                  Confirm Clawback
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClawbackManagement;
