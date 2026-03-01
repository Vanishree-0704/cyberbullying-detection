import React, { useState } from 'react';
import { motion } from 'framer-motion';
import apiClient from '../../api/config';

const Login = ({ onSwitch, onLoginSuccess }) => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // OAuth2 requires form-data encoding for the password flow
            const params = new URLSearchParams();
            params.append('username', formData.username);
            params.append('password', formData.password);

            const response = await apiClient.post('/auth/login', params, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            // Secure storage of credentials
            const { access_token, user } = response.data;
            localStorage.setItem('cyberguard_token', access_token);
            localStorage.setItem('cyberguard_user', JSON.stringify(user));

            onLoginSuccess(user);
        } catch (err) {
            console.error("Login Error Details:", err);
            setError("Wrong Username or Password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-[400px] space-y-6">
                <div className="bg-zinc-950 border border-white/10 p-12 rounded-[3rem] shadow-2xl flex flex-col items-center">
                    <div className="text-center mb-8 relative">
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-sky-500/10 rounded-full blur-2xl"></div>
                        <h2 className="text-4xl font-black text-white italic tracking-tighter mb-2">SIGN IN</h2>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">Enter your credentials to access the grid</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
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
                            {loading ? "Authenticating..." : "Login"}
                        </button>

                        {error && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl">
                                <p className="text-[9px] text-rose-500 font-black uppercase text-center tracking-widest">{error}</p>
                            </motion.div>
                        )}
                    </form>
                </div>

                <div className="bg-zinc-950 border border-white/10 p-8 rounded-[2rem] text-center text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    New Operator? <span className="text-sky-500 cursor-pointer hover:text-white transition-colors" onClick={onSwitch}>Request Credential</span>
                </div>
            </div>
        </div>
    );
};

export default Login;
