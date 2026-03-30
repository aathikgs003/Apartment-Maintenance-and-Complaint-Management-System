import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { toast } from 'react-hot-toast';
import {
    EnvelopeIcon,
    LockClosedIcon,
    EyeIcon,
    EyeSlashIcon,
    KeyIcon,
    ArrowLeftIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

const ForgotPassword = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    // Steps: 1=Email, 2=OTP, 3=Reset
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form Data
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Timer for Resend
    const [timer, setTimer] = useState(0);

    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    // -- HANDLERS --

    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (!email) {
            setError('Please enter your email');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await authService.forgotPassword(email);
            toast.success('OTP sent to your email');
            setStep(2);
            setTimer(60); // Start 60s timer
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (!otp || otp.length !== 6) {
            setError('Please enter a valid 6-digit OTP');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await authService.verifyOtp(email, otp);
            toast.success('OTP verified successfully');
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!newPassword || !confirmPassword) {
            setError('Please fill in all fields');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await authService.resetPassword({
                email,
                newPassword,
                confirmPassword,
            });
            toast.success('Password reset successfully! Please login.');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (timer > 0) return;
        setLoading(true);
        setError('');
        try {
            await authService.forgotPassword(email);
            toast.success('OTP resent to your email');
            setTimer(60);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend OTP');
        } finally {
            setLoading(false);
        }
    };

    // -- RENDERERS --

    return (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-sky-50 via-white to-sky-50 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-200/40 rounded-full mix-blend-multiply filter blur-[100px] opacity-50 animate-blob"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-200/40 rounded-full mix-blend-multiply filter blur-[100px] opacity-50 animate-blob animation-delay-2000"></div>

            <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border border-white/50 overflow-hidden animate-fade-in p-8 sm:p-10">

                {/* Step Indicator */}
                <div className="flex justify-between mb-8 relative">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -z-10 rounded-full"></div>
                    <div className={`transition-all duration-300 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 1 ? 'bg-sky-600 text-white shadow-lg shadow-sky-200' : 'bg-slate-200 text-slate-500'}`}>1</div>
                    <div className={`transition-all duration-300 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 2 ? 'bg-sky-600 text-white shadow-lg shadow-sky-200' : 'bg-slate-200 text-slate-500'}`}>2</div>
                    <div className={`transition-all duration-300 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 3 ? 'bg-sky-600 text-white shadow-lg shadow-sky-200' : 'bg-slate-200 text-slate-500'}`}>3</div>
                </div>

                {/* Back Link */}
                {step === 1 && (
                    <Link to="/login" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-sky-600 mb-6 transition-colors">
                        <ArrowLeftIcon className="h-4 w-4 mr-1" />
                        Back to Login
                    </Link>
                )}

                {/* --- STEP 1: EMAIL --- */}
                {step === 1 && (
                    <div className="animate-slide-up">
                        <h1 className="text-2xl font-black text-slate-900 mb-2">Forgot Password?</h1>
                        <p className="text-slate-500 mb-8">Enter your registered email and we'll send you an OTP to reset your password.</p>

                        {error && (
                            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center text-rose-700 text-sm animate-shake">
                                <ExclamationCircleIcon className="h-5 w-5 mr-3 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSendOtp} className="space-y-6">
                            <div>
                                <label className="form-label text-slate-700">Email Address</label>
                                <div className="relative group">
                                    <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="name@company.com"
                                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all outline-none text-slate-900 placeholder:text-slate-400"
                                        required
                                    />
                                </div>
                            </div>

                            <button type="submit" disabled={loading} className="w-full py-4 px-6 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-sky-500/30 transform transition-all active:scale-[0.98]">
                                {loading ? 'Sending OTP...' : 'Send OTP'}
                            </button>
                        </form>
                    </div>
                )}

                {/* --- STEP 2: OTP --- */}
                {step === 2 && (
                    <div className="animate-slide-up">
                        <h1 className="text-2xl font-black text-slate-900 mb-2">Verify OTP</h1>
                        <p className="text-slate-500 mb-8">Enter the 6-digit code sent to <b>{email}</b></p>

                        {error && (
                            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center text-rose-700 text-sm animate-shake">
                                <ExclamationCircleIcon className="h-5 w-5 mr-3 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleVerifyOtp} className="space-y-6">
                            <div>
                                <label className="form-label text-slate-700">One-Time Password</label>
                                <div className="relative group">
                                    <KeyIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            if (val.length <= 6) setOtp(val);
                                        }}
                                        placeholder="123456"
                                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all outline-none text-slate-900 placeholder:text-slate-400 tracking-widest text-lg font-bold"
                                        required
                                    />
                                </div>
                            </div>

                            <button type="submit" disabled={loading} className="w-full py-4 px-6 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-sky-500/30 transform transition-all active:scale-[0.98]">
                                {loading ? 'Verifying...' : 'Verify OTP'}
                            </button>

                            <div className="text-center">
                                <p className="text-sm text-slate-500">
                                    Didn't receive code?{' '}
                                    <button
                                        type="button"
                                        onClick={handleResendOtp}
                                        disabled={timer > 0 || loading}
                                        className={`font-bold ${timer > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-sky-600 hover:underline'}`}
                                    >
                                        Resend {timer > 0 ? `(${timer}s)` : ''}
                                    </button>
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="mt-4 text-xs font-bold text-slate-400 hover:text-slate-600"
                                >
                                    Change Email
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* --- STEP 3: RESET PASSWORD --- */}
                {step === 3 && (
                    <div className="animate-slide-up">
                        <div className="flex justify-center mb-6">
                            <div className="bg-emerald-100 p-3 rounded-full text-emerald-600 animate-bounce">
                                <CheckCircleIcon className="h-8 w-8" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 mb-2 text-center">Reset Password</h1>
                        <p className="text-slate-500 mb-8 text-center">Create a strong password for your account</p>

                        {error && (
                            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center text-rose-700 text-sm animate-shake">
                                <ExclamationCircleIcon className="h-5 w-5 mr-3 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleResetPassword} className="space-y-6">
                            <div>
                                <label className="form-label text-slate-700">New Password</label>
                                <div className="relative group">
                                    <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Min 8 characters"
                                        className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all outline-none text-slate-900 placeholder:text-slate-400"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="form-label text-slate-700">Confirm Password</label>
                                <div className="relative group">
                                    <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm new password"
                                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all outline-none text-slate-900 placeholder:text-slate-400"
                                        required
                                    />
                                </div>
                            </div>

                            <button type="submit" disabled={loading} className="w-full py-4 px-6 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-sky-500/30 transform transition-all active:scale-[0.98]">
                                {loading ? 'Reseting...' : 'Set New Password'}
                            </button>
                        </form>
                    </div>
                )}

            </div>
        </div>
    );
};

export default ForgotPassword;
