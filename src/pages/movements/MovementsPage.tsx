import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Truck, Loader2, FileSpreadsheet } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import DataTable, { Column } from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import { movementApi } from '../../api/movementApi';
import { batchApi } from '../../api/batchApi';
import { useAuthStore } from '../../store/authStore';
import { formatDate } from '../../utils/formatDate';
import { exportToCsv } from '../../utils/exportCsv';
import { ROUTES } from '../../constants/routes';
import { cn } from '../../lib/utils';

const movementSchema = z.object({
  batchId: z.string().min(1, 'Batch is required'),
  eventType: z.enum(['DISPATCH', 'RECEIVE', 'STORAGE', 'SALE', 'TRANSFER']),
  fromLocation: z.string().min(2, 'From location is required'),
  toLocation: z.string().min(2, 'To location is required'),
  weight: z.number().min(0.001, 'Weight must be greater than 0'),
  vehicle: z.string().optional(),
  driverName: z.string().optional(),
  notes: z.string().optional(),
});

type MovementForm = z.infer<typeof movementSchema>;

export default function MovementsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [batchSearch, setBatchSearch] = useState('');
  
  // Filters
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: movementsData, isLoading: isLoadingMovements } = useQuery({
    queryKey: ['movements'],
    queryFn: () => movementApi.getAll(),
  });

  const { data: batchesData } = useQuery({
    queryKey: ['batchesSearch', batchSearch],
    queryFn: () => batchApi.getAll({ search: batchSearch }),
    enabled: isModalOpen && batchSearch.length > 2,
  });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<MovementForm>({
    resolver: zodResolver(movementSchema),
    defaultValues: { eventType: 'DISPATCH' }
  });

  const selectedBatchId = watch('batchId');

  const createMutation = useMutation({
    mutationFn: (data: MovementForm) => {
      const batch = batchesData?.data.find((b: any) => b.id === data.batchId);
      return movementApi.create({ ...data, batchCode: batch?.batchCode, recordedBy: user?.fullName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      toast.success('Movement recorded successfully');
      setIsModalOpen(false);
      reset();
      setBatchSearch('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to record movement');
    },
  });

  const onSubmit = (data: MovementForm) => {
    createMutation.mutate(data);
  };

  const columns: Column<any>[] = [
    { 
      key: 'eventType', 
      label: 'Event Type', 
      sortable: true,
      render: (row) => (
        <span className={cn(
          "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
          row.eventType === 'DISPATCH' ? "bg-blue-100 text-blue-800" :
          row.eventType === 'RECEIVE' ? "bg-green-100 text-green-800" :
          row.eventType === 'STORAGE' ? "bg-slate-100 text-slate-800" :
          row.eventType === 'SALE' ? "bg-emerald-100 text-emerald-800" : "bg-purple-100 text-purple-800"
        )}>
          {row.eventType}
        </span>
      )
    },
    { 
      key: 'batchCode', 
      label: 'Batch Code', 
      sortable: true,
      render: (row) => (
        <span 
          className="font-mono font-medium text-primary-600 hover:text-primary-800 cursor-pointer hover:underline"
          onClick={(e) => {
            e.stopPropagation();
            navigate(ROUTES.BATCH_DETAIL(row.batchId));
          }}
        >
          {row.batchCode}
        </span>
      )
    },
    { key: 'fromLocation', label: 'From', sortable: true },
    { key: 'toLocation', label: 'To', sortable: true },
    { 
      key: 'weight', 
      label: 'Weight (kg)', 
      sortable: true,
      render: (row) => row.weight.toLocaleString()
    },
    { key: 'vehicle', label: 'Vehicle', sortable: true },
    { key: 'recordedBy', label: 'Recorded By', sortable: true },
    { 
      key: 'timestamp', 
      label: 'Timestamp', 
      sortable: true,
      render: (row) => formatDate(row.timestamp)
    },
  ];

  let filteredMovements = movementsData?.data || [];
  
  if (eventTypeFilter) {
    filteredMovements = filteredMovements.filter((m: any) => m.eventType === eventTypeFilter);
  }
  if (dateFrom) {
    filteredMovements = filteredMovements.filter((m: any) => new Date(m.timestamp) >= new Date(dateFrom));
  }
  if (dateTo) {
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);
    filteredMovements = filteredMovements.filter((m: any) => new Date(m.timestamp) <= to);
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Movement Events" 
        subtitle="Track the physical movement of mineral batches through the supply chain."
        action={
          <div className="flex gap-3">
            <button
              onClick={() => {
                const exportData = filteredMovements.map((m: any) => ({
                  'Event Type': m.eventType,
                  'Batch Code': m.batchCode,
                  'From': m.fromLocation,
                  'To': m.toLocation,
                  'Weight (kg)': m.weight,
                  'Vehicle': m.vehicle || 'N/A',
                  'Recorded By': m.recordedBy,
                  'Timestamp': formatDate(m.timestamp),
                }));
                exportToCsv(exportData, 'minetrace-movements');
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export CSV
            </button>
            <button
              onClick={() => {
                reset();
                setBatchSearch('');
                setIsModalOpen(true);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Truck className="h-4 w-4 mr-2" />
              Record Movement
            </button>
          </div>
        }
      />

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Event Type</label>
            <select value={eventTypeFilter} onChange={e => setEventTypeFilter(e.target.value)} className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm py-1.5 px-3">
              <option value="">All Types</option>
              <option value="DISPATCH">Dispatch</option>
              <option value="RECEIVE">Receive</option>
              <option value="STORAGE">Storage</option>
              <option value="TRANSFER">Transfer</option>
              <option value="SALE">Sale</option>
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
        data={filteredMovements} 
        loading={isLoadingMovements}
        searchPlaceholder="Search by batch code or location..."
      />

      {/* Record Movement Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Movement Event"
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
              disabled={isSubmitting || !selectedBatchId}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white border border-transparent rounded-lg bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Record Event
            </button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="block text-sm font-medium text-gray-700">Batch Code *</label>
            <div className="mt-1 relative">
              <input
                type="text"
                value={batchSearch}
                onChange={(e) => {
                  setBatchSearch(e.target.value);
                  setValue('batchId', ''); // Reset selected batch if search changes
                }}
                placeholder="Type to search batches..."
                className={`block w-full px-3 py-2 border ${errors.batchId ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
              />
              {/* Dropdown for search results */}
              {batchSearch.length > 2 && !selectedBatchId && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                  {batchesData?.data?.length > 0 ? (
                    batchesData.data.map((batch: any) => (
                      <div
                        key={batch.id}
                        className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-primary-50"
                        onClick={() => {
                          setValue('batchId', batch.id);
                          setBatchSearch(batch.batchCode);
                        }}
                      >
                        <span className="font-mono font-medium block truncate">{batch.batchCode}</span>
                        <span className="text-gray-500 text-xs">{batch.mineralType} • {batch.mineName}</span>
                      </div>
                    ))
                  ) : (
                    <div className="cursor-default select-none relative py-2 pl-3 pr-9 text-gray-500">
                      No batches found
                    </div>
                  )}
                </div>
              )}
            </div>
            {errors.batchId && <p className="mt-1 text-sm text-red-600">{errors.batchId.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Event Type *</label>
            <select
              {...register('eventType')}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            >
              <option value="DISPATCH">Dispatch</option>
              <option value="RECEIVE">Receive</option>
              <option value="STORAGE">Storage</option>
              <option value="TRANSFER">Transfer</option>
              <option value="SALE">Sale</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">From Location *</label>
              <input
                type="text"
                {...register('fromLocation')}
                className={`mt-1 block w-full px-3 py-2 border ${errors.fromLocation ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
              />
              {errors.fromLocation && <p className="mt-1 text-sm text-red-600">{errors.fromLocation.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">To Location *</label>
              <input
                type="text"
                {...register('toLocation')}
                className={`mt-1 block w-full px-3 py-2 border ${errors.toLocation ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
              />
              {errors.toLocation && <p className="mt-1 text-sm text-red-600">{errors.toLocation.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Recorded Weight (kg) *</label>
            <input
              type="number"
              step="0.001"
              {...register('weight', { valueAsNumber: true })}
              className={`mt-1 block w-full px-3 py-2 border ${errors.weight ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
            />
            {errors.weight && <p className="mt-1 text-sm text-red-600">{errors.weight.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Vehicle/Carrier</label>
              <input
                type="text"
                {...register('vehicle')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Driver Name</label>
              <input
                type="text"
                {...register('driverName')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
            <textarea
              {...register('notes')}
              rows={2}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
