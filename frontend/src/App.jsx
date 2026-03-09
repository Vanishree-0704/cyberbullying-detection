import React, { useState, useEffect, useRef } from 'react';
import apiClient from './api/config';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Search from './pages/Search';
import Reels from './pages/Reels';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import Explore from './pages/Explore';
import Notifications from './pages/Notifications';
import {
    Shield, Heart, MessageCircle, Send, Bookmark, MoreHorizontal,
    Instagram, Search as SearchIcon, Play, User, Home, BarChart3,
    LogOut, PlusSquare, Camera, X, Compass, MapPin, ChevronRight, Image as ImageIcon,
    CheckCircle2, Sliders, Bell, Music, Eye, EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './index.css';

const isVideo = (url) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|ogg)$/) || url.includes('video') || url.includes('player.vimeo.com');
};

// --- Components ---

const SkeletonPost = () => (
    <div className="border-b border-white/10 pb-8 mb-8 animate-pulse">
        <div className="flex items-center gap-3 py-3">
            <div className="w-9 h-9 rounded-full bg-zinc-900 border border-white/5"></div>
            <div className="space-y-2">
                <div className="w-24 h-3 bg-zinc-900 rounded"></div>
                <div className="w-16 h-2 bg-zinc-900 rounded"></div>
            </div>
        </div>
        <div className="w-full h-[500px] bg-zinc-900 rounded-lg border border-white/5"></div>
        <div className="flex items-center gap-4 py-3">
            <div className="w-8 h-8 rounded-full bg-zinc-900"></div>
            <div className="w-8 h-8 rounded-full bg-zinc-900"></div>
            <div className="w-8 h-8 rounded-full bg-zinc-900"></div>
        </div>
        <div className="space-y-2 mt-2">
            <div className="w-1/2 h-3 bg-zinc-900 rounded"></div>
            <div className="w-1/3 h-3 bg-zinc-900 rounded"></div>
        </div>
    </div>
);

