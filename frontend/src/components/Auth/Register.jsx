import React, { useState } from 'react';
import apiClient from '../../api/config';

const Register = ({ onSwitch, onRegisterSuccess }) => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        full_name: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
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
            let errorMsg = "Service Unavailable. Please check if Backend is running.";
            if (err.response) {
                // Server responded with error status
                errorMsg = err.response.data?.detail || "Registration failed. Try a different username.";
            } else if (err.request) {
                // Request was made but no response received
                errorMsg = "Network Error: Cannot connect to Backend server.";
            }
            setError(errorMsg);
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

                    <form onSubmit={handleSubmit} className="space-y-6 w-full">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-4">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:border-sky-500/50 outline-none transition-all placeholder:text-zinc-800"
                                    placeholder="name@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
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
                            {loading ? "Creating..." : "Sign Up Now"}
                        </button>

                        {error && (
                            <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl">
                                <p className="text-[9px] text-rose-500 font-black uppercase text-center tracking-widest">{error}</p>
                            </div>
                        )}

                        <p className="text-[8px] text-zinc-600 text-center py-6 font-bold uppercase tracking-widest leading-loose">
                            By initializing, you agree to the <span className="text-zinc-400">CyberGuard Encryption Protocols</span> & Privacy Shield.
                        </p>
                    </form>
                </div>

                <div className="bg-zinc-950 border border-white/10 p-8 rounded-[2rem] text-center text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Existing Node? <span className="text-sky-500 cursor-pointer hover:text-white transition-colors" onClick={onSwitch}>Resume Session</span>
                </div>
            </div>
        </div>
    );
};

export default Register;
