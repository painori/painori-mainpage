import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, User, Lock, Trash2, Loader2, ChevronDown, ChevronUp, Edit2 } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { collection, query, orderBy, limit, startAfter, getDocs, addDoc, deleteDoc, updateDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db, functions } from '../firebase/config';

// Compatibility Salt
const SALT = 'painori_salt_2025';

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
    const { t } = useTranslation();
    const [posts, setPosts] = useState([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState({ nickname: '', password: '', title: '', content: '' });
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [lastVisible, setLastVisible] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [expandedPostId, setExpandedPostId] = useState(null);
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchPosts(false);
    }, []);

    const fetchPosts = async (loadMore = false) => {
        if (loading) return;
        setLoading(true);
        try {
            let q = query(
                collection(db, "posts"),
                orderBy("createdAt", "desc"),
                limit(5)
            );

            if (loadMore && lastVisible) {
                q = query(
                    collection(db, "posts"),
                    orderBy("createdAt", "desc"),
                    startAfter(lastVisible),
                    limit(5)
                );
            }

            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                const newPosts = snapshot.docs.map(doc => {
                    const data = doc.data();
                    let displayDate = data.date;
                    if (data.createdAt && data.createdAt.toDate) {
                        const dateObj = data.createdAt.toDate();
                        displayDate = dateObj.toLocaleDateString('ko-KR', {
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                        }).replace(/\.$/, '');
                    }
                    return { id: doc.id, ...data, displayDate };
                });

                if (loadMore) {
                    setPosts(prev => [...prev, ...newPosts]);
                } else {
                    setPosts(newPosts);
                }

                setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
                if (snapshot.docs.length < 5) setHasMore(false);
            } else {
                if (!loadMore) setPosts([]);
                setHasMore(false);
            }
        } catch (error) {
            console.error("Error fetching posts:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (post) => {
        setEditingId(post.id);
        setFormData({
            nickname: post.nickname,
            password: '', // User must re-enter password to confirm edit
            title: post.title,
            content: post.content
        });
        setIsFormOpen(true);
        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancel = () => {
        setIsFormOpen(false);
        setEditingId(null);
        setFormData({ nickname: '', password: '', title: '', content: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.nickname || !formData.password || !formData.title || !formData.content) return;

        setSubmitting(true);

        try {
            // Hash Password
            const hashedPassword = await hashPassword(formData.password);

            if (editingId) {
                // UPDATE Logic
                const docRef = doc(db, "posts", editingId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists() && docSnap.data().password === hashedPassword) {
                    await updateDoc(docRef, {
                        title: formData.title,
                        content: formData.content,
                        updatedAt: serverTimestamp()
                    });

                    alert(t('lounge_save_edit_success', 'Post updated successfully.'));

                    // Optimistic Update
                    setPosts(prev => prev.map(p =>
                        p.id === editingId ? { ...p, title: formData.title, content: formData.content } : p
                    ));
                    handleCancel();
                } else {
                    alert(t('lounge_password_incorrect', 'Incorrect password.'));
                }

            } else {
                // CREATE Logic
                // 1. Validate Nickname (Optional)
                let finalNickname = formData.nickname;

                try {
                    const validateNickname = httpsCallable(functions, 'validateNickname');
                    const validationResult = await validateNickname({ nickname: formData.nickname });

                    if (validationResult.data) {
                        if (!validationResult.data.isValid) {
                            alert(validationResult.data.errorMessage || "Invalid nickname.");
                            setSubmitting(false);
                            return;
                        }
                        // Use the processed nickname from server (handles admin masking)
                        if (validationResult.data.processedNickname) {
                            finalNickname = validationResult.data.processedNickname;
                        }
                    }
                } catch (err) { }

                await addDoc(collection(db, "posts"), {
                    nickname: finalNickname,
                    password: hashedPassword,
                    title: formData.title,
                    content: formData.content,
                    createdAt: serverTimestamp(),
                    date: new Date().toISOString().split('T')[0],
                    authorTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                });

                handleCancel();
                setHasMore(true);
                setLastVisible(null);
                fetchPosts(false);
            }

        } catch (error) {
            console.error("Error submitting post:", error);
            alert("Failed to process request.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (postId) => {
        const password = prompt(t('lounge_delete_prompt', 'Enter password to delete:'));
        if (!password) return;

        try {
            const hashedPassword = await hashPassword(password);
            const docRef = doc(db, "posts", postId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists() && docSnap.data().password === hashedPassword) {
                await deleteDoc(docRef);
                alert(t('lounge_delete_success', 'Post deleted successfully.'));
                setPosts(prev => prev.filter(p => p.id !== postId));
            } else {
                alert(t('lounge_delete_fail', 'Incorrect password.'));
            }
        } catch (error) {
            console.error("Error deleting post:", error);
            alert("Failed to delete post.");
        }
    };

    const toggleExpand = (postId) => {
        setExpandedPostId(expandedPostId === postId ? null : postId);
    };

    return (
        <div className="bg-gray-50 min-h-screen py-12 font-sans">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('lounge_title')}</h1>
                    <p className="text-gray-500">{t('lounge_subtitle')}</p>
                </div>

                <div className="flex justify-end mb-4">
                    {!isFormOpen && (
                        <button
                            onClick={() => setIsFormOpen(true)}
                            className="bg-orange-500 text-white px-5 py-2.5 rounded-lg hover:bg-orange-600 transition flex items-center gap-2 font-bold shadow-sm"
                        >
                            <Plus size={18} /> {t('lounge_new_post_btn')}
                        </button>
                    )}
                </div>

                {/* Post Form */}
                <AnimatePresence>
                    {isFormOpen && (
                        <motion.form
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            onSubmit={handleSubmit}
                            className={`p-6 rounded-xl shadow-sm border mb-8 overflow-hidden ${editingId ? 'bg-blue-50 border-blue-200' : 'bg-white border-orange-100'}`}
                        >
                            <h3 className="text-xl font-bold mb-4">
                                {editingId ? t('lounge_edit_title', 'Edit Post') : t('lounge_form_title', 'Create New Post')}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="relative">
                                    <User size={18} className="absolute top-3 left-3 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder={t('lounge_form_nickname')}
                                        value={formData.nickname}
                                        onChange={e => setFormData({ ...formData, nickname: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500 bg-white"
                                        maxLength={20}
                                        disabled={!!editingId} // Nickname cannot be changed in edit mode
                                    />
                                </div>
                                <div className="relative">
                                    <Lock size={18} className="absolute top-3 left-3 text-gray-400" />
                                    <input
                                        type="password"
                                        placeholder={t('lounge_form_password')}
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500 bg-white"
                                    />
                                </div>
                            </div>
                            <input
                                type="text"
                                placeholder={t('lounge_form_title_placeholder')}
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:border-orange-500 bg-white"
                                maxLength={50}
                            />
                            <textarea
                                placeholder={t('lounge_form_content')}
                                value={formData.content}
                                onChange={e => setFormData({ ...formData, content: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg mb-4 h-32 focus:outline-none focus:border-orange-500 bg-white resize-none"
                                maxLength={300}
                            />
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="px-6 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 font-medium"
                                >
                                    {t('lounge_form_cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className={`text-white px-6 py-2 rounded-lg disabled:opacity-50 font-bold ${editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-navy-900 hover:bg-navy-800'}`}
                                >
                                    {submitting ? 'Processing...' : (editingId ? t('lounge_save_edit', 'Save Changes') : t('lounge_form_submit', 'Post'))}
                                </button>
                            </div>
                        </motion.form>
                    )}
                </AnimatePresence>

                {/* Post List */}
                <div className="flex flex-col gap-3">
                    {posts.map(post => (
                        <motion.div
                            key={post.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                        >
                            {/* Header Row */}
                            <div
                                className="p-4 flex flex-col md:flex-row justify-between md:items-center cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => toggleExpand(post.id)}
                            >
                                <h3 className="font-bold text-gray-800 text-base md:text-lg mb-2 md:mb-0 md:flex-1 pr-4 truncate">
                                    {post.title}
                                </h3>
                                <div className="flex items-center text-xs text-gray-500 gap-3 whitespace-nowrap">
                                    <span className="font-medium text-gray-600">{post.nickname}</span>
                                    <span className="text-gray-300">|</span>
                                    <span>{post.displayDate}</span>
                                </div>
                            </div>

                            {/* Expanded Content */}
                            <AnimatePresence>
                                {expandedPostId === post.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="bg-gray-50 border-t border-gray-100"
                                    >
                                        <div className="p-4 md:p-6">
                                            {/* Full Title Box */}
                                            <div className="bg-white p-3 rounded border-l-4 border-orange-300 mb-4 shadow-sm">
                                                <h4 className="font-bold text-gray-900 text-sm md:text-base">{post.title}</h4>
                                            </div>

                                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed mb-6 text-sm md:text-base">
                                                {post.content}
                                            </p>

                                            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleEditClick(post); }}
                                                    className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-blue-600 px-3 py-1.5 rounded border border-gray-300 hover:border-blue-300 bg-white transition-all"
                                                >
                                                    <Edit2 size={14} /> {t('lounge_edit_btn', 'Edit')}
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(post.id); }}
                                                    className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-red-600 px-3 py-1.5 rounded border border-gray-300 hover:border-red-300 bg-white transition-all"
                                                >
                                                    <Trash2 size={14} /> {t('lounge_delete_btn', 'Delete')}
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}

                    {posts.length === 0 && !loading && (
                        <div className="text-center py-16 text-gray-400 bg-white rounded-lg shadow-sm border border-gray-200">
                            <p>{t('lounge_no_posts')}</p>
                        </div>
                    )}

                    {loading && (
                        <div className="flex justify-center py-8">
                            <Loader2 className="animate-spin text-orange-500" size={30} />
                        </div>
                    )}

                    {hasMore && !loading && posts.length > 0 && (
                        <button
                            onClick={() => fetchPosts(true)}
                            className="w-full py-3 bg-[#6B7280] hover:bg-[#4B5563] text-white rounded-md transition-colors font-bold mt-4 shadow-sm text-sm"
                        >
                            {t('load_more_posts', '더 많은 글 보기')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Lounge;
