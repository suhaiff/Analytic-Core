import { fetchWithAuth } from '../utils/fetchWithAuth';
import React, { useState, useRef, useCallback } from 'react';
import { X, Upload, CheckCircle2, Clock, AlertCircle, QrCode, Shield, Smartphone, Image as ImageIcon, Loader2 } from 'lucide-react';
import { API_BASE } from '../config/api';
import { User } from '../types';

interface PaymentQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  planId: string;
  planName: string;
  planType: 'PREMIUM' | 'CUSTOM';
  billingCycle: 'MONTHLY' | 'YEARLY';
  amount: number;
  moduleIds?: string[];
  organizationId?: string | null;
}

type ModalStep = 'PAYMENT' | 'UPLOADING' | 'SUCCESS';

export const PaymentQRModal: React.FC<PaymentQRModalProps> = ({
  isOpen,
  onClose,
  user,
  planId,
  planName,
  planType,
  billingCycle,
  amount,
  moduleIds = [],
  organizationId = null,
}) => {
  const [step, setStep] = useState<ModalStep>('PAYMENT');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isFullscreenQR, setIsFullscreenQR] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, etc.)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }
    setError(null);
    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setScreenshotPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleSubmitPayment = async () => {
    if (!screenshotFile || !user) return;
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('screenshot', screenshotFile);
      formData.append('user_id', String(user.id));
      formData.append('user_name', user.name || '');
      formData.append('user_email', user.email || '');
      formData.append('plan_id', planId);
      formData.append('plan_name', planName);
      formData.append('plan_type', planType);
      formData.append('billing_cycle', billingCycle);
      formData.append('amount', String(amount));
      formData.append('module_ids', JSON.stringify(moduleIds));
      if (organizationId) formData.append('organization_id', organizationId);

      const res = await fetchWithAuth(`${API_BASE}/payment-requests`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit payment proof');
      }

      setStep('SUCCESS');
    } catch (err: any) {
      setError(err.message || 'Failed to submit. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (step === 'SUCCESS') {
      // On success close, reload to reflect pending state
      window.location.reload();
    } else {
      setStep('PAYMENT');
      setScreenshotFile(null);
      setScreenshotPreview(null);
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  const yearlyLabel = billingCycle === 'YEARLY' ? '/yr' : '/mo';
  const billingText = billingCycle === 'YEARLY' ? 'Yearly (Save 20%)' : 'Monthly';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[95vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-700/60 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-tight">Complete Payment</h2>
              <p className="text-[11px] text-slate-400 font-medium">Scan QR · Pay · Upload Screenshot</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'SUCCESS' ? (
          /* Success State */
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mb-6 animate-bounce-once">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            <h3 className="text-2xl font-extrabold text-white mb-3">Payment Proof Submitted!</h3>
            <p className="text-slate-400 mb-2 max-w-md leading-relaxed">
              Your payment screenshot has been sent to the admin for verification. Your subscription will be activated once approved.
            </p>
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-sm font-semibold mt-4">
              <Clock className="w-4 h-4" />
              Pending Admin Approval
            </div>
            <button
              onClick={handleClose}
              className="mt-8 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Order Summary + QR */}
            <div className="flex flex-col gap-4">
              {/* Order Summary */}
              <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Order Summary</p>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-white font-bold text-base">{planName}</p>
                    <p className="text-slate-400 text-xs">{planType === 'CUSTOM' ? 'Custom Plan' : 'Premium Plan'} · {billingText}</p>
                    {moduleIds.length > 0 && (
                      <p className="text-indigo-400 text-xs mt-1">{moduleIds.length} module{moduleIds.length > 1 ? 's' : ''} selected</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-extrabold text-white">₹{amount.toLocaleString()}</p>
                    <p className="text-slate-400 text-xs">{yearlyLabel}</p>
                  </div>
                </div>
                <div className="h-px bg-slate-700 my-3" />
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Total Due</span>
                  <span className="text-white font-black">₹{amount.toLocaleString()}</span>
                </div>
              </div>

              {/* QR Code */}
              <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 flex flex-col items-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Scan & Pay via UPI</p>
                <div 
                  className="relative rounded-2xl overflow-hidden border-2 border-indigo-500/30 p-1 cursor-pointer hover:border-indigo-400 transition-colors group"
                  onClick={() => setIsFullscreenQR(true)}
                  title="Click to view full screen"
                >
                  <div className="absolute inset-0 bg-indigo-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <QrCode className="w-8 h-8 text-white drop-shadow-md" />
                  </div>
                  <img
                    src="/upi_qr.png"
                    alt="UPI QR Code"
                    className="w-48 h-48 object-contain rounded-xl group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      // Fallback if image doesn't load
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
                <div className="mt-3 text-center">
                  <p className="text-slate-400 text-xs font-medium">UPI ID</p>
                  <p className="text-indigo-400 font-bold text-sm font-mono mt-0.5">analyticcore@paytm</p>
                </div>
                <div className="flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                  <Shield className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 text-[10px] font-bold">Secured by UPI</span>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Steps</p>
                {[
                  { icon: Smartphone, text: 'Open PhonePe, GPay, or Paytm' },
                  { icon: QrCode, text: 'Scan the QR code above' },
                  { icon: CheckCircle2, text: `Pay ₹${amount.toLocaleString()} and save screenshot` },
                  { icon: Upload, text: 'Upload screenshot on the right' },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-2.5 mb-2 last:mb-0">
                    <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                      <span className="text-indigo-400 text-[9px] font-black">{i + 1}</span>
                    </div>
                    <span className="text-slate-400 text-xs">{step.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Screenshot Upload */}
            <div className="flex flex-col gap-4">
              <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Upload Payment Screenshot</p>

                {screenshotPreview ? (
                  /* Preview */
                  <div className="space-y-3">
                    <div className="relative rounded-xl overflow-hidden border border-emerald-500/30 bg-slate-900">
                      <img
                        src={screenshotPreview}
                        alt="Payment Screenshot"
                        className="w-full h-52 object-contain"
                      />
                      <div className="absolute top-2 right-2">
                        <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full backdrop-blur-sm">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400 text-[10px] font-bold">Uploaded</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-slate-900 border border-slate-700 rounded-xl">
                      <ImageIcon className="w-4 h-4 text-slate-400 shrink-0" />
                      <p className="text-slate-300 text-xs font-medium truncate flex-1">{screenshotFile?.name}</p>
                      <button
                        onClick={() => { setScreenshotFile(null); setScreenshotPreview(null); }}
                        className="text-red-400 hover:text-red-300 text-xs font-bold px-2 py-1 rounded-lg hover:bg-red-500/10 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Drop Zone */
                  <div
                    className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
                      isDragging
                        ? 'border-indigo-400 bg-indigo-500/10 scale-[1.02]'
                        : 'border-slate-600 hover:border-indigo-500/50 hover:bg-slate-800'
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    />
                    <div className={`w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-all ${isDragging ? 'bg-indigo-500/20' : 'bg-slate-700'}`}>
                      <Upload className={`w-7 h-7 transition-colors ${isDragging ? 'text-indigo-400' : 'text-slate-400'}`} />
                    </div>
                    <p className="text-white font-bold text-sm mb-1">
                      {isDragging ? 'Drop screenshot here' : 'Upload payment screenshot'}
                    </p>
                    <p className="text-slate-500 text-xs">
                      Drag & drop or click to browse
                    </p>
                    <p className="text-slate-600 text-[10px] mt-2">
                      JPG, PNG, GIF · Max 10MB
                    </p>
                  </div>
                )}

                {/* Important note */}
                <div className="mt-4 flex items-start gap-2 p-3 bg-amber-500/8 border border-amber-500/20 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-amber-300 text-xs leading-relaxed">
                    Make sure your screenshot clearly shows the payment amount, transaction ID, and date. Blurry or incomplete screenshots may cause delays.
                  </p>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmitPayment}
                disabled={!screenshotFile || uploading}
                className={`w-full py-4 px-6 rounded-xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-2.5 shadow-lg ${
                  screenshotFile && !uploading
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white hover:shadow-indigo-500/30 hover:-translate-y-0.5'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting Proof...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Submit Payment Proof
                  </>
                )}
              </button>

              <p className="text-slate-500 text-[10px] text-center leading-relaxed">
                Your subscription will be activated within a few hours after admin verification. You'll be notified once approved.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen QR Code Overlay */}
      {isFullscreenQR && (
        <div 
          className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl animate-fade-in"
          onClick={() => setIsFullscreenQR(false)}
        >
          <button 
            className="absolute top-8 right-8 p-3 rounded-full bg-slate-800/50 hover:bg-slate-700 text-white transition-colors"
            onClick={() => setIsFullscreenQR(false)}
          >
            <X className="w-8 h-8" />
          </button>
          
          <div 
            className="bg-white p-4 rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src="/upi_qr.png"
              alt="UPI QR Code Fullscreen"
              className="max-w-[80vw] max-h-[70vh] object-contain rounded-2xl"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
          
          <div className="mt-8 text-center" onClick={(e) => e.stopPropagation()}>
            <p className="text-slate-400 text-sm font-medium mb-1">UPI ID</p>
            <p className="text-indigo-400 font-bold text-2xl font-mono">analyticcore@paytm</p>
          </div>
        </div>
      )}
    </div>
  );
};
