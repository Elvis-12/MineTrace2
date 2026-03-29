import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Truck, QrCode, ShieldAlert, Download, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import StatusBadge from '../../components/ui/StatusBadge';
import RiskBadge from '../../components/ui/RiskBadge';
import Modal from '../../components/ui/Modal';
import DataTable, { Column } from '../../components/ui/DataTable';
import { batchApi } from '../../api/batchApi';
import { movementApi } from '../../api/movementApi';
import { verificationApi } from '../../api/verificationApi';
import { useAuthStore } from '../../store/authStore';
import { formatDate, formatRelativeTime } from '../../utils/formatDate';
import { ROUTES } from '../../constants/routes';
import { cn } from '../../lib/utils';

// Schemas
const movementSchema = z.object({
  eventType: z.enum(['DISPATCH', 'RECEIVE', 'STORAGE', 'SALE', 'TRANSFER']),
  fromLocation: z.string().min(2, 'From location is required'),
  toLocation: z.string().min(2, 'To location is required'),
  weight: z.number().min(0.001, 'Weight must be greater than 0'),
  vehicle: z.string().optional(),
  driverName: z.string().optional(),
  notes: z.string().optional(),
});

const verificationSchema = z.object({
  checkpoint: z.string().min(2, 'Checkpoint location is required'),
  passed: z.boolean(),
  remarks: z.string().optional(),
});

const overrideSchema = z.object({
  note: z.string().min(10, 'Justification note must be at least 10 characters'),
});

type MovementForm = z.infer<typeof movementSchema>;
type VerificationForm = z.infer<typeof verificationSchema>;
type OverrideForm = z.infer<typeof overrideSchema>;

