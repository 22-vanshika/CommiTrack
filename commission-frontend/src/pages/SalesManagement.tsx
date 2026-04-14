import React from 'react';
import SalesForm from '../components/SalesForm';
import SalesList, { Sale } from '../components/SalesList';

interface SalesManagementProps {
  sales: Sale[];
  onSaleAdded: () => void;
  onCancelSale: (saleId: number) => Promise<void>;
}

const SalesManagement: React.FC<SalesManagementProps> = ({
  sales,
  onSaleAdded,
  onCancelSale,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-textprimary">
          Sales Management
        </h1>
        <p className="mt-2 text-sm text-textmuted">
          Record new policy sales and view sales history
        </p>
      </div>

      <SalesForm onSaleAdded={onSaleAdded} />

      <div className="rounded-lg p-6 bg-bgcard shadow-custom-xl">
        <h2 className="text-xl font-semibold mb-4 text-textprimary">
          Sales History
        </h2>
        <SalesList sales={sales} onCancelSale={onCancelSale} />
      </div>
    </div>
  );
};

export default SalesManagement;
