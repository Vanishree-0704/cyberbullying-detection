import React from 'react';
import { Heart, UserPlus, MessageSquare, Shield, AtSign, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const Notifications = () => {
    const notifications = [
        { id: 1, type: 'like', user: 'neon_dreamer', target: 'your secure broadcast', time: '2m', avatar: 'N' },
        { id: 2, type: 'follow', user: 'alex_dev', time: '15m', avatar: 'A' },
        { id: 3, type: 'mention', user: 'cyber_vibe', text: 'Great integrity score on this one!', time: '1h', avatar: 'C' },
        { id: 4, type: 'system', user: 'CyberGuard Core', text: 'System Integrity Scan completed. 0 threats detected.', time: '3h', avatar: '🛡️' },
        { id: 5, type: 'like', user: 'sarah_m', target: 'recent decryption', time: '5h', avatar: 'S' },
        { id: 6, type: 'comment', user: 'tech_guru', text: 'Massive update! 🚀', time: '8h', avatar: 'T' },
    ];

    const getIcon = (type) => {
        switch (type) {
            case 'like': return <Heart size={14} className="text-rose-500 fill-rose-500" />;
            case 'follow': return <UserPlus size={14} className="text-sky-500" />;
            case 'mention': return <AtSign size={14} className="text-emerald-500" />;
            case 'comment': return <MessageSquare size={14} className="text-indigo-500" />;
            default: return <Shield size={14} className="text-sky-500" />;
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto pt-16 px-6">
            <div className="flex items-center justify-between mb-12">
                <h2 className="text-4xl font-black italic text-white tracking-tighter uppercase">Activity</h2>
                <div className="flex items-center gap-2 bg-sky-500/10 text-sky-500 px-4 py-1 rounded-full text-[10px] font-black uppercase border border-sky-500/20">
                    <TrendingUp size={12} /> Live Pulse
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-6">Today</h3>
                {notifications.map((n, i) => (
                    <motion.div
                        key={n.id}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center justify-between p-6 bg-zinc-950 border border-white/5 rounded-3xl hover:bg-zinc-900 transition-all group cursor-pointer"
                    >
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="w-14 h-14 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center font-black text-white text-lg ring-1 ring-white/5 overflow-hidden">
                                    {n.avatar.length > 2 ? n.avatar : n.avatar}
                                </div>
                                <div className="absolute -bottom-1 -right-1 bg-black p-1.5 rounded-full border border-white/10 shadow-xl">
                                    {getIcon(n.type)}
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <p className="text-sm text-zinc-300">
                                    <span className="font-black text-white uppercase tracking-tighter mr-2">@{n.user}</span>
                                    {n.type === 'like' && `liked ${n.target}`}
                                    {n.type === 'follow' && `started following your secure path`}
                                    {n.type === 'mention' && `mentioned you in a transmission`}
                                    {n.type === 'comment' && `commented: "${n.text}"`}
                                    {n.type === 'system' && n.text}
                                </p>
                                <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-1">{n.time} ago</span>
                            </div>
                        </div>
                        {n.type === 'follow' ? (
                            <button className="bg-sky-500 text-white text-[9px] font-black px-6 py-2 rounded-full uppercase tracking-widest hover:bg-sky-600 transition-all">Relink</button>
                        ) : (
                            <div className="w-12 h-12 bg-zinc-900 rounded-lg border border-white/5 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                        )}
                    </motion.div>
                ))}
            </div>

            <div className="mt-20 p-12 bg-sky-500/5 rounded-[3rem] border border-sky-500/10 text-center">
                <Shield size={32} className="text-sky-500 mx-auto mb-6 opacity-20" />
                <h4 className="text-[10px] font-black text-sky-500 uppercase tracking-[0.4em] mb-2">Integrity Log Encrypted</h4>
                <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest leading-relaxed">
                    All notifications are signed with neural keys.<br />Your identity is protected across the CyberGuard network.
                </p>
            </div>
        </div>
    );
};

export default Notifications;
