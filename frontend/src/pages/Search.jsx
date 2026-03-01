import React, { useState } from 'react';
import { Search as SearchIcon, Play, User as UserIcon, ShieldAlert } from 'lucide-react';
import apiClient from '../api/config';

const Search = ({ onProfileClick }) => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState({ users: [], posts: [] });
    const [loading, setLoading] = useState(false);

    const handleSearch = async (val) => {
        setQuery(val);
        if (val.length < 2) {
            setResults({ users: [], posts: [] });
            return;
        }
        setLoading(true);
        try {
            const res = await apiClient.get(`/search?q=${val}`);
            setResults(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-4xl p-12 mt-12 bg-black flex flex-col items-center">
            <div className="w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-3xl p-6 mb-12 flex items-center gap-4 focus-within:ring-2 ring-sky-500/50 transition-all">
                <SearchIcon className="text-zinc-500" size={24} />
                <input
                    type="text"
                    placeholder="Search for friends or protected content..."
                    className="bg-transparent border-none outline-none w-full text-white text-lg font-light italic"
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                />
                {loading && <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>}
            </div>

            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* User Results */}
                <div className="space-y-6">
                    <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em] mb-8 border-b border-white/5 pb-4">Safe Accounts Found</h3>
                    {results.users.length > 0 ? results.users.map(u => (
                        <div
                            key={u.id}
                            onClick={() => onProfileClick(u.username)}
                            className="flex items-center justify-between p-4 bg-zinc-950 rounded-2xl border border-white/5 hover:bg-zinc-900 transition-all cursor-pointer"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-white uppercase">{u.username[0]}</div>
                                <div>
                                    <p className="font-bold text-sm tracking-tighter">{u.username}</p>
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase">{u.full_name}</p>
                                </div>
                            </div>
                            <button className="bg-white text-black text-[10px] font-black px-4 py-2 rounded-lg hover:bg-zinc-200 uppercase tracking-widest">Profile</button>
                        </div>
                    )) : query.length >= 2 && !loading ? (
                        <p className="text-zinc-600 text-sm italic">No verified accounts found.</p>
                    ) : (
                        <div className="opacity-20 flex flex-col items-center py-10">
                            <UserIcon size={40} className="mb-4" />
                            <p className="text-[10px] font-bold uppercase tracking-widest">Global Account Directory</p>
                        </div>
                    )}
                </div>

                {/* Content Results */}
                <div className="space-y-6">
                    <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em] mb-8 border-b border-white/5 pb-4">Protected Media</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {results.posts.length > 0 ? results.posts.map(p => (
                            <div key={p.id} className="aspect-square relative group rounded-xl overflow-hidden bg-zinc-900">
                                {p.image_url ? (
                                    <img src={p.image_url} alt="post" className={`w-full h-full object-cover ${p.is_toxic ? 'blur-lg grayscale' : ''}`} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center p-4">
                                        <p className="text-[8px] italic text-zinc-500 text-center">"{p.caption}"</p>
                                    </div>
                                )}
                                {p.is_toxic && (
                                    <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center">
                                        <ShieldAlert className="text-red-500" size={24} />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Play className="text-white" />
                                </div>
                            </div>
                        )) : query.length >= 2 && !loading ? (
                            <p className="text-zinc-600 text-sm italic col-span-2 text-center">No media matches found.</p>
                        ) : (
                            <div className="col-span-2 opacity-20 flex flex-col items-center py-10">
                                <Play size={40} className="mb-4" />
                                <p className="text-[10px] font-bold uppercase tracking-widest">Verified Media Stream</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Search;