const StoryViewer = ({ story, stories, onClose, setStory }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        setProgress(0); // Reset progress on new story
        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(timer);
                    // auto advance
                    const currentIndex = stories.findIndex(s => s.id === story.id);
                    if (currentIndex < stories.length - 1) {
                        setStory(stories[currentIndex + 1]);
                    } else {
                        onClose();
                    }
                    return 100;
                }
                return prev + 1;
            });
        }, 50); // ~5 seconds total
        return () => clearInterval(timer);
    }, [story, stories, onClose, setStory]);

    if (!story) return null;
    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[200] flex items-center justify-center p-4 backdrop-blur-sm"
        >
            <div className="absolute top-4 right-4 z-[210] cursor-pointer" onClick={onClose}>
                <X size={32} className="text-white drop-shadow-md hover:text-rose-500 transition-colors" />
            </div>

            <div className="relative w-full max-w-sm md:max-w-lg aspect-[9/16] bg-zinc-950 overflow-hidden rounded-[20px] md:rounded-[40px] shadow-2xl">
                {/* Progress Indicators */}
                <div className="absolute top-2 left-2 right-2 flex gap-1 z-[220]">
                    {stories.map((s, idx) => {
                        const currentIdx = stories.findIndex(st => st.id === story.id);
                        let barWidth = 0;
                        if (idx < currentIdx) barWidth = 100;
                        else if (idx === currentIdx) barWidth = progress;
                        return (
                            <div key={s.id} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                                <div className="h-full bg-white transition-all duration-100 ease-linear" style={{ width: `${barWidth}%` }}></div>
                            </div>
                        )
                    })}
                </div>

                <img src={story.img} alt={story.user} className="w-full h-full object-cover" />

                <div className="absolute top-4 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent flex items-center gap-3 mt-2">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-white/50 overflow-hidden">
                        <img src={story.profile_pic || story.img} alt={story.user} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-white text-xs md:text-sm tracking-tight">{story.user} <span className="text-zinc-400 font-normal ml-1">2h</span></span>
                        {story.music_name && (
                            <span className="text-[10px] text-zinc-300 flex items-center gap-1 font-bold italic truncate w-32">
                                <Music size={10} className="animate-pulse" /> {story.music_name}
                            </span>
                        )}
                    </div>
                </div>

                {/* Mentions (Optional style update) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {story.mentions?.map((m, i) => (
                        <div key={i} className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg text-white font-semibold text-sm border border-white/10 shadow-lg" style={{ transform: `rotate(${i % 2 === 0 ? '-5deg' : '5deg'})` }}>@{m}</div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

const StoryBar = ({ user, onStoryClick, stories }) => {
    return (
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-6 px-4">
            <div className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer group">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-zinc-950 border-2 border-zinc-800 p-1 flex items-center justify-center relative">
                    <div className="w-full h-full bg-zinc-800 rounded-full flex items-center justify-center overflow-hidden text-sky-500 font-black text-lg">
                        {user?.profile_pic ? (
                            <img src={user.profile_pic} className="w-full h-full object-cover" />
                        ) : (
                            user?.username ? user.username[0].toUpperCase() : <User size={20} className="text-zinc-400" />
                        )}
                    </div>
                    <div className="absolute bottom-0 right-0 bg-sky-500 rounded-full p-1 border-2 border-black"><PlusSquare size={10} className="text-white" /></div>
                </div>
                <span className="text-[10px] text-zinc-400 w-16 text-center truncate italic font-black uppercase tracking-tighter">Your story</span>
            </div>
            {stories.map(s => (
                <div key={s.id} className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer group" onClick={() => onStoryClick(s)}>
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-tr from-yellow-400 via-rose-500 to-fuchsia-600 p-[2px] transform transition-transform group-hover:scale-105">
                        <div className="w-full h-full rounded-full bg-black p-[2px]">
                            <img src={s.profile_pic || s.img} className="w-full h-full rounded-full object-cover" />
                        </div>
                    </div>
                    <span className="text-[10px] text-zinc-300 w-16 text-center truncate">{s.user}</span>
                </div>
            ))}
        </div>
    );
};


const PostItem = ({ post, session, onProfileClick }) => {
    const [comment, setComment] = useState("");
    const [comments, setComments] = useState([]);
    const [showComments, setShowComments] = useState(false);
    const [isLiking, setIsLiking] = useState(false);
    const [localLikes, setLocalLikes] = useState(post.likes || 0);
    const [hasLiked, setHasLiked] = useState(false);
    const [audio, setAudio] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showMusicCard, setShowMusicCard] = useState(false);
    const videoRef = useRef(null);

    // Auto-play on screen logic
    useEffect(() => {
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.6, // Play when 60% visible
        };

        const callback = (entries) => {
            entries.forEach((entry) => {
                if (videoRef.current) {
                    if (entry.isIntersecting) {
                        videoRef.current.play().catch(() => { });
                    } else {
                        videoRef.current.pause();
                    }
                }
            });
        };

        const observer = new IntersectionObserver(callback, options);
        if (videoRef.current) observer.observe(videoRef.current);

        return () => {
            if (videoRef.current) observer.unobserve(videoRef.current);
        };
    }, []);

    // Global audio sync
    useEffect(() => {
        const handleStop = () => {
            if (audio) {
                audio.pause();
                setIsPlaying(false);
            }
        };
        window.addEventListener('stop-all-audio', handleStop);
        return () => window.removeEventListener('stop-all-audio', handleStop);
    }, [audio]);

    const toggleMusic = (e) => {
        if (e) e.stopPropagation();
        if (!post.music_url) {
            alert("This neural pulse has no audio data.");
            return;
        }

        if (audio) {
            if (isPlaying) {
                audio.pause();
                setIsPlaying(false);
            } else {
                window.dispatchEvent(new CustomEvent('stop-all-audio'));
                audio.play().catch(err => console.error("Audio play failed:", err));
                setIsPlaying(true);
            }
        } else {
            window.dispatchEvent(new CustomEvent('stop-all-audio'));
            const newAudio = new Audio(post.music_url);
            newAudio.play().catch(err => {
                console.error("Audio play failed:", err);
                alert("Browser blocked auto-play. Click again to override.");
            });
            setAudio(newAudio);
            setIsPlaying(true);
            newAudio.onended = () => setIsPlaying(false);
        }
    };

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (audio) audio.pause();
        };
    }, [audio]);

    useEffect(() => {
        const fetchComments = async () => {
            try {
                const res = await apiClient.get(`/comments/${post.id}`);
                setComments(res.data);
            } catch (e) { }
        };
        if (showComments) fetchComments();
    }, [post.id, showComments]);

    const [showHeart, setShowHeart] = useState(false);

    const handleDoubleTap = () => {
        handleLike();
        setShowHeart(true);
        setTimeout(() => setShowHeart(false), 1000);
    };

    const handleSendComment = async (e) => {
        e.preventDefault();
        if (!comment.trim()) return;
        try {
            const res = await apiClient.post('/comments/create', {
                post_id: post.id,
                user_id: session.id,
                username: session.username,
                text: comment
            });
            setComments([...comments, res.data]);
            setComment("");
        } catch (e) {
            alert("Failed to send comment");
        }
    };

    const handleLike = async () => {
        if (isLiking) return;
        setIsLiking(true);
        try {
            const res = await apiClient.post(`/posts/like/${post.id}`, { user_id: session.id });
            setLocalLikes(res.data.likes);
            setHasLiked(res.data.status === 'liked');
        } catch (e) { }
        setTimeout(() => setIsLiking(false), 500);
    };

    const handleCommentLike = async (commentId) => {
        try {
            const res = await apiClient.post(`/comments/like/${commentId}`, { user_id: session.id });
            setComments(comments.map(c => c.id === commentId ? { ...c, likes_count: res.data.likes } : c));
        } catch (e) { }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm("Delete this comment?")) return;
        try {
            await apiClient.delete(`/comments/${commentId}`, { params: { user_id: session.id } });
            setComments(comments.filter(c => c.id !== commentId));
        } catch (e) { }
    };

    return (
        <div className="border-b border-white/10 pb-8 mb-8">
            <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => onProfileClick(post.user_handle)}>
                    <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs border border-white/10 uppercase ring-1 ring-zinc-700 overflow-hidden">
                        {post.user_pic ? <img src={post.user_pic} className="w-full h-full object-cover" /> : post.user_handle?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="text-[13px] font-bold text-white uppercase tracking-tighter hover:text-sky-400 transition-colors flex items-center gap-1">
                                {post.user_handle || 'User'}
                                <CheckCircle2 size={12} className="text-sky-500 fill-sky-500/10" />
                            </span>
                            <span className="text-zinc-500 text-[13px]">•</span>
                            <span className="text-zinc-500 text-[13px]">1d</span>
                            <button className="text-sky-500 font-bold text-[13px] ml-1 hover:text-white transition-colors">Follow</button>
                        </div>
                        {post.music_name ? (
                            <div className="flex items-center gap-1 mt-0.5 text-zinc-400 cursor-pointer group/music relative"
                                onClick={(e) => {
                                    setShowMusicCard(!showMusicCard);
                                    if (!isPlaying) toggleMusic(e);
                                }}>
                                <Music size={10} className={`text-white ${isPlaying ? 'animate-spin' : 'animate-pulse'}`} />
                                <span className="text-[9px] font-bold uppercase tracking-tighter italic overflow-hidden text-ellipsis whitespace-nowrap max-w-[150px] group-hover:text-sky-400 transition-colors">
                                    {post.music_name} {isPlaying ? '(Active Feed)' : '(Muted)'}
                                </span>

                                <AnimatePresence>
                                    {showMusicCard && post.music_cover && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                            className="absolute top-6 left-0 z-[100] bg-zinc-950 border border-white/10 p-3 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[200px] backdrop-blur-xl"
                                        >
                                            <div className="relative w-12 h-12 flex-shrink-0 group/cover" onClick={toggleMusic}>
                                                <img src={post.music_cover} className="w-full h-full rounded-lg object-cover shadow-lg" />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/cover:opacity-100 transition-opacity rounded-lg">
                                                    {isPlaying ? <X size={16} /> : <Play size={16} />}
                                                </div>
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="text-[10px] font-black text-white uppercase truncate">{post.music_name.split(' - ')[0]}</p>
                                                <p className="text-[8px] text-zinc-500 font-bold uppercase truncate">{post.music_name.split(' - ')[1] || 'Artist'}</p>
                                                <button onClick={toggleMusic} className="mt-1 text-[7px] font-black text-sky-500 uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1">
                                                    {isPlaying ? (
                                                        <><X size={8} /> TERMINATE FEED</>
                                                    ) : (
                                                        <><Play size={8} /> INITIATE FEED</>
                                                    )}
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 mt-0.5">
                                <Shield size={8} className="text-emerald-400" />
                                <span className="text-[7px] font-black text-emerald-400 uppercase tracking-widest leading-none">Safe Sentiment Detected</span>
                            </div>
                        )}
                    </div>
                </div>
                <MoreHorizontal size={20} className="text-white cursor-pointer hover:text-zinc-400" />
            </div>

            <div
                className="relative rounded-lg overflow-hidden bg-zinc-900 border border-white/5 flex flex-col justify-center items-center h-[500px] mb-4 group cursor-pointer"
                onDoubleClick={handleDoubleTap}
            >
                <AnimatePresence>
                    {showHeart && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 2, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="absolute z-20 pointer-events-none"
                        >
                            <Heart size={80} className="text-white fill-white drop-shadow-2xl" />
                        </motion.div>
                    )}
                </AnimatePresence>
                {post.image_url ? (
                    isVideo(post.image_url) ? (
                        <video
                            ref={videoRef}
                            src={post.image_url}
                            className={`w-full h-full object-cover ${post.is_toxic ? 'blur-2xl opacity-10' : ''}`}
                            controls
                            loop
                            playsInline
                            muted
                        />
                    ) : (
                        <img src={post.image_url} alt="post" className={`w-full h-full object-cover ${post.is_toxic ? 'blur-2xl opacity-10' : ''}`} />
                    )
                ) : (
                    <div className={`text-center p-10 ${post.is_toxic ? 'blur-2xl opacity-5' : ''}`}>
                        <p className="text-xl italic font-light opacity-80">"{post.caption}"</p>
                    </div>
                )}

                {post.is_toxic && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-3xl z-10 border border-red-500/20">
                        <Shield className="text-red-500 mb-4 animate-pulse" size={48} />
                        <h4 className="text-red-500 font-black uppercase tracking-[0.3em] text-[10px] mb-2">Content Intercepted</h4>
                        <p className="text-[11px] text-slate-400 px-10 text-center leading-relaxed font-bold">
                            CyberGuard successfully protected you from this harmful content.
                        </p>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between py-2 text-white">
                <div className="flex items-center gap-4">
                    <Heart
                        size={26}
                        className={`cursor-pointer transition-all ${isLiking || hasLiked ? 'fill-red-500 text-red-500 scale-125' : 'hover:scale-110'}`}
                        onClick={handleLike}
                    />
                    <MessageCircle size={26} className="cursor-pointer hover:scale-110" onClick={() => setShowComments(!showComments)} />
                    <Send
                        size={26}
                        className="cursor-pointer hover:scale-110"
                        onClick={() => {
                            const u = prompt("Enter username to share with:");
                            if (u) alert(`Shared ${post.is_reel ? 'reel' : 'post'} with @${u}!`);
                        }}
                    />
                </div>
                <Bookmark size={26} className="cursor-pointer hover:scale-110" />
            </div>

            <div className="text-white text-sm mt-2">
                <p className="font-bold mb-1">
                    {hasLiked && localLikes > 1 ? `Liked by you and ${(localLikes - 1).toLocaleString()} others` : hasLiked ? 'Liked by you' : `${localLikes.toLocaleString()} likes`}
                </p>
                <p><span className="font-bold mr-2 uppercase tracking-tighter cursor-pointer hover:text-sky-400" onClick={() => onProfileClick(post.user_handle)}>{post.user_handle}</span>{post.caption}</p>

                {comments.length > 0 && !showComments && (
                    <p className="text-zinc-500 text-xs mt-2 cursor-pointer" onClick={() => setShowComments(true)}>
                        View all {comments.length} comments
                    </p>
                )}

                {showComments && (
                    <div className="mt-4 space-y-3 bg-zinc-900/50 p-4 rounded-xl border border-white/5 max-h-[300px] overflow-y-auto">
                        {comments.filter(c => !c.parent_id).map(c => (
                            <div key={c.id} className="space-y-2">
                                <div className="flex gap-2 text-sm group">
                                    <span className="font-bold tracking-tighter uppercase text-[12px] cursor-pointer hover:text-sky-400" onClick={() => onProfileClick(c.username)}>{c.username}</span>
                                    <div className="flex-1">
                                        <p className={`${c.is_toxic ? 'blur-[4px] select-none opacity-40' : ''} text-zinc-300`}>{c.text}</p>
                                        <div className="flex items-center gap-3 mt-1 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                                            <span>{c.likes_count || 0} likes</span>
                                            <button onClick={() => setComment(`@${c.username} `)} className="hover:text-white transition-colors">Reply</button>
                                            <button onClick={() => handleCommentLike(c.id)} className="hover:text-rose-500 transition-colors">Like</button>
                                            {(session.id === post.user_id || session.id === c.user_id) && (
                                                <button onClick={() => handleDeleteComment(c.id)} className="text-zinc-700 hover:text-rose-500 transition-colors">Delete</button>
                                            )}
                                        </div>
                                    </div>
                                    {c.is_toxic && (
                                        <span className="text-[8px] font-black text-rose-500/50 border border-rose-500/20 px-2 rounded-full uppercase tracking-widest h-fit">Masked</span>
                                    )}
                                </div>
                                {/* Replies (Simplified for demo) */}
                                {comments.filter(reply => reply.parent_id === c.id).map(reply => (
                                    <div key={reply.id} className="ml-8 flex gap-2 text-[11px]">
                                        <span className="font-bold tracking-tighter uppercase text-zinc-400">{reply.username}</span>
                                        <p className="text-zinc-500">{reply.text}</p>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-4 flex flex-col gap-3 border-t border-white/5 pt-4 relative">
                    <div className="flex gap-3 px-1">
                        {['😂', '😍', '🔥', '❤️', '👏', '😢', '🔥', '🙌', '💯'].map((emoji, i) => (
                            <button type="button" key={i} onClick={() => setComment(prev => prev + emoji)} className="text-xl hover:scale-125 transition-transform">{emoji}</button>
                        ))}
                    </div>
                    <form onSubmit={handleSendComment} className="flex items-center gap-3">
                        {comment.length > 0 && (
                            <div className="absolute top-0 left-0 flex items-center gap-1">
                                <div className="w-1 h-1 bg-sky-500 rounded-full animate-bounce"></div>
                                <span className="text-[8px] font-black text-sky-500 uppercase tracking-widest">Real-Time AI Scanning...</span>
                            </div>
                        )}
                        <input
                            type="text"
                            placeholder="Add a comment... (AI Protected)"
                            className="flex-1 bg-transparent border-none outline-none text-xs text-zinc-400 placeholder:italic"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                        <button type="submit" disabled={!comment.trim()} className={`text-xs font-bold ${comment.trim() ? 'text-sky-500' : 'text-zinc-600'}`}>Post</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

// --- Main App ---

export default function App() {
    const [session, setSession] = useState(null);
    const [authView, setAuthView] = useState('login');
    const [view, setView] = useState('home');
    const [targetUsername, setTargetUsername] = useState(null);
    const [showCreate, setShowCreate] = useState(false);
    const [activeStory, setActiveStory] = useState(null);
    const [newPost, setNewPost] = useState({ caption: '', image: '', is_reel: false });
    const [localFile, setLocalFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = React.useRef(null);
    const [posts, setPosts] = useState([]);
    const [stats, setStats] = useState(null);
    const [messageReceiver, setMessageReceiver] = useState(null);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    const [isLoading, setIsLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [activeFilters, setActiveFilters] = useState({ brightness: 100, contrast: 100, grayscale: 0, sepia: 0 });
    const [musicLibrary, setMusicLibrary] = useState([]);
    const [selectedMusic, setSelectedMusic] = useState(null);
    const [activeCategory, setActiveCategory] = useState("General");
    const [activeMusicLang, setActiveMusicLang] = useState("Tamil");
    const [musicSearch, setMusicSearch] = useState("");
    const [previewAudio, setPreviewAudio] = useState(null);
    const [stories, setStories] = useState([]);
    const [createMode, setCreateMode] = useState('post'); // post or story
    const [revealedIds, setRevealedIds] = useState({});

    // RESTORE SESSION ON LOAD
    useEffect(() => {
        const savedUser = localStorage.getItem('cyberguard_user');
        const token = localStorage.getItem('cyberguard_token');
        if (savedUser && token) {
            setSession(JSON.parse(savedUser));
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('cyberguard_token');
        localStorage.removeItem('cyberguard_user');
        setSession(null);
    };

    const fetchInitial = async () => {
        setIsLoading(true);
        console.log("📡 [SYNC] Initiating Global Grid Sync...");
        try {
            const p = await apiClient.get('/posts/all?skip=0&limit=10');
            console.log("✅ [POSTS] Received:", p.data.length);
            setPosts(p.data);
            setPage(1);
            setHasMore(p.data.length === 10);

            const [s, lib, st] = await Promise.all([
                apiClient.get('/analytics'),
                apiClient.get('/music/library'),
                apiClient.get('/stories/all')
            ]);

            setStats(s.data);
            setMusicLibrary(lib.data);
            setStories(st.data);
            console.log("✅ [SYNC] Database Handshake Complete.");
        } catch (e) {
            console.error("❌ [SYNC] System Failure:", e);
            if (e.response?.status === 401) {
                handleLogout();
            }
        }
        finally { setIsLoading(false); }
    };

    const handleMusicSearch = async (val) => {
        setMusicSearch(val);
        if (val.length > 1) {
            try {
                const res = await apiClient.get(`/music/library?q=${val}`);
                setMusicLibrary(res.data);
            } catch (e) { }
        } else if (val.length === 0) {
            try {
                const res = await apiClient.get('/music/library');
                setMusicLibrary(res.data);
            } catch (e) { }
        }
    }

    const togglePreview = (audioUrl) => {
        if (previewAudio && previewAudio.src === audioUrl) {
            previewAudio.pause();
            setPreviewAudio(null);
        } else {
            if (previewAudio) previewAudio.pause();
            const audio = new Audio(audioUrl);
            audio.play();
            setPreviewAudio(audio);
            audio.onended = () => setPreviewAudio(null);
        }
    }

    const fetchMore = async () => {
        if (isFetchingMore || !hasMore) return;
        setIsFetchingMore(true);
        try {
            const p = await apiClient.get(`/posts/all?skip=${page * 10}&limit=10`);
            if (p.data.length === 0) {
                setHasMore(false);
            } else {
                setPosts(prev => [...prev, ...p.data]);
                setPage(prev => prev + 1);
                setHasMore(p.data.length === 10);
            }
        } catch (e) { }
        finally { setIsFetchingMore(false); }
    };

    useEffect(() => {
        const handleScroll = () => {
            if (window.innerHeight + document.documentElement.scrollTop + 100 >= document.documentElement.offsetHeight) {
                if (view === 'home') fetchMore();
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [page, hasMore, isFetchingMore, view]);

    useEffect(() => {
        if (session) {
            fetchInitial();

            // SIMULATED REAL-TIME NOTIFICATIONS
            const notifyInterval = setInterval(() => {
                const types = [
                    { msg: 'started following you', user: 'neon_dreamer' },
                    { msg: 'liked your secure broadcast', user: 'cyber_vibe' },
                    { msg: 'mentioned you in a transmission', user: 'alex_dev' }
                ];
                const type = types[Math.floor(Math.random() * types.length)];
                setToast({ ...type, id: Date.now() });
                setTimeout(() => setToast(null), 5000);
            }, 25000); // Every 25s

            // Real-time stats pooling
            const interval = setInterval(async () => {
                try {
                    const s = await apiClient.get(`/analytics?user_id=${session.id}`);
                    setStats(s.data);
                } catch (e) { }
            }, 10000);
            return () => {
                clearInterval(interval);
                clearInterval(notifyInterval);
            };
        }
    }, [session]);

    const handlePost = async () => {
        if (!newPost.caption.trim() && createMode === 'post') return;
        setIsUploading(true);
        try {
            let finalImageUrl = newPost.image;

            if (localFile) {
                const formData = new FormData();
                formData.append('file', localFile);
                const uploadRes = await apiClient.post('/posts/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                finalImageUrl = uploadRes.data.url;
            }

            if (!finalImageUrl) {
                finalImageUrl = "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&fit=crop";
            }

            const isReel = !!isVideo(finalImageUrl);

            if (createMode === 'post') {
                const res = await apiClient.post('/posts/create', {
                    user_id: session.id,
                    image_url: finalImageUrl,
                    caption: newPost.caption,
                    is_reel: isReel,
                    category: activeCategory,
                    music_id: selectedMusic?.id,
                    music_name: selectedMusic ? `${selectedMusic.title} - ${selectedMusic.artist}` : null,
                    music_url: selectedMusic?.audio_url,
                    music_cover: selectedMusic?.cover_url
                });
                setPosts([{ ...res.data, user_handle: session.username, user_pic: session.profile_pic }, ...posts]);
            } else {
                const res = await apiClient.post('/stories/create', {
                    user_id: session.id,
                    media_url: finalImageUrl,
                    mentions: [],
                    music_id: selectedMusic?.id,
                    music_name: selectedMusic ? `${selectedMusic.title} - ${selectedMusic.artist}` : null,
                    music_url: selectedMusic?.audio_url,
                    music_cover: selectedMusic?.cover_url
                });
                setStories([{ ...res.data, user: session.username, profile_pic: session.profile_pic, img: finalImageUrl }, ...stories]);
            }

            setNewPost({ caption: '', image: '', is_reel: false });
            setLocalFile(null);
            setSelectedMusic(null);
            setShowCreate(false);
            fetchInitial();
        } catch (e) {
            alert(`Execution Failed: ${e.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLocalFile(file);
            const url = URL.createObjectURL(file);
            const isVideoFile = file.type.startsWith('video/');
            setNewPost({ ...newPost, image: url, is_reel: isVideoFile });
        }
    };

    const navigateToProfile = (username) => {
        setTargetUsername(username);
        setView('profile');
    };

    const navigateToMessages = (user) => {
        if (user) setMessageReceiver(user);
        setView('messages');
    };

    const handleDeletePost = async (id) => {
        if (!window.confirm("Terminate this toxic payload?")) return;
        try {
            await apiClient.delete(`/posts/${id}`);
            fetchInitial();
        } catch (e) { }
    };

    if (!session) {
        return authView === 'login' ?
            <Login onSwitch={() => setAuthView('register')} onLoginSuccess={setSession} /> :
            <Register onSwitch={() => setAuthView('login')} onRegisterSuccess={() => setAuthView('login')} />;
    }

    return (
        <div className="min-h-screen bg-black text-white flex">
            {/* Sidebar */}
            <nav className="w-20 lg:w-64 border-r border-white/10 p-4 fixed h-full flex flex-col bg-black z-50">
                <div className="flex flex-col h-full">
                    {/* Header Section */}
                    <div className="mb-6">
                        <div className="px-4 py-3 hidden lg:flex items-center gap-2 cursor-pointer" onClick={() => setView('home')}>
                            <Shield className="text-sky-500 animate-pulse" size={24} />
                            <h1 className="text-xl font-black italic tracking-tighter text-white">CyberGuard</h1>
                        </div>
                        <div className="px-4 block lg:hidden text-white mb-4" onClick={() => setView('home')}><Shield className="text-sky-500" size={24} /></div>

                        <div className="mx-4 p-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl hidden lg:block">
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-1 bg-emerald-500 rounded-full animate-ping"></div>
                                <span className="text-[7px] font-black text-emerald-500 uppercase tracking-widest">Active Scan</span>
                            </div>
                        </div>
                    </div>

                    {/* Scrollable Navigation Items */}
                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
                        {[
                            { icon: Home, label: 'Home', val: 'home' },
                            { icon: SearchIcon, label: 'Search', val: 'search' },
                            { icon: Compass, label: 'Explore', val: 'explore' },
                            { icon: Play, label: 'Reels', val: 'reels' },
                            { icon: MessageCircle, label: 'Messages', val: 'messages', action: () => { setMessageReceiver(null); setView('messages'); } },
                            { icon: Heart, label: 'Notifications', val: 'notifications' },
                            { icon: PlusSquare, label: 'Create', val: 'create', action: () => setShowCreate(true) },
                            { icon: User, label: 'Profile', val: 'profile', action: () => navigateToProfile(session.username) },
                            { icon: BarChart3, label: 'AI Analytics', val: 'analytics' },
                        ].map(item => (
                            <div
                                key={item.label}
                                onClick={item.action ? item.action : () => setView(item.val)}
                                className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all duration-300 ${view === item.val && (item.val !== 'profile' || targetUsername === session.username) ? 'bg-white/10 font-black text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]' : 'text-zinc-400 hover:bg-white/5 hover:text-white hover:translate-x-1'}`}
                            >
                                {item.label === 'Profile' ? (
                                    session.profile_pic ? (
                                        <img src={session.profile_pic} className="w-[22px] h-[22px] rounded-full object-cover ring-1 ring-white/20" />
                                    ) : (
                                        <div className="w-[22px] h-[22px] bg-sky-500/20 text-sky-500 rounded-full flex items-center justify-center text-[8px] font-black uppercase ring-1 ring-sky-500/20">
                                            {session.username[0]}
                                        </div>
                                    )
                                ) : (
                                    <item.icon size={22} strokeWidth={view === item.val ? 3 : 2} />
                                )}
                                <span className="hidden lg:inline text-[13px] tracking-tight">{item.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Bottom Utility Section */}
                    <div className="mt-auto pt-4 border-t border-white/5 space-y-2">
                        <div
                            onClick={handleLogout}
                            className="flex items-center gap-4 p-3 hover:bg-rose-500/10 rounded-xl cursor-pointer text-rose-500 font-black transition-all group"
                        >
                            <LogOut size={22} className="group-hover:rotate-12 transition-transform" />
                            <span className="hidden lg:inline text-[11px] uppercase tracking-widest">Terminate Session</span>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="flex-1 ml-20 lg:ml-64 flex flex-col min-h-screen">
                {view === 'home' && (
                    <div className="w-full max-w-[600px] mx-auto pt-[60px] lg:pt-12 px-0 md:px-6">
                        <StoryBar user={session} onStoryClick={setActiveStory} stories={stories} />
                        <div className="mt-8">
                            {isLoading ? (
                                [1, 2, 3].map(i => <SkeletonPost key={i} />)
                            ) : posts.length > 0 ? (
                                posts.map(post => (
                                    <PostItem key={post.id} post={post} session={session} onProfileClick={navigateToProfile} />
                                ))
                            ) : (
                                <div className="text-center py-32 bg-zinc-950 border border-white/5 rounded-[40px] shadow-2xl mx-4">
                                    <div className="w-20 h-20 bg-sky-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Shield className="text-sky-500 animate-pulse" size={36} />
                                    </div>
                                    <p className="text-zinc-500 font-bold tracking-[0.2em] text-[10px] mb-8 uppercase">Network Integrity Operational</p>
                                    <button onClick={() => setShowCreate(true)} className="bg-white text-black text-[10px] font-black px-10 py-3 rounded-full hover:bg-zinc-200 transition-all uppercase tracking-widest">Share First Protected Post</button>
                                </div>
                            )}
                            {isFetchingMore && <div className="py-10 flex justify-center"><div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div></div>}
                        </div>
                    </div>
                )}

                {view === 'search' && <Search onProfileClick={navigateToProfile} />}
                {view === 'explore' && <Explore onProfileClick={navigateToProfile} />}
                {view === 'reels' && <Reels onProfileClick={navigateToProfile} />}
                {view === 'messages' && <Messages session={session} preselectedReceiver={messageReceiver} />}
                {view === 'notifications' && <Notifications />}
                {view === 'profile' && <Profile user={session} setSession={setSession} targetUsername={targetUsername} onProfileClick={navigateToProfile} onMessageClick={navigateToMessages} />}
                {view === 'music' && (
                    <div className="w-full max-w-4xl p-6 md:p-12 mt-12 bg-black">
                        <h2 className="text-3xl md:text-5xl font-black italic text-white tracking-widest mb-12 uppercase">Music Library</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {musicLibrary.map(m => (
                                <div key={m.id} className="flex items-center justify-between p-6 bg-zinc-950 border border-white/5 rounded-3xl group hover:border-sky-500/50 transition-all cursor-pointer">
                                    <div className="flex items-center gap-6">
                                        <img src={m.cover_url} className="w-20 h-20 rounded-2xl object-cover shadow-2xl group-hover:scale-105 transition-transform" />
                                        <div>
                                            <p className="text-xl font-black text-white uppercase italic">{m.title}</p>
                                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">{m.artist}</p>
                                        </div>
                                    </div>
                                    {m.spotify_url && (
                                        <a href={m.spotify_url} target="_blank" rel="noreferrer" className="bg-sky-500 text-white text-[10px] font-black px-6 py-2 rounded-full uppercase tracking-widest hover:bg-sky-600 transition-all">Spotify</a>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {view === 'analytics' && (
                    <div className="w-full max-w-4xl p-6 md:p-12 mt-12 bg-black">
                        <div className="flex justify-between items-center mb-12">
                            <h2 className="text-3xl md:text-5xl font-black italic text-white tracking-widest">NETWORK PULSE</h2>
                            <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-500 px-4 py-1 rounded-full text-[10px] font-black uppercase border border-emerald-500/20"><Shield size={12} /> Global Integrity Scan: Active</div>
                        </div>
                        {stats ? (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                                    <div className="p-10 border border-white/10 rounded-3xl bg-zinc-950 flex flex-col items-center">
                                        <p className="text-[10px] text-zinc-500 uppercase font-black mb-4 tracking-[0.3em]">Traffic Scanned</p>
                                        <h3 className="text-6xl font-thin italic text-white">{stats.total_checks}</h3>
                                    </div>
                                    <div className="p-10 border border-rose-500/20 rounded-3xl bg-rose-500/[0.03] flex flex-col items-center">
                                        <p className="text-[10px] text-rose-500 uppercase font-black mb-4 tracking-[0.3em]">Threats Neutered</p>
                                        <h3 className="text-6xl font-thin italic text-rose-500">{stats.toxic_count}</h3>
                                        <p className="text-[8px] text-rose-500/50 mt-4 uppercase font-bold tracking-widest">Total Bad Comments on Your Posts</p>
                                    </div>
                                    <div className="p-10 border border-emerald-500/20 rounded-3xl bg-emerald-500/[0.03] flex flex-col items-center">
                                        <p className="text-[10px] text-emerald-500 uppercase font-black mb-4 tracking-[0.3em]">Account Safety</p>
                                        <h3 className="text-6xl font-thin italic text-emerald-500">100%</h3>
                                    </div>
                                </div>

                                {/* Detailed Post Breakdown */}
                                <div className="bg-zinc-950 border border-white/5 rounded-[3rem] p-12 mb-12">
                                    <h4 className="text-[10px] text-zinc-500 uppercase font-black mb-12 tracking-[0.4em]">Post-Wise Integrity Breakdown</h4>
                                    <div className="space-y-6">
                                        {stats.post_stats && stats.post_stats.length > 0 ? (
                                            stats.post_stats.map(ps => (
                                                <div key={ps.id} className="p-6 bg-black border border-white/5 rounded-[2.5rem] hover:border-rose-500/30 transition-all overflow-hidden">
                                                    <div className="flex items-center justify-between mb-8">
                                                        <div className="flex items-center gap-6">
                                                            <div className="w-20 h-20 rounded-3xl overflow-hidden bg-zinc-900 border border-white/10 shrink-0">
                                                                <img src={ps.image_url} className="w-full h-full object-cover opacity-60" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] text-zinc-500 font-bold italic mb-2">"{ps.caption}"</p>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="bg-rose-500/10 text-rose-500 text-[9px] font-black px-4 py-1.5 rounded-full border border-rose-500/20 uppercase tracking-widest">
                                                                        {ps.bad_comments_count} Threats Neutered
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[10px] font-black text-white uppercase mb-1">Integrity Status</p>
                                                            <p className="text-[8px] text-emerald-500 font-bold uppercase tracking-widest flex items-center gap-1 justify-end"><Shield size={10} /> Fully Protected</p>
                                                        </div>
                                                    </div>

                                                    {/* Bad Comment Details */}
                                                    <div className="space-y-4 border-t border-white/5 pt-8">
                                                        <p className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-6 ml-2">Neural Threat Identification</p>
                                                        {ps.toxic_details?.map((td, idx) => {
                                                            const key = `${ps.id}-${idx}`;
                                                            const isRevealed = revealedIds[key];
                                                            return (
                                                                <div key={idx} className="flex items-center justify-between p-5 bg-zinc-950/40 rounded-3xl border border-white/5 group/detail hover:bg-zinc-950 transition-colors">
                                                                    <div className="flex items-center gap-5">
                                                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black uppercase transition-all duration-500 ${isRevealed ? 'bg-rose-500/20 text-rose-500 rotate-12' : 'bg-zinc-900 text-zinc-700'}`}>
                                                                            {isRevealed ? td.username[0] : '?'}
                                                                        </div>
                                                                        <div>
                                                                            <p className={`text-[10px] font-black uppercase tracking-tighter transition-all duration-500 ${isRevealed ? 'text-white' : 'text-zinc-800'}`}>
                                                                                {isRevealed ? td.username : 'Source Encrypted'}
                                                                            </p>
                                                                            <p className={`text-[13px] font-medium leading-tight transition-all duration-700 ${isRevealed ? 'text-rose-400 blur-0' : 'text-transparent bg-zinc-900/50 animate-pulse rounded px-2 select-none blur-md'}`}>
                                                                                {td.text}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => setRevealedIds(prev => ({ ...prev, [key]: !prev[key] }))}
                                                                        className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all ${isRevealed ? 'bg-rose-500/20 text-rose-500 shadow-lg shadow-rose-500/20' : 'bg-white/5 text-zinc-600 hover:text-white hover:bg-white/10'}`}
                                                                        title={isRevealed ? "Mask Content" : "Reveal Content"}
                                                                    >
                                                                        {isRevealed ? <EyeOff size={18} /> : <Eye size={18} />}
                                                                    </button>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-10">
                                                <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                                                    <Shield size={20} className="text-emerald-500" />
                                                </div>
                                                <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">Zero Threats Detected Across All Posts</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-12">
                                    <div className="bg-zinc-950 border border-white/5 rounded-3xl p-8">
                                        <h4 className="text-[10px] text-zinc-500 uppercase font-black mb-8 tracking-[0.3em]">Real-Time Integrity Feed</h4>
                                        <div className="space-y-4">
                                            {stats.recent_activity?.map((act, i) => (
                                                <div key={i} className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-2.5 h-2.5 rounded-full ${act.is_toxic ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                                                        <div className="max-w-xs md:max-w-md">
                                                            <p className="text-xs text-zinc-300 font-bold truncate">{act.text}</p>
                                                            <p className="text-[8px] text-zinc-600 font-black uppercase mt-1">Sender: {act.user_handle || 'anonymous'}</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-[9px] text-zinc-600 font-black uppercase">Detect-Rate: {(act.score * 100).toFixed(0)}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-zinc-950 border border-red-500/10 rounded-3xl p-8">
                                        <h4 className="text-[10px] text-rose-500 uppercase font-black tracking-[0.3em] mb-8">Threat Quarantine</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {posts.filter(p => p.is_toxic).map(tp => (
                                                <div key={tp.id} className="p-4 rounded-2xl bg-black border border-white/5 flex gap-4 items-center">
                                                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 blur-[2px] opacity-50"><img src={tp.image_url} className="w-full h-full object-cover" /></div>
                                                    <div className="flex-1 overflow-hidden">
                                                        <p className="text-[10px] text-zinc-400 font-bold truncate italic">"{tp.caption}"</p>
                                                        <p className="text-[8px] text-zinc-600 font-black uppercase mt-1">Status: Flagged</p>
                                                    </div>
                                                    <button onClick={() => handleDeletePost(tp.id)} className="text-rose-500 hover:text-white transition-colors p-2"><X size={16} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : <div className="text-center py-20 text-zinc-600">Syncing with AI Global Core...</div>}
                    </div>
                )}
            </main>

            {/* CREATE POST MODAL */}
            <AnimatePresence>
                {showCreate && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
                        <div className="bg-zinc-950 border border-white/10 w-full max-w-4xl h-[85vh] rounded-[40px] overflow-hidden flex flex-col md:flex-row shadow-2xl">
                            <div className="flex-[1.5] bg-black relative flex items-center justify-center border-r border-white/5">
                                {newPost.image ? (
                                    <div className="w-full h-full p-8 flex items-center justify-center relative">
                                        {newPost.is_reel ? <video src={newPost.image} className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl" style={{ filter: `brightness(${activeFilters.brightness}%) contrast(${activeFilters.contrast}%) grayscale(${activeFilters.grayscale}%) sepia(${activeFilters.sepia}%)` }} autoPlay controls loop /> : <img src={newPost.image} className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl" style={{ filter: `brightness(${activeFilters.brightness}%) contrast(${activeFilters.contrast}%) grayscale(${activeFilters.grayscale}%) sepia(${activeFilters.sepia}%)` }} />}
                                        <button className="absolute top-12 right-12 bg-black/60 p-2 rounded-full" onClick={() => setNewPost({ ...newPost, image: '' })}><X size={16} /></button>
                                    </div>
                                ) : (
                                    <div className="text-center space-y-6">
                                        <div className="w-24 h-24 bg-sky-500/10 rounded-full flex items-center justify-center mx-auto border border-sky-500/20"><ImageIcon size={40} className="text-sky-500" /></div>
                                        <button onClick={() => fileInputRef.current.click()} className="bg-white text-black text-[10px] font-black px-12 py-4 rounded-full uppercase tracking-widest">Select Drive</button>
                                    </div>
                                )}
                                <input type="file" ref={fileInputRef} className="hidden" accept="video/*,image/*" onChange={handleFileChange} />
                            </div>
                            <div className="flex-1 flex flex-col">
                                <div className="p-8 border-b border-white/5 flex justify-between items-center">
                                    <div className="flex gap-4">
                                        <button onClick={() => setCreateMode('post')} className={`text-[10px] font-black uppercase tracking-widest ${createMode === 'post' ? 'text-white border-b-2 border-sky-500 pb-1' : 'text-zinc-500'}`}>Post</button>
                                        <button onClick={() => setCreateMode('story')} className={`text-[10px] font-black uppercase tracking-widest ${createMode === 'story' ? 'text-white border-b-2 border-sky-500 pb-1' : 'text-zinc-500'}`}>Story</button>
                                    </div>
                                    <X size={20} className="cursor-pointer text-zinc-600" onClick={() => setShowCreate(false)} />
                                </div>
                                <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                                    {createMode === 'post' && (
                                        <textarea placeholder="Metadata Caption..." className="w-full bg-transparent border-none outline-none text-white resize-none h-24 placeholder:text-zinc-800" value={newPost.caption} onChange={e => setNewPost({ ...newPost, caption: e.target.value })} />
                                    )}

                                    {createMode === 'post' && (
                                        <div className="space-y-4">
                                            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Category Flux</p>
                                            <div className="flex flex-wrap gap-2">
                                                {["General", "Comedy", "Tech", "Music", "Vlog"].map(cat => (
                                                    <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-white text-black' : 'bg-black text-zinc-500 border border-white/5'}`}>{cat}</button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-4 pt-6 border-t border-white/5">
                                        <div className="flex justify-between items-center">
                                            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Neural Soundtrack</p>
                                            <div className="flex gap-2">
                                                <button onClick={() => setActiveMusicLang("Tamil")} className={`text-[7px] font-black uppercase ${activeMusicLang === 'Tamil' ? 'text-sky-500' : 'text-zinc-700'}`}>Tamil</button>
                                                <button onClick={() => setActiveMusicLang("English")} className={`text-[7px] font-black uppercase ${activeMusicLang === 'English' ? 'text-sky-500' : 'text-zinc-700'}`}>English</button>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <SearchIcon size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                                            <input
                                                type="text"
                                                placeholder="Search Tamil Songs..."
                                                className="w-full bg-black border border-white/5 rounded-xl py-2 pl-9 pr-4 text-[10px] text-white outline-none focus:border-sky-500/50 transition-all font-bold"
                                                value={musicSearch}
                                                onChange={(e) => handleMusicSearch(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            {musicLibrary.filter(m => m.language === activeMusicLang).map(m => (
                                                <div key={m.id} onClick={() => setSelectedMusic(m)} className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${selectedMusic?.id === m.id ? 'bg-sky-500/10 border border-sky-500/20' : 'bg-black border border-white/5 hover:border-white/20'}`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative group/play">
                                                            <img src={m.cover_url} className="w-10 h-10 rounded-lg object-cover" />
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); togglePreview(m.audio_url); }}
                                                                className="absolute inset-0 bg-black/40 items-center justify-center opacity-0 group-hover/play:opacity-100 flex transition-opacity rounded-lg"
                                                            >
                                                                {previewAudio && previewAudio.src === m.audio_url ? <X size={16} /> : <Play size={16} />}
                                                            </button>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-white uppercase">{m.title}</p>
                                                            <p className="text-[8px] text-zinc-600 font-bold">{m.artist}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {selectedMusic?.id === m.id && <Music size={12} className="text-sky-500 animate-bounce" />}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {newPost.image && (
                                        <div className="space-y-4 pt-6 border-t border-white/5">
                                            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Neural Filters</p>
                                            {['brightness', 'contrast', 'grayscale', 'sepia'].map(f => (
                                                <div key={f} className="space-y-1">
                                                    <div className="flex justify-between text-[7px] font-bold text-zinc-600 uppercase"><span>{f}</span><span>{activeFilters[f]}%</span></div>
                                                    <input type="range" min="0" max="200" value={activeFilters[f]} onChange={e => setActiveFilters({ ...activeFilters, [f]: e.target.value })} className="w-full h-1 accent-white bg-zinc-900 rounded-full appearance-none cursor-pointer" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="p-8"><button disabled={!newPost.caption.trim() || isUploading} onClick={handlePost} className="w-full bg-white text-black text-[10px] font-black py-4 rounded-full shadow-2xl shadow-sky-500/20 uppercase tracking-widest">{isUploading ? "Syncing Grid..." : "Transmit Pulse"}</button></div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {activeStory && <StoryViewer story={activeStory} stories={stories} setStory={setActiveStory} onClose={() => setActiveStory(null)} />}
            </AnimatePresence>

            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 300, opacity: 0 }} className="fixed bottom-10 right-10 z-[300] bg-zinc-950 border border-white/10 p-6 rounded-[2rem] shadow-2xl flex items-center gap-4 max-w-sm backdrop-blur-xl">
                        <div className="w-12 h-12 rounded-full bg-sky-500 flex items-center justify-center text-white font-black text-xs border-2 border-black">{toast.user[0]}</div>
                        <div><p className="text-[11px] font-bold text-white"><span className="text-sky-400">@{toast.user}</span> {toast.msg}</p><p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest mt-1">Just Now</p></div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
