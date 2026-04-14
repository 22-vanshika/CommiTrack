import React, { useEffect, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import AgentManagement from './pages/AgentManagement';
import SalesManagement from './pages/SalesManagement';
import CommissionReportsPage from './pages/CommissionReports';
import ClawbackManagementPage from './pages/ClawbackManagement';
import { Agent } from './components/AgentNode';
import { Sale } from './components/SalesList';
import { Bonus } from './components/BonusList';
import { SummaryData } from './components/DashboardSummary';

const API_URL =
  process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000/api';

function App() {
  const [hierarchy, setHierarchy] = useState<Agent[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [calcMessage, setCalcMessage] = useState('');

  const fetchHierarchy = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/agents`);
      setHierarchy(response.data);
    } catch (error) {
      console.error('Failed to fetch agent hierarchy:', error);
    }
  }, []);

  const fetchSales = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/sales`);
      setSales(response.data);
    } catch (error) {
      console.error('Failed to fetch sales:', error);
    }
  }, []);

  const fetchBonuses = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/bonuses`);
      setBonuses(response.data);
    } catch (error) {
      console.error('Failed to fetch bonuses:', error);
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const response = await axios.get<SummaryData>(
        `${API_URL}/dashboard/summary`
      );
      setSummaryData(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard summary:', error);
      setSummaryData(null);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchHierarchy(),
      fetchSales(),
      fetchBonuses(),
      fetchSummary(),
    ]).finally(() => {
      setLoading(false);
    });
  }, [fetchHierarchy, fetchSales, fetchBonuses, fetchSummary]);

  const handleCalculateBonuses = useCallback(
    async (bonusType: 'Monthly' | 'Quarterly' | 'Annual', period: string) => {
      setCalcMessage('Calculating...');

      try {
        const response = await axios.post(`${API_URL}/bonuses/calculate`, {
          period: period,
          type: bonusType,
        });
        setCalcMessage(response.data.message || 'Calculation complete!');
        await fetchBonuses();
        await fetchSummary();
      } catch (error) {
        console.error('Failed to calculate bonuses:', error);
        setCalcMessage('Calculation failed.');
      }
    },
    [fetchBonuses, fetchSummary]
  );

  const handleMonthlyBonus = () => {
    const now = new Date();
    const periodStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    handleCalculateBonuses('Monthly', periodStr);
  };

  const handleQuarterlyBonus = (quarter: number) => {
    const now = new Date();
    const periodStr = `${now.getFullYear()}-Q${quarter}`;
    handleCalculateBonuses('Quarterly', periodStr);
  };

  const handleAnnualBonus = () => {
    const now = new Date();
    const periodStr = `${now.getFullYear()}`;
    handleCalculateBonuses('Annual', periodStr);
  };

  const onSaleAdded = () => {
    fetchSales();
    fetchSummary();
  };

  const onAgentAdded = () => {
    fetchHierarchy();
    fetchSummary();
  };

  const handleCancelSale = useCallback(
    async (saleId: number) => {
      try {
        await axios.put(`${API_URL}/sales/${saleId}/cancel`);
        await fetchSales();
        await fetchBonuses();
        await fetchSummary();
      } catch (error) {
        console.error(`Failed to cancel sale ${saleId}:`, error);
      }
    },
    [fetchSales, fetchBonuses, fetchSummary]
  );

  return (
    <Router>
      <Layout>
        <Routes>
          <Route
            path="/"
            element={
              <Dashboard
                summaryData={summaryData}
                loading={loading}
                sales={sales}
              />
            }
          />
          <Route
            path="/agents"
            element={
              <AgentManagement
                hierarchy={hierarchy}
                onAgentAdded={onAgentAdded}
              />
            }
          />
          <Route
            path="/sales"
            element={
              <SalesManagement
                sales={sales}
                onSaleAdded={onSaleAdded}
                onCancelSale={handleCancelSale}
              />
            }
          />
          <Route
            path="/reports"
            element={
              <CommissionReportsPage
                sales={sales}
                bonuses={bonuses}
                calcMessage={calcMessage}
                handleMonthlyBonus={handleMonthlyBonus}
                handleQuarterlyBonus={handleQuarterlyBonus}
                handleAnnualBonus={handleAnnualBonus}
              />
            }
          />
          <Route
            path="/clawbacks"
            element={
              <ClawbackManagementPage
                sales={sales}
                handleCancelSale={handleCancelSale}
              />
            }
          />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
