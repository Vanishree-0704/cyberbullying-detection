import React, { useState } from 'react';
import apiClient from '../../api/config';

const Register = ({ onSwitch, onRegisterSuccess }) => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        full_name: '',
        otp_code: ''
    });
    const [otpSent, setOtpSent] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [demoOtp, setDemoOtp] = useState('');

    const handleSendOTP = async () => {
        if (!formData.email) {
            setError("Please enter an email address");
            return;
        }
        setError('');
        setLoading(true);
        try {
            const response = await apiClient.post('/auth/send-otp', { email: formData.email });
            setOtpSent(true);
            // If backend returned code (for demo), show it in UI
            if (response.data.code) {
                setDemoOtp(response.data.code);
                console.log("DEMO OTP:", response.data.code);
            }
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to send OTP. Check email or account limit.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!formData.otp_code) {
            setError("Please enter the OTP code");
            return;
        }
        setError('');
        setLoading(true);
        try {
            await apiClient.post('/auth/verify-otp', { email: formData.email, code: formData.otp_code });
            setOtpVerified(true);
        } catch (err) {
            setError(err.response?.data?.detail || "Invalid or expired OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!otpVerified) {
            setError("Please verify your email first");
            return;
        }
        setError('');
        setLoading(true);

        try {
            const response = await apiClient.post('/auth/signup', formData);

            // Auto login after signup
            const { access_token, user } = response.data;
            localStorage.setItem('cyberguard_token', access_token);
            localStorage.setItem('cyberguard_user', JSON.stringify(user));

            onRegisterSuccess(user);
        } catch (err) {
            console.error("Registration Error Details:", err);
            setError(err.response?.data?.detail || "Registration failed. Try a different username.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-white">
            <div className="w-full max-w-[450px] space-y-6">
                <div className="bg-zinc-950 border border-white/10 p-12 rounded-[3.5rem] shadow-2xl flex flex-col items-center">
                    <div className="text-center mb-8 relative">
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-sky-500/10 rounded-full blur-2xl"></div>
                        <h2 className="text-4xl font-black text-white italic tracking-tighter mb-2">CREATE ACCOUNT</h2>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">Join the CyberGuard Community</p>
                    </div>

                    <div className="space-y-6 w-full">
                        {/* Step 1: Email & OTP */}
                        {!otpVerified ? (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-4">Email Address</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="email"
                                            disabled={otpSent}
                                            className="flex-1 bg-zinc-950 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:border-sky-500/50 outline-none transition-all placeholder:text-zinc-800"
                                            placeholder="name@example.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                        {!otpSent && (
                                            <button
                                                onClick={handleSendOTP}
                                                disabled={loading}
                                                className="bg-white text-black px-4 rounded-2xl text-[10px] font-black uppercase tracking-tighter hover:bg-zinc-200 transition-all"
                                            >
                                                Send OTP
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {otpSent && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                        {demoOtp && (
                                            <div className="p-4 bg-sky-500/10 border border-sky-500/30 rounded-2xl flex flex-col items-center">
                                                <p className="text-[8px] text-sky-500 font-black uppercase tracking-widest mb-2">DEBUG MODE: SESSION CODE</p>
                                                <p className="text-3xl font-black text-white tracking-[0.5em] ml-[0.5em]">{demoOtp}</p>
                                                <p className="text-[8px] text-zinc-600 font-bold mt-2 uppercase">Developer Bypass: Use this code to verify</p>
                                            </div>
                                        )}
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-4">Verification Code (OTP)</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    className="flex-1 bg-zinc-950 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:border-sky-500/50 outline-none transition-all placeholder:text-zinc-800"
                                                    placeholder="6-digit code"
                                                    maxLength={6}
                                                    value={formData.otp_code}
                                                    onChange={(e) => setFormData({ ...formData, otp_code: e.target.value })}
                                                />
                                                <button
                                                    onClick={handleVerifyOTP}
                                                    disabled={loading}
                                                    className="bg-sky-500 text-white px-4 rounded-2xl text-[10px] font-black uppercase tracking-tighter hover:bg-sky-400 transition-all"
                                                >
                                                    Verify
                                                </button>
                                            </div>
                                            <p className="text-[8px] text-zinc-500 text-center font-bold italic">Verification email sent. Check your inbox.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Step 2: Final Details */
                            <form onSubmit={handleSubmit} className="space-y-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl mb-4">
                                    <p className="text-[9px] text-emerald-500 font-black uppercase text-center tracking-widest">Email Verified: {formData.email}</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-4">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:border-sky-500/50 outline-none transition-all placeholder:text-zinc-800"
                                        placeholder="Your Name"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-4">Username</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm font-bold focus:border-sky-500/50 outline-none transition-all"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-4">Password</label>
                                    <input
                                        type="password"
                                        required
                                        className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:border-sky-500/50 outline-none transition-all"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-sky-500 hover:bg-sky-400 text-white font-black py-5 rounded-3xl transition-all shadow-lg shadow-sky-500/25 uppercase tracking-widest text-xs mt-4"
                                >
                                    {loading ? "Creating..." : "Complete Registration"}
                                </button>
                            </form>
                        )}

                        {error && (
                            <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl">
                                <p className="text-[9px] text-rose-500 font-black uppercase text-center tracking-widest">{error}</p>
                            </div>
                        )}

                        <p className="text-[8px] text-zinc-600 text-center py-6 font-bold uppercase tracking-widest leading-loose">
                            By initializing, you agree to the <span className="text-zinc-400">CyberGuard Encryption Protocols</span> & Privacy Shield.
                        </p>
                    </div>
                </div>

                <div className="bg-zinc-950 border border-white/10 p-8 rounded-[2rem] text-center text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Existing Node? <span className="text-sky-500 cursor-pointer hover:text-white transition-colors" onClick={onSwitch}>Resume Session</span>
                </div>
            </div>
        </div>
    );
};

export default Register;
