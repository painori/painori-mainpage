import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, limit, startAfter, getDocs, addDoc, serverTimestamp, doc, deleteDoc, getDoc, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase/config';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Trash2, Plus, Lock, User, MessageSquare } from 'lucide-react';

const SALT = 'painori_salt_2025';

// Helper: Hash Password
const hashPassword = async (password) => {
    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + SALT);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
        console.error('Hashing failed:', error);
        return btoa(password + SALT); // Fallback
    }
};

const Lounge = () => {
    const [posts, setPosts] = useState([]);
    const [lastDoc, setLastDoc] = useState(null);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        nickname: '',
        password: '',
        title: '',
        content: ''
    });
    const [submitting, setSubmitting] = useState(false);

    // Edit/Delete State
    const [editMode, setEditMode] = useState(null); // null or { id, ...data }

    useEffect(() => {
        fetchPosts(true);
    }, []);

    const fetchPosts = async (isRefresh = false) => {
        if (loading) return;
        setLoading(true);
        try {
            let q = query(
                collection(db, 'posts'),
                orderBy('createdAt', 'desc'),
                limit(10)
            );

            if (!isRefresh && lastDoc) {
                q = query(
                    collection(db, 'posts'),
                    orderBy('createdAt', 'desc'),
                    limit(10),
                    startAfter(lastDoc)
                );
            }

            const snapshot = await getDocs(q);
            const newPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            if (isRefresh) {
                setPosts(newPosts);
            } else {
                setPosts(prev => [...prev, ...newPosts]);
            }

            setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
            setHasMore(snapshot.docs.length === 10);
        } catch (err) {
            console.error("Error fetching posts:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.content || !formData.nickname || !formData.password) {
            alert("All fields are required.");
            return;
        }

        setSubmitting(true);
        try {
            // 1. Validate Nickname via Cloud Function
            const validateNicknameFn = httpsCallable(functions, 'validateNickname');
            const validationRes = await validateNicknameFn({ nickname: formData.nickname });

            if (!validationRes.data.success || !validationRes.data.isValid) {
                alert(validationRes.data.error || "Nickname invalid or not allowed.");
                setSubmitting(false);
                return;
            }

            const validatedNickname = validationRes.data.processedNickname;

            // 2. Hash Password
            const hashedPassword = await hashPassword(formData.password);

            // 3. Add to Firestore
            await addDoc(collection(db, 'posts'), {
                nickname: validatedNickname,
                password: hashedPassword,
                title: formData.title,
                content: formData.content,
                createdAt: serverTimestamp(),
                date: new Date().toISOString().split('T')[0],
            });

            alert("Post created successfully!");
            setIsFormOpen(false);
            setFormData({ nickname: '', password: '', title: '', content: '' });
            fetchPosts(true); // Refresh list

        } catch (err) {
            console.error("Submit error:", err);
            alert("Failed to submit post.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (postId) => {
        const password = prompt("Enter password to delete:");
        if (!password) return;

        try {
            const hashedPassword = await hashPassword(password);
            const docRef = doc(db, "posts", postId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists() && docSnap.data().password === hashedPassword) {
                await deleteDoc(docRef);
                alert("Post deleted.");
                setPosts(prev => prev.filter(p => p.id !== postId));
            } else {
                alert("Incorrect password.");
            }
        } catch (err) {
            console.error("Delete error:", err);
            alert("Failed to delete.");
        }
    };

    // Simplified Edit - just expanding on existing logic
    // For MVP/Renewal we can keep it simple.

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Pioneer's Lounge</h1>
                        <p className="text-gray-500">Free talk about Painori & Pi Network</p>
                    </div>
                    <button
                        onClick={() => setIsFormOpen(!isFormOpen)}
                        className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition flex items-center gap-2"
                    >
                        {isFormOpen ? <X size={20} /> : <Plus size={20} />}
                        {isFormOpen ? 'Cancel' : 'New Post'}
                    </button>
                </div>

                {/* Post Form */}
                <AnimatePresence>
                    {isFormOpen && (
                        <motion.form
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            onSubmit={handleSubmit}
                            className="bg-white p-6 rounded-xl shadow-sm border border-orange-100 mb-8 overflow-hidden"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="relative">
                                    <User size={18} className="absolute top-3 left-3 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Nickname"
                                        value={formData.nickname}
                                        onChange={e => setFormData({ ...formData, nickname: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                                        maxLength={20}
                                    />
                                </div>
                                <div className="relative">
                                    <Lock size={18} className="absolute top-3 left-3 text-gray-400" />
                                    <input
                                        type="password"
                                        placeholder="Password (for delete)"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                                    />
                                </div>
                            </div>
                            <input
                                type="text"
                                placeholder="Title"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:border-orange-500"
                                maxLength={50}
                            />
                            <textarea
                                placeholder="Content..."
                                value={formData.content}
                                onChange={e => setFormData({ ...formData, content: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg mb-4 h-32 focus:outline-none focus:border-orange-500"
                                maxLength={300}
                            />
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="bg-navy-900 text-white px-6 py-2 rounded-lg hover:bg-navy-800 disabled:opacity-50"
                                >
                                    {submitting ? 'Submitting...' : 'Post'}
                                </button>
                            </div>
                        </motion.form>
                    )}
                </AnimatePresence>

                {/* Post List */}
                <div className="space-y-4">
                    {posts.map(post => (
                        <motion.div
                            key={post.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg text-gray-800">{post.title}</h3>
                                <div className="flex items-center text-xs text-gray-400 gap-2">
                                    <span>{post.date}</span>
                                    <button
                                        onClick={() => handleDelete(post.id)}
                                        className="p-1 hover:text-red-500 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            <div className="text-sm text-orange-500 mb-3 font-medium flex items-center gap-1">
                                <User size={14} /> {post.nickname}
                            </div>
                            <p className="text-gray-600 whitespace-pre-wrap">{post.content}</p>
                        </motion.div>
                    ))}

                    {posts.length === 0 && !loading && (
                        <div className="text-center py-12 text-gray-500">
                            No posts yet. Be the first to write one!
                        </div>
                    )}

                    {hasMore && (
                        <div className="text-center mt-8">
                            <button
                                onClick={() => fetchPosts(false)}
                                disabled={loading}
                                className="px-6 py-2 border border-orange-500 text-orange-500 rounded-full hover:bg-orange-50 disabled:opacity-50"
                            >
                                {loading ? 'Loading...' : 'Load More'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Simple icon import fix
import { X } from 'lucide-react';

export default Lounge;
