import React, { useState, useRef, useEffect } from 'react';
import { authService } from '../../services/authService';
import { useTheme } from '../../ThemeContext';
import { getThemeClasses } from '../../theme';
import { KeyRound, Mail, Lock, Unlock, AlertCircle, ArrowRight, ArrowLeft, CheckCircle2, RefreshCw, ShieldCheck } from 'lucide-react';

interface ForgotPasswordProps {
    onBack: () => void;
    onResetSuccess: () => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack, onResetSuccess }) => {
    const { theme } = useTheme();
    const colors = getThemeClasses(theme);
    const [step, setStep] = useState<'email' | 'otp' | 'newPassword'>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    const isDark = theme === 'dark';

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await authService.forgotPassword(email);
            setStep('otp');
            setSuccess('A 6-digit OTP has been sent to your email');
            setResendCooldown(60);
        } catch (err: any) {
            setError(err.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendCooldown > 0) return;
        setError('');
        setLoading(true);
        try {
            await authService.forgotPassword(email);
            setSuccess('OTP has been resent to your email');
            setResendCooldown(60);
            setOtp(['', '', '', '', '', '']);
        } catch (err: any) {
            setError(err.message || 'Failed to resend OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return; // Only digits
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1); // Only take last digit
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        const newOtp = [...otp];
        for (let i = 0; i < pastedData.length; i++) {
            newOtp[i] = pastedData[i];
        }
        setOtp(newOtp);
        if (pastedData.length > 0) {
            const focusIndex = Math.min(pastedData.length, 5);
            otpRefs.current[focusIndex]?.focus();
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        const otpString = otp.join('');
        if (otpString.length !== 6) {
            setError('Please enter all 6 digits');
            return;
        }
        setLoading(true);
        try {
            await authService.verifyOtp(email, otpString);
            setStep('newPassword');
            setSuccess('OTP verified! Set your new password below.');
        } catch (err: any) {
            setError(err.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const otpString = otp.join('');
            await authService.resetPassword(email, otpString, newPassword);
            onResetSuccess();
        } catch (err: any) {
            setError(err.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    const renderStepIndicator = () => (
        <div className="flex items-center justify-center gap-2 mb-8">
            {['email', 'otp', 'newPassword'].map((s, i) => (
                <React.Fragment key={s}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${
                        step === s 
                            ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30 scale-110' 
                            : ['email', 'otp', 'newPassword'].indexOf(step) > i
                                ? 'bg-emerald-500 text-white shadow-sm'
                                : `${isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-200 text-slate-400'}`
                    }`}>
                        {['email', 'otp', 'newPassword'].indexOf(step) > i ? (
                            <CheckCircle2 className="w-4 h-4" />
                        ) : (
                            i + 1
                        )}
                    </div>
                    {i < 2 && (
                        <div className={`w-8 h-0.5 rounded-full transition-all duration-300 ${
                            ['email', 'otp', 'newPassword'].indexOf(step) > i 
                                ? 'bg-emerald-500' 
                                : isDark ? 'bg-slate-700' : 'bg-slate-200'
                        }`}></div>
                    )}
                </React.Fragment>
            ))}
        </div>
    );

    return (
        <div className={`min-h-screen flex items-center justify-center mesh-gradient p-4 relative overflow-hidden font-jakarta w-full`}>
            <div className="noise-bg"></div>

            <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] ${isDark ? 'bg-indigo-600/20' : 'bg-indigo-400/20'} blur-[140px] rounded-full animate-pulse-glow`}></div>
            <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] ${isDark ? 'bg-violet-600/20' : 'bg-violet-400/20'} blur-[140px] rounded-full animate-pulse-glow delay-700`}></div>

            <div className={`max-w-[420px] w-full auth-glass-card rounded-[32px] p-6 sm:p-8 relative z-10 animate-fade-in-up mx-4 overflow-hidden`}>
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>

                <button
                    onClick={step === 'email' ? onBack : () => setStep(step === 'newPassword' ? 'otp' : 'email')}
                    className={`absolute top-6 left-6 p-2 rounded-full hover:${colors.bgTertiary} ${colors.textMuted} hover:${colors.textPrimary} transition-all duration-300 z-20 active-press flex items-center gap-1`}
                    title="Go back"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="text-center mb-8 relative pt-4">
                    <div className="relative inline-block mb-6">
                        <div className="absolute inset-0 bg-indigo-500 blur-[30px] opacity-20"></div>
                        <div className="relative bg-gradient-to-br from-indigo-500 to-violet-600 w-14 h-14 rounded-[18px] flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/40">
                            {step === 'newPassword' ? <ShieldCheck className="w-7 h-7 text-white" /> : <KeyRound className="w-7 h-7 text-white" />}
                        </div>
                    </div>
                    <h2 className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'} tracking-tight mb-2 font-poppins`}>
                        {step === 'email' && 'Forgot Password'}
                        {step === 'otp' && 'Verify OTP'}
                        {step === 'newPassword' && 'New Password'}
                    </h2>
                    <p className={`${isDark ? 'text-slate-300' : 'text-slate-600'} text-sm font-medium opacity-90`}>
                        {step === 'email' && "Enter your email to receive a verification code"}
                        {step === 'otp' && `Enter the 6-digit code sent to ${email}`}
                        {step === 'newPassword' && "Create a strong password for your account"}
                    </p>
                </div>

                {renderStepIndicator()}

                {error && (
                    <div className={`mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400 animate-shake`}>
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span className="text-sm font-semibold">{error}</span>
                    </div>
                )}

                {success && (
                    <div className={`mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-400`}>
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        <span className="text-sm font-semibold">{success}</span>
                    </div>
                )}

                {/* Step 1: Email */}
                {step === 'email' && (
                    <form onSubmit={handleRequestOtp} className="space-y-7 relative">
                        <div className="space-y-2.5">
                            <label className={`block text-[11px] font-bold ${isDark ? 'text-slate-300' : 'text-slate-500'} uppercase tracking-[2px] ml-1 opacity-80`}>
                                Email Address
                            </label>
                            <div className={`relative input-glossy rounded-2xl group transition-all duration-300`}>
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors duration-300">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={`w-full bg-transparent border-none py-5 pl-12 pr-4 ${colors.textPrimary} placeholder-slate-500/40 focus:ring-0 outline-none text-base font-semibold`}
                                    placeholder="name@company.com"
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full relative group overflow-hidden bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-3.5 rounded-2xl transition-all duration-500 shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 active-press disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 pointer-events-none"></div>
                            <div className="relative flex items-center justify-center gap-3">
                                {loading ? (
                                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span className="text-base tracking-wide">Send OTP</span>
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-500" />
                                    </>
                                )}
                            </div>
                        </button>
                    </form>
                )}

                {/* Step 2: OTP */}
                {step === 'otp' && (
                    <form onSubmit={handleVerifyOtp} className="space-y-7 relative">
                        <div className="space-y-4">
                            <label className={`block text-[11px] font-bold ${isDark ? 'text-slate-300' : 'text-slate-500'} uppercase tracking-[2px] ml-1 opacity-80 text-center`}>
                                Verification Code
                            </label>
                            <div className="flex justify-center gap-2.5" onPaste={handleOtpPaste}>
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={el => otpRefs.current[index] = el}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                        className={`w-12 h-14 text-center text-xl font-extrabold rounded-xl border-2 transition-all duration-300 outline-none ${
                                            digit
                                                ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 shadow-lg shadow-indigo-500/20'
                                                : isDark 
                                                    ? 'border-slate-700 bg-slate-900/50 text-white focus:border-indigo-500 focus:bg-indigo-500/5' 
                                                    : 'border-slate-200 bg-white text-slate-900 focus:border-indigo-500 focus:bg-indigo-50'
                                        }`}
                                        autoFocus={index === 0}
                                    />
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || otp.join('').length !== 6}
                            className="w-full relative group overflow-hidden bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-3.5 rounded-2xl transition-all duration-500 shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 active-press disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 pointer-events-none"></div>
                            <div className="relative flex items-center justify-center gap-3">
                                {loading ? (
                                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span className="text-base tracking-wide">Verify Code</span>
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-500" />
                                    </>
                                )}
                            </div>
                        </button>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={handleResendOtp}
                                disabled={resendCooldown > 0 || loading}
                                className={`text-sm font-bold transition-all duration-300 inline-flex items-center gap-2 ${
                                    resendCooldown > 0 
                                        ? isDark ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 cursor-not-allowed'
                                        : 'text-indigo-400 hover:text-indigo-300'
                                }`}
                            >
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Step 3: New Password */}
                {step === 'newPassword' && (
                    <form onSubmit={handleResetPassword} className="space-y-7 relative">
                        <div className="space-y-2.5">
                            <label className={`block text-[11px] font-bold ${isDark ? 'text-slate-300' : 'text-slate-500'} uppercase tracking-[2px] ml-1 opacity-80`}>
                                New Password
                            </label>
                            <div className={`relative input-glossy rounded-2xl group transition-all duration-300`}>
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors duration-300">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className={`w-full bg-transparent border-none py-5 pl-12 pr-14 ${colors.textPrimary} placeholder-slate-500/40 focus:ring-0 outline-none text-base font-semibold`}
                                    placeholder="Enter new password"
                                    required
                                    minLength={8}
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-400 transition-all duration-300 p-1.5 rounded-lg hover:bg-white/5"
                                >
                                    {showPassword ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2.5">
                            <label className={`block text-[11px] font-bold ${isDark ? 'text-slate-300' : 'text-slate-500'} uppercase tracking-[2px] ml-1 opacity-80`}>
                                Confirm Password
                            </label>
                            <div className={`relative input-glossy rounded-2xl group transition-all duration-300`}>
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors duration-300">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className={`w-full bg-transparent border-none py-5 pl-12 pr-14 ${colors.textPrimary} placeholder-slate-500/40 focus:ring-0 outline-none text-base font-semibold`}
                                    placeholder="Confirm new password"
                                    required
                                />
                            </div>
                            {confirmPassword.length > 0 && (
                                <div className="flex items-center gap-2 px-1">
                                    {newPassword === confirmPassword ? (
                                        <>
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Passwords match</span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                                            <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Passwords don't match</span>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || newPassword.length < 8 || newPassword !== confirmPassword}
                            className="w-full relative group overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3.5 rounded-2xl transition-all duration-500 shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 active-press disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 pointer-events-none"></div>
                            <div className="relative flex items-center justify-center gap-3">
                                {loading ? (
                                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span className="text-base tracking-wide">Reset Password</span>
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-500" />
                                    </>
                                )}
                            </div>
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};
