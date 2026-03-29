import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Html5Qrcode } from 'html5-qrcode';
import toast from 'react-hot-toast';
import { QrCode, Keyboard, Loader2, CheckCircle, AlertTriangle, XCircle, ArrowRight } from 'lucide-react';
import { batchApi } from '../../api/batchApi';
import { verificationApi } from '../../api/verificationApi';
import { useAuthStore } from '../../store/authStore';
import StatusBadge from '../../components/ui/StatusBadge';
import RiskBadge from '../../components/ui/RiskBadge';
import { formatDate } from '../../utils/formatDate';
import { cn } from '../../lib/utils';

export default function VerificationPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'scan' | 'manual'>('scan');
  const [batchCode, setBatchCode] = useState('');
  const [scannedBatch, setScannedBatch] = useState<any | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const lookupMutation = useMutation({
    mutationFn: (code: string) => batchApi.getById(code), // Assuming getById can take batchCode
    onSuccess: (res) => {
      setScannedBatch(res.data);
      setScanError(null);
      // Auto-log verification
      logVerificationMutation.mutate({
        batchId: res.data.id,
        checkpoint: 'QR Scan Checkpoint', // In a real app, this might be selected or derived from user location
        passed: res.data.riskLevel !== 'HIGH' && res.data.riskLevel !== 'FLAGGED',
      });
    },
    onError: () => {
      setScannedBatch(null);
      setScanError('Batch not found in the system');
    },
  });

  const logVerificationMutation = useMutation({
    mutationFn: (data: any) => verificationApi.verify({ ...data, verifiedBy: user?.fullName }),
    onSuccess: () => {
      toast.success('Verification logged automatically');
    },
  });

  useEffect(() => {
    let html5QrCode: Html5Qrcode;

    if (activeTab === 'scan') {
      html5QrCode = new Html5Qrcode("reader");
      setIsScanning(true);
      
      html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          // Stop scanning once we get a result
          html5QrCode.stop().then(() => {
            setIsScanning(false);
            lookupMutation.mutate(decodedText);
          }).catch(err => console.error("Failed to stop scanner", err));
        },
        (errorMessage) => {
          // Ignore continuous scanning errors
        }
      ).catch((err) => {
        setIsScanning(false);
        setScanError("Camera access denied or not available.");
        console.error("Camera start error", err);
      });
    }

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(console.error);
      }
    };
  }, [activeTab]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (batchCode.trim()) {
      lookupMutation.mutate(batchCode.trim());
    }
  };

  const resetScanner = () => {
    setScannedBatch(null);
    setScanError(null);
    setBatchCode('');
    setActiveTab('scan'); // This will trigger the useEffect to restart the camera
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Batch Verification</h1>
        <p className="text-gray-500">Scan a QR code or enter a batch code to verify authenticity</p>
      </div>

      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Tabs */}
        {!scannedBatch && !scanError && (
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('scan')}
              className={cn(
                "flex-1 py-4 px-6 text-center font-medium text-sm transition-colors flex items-center justify-center gap-2",
                activeTab === 'scan' ? "bg-primary-50 text-primary-700 border-b-2 border-primary-600" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              )}
            >
              <QrCode className="h-5 w-5" />
              Scan QR Code
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={cn(
                "flex-1 py-4 px-6 text-center font-medium text-sm transition-colors flex items-center justify-center gap-2",
                activeTab === 'manual' ? "bg-primary-50 text-primary-700 border-b-2 border-primary-600" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              )}
            >
              <Keyboard className="h-5 w-5" />
              Enter Batch Code
            </button>
          </div>
        )}

        <div className="p-6 sm:p-8">
          {/* Scan Tab */}
          {!scannedBatch && !scanError && activeTab === 'scan' && (
            <div className="flex flex-col items-center">
              <div className="relative w-full max-w-sm aspect-square bg-black rounded-xl overflow-hidden shadow-inner border-4 border-gray-100">
                <div id="reader" className="w-full h-full"></div>
                {isScanning && (
                  <div className="absolute inset-0 border-2 border-primary-500 opacity-50 animate-pulse pointer-events-none"></div>
                )}
              </div>
              <p className="mt-6 text-sm text-gray-500 flex items-center gap-2">
                {isScanning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Position QR code within the frame
                  </>
                ) : (
                  "Initializing camera..."
                )}
              </p>
            </div>
          )}

          {/* Manual Tab */}
          {!scannedBatch && !scanError && activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} className="flex flex-col items-center py-8">
              <div className="w-full max-w-sm">
                <label htmlFor="batchCode" className="sr-only">Batch Code</label>
                <input
                  type="text"
                  id="batchCode"
                  value={batchCode}
                  onChange={(e) => setBatchCode(e.target.value)}
                  placeholder="e.g. MT-2026-001"
                  className="block w-full px-4 py-3 text-center font-mono text-lg border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!batchCode.trim() || lookupMutation.isPending}
                  className="mt-4 w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
                >
                  {lookupMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Verify Batch'}
                </button>
              </div>
            </form>
          )}

          {/* Error State */}
          {scanError && (
            <div className="text-center py-8 animate-in fade-in zoom-in duration-300">
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-6">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
              <p className="text-gray-500 mb-8">{scanError}</p>
              <button
                onClick={resetScanner}
                className="inline-flex justify-center py-3 px-6 border border-transparent text-sm font-medium rounded-xl text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
              >
                Scan Another Code
              </button>
            </div>
          )}

          {/* Success State */}
          {scannedBatch && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {scannedBatch.riskLevel === 'HIGH' || scannedBatch.status === 'FLAGGED' ? (
                <div className="bg-red-50 border-2 border-red-500 rounded-xl p-6 mb-6 text-center shadow-sm">
                  <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-3" />
                  <h2 className="text-2xl font-bold text-red-800 mb-1">FLAGGED — HIGH RISK BATCH</h2>
                  <p className="text-red-600 font-medium">This batch has failed security checks and requires immediate impoundment.</p>
                </div>
              ) : (
                <div className="bg-green-50 border-2 border-green-500 rounded-xl p-6 mb-6 text-center shadow-sm">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                  <h2 className="text-2xl font-bold text-green-800 mb-1">VERIFIED — Batch Authenticated</h2>
                  <p className="text-green-600 font-medium">This batch is registered and cleared for transit.</p>
                </div>
              )}

              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Batch Code</p>
                    <p className="text-2xl font-mono font-bold text-gray-900">{scannedBatch.batchCode}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={scannedBatch.status} className="mb-2 block" />
                    <RiskBadge level={scannedBatch.riskLevel} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Mineral Type</p>
                    <p className="font-medium text-gray-900">{scannedBatch.mineralType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Initial Weight</p>
                    <p className="font-medium text-gray-900">{scannedBatch.initialWeight} kg</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 mb-1">Mine of Origin</p>
                    <p className="font-medium text-gray-900">{scannedBatch.mineName}</p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <p className="text-xs text-gray-500 mb-2">Registration Date</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(scannedBatch.createdAt)}</p>
                </div>
              </div>

              <div className="mt-8 flex justify-center">
                <button
                  onClick={resetScanner}
                  className="inline-flex justify-center py-3 px-8 border border-transparent text-sm font-medium rounded-xl text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-sm"
                >
                  Scan Next Batch
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
