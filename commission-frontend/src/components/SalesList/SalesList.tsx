import React from 'react';

export interface Sale {
  id: number;
  policy_number: string;
  policy_value: number;
  sale_date: string;
  agent_id: number;
  agent_name: string;
  is_cancelled: boolean;
}

interface SalesListProps {
  sales: Sale[];
  onCancelSale: (saleId: number) => void;
}

const SalesList: React.FC<SalesListProps> = ({ sales, onCancelSale }) => {
  return (
    <div className="overflow-x-auto">
      <h2 className="text-xl font-semibold mb-4 text-textprimary">
        Recent Sales
      </h2>
      <table className="min-w-full">
        <thead className="bg-bginput">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-textmuted"
            >
              Policy #
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-textmuted"
            >
              Value
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
              Date
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-textmuted"
            >
              Status
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-textmuted"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-transparent">
          {sales.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-4 text-center text-textsubtl">
                No sales recorded yet.
              </td>
            </tr>
          ) : (
            sales.map((sale) => (
              <tr
                key={sale.id}
                className="hover:bg-opacity-10 hover:bg-white transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-textprimary">
                  {sale.policy_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-textsecondary">
                  ${sale.policy_value.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-textsecondary">
                  {sale.agent_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-textmuted">
                  {new Date(sale.sale_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {sale.is_cancelled ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-dangerbg text-dangerlight">
                      Cancelled
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-successbg text-successlight">
                      Active
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => onCancelSale(sale.id)}
                    disabled={sale.is_cancelled}
                    className={`transition-colors ${sale.is_cancelled ? 'opacity-50 cursor-not-allowed text-textsubtl' : 'text-danger'}`}
                    title={
                      sale.is_cancelled ? 'Already Cancelled' : 'Cancel Policy'
                    }
                  >
                    Cancel
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default SalesList;
