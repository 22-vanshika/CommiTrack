import React from 'react';

export interface Bonus {
  id: number;
  amount: number;
  bonus_type: string;
  period: string;
  agent_id: number;
  agent_name: string;
}

interface BonusListProps {
  bonuses: Bonus[];
}

const BonusList: React.FC<BonusListProps> = ({ bonuses }) => {
  return (
    <div className="overflow-x-auto">
      <h2 className="text-xl font-semibold mb-4 text-textprimary">
        Calculated Bonuses
      </h2>
      <table className="min-w-full">
        <thead className="bg-bginput">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-textmuted"
            >
              Period
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-textmuted"
            >
              Type
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-textmuted"
            >
              Agent
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-textmuted"
            >
              Amount
            </th>
          </tr>
        </thead>
        <tbody className="bg-transparent">
          {bonuses.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-6 py-4 text-center text-textsubtl">
                No bonuses calculated yet.
              </td>
            </tr>
          ) : (
            bonuses.map((bonus) => (
              <tr
                key={bonus.id}
                className="hover:bg-opacity-10 hover:bg-white transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-textprimary">
                  {bonus.period}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-textsecondary">
                  {bonus.bonus_type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-textsecondary">
                  {bonus.agent_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-textsecondary">
                  $
                  {bonus.amount.toLocaleString(undefined, {
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
  );
};

export default BonusList;
