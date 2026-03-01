import React, { useState, useEffect } from 'react';
import { Play, Image as ImageIcon, Heart, MessageCircle, ShieldCheck } from 'lucide-react';
import apiClient from '../api/config';

const Explore = ({ onProfileClick }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const res = await apiClient.get('/posts/all');
                // Shuffle posts for explore feel
                setPosts(res.data.sort(() => Math.random() - 0.5));
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, []);

    if (loading) {
        return (
            <div className="w-full h-screen bg-black flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-5xl mx-auto pt-16 px-4">
            <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-6">
                <ShieldCheck className="text-emerald-500" size={32} />
                <div>
                    <h2 className="text-2xl font-black italic tracking-tighter text-white uppercase">Safe Discovery</h2>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Global Feed • AI Screened for Integrity</p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-1 md:gap-4 pb-20">
                {posts.map((post, index) => (
                    <div
                        key={post.id}
                        onClick={() => onProfileClick(post.user_handle)}
                        className={`relative group cursor-pointer overflow-hidden rounded-xl bg-zinc-900 border border-white/5 ${index % 5 === 0 ? 'col-span-2 row-span-2 aspect-square md:aspect-auto' : 'aspect-square'}`}
                    >
                        {post.image_url?.match(/\.(mp4|webm|ogg)$/) || post.image_url?.includes('video') ? (
                            <>
                                <video src={post.image_url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700" muted loop playsInline onMouseOver={e => e.target.play()} onMouseOut={e => e.target.pause()} />
                                <div className="absolute top-4 right-4 text-white drop-shadow-lg">
                                    <Play size={20} fill="white" />
                                </div>
                            </>
                        ) : (
                            <img src={post.image_url} alt="explore" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110" />
                        )}

                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4">
                            <div className="flex gap-6 text-white font-black text-lg">
                                <div className="flex items-center gap-2"><Heart size={24} fill="white" /> {post.likes || 0}</div>
                                <div className="flex items-center gap-2"><MessageCircle size={24} fill="white" /> AI Safe</div>
                            </div>
                            <span className="text-[10px] text-sky-400 font-black uppercase tracking-widest border border-sky-500/30 px-3 py-1 rounded-full backdrop-blur-md">Secure Content</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Explore;
