import React, { useState, useEffect } from 'react';
import { Send, Shield, Search, MoreHorizontal, CheckCircle2, AlertCircle, Heart, Trash2 } from 'lucide-react';
import apiClient from '../api/config';

const Messages = ({ session, preselectedReceiver }) => {
    const [activeChat, setActiveChat] = useState(null);
    const [msg, setMsg] = useState("");
    const [chatHistory, setChatHistory] = useState([]);
    const [chats, setChats] = useState([]);
    const [loadingChats, setLoadingChats] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // 1. Fetch available chats (all users)
    useEffect(() => {
        const fetchAvailableChats = async () => {
            try {
                // Fetch all users to allow messaging anyone on the network
                const allUsersRes = await apiClient.get('/users/all');

                // Exclude the current user
                const uniqueUsers = allUsersRes.data.filter(u => u.id !== session.id);

                setChats(uniqueUsers.map(u => ({
                    id: u.id,
                    name: u.username,
                    full_name: u.full_name,
                    profile_pic: u.profile_pic,
                    online: Math.random() > 0.5 // Simulated for UI
                })));

                // If we came from a profile, select that user
                if (preselectedReceiver) {
                    const exists = uniqueUsers.find(u => u.id === preselectedReceiver.id);
                    if (exists) {
                        setActiveChat(exists);
                    } else {
                        // Add preselected to list if not there
                        setChats(prev => [{
                            id: preselectedReceiver.id,
                            name: preselectedReceiver.username,
                            full_name: preselectedReceiver.full_name,
                            profile_pic: preselectedReceiver.profile_pic,
                            online: true
                        }, ...prev]);
                        setActiveChat(preselectedReceiver);
                    }
                }
            } catch (e) {
                console.error("Failed to fetch chats", e);
            } finally {
                setLoadingChats(false);
            }
        };
        fetchAvailableChats();
    }, [session.id, preselectedReceiver]);

    // 2. Fetch Chat History when activeChat changes
    useEffect(() => {
        const fetchHistory = async () => {
            if (!activeChat) return;
            try {
                const res = await apiClient.get(`/messages/${session.id}/${activeChat.id}`);
                setChatHistory(res.data.map(m => ({
                    id: m.id,
                    sender: m.sender_id === session.id ? 'me' : 'other',
                    text: m.content,
                    toxic: m.is_toxic,
                    is_recalled: m.is_recalled,
                    likes: m.likes || 0,
                    timestamp: m.timestamp
                })));
            } catch (e) { }
        };
        fetchHistory();

        // Polling for new messages every 3 seconds
        const interval = setInterval(fetchHistory, 3000);
        return () => clearInterval(interval);
    }, [activeChat, session.id]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!msg.trim() || !activeChat) return;

        const originalMsg = msg;
        setMsg(""); // Clear early for UX

        try {
            const res = await apiClient.post('/messages/send', {
                sender_id: session.id,
                receiver_id: activeChat.id,
                content: originalMsg
            });

            // Optimistic update
            setChatHistory(prev => [...prev, {
                id: res.data.id,
                sender: 'me',
                text: originalMsg,
                toxic: res.data.is_toxic,
                timestamp: res.data.timestamp
            }]);
        } catch (e) {
            alert("Secure transmission failed");
        }
    };

    const filteredChats = chats.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="w-full max-w-6xl h-[85vh] mt-10 bg-zinc-950 border border-white/10 rounded-[2.5rem] overflow-hidden flex shadow-2xl shadow-indigo-500/5">
            {/* Sidebar */}
            <div className="w-80 border-r border-white/10 flex flex-col bg-zinc-950">
                <div className="p-8 border-b border-white/5">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-black italic tracking-tighter text-white">SECURE DM</h2>
                        <Shield size={20} className="text-sky-500" />
                    </div>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-sky-500 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Search network users"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-zinc-900 rounded-xl py-3 pl-12 pr-4 text-xs text-white outline-none border border-transparent focus:border-sky-500/20 transition-all font-medium"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 mt-4 space-y-1">
                    {loadingChats ? (
                        <div className="text-center py-10 opacity-20 animate-pulse text-[10px] font-black uppercase tracking-widest">Scanning Network...</div>
                    ) : filteredChats.length > 0 ? filteredChats.map(chat => (
                        <div
                            key={chat.id}
                            onClick={() => setActiveChat(chat)}
                            className={`flex items-center gap-4 p-4 rounded-3xl cursor-pointer transition-all ${activeChat?.id === chat.id ? 'bg-sky-500/10 border border-sky-500/20' : 'hover:bg-white/[0.02]'}`}
                        >
                            <div className="relative">
                                <div className="w-14 h-14 rounded-full bg-zinc-800 border border-white/5 flex items-center justify-center font-black text-xs text-white overflow-hidden ring-1 ring-white/5">
                                    {chat.profile_pic ? <img src={chat.profile_pic} className="w-full h-full object-cover" /> : chat.name[0].toUpperCase()}
                                </div>
                                {chat.online && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-zinc-950 rounded-full animate-pulse"></div>}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <div className="flex justify-between items-center mb-1">
                                    <p className="font-bold text-sm text-zinc-100 truncate uppercase tracking-tighter">{chat.name}</p>
                                    <span className="text-[10px] text-zinc-600 font-bold uppercase">Active</span>
                                </div>
                                <p className="text-[10px] text-zinc-500 truncate font-black uppercase tracking-widest">Secure Link Established</p>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-20 px-10">
                            <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">No Active Transmission Paths Found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            {activeChat ? (
                <div className="flex-1 flex flex-col bg-zinc-950/50">
                    {/* Header */}
                    <div className="p-6 border-b border-white/5 flex items-center justify-between backdrop-blur-md bg-zinc-950/40">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 flex items-center justify-center font-black bg-zinc-900 text-white">
                                {activeChat.profile_pic ? <img src={activeChat.profile_pic} className="w-full h-full object-cover" /> : activeChat.name?.[0].toUpperCase()}
                            </div>
                            <div>
                                <p className="font-bold text-lg text-white tracking-tight flex items-center gap-2 uppercase italic">
                                    {activeChat.name} <CheckCircle2 size={14} className="text-sky-500 fill-sky-500/10" />
                                </p>
                                <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Active Shield Line</p>
                            </div>
                        </div>
                        <MoreHorizontal className="text-zinc-600 cursor-pointer hover:text-white transition-colors" />
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-[radial-gradient(circle_at_50%_50%,#0c0c0e_0%,#000000_100%)]">
                        {chatHistory.length > 0 ? chatHistory.map(m => (
                            <div key={m.id} className={`flex ${m.sender === 'me' ? 'justify-end' : 'justify-start'} group animate-in slide-in-from-bottom-2 duration-300 relative`}>
                                <div className={`max-w-[70%] relative ${m.toxic ? 'border border-rose-500/20 rounded-[2rem]' : ''} group`}>
                                    <div className={`
                                        p-6 rounded-[2rem] text-[13px] leading-relaxed font-medium transition-all relative
                                        ${m.sender === 'me' ? 'bg-sky-500 text-white rounded-tr-none shadow-xl shadow-sky-500/10' : 'bg-zinc-900 text-zinc-200 rounded-tl-none border border-white/5'}
                                        ${m.toxic ? 'bg-rose-950/40 blur-[15px] opacity-20 select-none' : ''}
                                        ${m.is_recalled ? 'opacity-40 italic' : ''}
                                    `}>
                                        {m.text}
                                        {m.likes > 0 && (
                                            <div className="absolute -bottom-2 right-4 bg-zinc-800 border border-white/10 rounded-full px-2 py-0.5 flex items-center gap-1 scale-90">
                                                <Heart size={10} className="fill-rose-500 text-rose-500" />
                                                <span className="text-[10px] font-black">{m.likes}</span>
                                            </div>
                                        )}
                                    </div>

                                    {!m.is_recalled && (
                                        <div className={`absolute top-0 ${m.sender === 'me' ? '-left-12' : '-right-12'} opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2`}>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const res = await apiClient.post(`/messages/like/${m.id}`);
                                                        setChatHistory(prev => prev.map(msg => msg.id === m.id ? { ...msg, likes: res.data.likes } : msg));
                                                    } catch (e) { }
                                                }}
                                                className="p-2 bg-zinc-900 rounded-full hover:bg-rose-500/10 transition-colors"
                                            >
                                                <Heart size={14} className="text-rose-500" />
                                            </button>
                                            {m.sender === 'me' && (
                                                <button
                                                    onClick={async () => {
                                                        if (!window.confirm("Unsend message?")) return;
                                                        try {
                                                            await apiClient.delete(`/messages/${m.id}`, { params: { user_id: session.id } });
                                                            setChatHistory(prev => prev.map(msg => msg.id === m.id ? { ...msg, is_recalled: true, text: "🛡️ Content Restrained" } : msg));
                                                        } catch (e) { }
                                                    }}
                                                    className="p-2 bg-zinc-900 rounded-full hover:bg-rose-500/10 transition-colors"
                                                >
                                                    <Trash2 size={14} className="text-zinc-500 group-hover:text-rose-500" />
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {m.toxic && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                                            <AlertCircle size={28} className="text-rose-500 mb-2 animate-pulse" />
                                            <p className="text-[9px] font-black uppercase text-rose-500 tracking-[0.2em] text-center">Toxic Payload Intercepted</p>
                                            <p className="text-[7px] text-zinc-600 mt-2 uppercase font-bold">CyberGuard Neural Protection Active</p>
                                        </div>
                                    )}
                                    <p className={`text-[8px] mt-2 font-black uppercase tracking-widest ${m.sender === 'me' ? 'text-right' : 'text-left'} text-zinc-700`}>
                                        {m.sender === 'me' ? `Broadcast · ${new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Verified Transmission'}
                                    </p>
                                </div>
                            </div>
                        )) : (
                            <div className="flex flex-col items-center justify-center h-full opacity-20">
                                <Shield size={64} className="text-zinc-500 mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-[0.5em]">Establishing Secure Context...</p>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSend} className="p-8 border-t border-white/5 flex gap-4 bg-black">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Broadcast secure transmission..."
                                className="w-full bg-zinc-900 border border-white/5 rounded-2xl px-6 py-4 text-sm text-white outline-none focus:border-sky-500/50 transition-all font-medium placeholder:text-zinc-600"
                                value={msg}
                                onChange={(e) => setMsg(e.target.value)}
                            />
                            {msg.length > 3 && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                    <div className="w-1 h-1 bg-emerald-500 rounded-full animate-ping"></div>
                                    <span className="text-[7px] font-black text-emerald-500 uppercase tracking-widest">AI Scanning</span>
                                </div>
                            )}
                        </div>
                        <button className="bg-sky-500 text-white p-4 rounded-2xl hover:bg-sky-600 shadow-lg shadow-sky-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed" disabled={!msg.trim()}>
                            <Send size={24} />
                        </button>
                    </form>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-20 bg-zinc-950/30 bg-[radial-gradient(circle_at_50%_0%,#1e1b4b_0%,#000000_70%)]">
                    <div className="w-40 h-40 bg-sky-500/10 rounded-full flex items-center justify-center mb-10 border border-sky-500/20 relative group">
                        <div className="absolute inset-0 rounded-full border border-sky-500/50 animate-ping opacity-20"></div>
                        <Send size={56} className="text-sky-500 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <h3 className="text-5xl font-black italic text-white mb-6 tracking-tighter uppercase">Private Encryption Node</h3>
                    <p className="text-zinc-500 max-w-sm font-bold leading-relaxed uppercase text-[10px] tracking-widest">
                        Communication is the core of our culture. Protect it with the CyberGuard Integrity Matrix.
                    </p>
                    <div className="mt-12 flex gap-4">
                        <div className="px-6 py-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 flex items-center gap-2">
                            <Shield size={12} className="text-emerald-500" />
                            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Secure Channels Ready</span>
                        </div>
                        <div className="px-6 py-2 rounded-full border border-sky-500/20 bg-sky-500/5 flex items-center gap-2">
                            <Shield size={12} className="text-sky-500" />
                            <span className="text-[8px] font-black text-sky-500 uppercase tracking-widest">AI BERT V2 ACTIVE</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Messages;
