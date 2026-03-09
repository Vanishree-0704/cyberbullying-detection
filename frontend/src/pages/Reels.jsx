import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Send, Music as MusicIcon, MoreVertical, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../api/config';

const Reels = ({ onProfileClick }) => {
    const [reels, setReels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState("All");
    const containerRef = useRef(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const categories = ["All", "Comedy", "Tech", "Music", "Vlog"];

    const fetchReels = async (cat) => {
        setLoading(true);
        try {
            const res = await apiClient.get(`/reels/all${cat !== 'All' ? `?category=${cat}` : ''}`);
            setReels(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReels(activeCategory);
    }, [activeCategory]);

    const handleScroll = () => {
        if (!containerRef.current) return;
        const index = Math.round(containerRef.current.scrollTop / window.innerHeight);
        setActiveIndex(index);
    };

    return (
        <div className="h-screen w-full bg-black overflow-hidden relative">
            {/* Category Filter */}
            <div className="absolute top-6 left-0 right-0 z-50 flex justify-center gap-4">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-white text-black scale-110' : 'bg-black/50 text-white/50 border border-white/10 hover:bg-black/80'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div
                ref={containerRef}
                onScroll={handleScroll}
                className="h-full w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth hide-scrollbar"
            >
                {loading ? (
                    <div className="h-screen w-full flex items-center justify-center">
                        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : reels.length > 0 ? (
                    reels.map((reel, index) => (
                        <div key={reel.id} className="h-screen w-full snap-start relative bg-zinc-900">
                            <video
                                src={reel.image_url}
                                className="h-full w-full object-cover"
                                loop
                                muted={activeIndex !== index}
                                playsInline
                                autoPlay={activeIndex === index}
                            />

                            {/* UI Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none"></div>

                            <div className="absolute bottom-10 left-6 right-16 text-white pointer-events-auto">
                                <div className="flex items-center gap-3 mb-4" onClick={() => onProfileClick(reel.user_handle)}>
                                    <div className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-white overflow-hidden">
                                        <img src={reel.user_pic || "https://via.placeholder.com/150"} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <span className="font-black text-sm uppercase tracking-tighter">@{reel.user_handle}</span>
                                    <button className="bg-transparent border border-white/30 px-4 py-1 rounded-lg text-[10px] font-black uppercase">Follow</button>
                                </div>
                                <p className="text-sm mb-4 line-clamp-2 pr-10">{reel.caption}</p>
                                <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full w-fit">
                                    <MusicIcon size={14} className="animate-spin-slow" />
                                    <span className="text-[10px] font-bold truncate max-w-[150px]">{reel.music_name || "Original Audio"}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="absolute bottom-10 right-4 flex flex-col gap-6 items-center">
                                <div className="flex flex-col items-center">
                                    <div className="p-3 bg-black/20 backdrop-blur-xl rounded-full hover:scale-110 transition-transform cursor-pointer">
                                        <Heart size={28} className="text-white hover:text-rose-500 hover:fill-rose-500 transition-colors" />
                                    </div>
                                    <span className="text-[10px] font-black mt-1">{reel.likes}</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="p-3 bg-black/20 backdrop-blur-xl rounded-full hover:scale-110 transition-transform cursor-pointer">
                                        <MessageCircle size={28} />
                                    </div>
                                    <span className="text-[10px] font-black mt-1">2.4k</span>
                                </div>
                                <div className="p-3 bg-black/20 backdrop-blur-xl rounded-full hover:scale-110 transition-transform cursor-pointer">
                                    <Send size={28} />
                                </div>
                                <div className="p-3 bg-black/20 backdrop-blur-xl rounded-full hover:scale-110 transition-transform cursor-pointer">
                                    <MoreVertical size={28} />
                                </div>
                                <div className="p-3 bg-sky-500 rounded-full animate-pulse">
                                    <Shield size={20} className="text-white" />
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="h-screen w-full flex flex-col items-center justify-center text-zinc-500 uppercase tracking-widest font-black text-xs">
                        No {activeCategory} Reels Detected in Network
                    </div>
                )}
            </div>
        </div>
    );
};

export default Reels;
