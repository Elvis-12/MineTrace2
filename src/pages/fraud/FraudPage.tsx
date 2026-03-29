import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShieldAlert, ShieldCheck, ShieldX, RefreshCw, Loader2, FileSpreadsheet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import PageHeader from '../../components/ui/PageHeader';
import DataTable, { Column } from '../../components/ui/DataTable';
import StatCard from '../../components/ui/StatCard';
import RiskBadge from '../../components/ui/RiskBadge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { fraudApi } from '../../api/fraudApi';
import { formatDate } from '../../utils/formatDate';
import { exportToCsv } from '../../utils/exportCsv';
import { ROUTES } from '../../constants/routes';
import { cn } from '../../lib/utils';

export default function FraudPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const [isAnalyzeModalOpen, setIsAnalyzeModalOpen] = useState(false);
  const [riskFilter, setRiskFilter] = useState('');

  const { data: fraudData, isLoading } = useQuery({
    queryKey: ['fraud', riskFilter],
    queryFn: () => fraudApi.getAll(riskFilter ? { riskLevel: riskFilter } : undefined),
  });

  const analyzeMutation = useMutation({
    mutationFn: () => fraudApi.analyzeAll(),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['fraud'] });
      toast.success(`Analysis complete. ${res.data.analyzedCount} batches processed.`);
      setIsAnalyzeModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Analysis failed');
      setIsAnalyzeModalOpen(false);
    },
  });

  const batches = fraudData?.data || [];

  // Stats
  const lowRisk = batches.filter((b: any) => b.riskLevel === 'LOW').length;
  const mediumRisk = batches.filter((b: any) => b.riskLevel === 'MEDIUM').length;
  const highRisk = batches.filter((b: any) => b.riskLevel === 'HIGH').length;

  const barData = [
    { name: 'Low Risk', count: lowRisk, fill: '#10b981' },
    { name: 'Medium Risk', count: mediumRisk, fill: '#f59e0b' },
    { name: 'High Risk', count: highRisk, fill: '#ef4444' },
  ];

  const columns: Column<any>[] = [
    { 
      key: 'batchCode', 
      label: 'Batch Code', 
      sortable: true,
      render: (row) => (
        <span 
          className="font-mono font-medium text-primary-600 hover:text-primary-800 cursor-pointer hover:underline"
          onClick={() => navigate(ROUTES.BATCH_DETAIL(row.id))}
        >
          {row.batchCode}
        </span>
      )
    },
    { key: 'mineralType', label: 'Mineral Type', sortable: true },
    {
      key: 'flags',
      label: 'Flags (W/R/D/L/H)',
      render: (row) => (
        <div className="flex gap-1">
          <div className={cn("h-2.5 w-2.5 rounded-full", row.flags.weight ? "bg-red-500" : "bg-green-500")} title="Weight Anomaly"></div>
          <div className={cn("h-2.5 w-2.5 rounded-full", row.flags.route ? "bg-red-500" : "bg-green-500")} title="Route Deviation"></div>
          <div className={cn("h-2.5 w-2.5 rounded-full", row.flags.duplicate ? "bg-red-500" : "bg-green-500")} title="Duplicate Event"></div>
          <div className={cn("h-2.5 w-2.5 rounded-full", row.flags.license ? "bg-red-500" : "bg-green-500")} title="License Issue"></div>
          <div className={cn("h-2.5 w-2.5 rounded-full", row.flags.handover ? "bg-red-500" : "bg-green-500")} title="Missing Handover"></div>
        </div>
      )
    },
    { 
      key: 'anomalyScore', 
      label: 'Anomaly Score', 
      sortable: true,
      render: (row) => (
        <span className={cn(
          "font-bold",
          row.anomalyScore >= 3 ? "text-red-600" : row.anomalyScore >= 1 ? "text-amber-600" : "text-green-600"
        )}>
          {row.anomalyScore.toFixed(1)}
        </span>
      )
    },
    { 
      key: 'riskLevel', 
      label: 'Risk Level', 
      sortable: true,
      render: (row) => <RiskBadge level={row.riskLevel} />
    },
    { 
      key: 'createdAt', 
      label: 'Analyzed Date', 
      sortable: true,
      render: (row) => formatDate(row.createdAt) // Mocking analyzed date
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <button
          onClick={() => navigate(ROUTES.BATCH_DETAIL(row.id))}
          className="text-sm font-medium text-primary-600 hover:text-primary-900 transition-colors"
        >
          View
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Fraud & Risk Analysis" 
        subtitle="AI-driven anomaly detection for supply chain integrity."
        action={
          <div className="flex gap-3">
            <button
              onClick={() => {
                const exportData = batches.map((b: any) => ({
                  'Batch Code': b.batchCode,
                  'Mineral Type': b.mineralType,
                  'Anomaly Score': b.anomalyScore.toFixed(1),
                  'Risk Level': b.riskLevel,
                  'Weight Anomaly': b.flags.weight ? 'Yes' : 'No',
                  'Route Deviation': b.flags.route ? 'Yes' : 'No',
                  'Duplicate Event': b.flags.duplicate ? 'Yes' : 'No',
                  'License Issue': b.flags.license ? 'Yes' : 'No',
                  'Missing Handover': b.flags.handover ? 'Yes' : 'No',
                  'Analyzed Date': formatDate(b.createdAt),
                }));
                exportToCsv(exportData, 'minetrace-fraud-analysis');
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export CSV
            </button>
            <button
              onClick={() => setIsAnalyzeModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Analyze All Batches
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatCard icon={ShieldCheck} label="Low Risk" value={lowRisk} colorClass="text-green-600 bg-green-100" loading={isLoading} />
          <StatCard icon={ShieldAlert} label="Medium Risk" value={mediumRisk} colorClass="text-amber-600 bg-amber-100" loading={isLoading} />
          <StatCard icon={ShieldX} label="High Risk" value={highRisk} colorClass="text-red-600 bg-red-100" loading={isLoading} />
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <h3 className="text-sm font-medium text-gray-500 mb-2 text-center">Risk Distribution</h3>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" hide />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={batches} 
        loading={isLoading}
        searchPlaceholder="Search by batch code..."
        filters={
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="block w-full sm:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
          >
            <option value="">All Risk Levels</option>
            <option value="LOW">Low Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="HIGH">High Risk</option>
          </select>
        }
      />

      <ConfirmDialog
        isOpen={isAnalyzeModalOpen}
        onCancel={() => setIsAnalyzeModalOpen(false)}
        onConfirm={() => analyzeMutation.mutate()}
        title="Run Global Fraud Analysis"
        message="This will trigger the AI anomaly detection engine to analyze all active batches across the system. This process may take a few moments. Continue?"
        confirmLabel="Run Analysis"
        loading={analyzeMutation.isPending}
      />
    </div>
  );
}
