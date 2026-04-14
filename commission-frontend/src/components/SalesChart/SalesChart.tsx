import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Sale } from '../SalesList';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface SalesChartProps {
  sales: Sale[];
}

const SalesChart: React.FC<SalesChartProps> = ({ sales }) => {
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    if (!sales || sales.length === 0) {
      setChartData(null);
      return;
    }

    const salesByMonth: { [key: string]: number } = {};

    sales.forEach((sale) => {
      if (sale.is_cancelled) return;

      const date = new Date(sale.sale_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!salesByMonth[monthKey]) {
        salesByMonth[monthKey] = 0;
      }
      salesByMonth[monthKey] += sale.policy_value;
    });

    const sortedMonths = Object.keys(salesByMonth).sort().slice(-6);
    const values = sortedMonths.map((month) => salesByMonth[month]);

    const labels = sortedMonths.map((month) => {
      const [year, monthNum] = month.split('-');
      const date = new Date(parseInt(year), parseInt(monthNum) - 1);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      });
    });

    const gradient = [
      'rgba(59, 130, 246, 0.9)',
      'rgba(99, 102, 241, 0.9)',
      'rgba(139, 92, 246, 0.9)',
    ];

    setChartData({
      labels,
      datasets: [
        {
          label: 'Sales Volume',
          data: values,
          backgroundColor: values.map(
            (_, index) => gradient[index % gradient.length]
          ),
          borderColor: 'transparent',
          borderWidth: 0,
          borderRadius: 8,
          borderSkipped: false,
          barThickness: 'flex',
          maxBarThickness: 60,
          hoverBackgroundColor: values.map((_, index) => {
            const colors = [
              'rgba(59, 130, 246, 1)',
              'rgba(99, 102, 241, 1)',
              'rgba(139, 92, 246, 1)',
            ];
            return colors[index % colors.length];
          }),
        },
      ],
    });
  }, [sales]);

  const getColorVar = (varName: string) => {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(varName)
      .trim();
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(30, 31, 36, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#d1d5db',
        borderColor: 'rgba(59, 130, 246, 0.5)',
        borderWidth: 1,
        padding: 16,
        cornerRadius: 12,
        displayColors: true,
        boxPadding: 6,
        titleFont: {
          size: 14,
          weight: 'bold' as const,
          family: 'Inter, system-ui, sans-serif',
        },
        bodyFont: {
          size: 13,
          weight: 'normal' as const,
          family: 'Inter, system-ui, sans-serif',
        },
        callbacks: {
          title: function (context: any) {
            return context[0].label;
          },
          label: function (context: any) {
            const value = context.parsed.y;
            return `Sales: $${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: getColorVar('--color-chartText') || '#9ca3af',
          font: {
            size: 12,
            weight: 'normal' as const,
            family: 'Inter, system-ui, sans-serif',
          },
          padding: 8,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(75, 85, 99, 0.15)',
          drawBorder: false,
          lineWidth: 1,
        },
        border: {
          display: false,
          dash: [5, 5],
        },
        ticks: {
          color: getColorVar('--color-chartText') || '#9ca3af',
          font: {
            size: 12,
            weight: 'normal' as const,
            family: 'Inter, system-ui, sans-serif',
          },
          padding: 12,
          maxTicksLimit: 6,
          callback: function (value: any) {
            if (value >= 1000000) {
              return '$' + (value / 1000000).toFixed(1) + 'M';
            } else if (value >= 1000) {
              return '$' + (value / 1000).toFixed(0) + 'K';
            }
            return '$' + value.toLocaleString();
          },
        },
      },
    },
    animation: {
      duration: 750,
      easing: 'easeInOutQuart' as const,
    },
  };

  if (!chartData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-center text-sm text-textsubtl">
          No sales data available for chart
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-80">
      <Bar options={options} data={chartData} />
    </div>
  );
};

export default SalesChart;
