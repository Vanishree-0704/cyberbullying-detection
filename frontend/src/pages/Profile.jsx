import React, { useState, useEffect } from 'react';
import { Settings, Grid, Heart, MessageCircle, X, Edit2, Trash2, UserSquare, Users } from 'lucide-react';
import apiClient from '../api/config';

const Profile = ({ user, targetUsername, onProfileClick, onMessageClick }) => {
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ full_name: '', bio: '', profile_pic: '' });
    const [localFile, setLocalFile] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);

    // Modals
    const [followers, setFollowers] = useState([]);
    const [following, setFollowing] = useState([]);
    const [showFollowers, setShowFollowers] = useState(false);
    const [showFollowing, setShowFollowing] = useState(false);

    // Post Edit Modal
    const [selectedPost, setSelectedPost] = useState(null);
    const [editCaption, setEditCaption] = useState("");

    const currentUsername = targetUsername || user.username;
    const isOwnProfile = user && user.username === currentUsername;

    useEffect(() => {
        fetchProfile();
    }, [currentUsername]);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get(`/profile/${currentUsername}`);
            setProfileData(res.data);
            setEditForm({
                full_name: res.data.user.full_name,
                bio: res.data.user.bio,
                profile_pic: res.data.user.profile_pic
            });
        } catch (e) {
            console.log(e);
        }
        setLoading(false);
    };

    const loadFollowers = async () => {
        try {
            const res = await apiClient.get(`/profile/${currentUsername}/followers`);
            setFollowers(res.data);
            setShowFollowers(true);
        } catch (e) {
            console.log(e);
        }
    };

    const loadFollowing = async () => {
        try {
            const res = await apiClient.get(`/profile/${currentUsername}/following`);
            setFollowing(res.data);
            setShowFollowing(true);
        } catch (e) {
            console.log(e);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLocalFile(file);
            setEditForm({ ...editForm, profile_pic: URL.createObjectURL(file) });
        }
    };

    const handleUpdateProfile = async () => {
        setIsUpdating(true);
        try {
            let finalPicUrl = editForm.profile_pic;
            if (localFile) {
                const formData = new FormData();
                formData.append("file", localFile);
                const uploadRes = await fetch("http://127.0.0.1:8000/api/v1/posts/upload", {
                    method: "POST",
                    body: formData
                });
                const data = await uploadRes.json();
                finalPicUrl = data.url;
            }
            const res = await apiClient.post("/profile/update", {
                user_id: user.id,
                full_name: editForm.full_name,
                bio: editForm.bio,
                profile_pic: finalPicUrl
            });
            setProfileData({ ...profileData, user: res.data });
            setIsEditing(false);
            setLocalFile(null);
        } catch (e) {
            alert("Upload Failed");
        }
        setIsUpdating(false);
    };

    const handleUpdatePost = async () => {
        if (!selectedPost) return;
        try {
            const res = await apiClient.put(`/posts/${selectedPost.id}`, { caption: editCaption });
            setProfileData(prev => ({
                ...prev,
                posts: prev.posts.map(p => p.id === selectedPost.id ? { ...p, caption: editCaption } : p)
            }));
            setSelectedPost(null);
        } catch (e) {
            console.log(e);
            alert("Failed to update post");
        }
    };

    const handleDeletePost = async () => {
        if (!selectedPost || !window.confirm("Are you sure you want to delete this post?")) return;
        try {
            await apiClient.delete(`/posts/${selectedPost.id}`);
            setProfileData(prev => ({
                ...prev,
                posts: prev.posts.filter(p => p.id !== selectedPost.id)
            }));
            setSelectedPost(null);
        } catch (e) {
            console.log(e);
            alert("Failed to delete post");
        }
    };


    if (loading) {
        return <div className="text-white p-10 text-center mt-20">Loading...</div>;
    }

    if (!profileData) {
        return <div className="text-white p-10 text-center mt-20">Profile not found.</div>;
    }

    const profile = profileData.user;
    const posts = profileData.posts || [];

    return (
        <div className="max-w-4xl mx-auto text-white p-4 md:p-10 pb-20">

            {/* Profile Header (Instagram style) */}
            <div className="flex flex-col md:flex-row gap-8 items-start md:items-center mb-10 pb-10 border-b border-zinc-800">

                {/* Profile Pic */}
                <div className="flex-shrink-0 md:ml-12 md:mr-10">
                    <div
                        className="w-24 h-24 md:w-36 md:h-36 rounded-full bg-zinc-800 overflow-hidden cursor-pointer border border-zinc-700 hover:opacity-80 transition-opacity"
                        onClick={() => { if (isOwnProfile) setIsEditing(true); }}
                    >
                        {profile.profile_pic ? (
                            <img src={profile.profile_pic} className="w-full h-full object-cover" alt="Profile" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl uppercase">
                                {profile.username[0]}
                            </div>
                        )}
                    </div>
                </div>

                {/* Profile Info */}
                <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4 mt-2">
                        <h2 className="text-xl md:text-2xl">{profile.username}</h2>

                        {isOwnProfile && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="bg-zinc-800 hover:bg-zinc-700 px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                                >
                                    Edit Profile
                                </button>
                                <button className="bg-zinc-800 hover:bg-zinc-700 p-1.5 rounded-lg transition-colors">
                                    <Settings size={20} />
                                </button>
                            </div>
                        )}
                        {!isOwnProfile && (
                            <div className="flex gap-2">
                                <button
                                    onClick={async () => {
                                        try {
                                            const res = await apiClient.post(`/profile/${profile.username}/follow`, { follower_id: user.id });
                                            if (res.data.status === 'followed') {
                                                setProfileData({ ...profileData, user: { ...profile, followers_count: profile.followers_count + 1 } });
                                            } else {
                                                setProfileData({ ...profileData, user: { ...profile, followers_count: profile.followers_count - 1 < 0 ? 0 : profile.followers_count - 1 } });
                                            }
                                        } catch (e) {
                                            console.log(e);
                                        }
                                    }}
                                    className="bg-sky-500 hover:bg-sky-600 px-6 py-1.5 rounded-lg text-sm font-bold transition-colors uppercase tracking-widest text-[10px]"
                                >
                                    Follow
                                </button>
                                <button
                                    onClick={() => onMessageClick && onMessageClick(profile)}
                                    className="bg-zinc-800 hover:bg-zinc-700 px-6 py-1.5 rounded-lg text-sm font-bold transition-colors uppercase tracking-widest text-[10px]"
                                >
                                    Message
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-6 mb-4 text-sm md:text-base">
                        <div><span className="font-semibold">{posts.length}</span> posts</div>
                        <div className="cursor-pointer hover:text-gray-300" onClick={loadFollowers}>
                            <span className="font-semibold">{profile.followers_count || 0}</span> followers
                        </div>
                        <div className="cursor-pointer hover:text-gray-300" onClick={loadFollowing}>
                            <span className="font-semibold">{profile.following_count || 0}</span> following
                        </div>
                    </div>

                    <div>
                        <h1 className="font-semibold text-sm mb-1">{profile.full_name}</h1>
                        <p className="text-sm whitespace-pre-wrap">{profile.bio}</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex justify-center gap-12 border-t border-zinc-800 mt-[-40px] pt-4 mb-6">
                <div className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase cursor-pointer border-t border-white pt-3 -mt-4">
                    <Grid size={16} /> POSTS
                </div>
            </div>

            {/* Posts Grid */}
            <div className="grid grid-cols-3 gap-1 md:gap-4">
                {posts.map((post) => (
                    <div
                        key={post.id}
                        className="aspect-square relative group cursor-pointer bg-zinc-900 overflow-hidden"
                        onClick={() => {
                            if (isOwnProfile) {
                                setSelectedPost(post);
                                setEditCaption(post.caption);
                            }
                        }}
                    >
                        {post.is_reel && (
                            <video src={post.image_url} className="w-full h-full object-cover" />
                        )}
                        {!post.is_reel && (
                            <img src={post.image_url} className="w-full h-full object-cover" alt={post.caption} />
                        )}
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-6 transition-opacity duration-200">
                            <div className="flex items-center gap-2">
                                <Heart size={20} className="fill-white" />
                                <span className="font-semibold">{post.likes || 0}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MessageCircle size={20} className="fill-white" />
                                <span className="font-semibold">{post.comments_count || 0}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {posts.length === 0 && (
                <div className="text-center text-zinc-500 mt-20">
                    <div className="flex justify-center mb-4"><Grid size={48} className="opacity-50" /></div>
                    <h1 className="text-2xl font-bold">No posts yet</h1>
                </div>
            )}

            {/* Edit Profile Modal */}
            {isEditing && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
                    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl w-full max-w-sm relative">
                        <button onClick={() => setIsEditing(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-white">
                            <X size={24} />
                        </button>
                        <h3 className="text-xl font-semibold mb-6 text-center">Edit Profile</h3>

                        <div className="flex justify-center mb-6">
                            <div
                                className="w-24 h-24 rounded-full bg-zinc-800 overflow-hidden cursor-pointer"
                                onClick={() => document.getElementById("fileUpload").click()}
                            >
                                {editForm.profile_pic ? (
                                    <img src={editForm.profile_pic} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-2xl uppercase">
                                        {profile.username[0]}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-zinc-400 font-semibold mb-1 block">Full Name</label>
                                <input
                                    className="w-full bg-black border border-zinc-800 p-3 rounded-lg text-sm focus:outline-none focus:border-zinc-500"
                                    value={editForm.full_name}
                                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="text-xs text-zinc-400 font-semibold mb-1 block">Bio</label>
                                <textarea
                                    className="w-full bg-black border border-zinc-800 p-3 rounded-lg text-sm focus:outline-none focus:border-zinc-500 resize-none h-20"
                                    value={editForm.bio}
                                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                />
                            </div>

                            <input
                                type="file"
                                id="fileUpload"
                                className="hidden"
                                onChange={handleFileChange}
                                accept="image/*"
                            />

                            <button
                                onClick={handleUpdateProfile}
                                disabled={isUpdating}
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl mt-4 disabled:opacity-50 transition-colors"
                            >
                                {isUpdating ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Followers Modal */}
            {showFollowers && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-sm overflow-hidden flex flex-col max-h-[70vh]">
                        <div className="p-4 border-b border-zinc-800 flex items-center justify-between pb-3">
                            <div className="w-6"></div>
                            <h3 className="font-semibold text-center flex-1">Followers</h3>
                            <button onClick={() => setShowFollowers(false)}><X size={20} className="text-white" /></button>
                        </div>
                        <div className="p-2 overflow-y-auto flex-1 h-[300px]">
                            {followers.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-zinc-500 text-sm">No followers yet.</div>
                            ) : (
                                followers.map(f => (
                                    <div key={f.id} onClick={() => { onProfileClick && onProfileClick(f.username); setShowFollowers(false); }} className="flex items-center justify-between p-2 hover:bg-zinc-800/50 rounded-lg cursor-pointer transition-colors">
                                        <div className="flex items-center gap-3">
                                            <img src={f.profile_pic} alt="" className="w-10 h-10 rounded-full object-cover" />
                                            <div>
                                                <p className="font-semibold text-sm">{f.username}</p>
                                                <p className="text-xs text-zinc-400">{f.full_name}</p>
                                            </div>
                                        </div>
                                        {isOwnProfile && <button className="bg-zinc-800 px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-zinc-700 transition-colors">Remove</button>}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Following Modal */}
            {showFollowing && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-sm overflow-hidden flex flex-col max-h-[70vh]">
                        <div className="p-4 border-b border-zinc-800 flex items-center justify-between pb-3">
                            <div className="w-6"></div>
                            <h3 className="font-semibold text-center flex-1">Following</h3>
                            <button onClick={() => setShowFollowing(false)}><X size={20} className="text-white" /></button>
                        </div>
                        <div className="p-2 overflow-y-auto flex-1 h-[300px]">
                            {following.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-zinc-500 text-sm">Not following anyone.</div>
                            ) : (
                                following.map(f => (
                                    <div key={f.id} onClick={() => { onProfileClick && onProfileClick(f.username); setShowFollowing(false); }} className="flex items-center justify-between p-2 hover:bg-zinc-800/50 rounded-lg cursor-pointer transition-colors">
                                        <div className="flex items-center gap-3">
                                            <img src={f.profile_pic} alt="" className="w-10 h-10 rounded-full object-cover" />
                                            <div>
                                                <p className="font-semibold text-sm">{f.username}</p>
                                                <p className="text-xs text-zinc-400">{f.full_name}</p>
                                            </div>
                                        </div>
                                        {isOwnProfile && <button className="bg-zinc-800 px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-zinc-700 transition-colors">Following</button>}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Post Edit Modal */}
            {selectedPost && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-4xl flex overflow-hidden shadow-2xl">
                        <div className="hidden md:block w-3/5 bg-black flex items-center justify-center border-r border-zinc-800">
                            {selectedPost.is_reel ? (
                                <video src={selectedPost.image_url} controls className="w-full h-auto max-h-[80vh] object-contain" />
                            ) : (
                                <img src={selectedPost.image_url} className="w-full h-auto max-h-[80vh] object-contain" />
                            )}
                        </div>
                        <div className="w-full md:w-2/5 flex flex-col">
                            <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900">
                                <div className="flex items-center gap-3">
                                    <img src={profile.profile_pic} className="w-8 h-8 rounded-full object-cover" />
                                    <span className="font-semibold text-sm">{profile.username}</span>
                                </div>
                                <button onClick={() => setSelectedPost(null)} className="text-zinc-400 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="p-4 flex-1 flex flex-col gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-zinc-400 mb-2 block uppercase uppercase tracking-wider">Caption</label>
                                    <textarea
                                        className="w-full bg-black border border-zinc-800 p-3 rounded-lg text-sm resize-none min-h-[150px] focus:outline-none focus:border-zinc-500"
                                        value={editCaption}
                                        onChange={(e) => setEditCaption(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                    <div className="flex items-center gap-1"><Heart size={14} /> {selectedPost.likes}</div>
                                    <div className="flex items-center gap-1"><MessageCircle size={14} /> {selectedPost.comments_count}</div>
                                </div>
                            </div>
                            <div className="p-4 border-t border-zinc-800 flex gap-2">
                                <button
                                    onClick={handleDeletePost}
                                    className="p-3 text-red-500 bg-zinc-800 hover:bg-red-500 hover:text-white rounded-lg transition-colors flex items-center justify-center aspect-square"
                                    title="Delete Post"
                                >
                                    <Trash2 size={20} />
                                </button>
                                <button
                                    onClick={handleUpdatePost}
                                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Profile;