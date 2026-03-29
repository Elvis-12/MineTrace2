import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileText, PieChart, TrendingUp, Calendar } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import { reportApi } from '../../api/reportApi';
import { exportToPdf } from '../../utils/exportPdf';
import { exportToCsv } from '../../utils/exportCsv';
import { formatDate } from '../../utils/formatDate';

export default function ReportsPage() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: summaryData, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['reportSummary', dateFrom, dateTo],
    queryFn: () => reportApi.getSummary({ startDate: dateFrom, endDate: dateTo }),
  });

  const { data: mineData, isLoading: isLoadingMine } = useQuery({
    queryKey: ['reportMine', dateFrom, dateTo],
    queryFn: () => reportApi.getMineProduction({ startDate: dateFrom, endDate: dateTo }),
  });

  const { data: mineralData, isLoading: isLoadingMineral } = useQuery({
    queryKey: ['reportMineral', dateFrom, dateTo],
    queryFn: () => reportApi.getMineralDistribution({ startDate: dateFrom, endDate: dateTo }),
  });

  const handleExportPdf = () => {
    if (!summaryData?.data) return;
    
    const doc = new (window as any).jspdf.jsPDF();
    doc.text('MineTrace Summary Report', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${formatDate(new Date().toISOString())}`, 14, 22);
    
    if (dateFrom || dateTo) {
      doc.text(`Period: ${dateFrom || 'Start'} to ${dateTo || 'End'}`, 14, 28);
    }

    const tableData = [
      ['Total Batches', summaryData.data.totalBatches.toString()],
      ['Total Weight', `${summaryData.data.totalWeight.toLocaleString()} kg`],
      ['Active Mines', summaryData.data.activeMines.toString()],
      ['Flagged Batches', summaryData.data.flaggedBatches.toString()],
    ];

    (doc as any).autoTable({
      startY: 35,
      head: [['Metric', 'Value']],
      body: tableData,
    });

    doc.save('minetrace-summary-report.pdf');
  };

  const handleExportCsv = () => {
    if (!mineData?.data) return;
    
    const data = mineData.data.map((item: any) => ({
      'Mine Name': item.mineName,
      'Total Batches': item.totalBatches,
      'Total Weight (kg)': item.totalWeight,
    }));
    
    exportToCsv(data, 'mine-production-report');
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Reports & Analytics" 
        subtitle="Generate comprehensive reports on mineral production and supply chain metrics."
      />

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Date From</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-4 w-4 text-gray-400" />
              </div>
              <input 
                type="date" 
                value={dateFrom} 
                onChange={e => setDateFrom(e.target.value)} 
                className="block w-full pl-10 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm py-2" 
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Date To</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-4 w-4 text-gray-400" />
              </div>
              <input 
                type="date" 
                value={dateTo} 
                onChange={e => setDateTo(e.target.value)} 
                className="block w-full pl-10 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm py-2" 
              />
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0">
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); }}
              className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Summary Report */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-primary-600" />
              Executive Summary
            </h3>
            <button
              onClick={handleExportPdf}
              disabled={isLoadingSummary || !summaryData?.data}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5 mr-1" />
              PDF
            </button>
          </div>
          <div className="p-6">
            {isLoadingSummary ? (
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            ) : summaryData?.data ? (
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Total Batches Registered</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{summaryData.data.totalBatches}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Total Volume Tracked</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{summaryData.data.totalWeight.toLocaleString()} <span className="text-lg text-gray-500 font-normal">kg</span></dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Active Mines</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{summaryData.data.activeMines}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Flagged Batches</dt>
                  <dd className="mt-1 text-3xl font-semibold text-red-600">{summaryData.data.flaggedBatches}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-gray-500 text-sm">No data available for selected period.</p>
            )}
          </div>
        </div>

        {/* Mine Production Report */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-primary-600" />
              Mine Production
            </h3>
            <button
              onClick={handleExportCsv}
              disabled={isLoadingMine || !mineData?.data}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5 mr-1" />
              CSV
            </button>
          </div>
          <div className="p-0">
            {isLoadingMine ? (
              <div className="p-6 animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
            ) : mineData?.data && mineData.data.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mine Name</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Batches</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Weight (kg)</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mineData.data.map((mine: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{mine.mineName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{mine.totalBatches}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium text-right">{mine.totalWeight.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-6 text-gray-500 text-sm">No production data found.</div>
            )}
          </div>
        </div>

        {/* Mineral Distribution Report */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden lg:col-span-2">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <PieChart className="h-5 w-5 mr-2 text-primary-600" />
              Mineral Distribution
            </h3>
          </div>
          <div className="p-0">
            {isLoadingMineral ? (
              <div className="p-6 animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
            ) : mineralData?.data && mineralData.data.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mineral Type</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Batches</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Weight (kg)</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% of Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mineralData.data.map((mineral: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{mineral.mineralType}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{mineral.totalBatches}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium text-right">{mineral.totalWeight.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        <div className="flex items-center justify-end">
                          <span className="mr-2">{mineral.percentage}%</span>
                          <div className="w-16 bg-gray-200 rounded-full h-1.5">
                            <div className="bg-primary-600 h-1.5 rounded-full" style={{ width: `${mineral.percentage}%` }}></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-6 text-gray-500 text-sm">No mineral data found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
