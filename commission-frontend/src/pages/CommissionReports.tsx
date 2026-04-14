import React from 'react';
import CommissionReports from '../components/CommissionReports/CommissionReports';
import BonusList, { Bonus } from '../components/BonusList';
import { Sale } from '../components/SalesList';

interface CommissionReportsPageProps {
  sales: Sale[];
  bonuses: Bonus[];
  calcMessage: string;
  handleMonthlyBonus: () => void;
  handleQuarterlyBonus: (quarter: number) => void;
  handleAnnualBonus: () => void;
}

const CommissionReportsPage: React.FC<CommissionReportsPageProps> = ({
  sales,
  bonuses,
  calcMessage,
  handleMonthlyBonus,
  handleQuarterlyBonus,
  handleAnnualBonus,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-textprimary">
          Commission Reports
        </h1>
        <p className="mt-2 text-sm text-textmuted">
          Calculate bonuses and view commission reports
        </p>
      </div>

      <div className="rounded-lg p-6 bg-bgcard shadow-custom-xl">
        <h2 className="text-xl font-semibold mb-4 text-textprimary">
          Calculate Bonuses
        </h2>

        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2 text-textmuted">
            Monthly Bonuses
          </h3>
          <button
            onClick={handleMonthlyBonus}
            className="inline-flex justify-center rounded-md py-2 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 bg-success text-textprimary shadow-custom-sm"
            disabled={calcMessage === 'Calculating...'}
          >
            Calculate Current Month
          </button>
        </div>

        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2 text-textmuted">
            Quarterly Bonuses
          </h3>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((quarter) => (
              <button
                key={quarter}
                onClick={() => handleQuarterlyBonus(quarter)}
                className="inline-flex justify-center rounded-md py-2 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 bg-primary text-textprimary shadow-custom-sm"
                disabled={calcMessage === 'Calculating...'}
              >
                Q{quarter}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2 text-textmuted">
            Annual Bonuses
          </h3>
          <button
            onClick={handleAnnualBonus}
            className="inline-flex justify-center rounded-md py-2 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 bg-info text-textprimary shadow-custom-sm"
            disabled={calcMessage === 'Calculating...'}
          >
            Calculate Current Year
          </button>
        </div>

        {calcMessage && (
          <div className="mt-4 p-3 rounded-md bg-infobg">
            <p className="text-sm text-infolight">{calcMessage}</p>
          </div>
        )}
      </div>

      <div className="rounded-lg p-6 bg-bgcard shadow-custom-xl">
        <h2 className="text-xl font-semibold mb-4 text-textprimary">
          Bonus History
        </h2>
        <BonusList bonuses={bonuses} />
      </div>

      <CommissionReports sales={sales} bonuses={bonuses} />
    </div>
  );
};

export default CommissionReportsPage;