export default function BatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const qrRef = useRef<HTMLCanvasElement>(null);

  const [activeTab, setActiveTab] = useState<'movements' | 'verifications' | 'audit'>('movements');
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);

  // Queries
  const { data: batchData, isLoading: isLoadingBatch } = useQuery({
    queryKey: ['batch', id],
    queryFn: () => batchApi.getById(id!),
    enabled: !!id,
  });

  const { data: movementsData, isLoading: isLoadingMovements } = useQuery({
    queryKey: ['movements', id],
    queryFn: () => movementApi.getAll({ batchId: id }),
    enabled: !!id,
  });

  const { data: verificationsData, isLoading: isLoadingVerifications } = useQuery({
    queryKey: ['verifications', id],
    queryFn: () => verificationApi.getLogsForBatch(id!),
    enabled: !!id,
  });

  const batch = batchData?.data;
  const movements = movementsData?.data || [];
  const verifications = verificationsData?.data || [];
  
  // Role checks
  const isAdmin = user?.role === 'ADMIN';
  const canRecordMovement = isAdmin || user?.role === 'SUPPLY_OFFICER';
  const canVerify = isAdmin || user?.role === 'INSPECTOR';

  // Mutations
  const analyzeMutation = useMutation({
    mutationFn: () => batchApi.runFraudAnalysis(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batch', id] });
      toast.success('Fraud analysis completed');
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Analysis failed'),
  });

  const movementMutation = useMutation({
    mutationFn: (data: MovementForm) => movementApi.create({ ...data, batchId: id, batchCode: batch?.batchCode, recordedBy: user?.fullName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements', id] });
      toast.success('Movement recorded successfully');
      setIsMovementModalOpen(false);
      movementForm.reset();
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to record movement'),
  });

  const verifyMutation = useMutation({
    mutationFn: (data: VerificationForm) => verificationApi.verify({ ...data, batchId: id, verifiedBy: user?.fullName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verifications', id] });
      toast.success('Verification logged successfully');
      setIsVerifyModalOpen(false);
      verifyForm.reset();
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to log verification'),
  });

  const overrideMutation = useMutation({
    mutationFn: (data: OverrideForm) => batchApi.overrideRisk(id!, data.note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batch', id] });
      toast.success('Risk level overridden successfully');
      setIsOverrideModalOpen(false);
      overrideForm.reset();
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to override risk'),
  });

  // Forms
  const movementForm = useForm<MovementForm>({ resolver: zodResolver(movementSchema), defaultValues: { eventType: 'DISPATCH' } });
  const verifyForm = useForm<VerificationForm>({ resolver: zodResolver(verificationSchema), defaultValues: { passed: true } });
  const overrideForm = useForm<OverrideForm>({ resolver: zodResolver(overrideSchema) });

  const downloadQR = () => {
    if (qrRef.current && batch) {
      const url = qrRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${batch.batchCode}-QR.png`;
      link.href = url;
      link.click();
    }
  };

  if (isLoadingBatch) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary-500" /></div>;
  }

  if (!batch) {
    return <div className="text-center py-12 text-gray-500">Batch not found</div>;
  }

  const isHighRisk = batch.riskLevel === 'HIGH';

  const verificationColumns: Column<any>[] = [
    { key: 'checkpoint', label: 'Checkpoint Location', sortable: true },
    { 
      key: 'passed', 
      label: 'Result', 
      sortable: true,
      render: (row) => (
        <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", row.passed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>
          {row.passed ? 'PASSED' : 'FAILED'}
        </span>
      )
    },
    { key: 'remarks', label: 'Remarks', sortable: true },
    { key: 'verifiedBy', label: 'Verified By', sortable: true },
    { key: 'timestamp', label: 'Date', sortable: true, render: (row) => formatDate(row.timestamp) },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex text-sm text-gray-500 font-medium mb-4">
        <button onClick={() => navigate(ROUTES.BATCHES)} className="hover:text-primary-600 transition-colors">Batches</button>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-mono">{batch.batchCode}</span>
      </nav>

      {/* High Risk Banner */}
      {isHighRisk && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm flex items-start">
          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wide">High Risk Alert</h3>
            <p className="mt-1 text-sm text-amber-700">
              This batch is flagged as HIGH RISK due to detected anomalies. Immediate review is required before further processing.
            </p>
          </div>
        </div>
      )}

      {/* Header Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 sm:p-8 flex flex-col md:flex-row justify-between gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-6">
              <h1 className="text-3xl font-bold text-gray-900 font-mono tracking-tight">{batch.batchCode}</h1>
              <StatusBadge status={batch.status} className="px-3 py-1 text-sm" />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Mineral Type</p>
                <p className="text-base font-semibold text-gray-900">{batch.mineralType}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Initial Weight</p>
                <p className="text-base font-semibold text-gray-900">{batch.initialWeight.toLocaleString()} kg</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Mine of Origin</p>
                <p className="text-base font-semibold text-gray-900">{batch.mineName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Extraction Date</p>
                <p className="text-base font-semibold text-gray-900">{formatDate(batch.extractionDate).split(' ')[0]}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Registered By</p>
                <p className="text-base font-semibold text-gray-900">{batch.createdBy}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Date Registered</p>
                <p className="text-base font-semibold text-gray-900">{formatDate(batch.createdAt)}</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center bg-gray-50 p-6 rounded-xl border border-gray-100 min-w-[240px]">
            <div className="bg-white p-3 rounded-lg shadow-sm mb-4">
              <QRCodeCanvas ref={qrRef} value={batch.batchCode} size={160} level="H" includeMargin={true} />
            </div>
            <button
              onClick={downloadQR}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 w-full justify-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Download QR
            </button>
          </div>
        </div>
        
        {/* Action Buttons Row */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex flex-wrap gap-3">
          {canRecordMovement && (
            <button
              onClick={() => setIsMovementModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Truck className="h-4 w-4 mr-2" />
              Record Movement
            </button>
          )}
          {canVerify && (
            <button
              onClick={() => setIsVerifyModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <QrCode className="h-4 w-4 mr-2" />
              Verify Batch
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => analyzeMutation.mutate()}
              disabled={analyzeMutation.isPending}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {analyzeMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldAlert className="h-4 w-4 mr-2" />}
              Run Fraud Analysis
            </button>
          )}
        </div>
      </div>

      {/* Risk Assessment Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Fraud Risk Assessment</h2>
          <RiskBadge level={batch.riskLevel} className="px-3 py-1 text-sm" />
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-medium text-gray-700">Anomaly Score</span>
            <span className={cn("text-lg font-bold", batch.anomalyScore >= 3 ? "text-red-600" : batch.anomalyScore >= 1 ? "text-amber-600" : "text-green-600")}>
              {batch.anomalyScore.toFixed(1)} / 5.0
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div 
              className={cn("h-2.5 rounded-full transition-all duration-500", batch.anomalyScore >= 3 ? "bg-red-600" : batch.anomalyScore >= 1 ? "bg-amber-500" : "bg-green-500")}
              style={{ width: `${(batch.anomalyScore / 5) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {[
            { key: 'weight', label: 'Weight anomaly detected' },
            { key: 'route', label: 'Route deviation detected' },
            { key: 'duplicate', label: 'Duplicate event detected' },
            { key: 'license', label: 'License compliance issue' },
            { key: 'handover', label: 'Missing handover step' },
          ].map((flag) => {
            const isFlagged = batch.flags[flag.key as keyof typeof batch.flags];
            return (
              <div key={flag.key} className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                {isFlagged ? (
                  <XCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                )}
                <span className={cn("text-sm font-medium", isFlagged ? "text-red-700" : "text-gray-700")}>
                  {flag.label}
                </span>
              </div>
            );
          })}
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Analysis based on historical movement patterns, expected weight loss during transit, and compliance with registered routes.
          Last analyzed: {formatDate(batch.createdAt)} {/* Mocking analyzed date */}
        </p>

        {batch.overrideNote && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <h4 className="text-sm font-bold text-yellow-800 mb-1">Admin Override Applied</h4>
            <p className="text-sm text-yellow-700">{batch.overrideNote}</p>
          </div>
        )}

        {isAdmin && batch.riskLevel !== 'LOW' && !batch.overrideNote && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <button
              onClick={() => setIsOverrideModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Override Risk Level
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('movements')}
              className={cn(
                "w-1/2 sm:w-auto py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors",
                activeTab === 'movements'
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              Movement History
            </button>
            <button
              onClick={() => setActiveTab('verifications')}
              className={cn(
                "w-1/2 sm:w-auto py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors",
                activeTab === 'verifications'
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              Verification Logs
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab('audit')}
                className={cn(
                  "w-full sm:w-auto py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors",
                  activeTab === 'audit'
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )}
              >
                Audit Logs
              </button>
            )}
          </nav>
        </div>

        <div className="p-0">
          {activeTab === 'movements' && (
            <div className="p-6">
              {isLoadingMovements ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
              ) : movements.length > 0 ? (
                <div className="flow-root">
                  <ul className="-mb-8">
                    {movements.map((movement: any, idx: number) => (
                      <li key={movement.id}>
                        <div className="relative pb-8">
                          {idx !== movements.length - 1 ? (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                          ) : null}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white",
                                movement.eventType === 'DISPATCH' ? "bg-blue-500" :
                                movement.eventType === 'RECEIVE' ? "bg-green-500" :
                                movement.eventType === 'STORAGE' ? "bg-slate-500" :
                                movement.eventType === 'SALE' ? "bg-emerald-500" : "bg-purple-500"
                              )}>
                                <Truck className="h-4 w-4 text-white" aria-hidden="true" />
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-900 font-medium">
                                  {movement.eventType} <span className="text-gray-500 font-normal">recorded by</span> {movement.recordedBy}
                                </p>
                                <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 inline-block">
                                  <div className="flex items-center gap-2 font-medium">
                                    <span>{movement.fromLocation}</span>
                                    <span className="text-gray-400">→</span>
                                    <span>{movement.toLocation}</span>
                                  </div>
                                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
                                    <div>Weight: <span className="font-medium text-gray-900">{movement.weight} kg</span></div>
                                    {movement.vehicle && <div>Vehicle: <span className="font-medium text-gray-900">{movement.vehicle}</span></div>}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                <time dateTime={movement.timestamp}>{formatRelativeTime(movement.timestamp)}</time>
                                <div className="text-xs mt-1">{formatDate(movement.timestamp)}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">No movement history found for this batch.</div>
              )}
            </div>
          )}

          {activeTab === 'verifications' && (
            <DataTable 
              columns={verificationColumns} 
              data={verifications} 
              loading={isLoadingVerifications}
              searchable={false}
            />
          )}

          {activeTab === 'audit' && isAdmin && (
            <div className="p-6 text-center text-gray-500">
              Audit logs for this specific batch would be displayed here.
            </div>
          )}
        </div>
      </div>

      {/* Record Movement Modal */}
      <Modal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        title="Record Movement Event"
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsMovementModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={movementForm.handleSubmit((data) => movementMutation.mutate(data))}
              disabled={movementMutation.isPending}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white border border-transparent rounded-lg bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {movementMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Record Event
            </button>
          </>
        }
      >
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Event Type *</label>
            <select
              {...movementForm.register('eventType')}
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
                {...movementForm.register('fromLocation')}
                className={`mt-1 block w-full px-3 py-2 border ${movementForm.formState.errors.fromLocation ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
              />
              {movementForm.formState.errors.fromLocation && <p className="mt-1 text-sm text-red-600">{movementForm.formState.errors.fromLocation.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">To Location *</label>
              <input
                type="text"
                {...movementForm.register('toLocation')}
                className={`mt-1 block w-full px-3 py-2 border ${movementForm.formState.errors.toLocation ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
              />
              {movementForm.formState.errors.toLocation && <p className="mt-1 text-sm text-red-600">{movementForm.formState.errors.toLocation.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Recorded Weight (kg) *</label>
            <input
              type="number"
              step="0.001"
              {...movementForm.register('weight', { valueAsNumber: true })}
              className={`mt-1 block w-full px-3 py-2 border ${movementForm.formState.errors.weight ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
            />
            {movementForm.formState.errors.weight && <p className="mt-1 text-sm text-red-600">{movementForm.formState.errors.weight.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Vehicle/Carrier</label>
              <input
                type="text"
                {...movementForm.register('vehicle')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Driver Name</label>
              <input
                type="text"
                {...movementForm.register('driverName')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              {...movementForm.register('notes')}
              rows={2}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
        </form>
      </Modal>

      {/* Verify Batch Modal */}
      <Modal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        title="Verify Batch"
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsVerifyModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={verifyForm.handleSubmit((data) => verifyMutation.mutate(data))}
              disabled={verifyMutation.isPending}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white border border-transparent rounded-lg bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {verifyMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit Verification
            </button>
          </>
        }
      >
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Checkpoint Location *</label>
            <input
              type="text"
              {...verifyForm.register('checkpoint')}
              className={`mt-1 block w-full px-3 py-2 border ${verifyForm.formState.errors.checkpoint ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
            />
            {verifyForm.formState.errors.checkpoint && <p className="mt-1 text-sm text-red-600">{verifyForm.formState.errors.checkpoint.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Verification Result *</label>
            <div className="flex items-center space-x-6">
              <label className="flex items-center">
                <input
                  type="radio"
                  {...verifyForm.register('passed')}
                  value="true"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-900">Passed</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  {...verifyForm.register('passed')}
                  value="false"
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-900">Failed</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Remarks</label>
            <textarea
              {...verifyForm.register('remarks')}
              rows={3}
              placeholder="Provide details if verification failed..."
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
        </form>
      </Modal>

      {/* Override Risk Modal */}
      <Modal
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        title="Override Risk Level"
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsOverrideModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={overrideForm.handleSubmit((data) => overrideMutation.mutate(data))}
              disabled={overrideMutation.isPending}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white border border-transparent rounded-lg bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
            >
              {overrideMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirm Override
            </button>
          </>
        }
      >
        <form className="space-y-4">
          <div className="bg-amber-50 p-4 rounded-md border border-amber-200 mb-4">
            <p className="text-sm text-amber-800">
              You are about to override the automated fraud risk assessment. This action will be logged and audited.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Justification Note *</label>
            <textarea
              {...overrideForm.register('note')}
              rows={4}
              placeholder="Explain why this risk flag is being overridden..."
              className={`mt-1 block w-full px-3 py-2 border ${overrideForm.formState.errors.note ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
            />
            {overrideForm.formState.errors.note && <p className="mt-1 text-sm text-red-600">{overrideForm.formState.errors.note.message}</p>}
          </div>
        </form>
      </Modal>
    </div>
  );
}
