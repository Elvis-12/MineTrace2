import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, Loader2, Download, FileSpreadsheet } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import PageHeader from '../../components/ui/PageHeader';
import DataTable, { Column } from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import RiskBadge from '../../components/ui/RiskBadge';
import { batchApi } from '../../api/batchApi';
import { mineApi } from '../../api/mineApi';
import { useAuthStore } from '../../store/authStore';
import { formatDate } from '../../utils/formatDate';
import { exportToCsv } from '../../utils/exportCsv';
import { ROUTES } from '../../constants/routes';
import { STATUS_COLORS, RISK_COLORS } from '../../constants/statusColors';

const MINERAL_TYPES = ['Coltan', 'Cassiterite', 'Wolframite', 'Gold', 'Tin', 'Lithium', 'Other'];

const batchSchema = z.object({
  mineralType: z.enum(['Coltan', 'Cassiterite', 'Wolframite', 'Gold', 'Tin', 'Lithium', 'Other']),
  initialWeight: z.number().min(0.001, 'Weight must be greater than 0'),
  extractionDate: z.string().min(1, 'Extraction date is required'),
  mineId: z.string().min(1, 'Mine is required'),
  notes: z.string().optional(),
});

type BatchForm = z.infer<typeof batchSchema>;

export default function BatchesPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  
  const canRegister = user?.role === 'ADMIN' || user?.role === 'MINE_OFFICER';
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [qrModalData, setQrModalData] = useState<{ isOpen: boolean; batchCode: string }>({ isOpen: false, batchCode: '' });
  const qrRef = useRef<HTMLCanvasElement>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [mineralFilter, setMineralFilter] = useState('');
  const [mineFilter, setMineFilter] = useState(searchParams.get('mineId') || '');
  const [riskFilter, setRiskFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: batchesData, isLoading: isLoadingBatches } = useQuery({
    queryKey: ['batches'],
    queryFn: () => batchApi.getAll(),
  });

  const { data: minesData } = useQuery({
    queryKey: ['mines'],
    queryFn: () => mineApi.getAll(),
    enabled: canRegister || true, // Need for filters too
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<BatchForm>({
    resolver: zodResolver(batchSchema),
    defaultValues: {
      extractionDate: new Date().toISOString().split('T')[0],
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: BatchForm) => {
      const mine = minesData?.data.find((m: any) => m.id === data.mineId);
      return batchApi.create({ ...data, mineName: mine?.name, createdBy: user?.fullName });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      toast.success('Batch registered successfully');
      setIsModalOpen(false);
      reset();
      setQrModalData({ isOpen: true, batchCode: res.data.batchCode });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to register batch');
    },
  });

  const onSubmit = (data: BatchForm) => {
    createMutation.mutate(data);
  };

  const downloadQR = () => {
    if (qrRef.current) {
      const url = qrRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${qrModalData.batchCode}-QR.png`;
      link.href = url;
      link.click();
    }
  };

  const columns: Column<any>[] = [
    { 
      key: 'batchCode', 
      label: 'Batch Code', 
      sortable: true,
      render: (row) => (
        <span 
          className="font-mono font-medium text-primary-600 hover:text-primary-800 cursor-pointer hover:underline"
          onClick={(e) => {
            e.stopPropagation();
            navigate(ROUTES.BATCH_DETAIL(row.id));
          }}
        >
          {row.batchCode}
        </span>
      )
    },
    { key: 'mineralType', label: 'Mineral Type', sortable: true },
    { 
      key: 'initialWeight', 
      label: 'Initial Weight (kg)', 
      sortable: true,
      render: (row) => row.initialWeight.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })
    },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />
    },
    { 
      key: 'riskLevel', 
      label: 'Risk Level', 
      sortable: true,
      render: (row) => <RiskBadge level={row.riskLevel} />
    },
    { key: 'mineName', label: 'Mine Name', sortable: true },
    { 
      key: 'extractionDate', 
      label: 'Extraction Date', 
      sortable: true,
      render: (row) => formatDate(row.extractionDate).split(' ')[0] // Just date
    },
    { key: 'createdBy', label: 'Created By', sortable: true },
    { 
      key: 'createdAt', 
      label: 'Date Registered', 
      sortable: true,
      render: (row) => formatDate(row.createdAt)
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(ROUTES.BATCH_DETAIL(row.id));
          }}
          className="text-sm font-medium text-primary-600 hover:text-primary-900 transition-colors"
        >
          View Details
        </button>
      )
    }
  ];

  let filteredBatches = batchesData?.data || [];
  
  if (statusFilter) {
    filteredBatches = filteredBatches.filter((b: any) => b.status === statusFilter);
  }
  if (mineralFilter) {
    filteredBatches = filteredBatches.filter((b: any) => b.mineralType === mineralFilter);
  }
  if (mineFilter) {
    filteredBatches = filteredBatches.filter((b: any) => b.mineId === mineFilter);
  }
  if (riskFilter) {
    filteredBatches = filteredBatches.filter((b: any) => b.riskLevel === riskFilter);
  }
  if (dateFrom) {
    filteredBatches = filteredBatches.filter((b: any) => new Date(b.createdAt) >= new Date(dateFrom));
  }
  if (dateTo) {
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);
    filteredBatches = filteredBatches.filter((b: any) => new Date(b.createdAt) <= to);
  }

  // Filter mines for dropdown based on role
  let availableMines = minesData?.data || [];
  if (user?.role === 'MINE_OFFICER') {
    // Assuming user object has organizationId in a real app, filtering by org name for mock
    availableMines = availableMines.filter((m: any) => m.organizationName === user.organizationName);
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Mineral Batches" 
        subtitle="Track and manage registered mineral batches."
        action={
          <div className="flex gap-3">
            <button
              onClick={() => {
                const exportData = filteredBatches.map((b: any) => ({
                  'Batch Code': b.batchCode,
                  'Mineral Type': b.mineralType,
                  'Initial Weight (kg)': b.initialWeight,
                  'Status': b.status,
                  'Risk Level': b.riskLevel,
                  'Mine Name': b.mineName,
                  'Extraction Date': formatDate(b.extractionDate).split(' ')[0],
                  'Created By': b.createdBy,
                  'Date Registered': formatDate(b.createdAt),
                }));
                exportToCsv(exportData, 'minetrace-batches');
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export CSV
            </button>
            {canRegister && (
              <button
                onClick={() => {
                  reset({ extractionDate: new Date().toISOString().split('T')[0] });
                  setIsModalOpen(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Register Batch
              </button>
            )}
          </div>
        }
      />

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm py-1.5 px-3">
              <option value="">All</option>
              {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Mineral</label>
            <select value={mineralFilter} onChange={e => setMineralFilter(e.target.value)} className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm py-1.5 px-3">
              <option value="">All</option>
              {MINERAL_TYPES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Mine</label>
            <select value={mineFilter} onChange={e => setMineFilter(e.target.value)} className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm py-1.5 px-3">
              <option value="">All</option>
              {(minesData?.data || []).map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Risk Level</label>
            <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)} className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm py-1.5 px-3">
              <option value="">All</option>
              {Object.keys(RISK_COLORS).map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">From Date</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm py-1.5 px-3" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">To Date</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm py-1.5 px-3" />
          </div>
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={filteredBatches} 
        loading={isLoadingBatches}
        onRowClick={(row) => navigate(ROUTES.BATCH_DETAIL(row.id))}
        searchPlaceholder="Search by batch code..."
      />

      {/* Register Batch Modal */}
      {canRegister && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Register Mineral Batch"
          size="md"
          footer={
            <>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white border border-transparent rounded-lg bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Register Batch
              </button>
            </>
          }
        >
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Mineral Type *</label>
                <select
                  {...register('mineralType')}
                  className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border ${errors.mineralType ? 'border-red-300' : 'border-gray-300'} focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md`}
                >
                  <option value="">Select type</option>
                  {MINERAL_TYPES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                {errors.mineralType && <p className="mt-1 text-sm text-red-600">{errors.mineralType.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Initial Weight (kg) *</label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  {...register('initialWeight', { valueAsNumber: true })}
                  className={`mt-1 block w-full px-3 py-2 border ${errors.initialWeight ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                />
                {errors.initialWeight && <p className="mt-1 text-sm text-red-600">{errors.initialWeight.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Extraction Date *</label>
                <input
                  type="date"
                  max={new Date().toISOString().split('T')[0]}
                  {...register('extractionDate')}
                  className={`mt-1 block w-full px-3 py-2 border ${errors.extractionDate ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                />
                {errors.extractionDate && <p className="mt-1 text-sm text-red-600">{errors.extractionDate.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Mine of Origin *</label>
                <select
                  {...register('mineId')}
                  className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border ${errors.mineId ? 'border-red-300' : 'border-gray-300'} focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md`}
                >
                  <option value="">Select mine</option>
                  {availableMines.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                {errors.mineId && <p className="mt-1 text-sm text-red-600">{errors.mineId.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
              <textarea
                {...register('notes')}
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
          </form>
        </Modal>
      )}

      {/* QR Code Display Modal */}
      <Modal
        isOpen={qrModalData.isOpen}
        onClose={() => setQrModalData({ isOpen: false, batchCode: '' })}
        title="Batch Registered Successfully"
        size="sm"
        footer={
          <button
            type="button"
            onClick={() => setQrModalData({ isOpen: false, batchCode: '' })}
            className="w-full inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-white border border-transparent rounded-lg bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Close
          </button>
        }
      >
        <div className="flex flex-col items-center justify-center py-6">
          <p className="text-sm text-gray-500 mb-4 text-center">
            Scan this QR code to quickly access batch details during transit and verification.
          </p>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4">
            <QRCodeCanvas 
              ref={qrRef}
              value={qrModalData.batchCode} 
              size={200} 
              level="H"
              includeMargin={true}
            />
          </div>
          <p className="font-mono text-lg font-bold text-gray-900 mb-6">{qrModalData.batchCode}</p>
          
          <button
            onClick={downloadQR}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Download className="h-4 w-4 mr-2" />
            Download QR Code (PNG)
          </button>
        </div>
      </Modal>
    </div>
  );
}
