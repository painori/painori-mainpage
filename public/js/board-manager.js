/**
 * 게시판 관리 모듈
 * 게시글 CRUD, 실시간 업데이트, 페이지네이션, 비밀번호 해싱
 */

class BoardManager {
    constructor() {
        this.currentEditingPostId = null;
        this.lastVisiblePost = null;
        this.isLoadingPosts = false;
        this.hasMorePosts = true;
        this.postsListener = null;
        this.loadedPostIds = new Set();
        
        // 🔐 보안: 솔트 설정
        this.SALT = 'painori_salt_2025';
        
        console.log('📝 Board Manager 초기화');
    }

    /**
     * Firebase 참조 가져오기
     */
    getFirebaseRefs() {
        if (!window.PainoriFirebase) {
            throw new Error('Firebase가 초기화되지 않았습니다');
        }
        return {
            db: window.PainoriFirebase.db,
            firestore: window.PainoriFirebase.firestore
        };
    }

    /**
     * 🔐 비밀번호 해싱 (SHA-256 + 솔트)
     * @param {string} password - 원본 비밀번호
     * @returns {string} 해싱된 비밀번호
     */
    async hashPassword(password) {
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(password + this.SALT);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (error) {
            console.error('❌ 비밀번호 해싱 실패:', error);
            // 폴백: 기본 해싱
            return btoa(password + this.SALT);
        }
    }

    /**
     * DOM 요소 가져오기
     */
    getElements() {
        return {
            postList: document.getElementById('post-list'),
            newPostBtn: document.getElementById('new-post-btn'),
            postFormContainer: document.getElementById('post-form-container'),
            editFormContainer: document.getElementById('edit-form-container'),
            loadMoreBtn: document.getElementById('load-more-btn'),
            postsLoading: document.getElementById('posts-loading'),
            newPostNotification: document.getElementById('new-post-notification'),
            
            // 폼 요소들
            postNickname: document.getElementById('post-nickname'),
            postPassword: document.getElementById('post-password'),
            postTitle: document.getElementById('post-title'),
            postContent: document.getElementById('post-content'),
            
            // 수정 폼 요소들
            editPassword: document.getElementById('edit-password'),
            editTitle: document.getElementById('edit-title'),
            editContentField: document.getElementById('edit-content-field'),
            
            // 버튼들
            submitPostBtn: document.getElementById('submit-post-btn'),
            cancelPostBtn: document.getElementById('cancel-post-btn'),
            saveEditBtn: document.getElementById('save-edit-btn'),
            cancelEditBtn: document.getElementById('cancel-edit-btn')
        };
    }

    /**
     * 실시간 리스너 설정 - 새 글 알림
     */
    setupPostsListener(lang) {
        const { db } = this.getFirebaseRefs();
        const translations = window.PainoriI18n.translations[lang] || window.PainoriI18n.translations['en'];
        
        // 기존 리스너 해제
        if (this.postsListener) {
            this.postsListener();
        }

        console.log('🔄 게시글 실시간 리스너 설정');
        
        // 최신 3개 게시글에 대한 실시간 리스너
        this.postsListener = db.collection("posts")
            .orderBy("createdAt", "desc")
            .limit(3)
            .onSnapshot((snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === "added") {
                        const postId = change.doc.id;
                        
                        // 페이지 로드 완료 후에만 알림 표시
                        if (this.isPageLoaded && !this.loadedPostIds.has(postId)) {
                            this.showNewPostNotification(translations);
                        }
                    }
                });
            }, (error) => {
                console.error('❌ 실시간 리스너 에러:', error);
            });
    }

    /**
     * 새 글 알림 표시
     */
    showNewPostNotification(translations) {
        const elements = this.getElements();
        
        if (elements.newPostNotification) {
            elements.newPostNotification.classList.remove('hidden');
            
            const messageSpan = elements.newPostNotification.querySelector('[data-i18n="new_post_available"]');
            if (messageSpan) {
                messageSpan.textContent = translations.new_post_available || 'New post available. Click to refresh.';
            }
        }
    }

    /**
     * 게시글 렌더링
     */
    async renderPosts(lang, isRefresh = false) {
        const elements = this.getElements();
        const { db } = this.getFirebaseRefs();
        
        if (!elements.postList) return;
        
        if (this.isLoadingPosts) return;
        
        const translations = window.PainoriI18n.translations[lang] || window.PainoriI18n.translations['en'];
        
        try {
            this.isLoadingPosts = true;
            
            // 새로고침 시 초기화
            if (isRefresh) {
                elements.postList.innerHTML = '';
                this.lastVisiblePost = null;
                this.hasMorePosts = true;
                this.loadedPostIds.clear();
                
                // 더보기 버튼 초기화
                if (elements.loadMoreBtn) {
                    elements.loadMoreBtn.classList.add('hidden');
                }
            }
            
            // 로딩 표시
            if (elements.postsLoading) {
                elements.postsLoading.classList.remove('hidden');
            }
            
            console.log('📄 게시글 목록 로딩 시작');
            
            // 10개씩 로드
            let query = db.collection("posts")
                .orderBy("createdAt", "desc")
                .limit(isRefresh ? 10 : 10);
            
            if (this.lastVisiblePost) {
                query = query.startAfter(this.lastVisiblePost);
            }
            
            const snapshot = await query.get();
            
            // 로딩 숨김
            if (elements.postsLoading) {
                elements.postsLoading.classList.add('hidden');
            }
            
            // 첫 로딩에서 게시글이 없는 경우
            if (snapshot.empty && !this.lastVisiblePost) {
                console.log('📄 게시글 없음');
                elements.postList.innerHTML = `<div class="text-center py-8 text-gray-500">${translations.lounge_no_posts}</div>`;
                this.isPageLoaded = true;
                return;
            }
            
            if (snapshot.empty && this.lastVisiblePost) {
                // 더 이상 불러올 게시글 없음
                this.hasMorePosts = false;
                if (elements.loadMoreBtn) {
                    elements.loadMoreBtn.textContent = translations.all_posts_loaded || 'All posts loaded';
                    elements.loadMoreBtn.disabled = true;
                    elements.loadMoreBtn.classList.remove('hidden');
                }
                return;
            }
            
            console.log(`📄 ${snapshot.size}개 게시글 발견`);
            
            // 마지막 문서 업데이트
            this.lastVisiblePost = snapshot.docs[snapshot.docs.length - 1];
            
            snapshot.forEach((doc, index) => {
                const post = doc.data();
                const postId = doc.id;
                
                if (this.loadedPostIds.has(postId)) {
                    return;
                }
                this.loadedPostIds.add(postId);
                
                this.renderSinglePost(post, postId, index, lang, translations);
            });
            
            // 더보기 버튼 처리
            if (elements.loadMoreBtn && snapshot.size >= 5 && this.hasMorePosts) {
                elements.loadMoreBtn.classList.remove('hidden');
                elements.loadMoreBtn.disabled = false;
                elements.loadMoreBtn.textContent = translations.load_more_posts;
            } else if (elements.loadMoreBtn && snapshot.size < 5) {
                // 5개 미만이면 더 이상 없음으로 처리
                this.hasMorePosts = false;
                elements.loadMoreBtn.textContent = translations.all_posts_loaded || 'All posts loaded';
                elements.loadMoreBtn.disabled = true;
                elements.loadMoreBtn.classList.remove('hidden');
            }
            
            // 첫 번째 로딩 완료 후 페이지 로드 완료 표시
            if (isRefresh || !this.isPageLoaded) {
                this.isPageLoaded = true;
            }
            
            console.log('✅ 게시글 렌더링 완료');
            
        } catch (error) {
            console.error("❌ 게시글 로딩 에러:", error);
            if (elements.postList) {
                elements.postList.innerHTML = `<div class="text-center py-8 text-gray-500">${translations.news_error || 'Failed to load posts'}</div>`;
            }
        } finally {
            this.isLoadingPosts = false;
            if (elements.postsLoading) {
                elements.postsLoading.classList.add('hidden');
            }
        }
    }

    /**
     * 개별 게시글 렌더링
     * @param {Object} post - 게시글 데이터
     * @param {string} postId - 게시글 ID
     * @param {number} index - 인덱스
     * @param {string} lang - 언어
     * @param {Object} translations - 번역 객체
     */
    renderSinglePost(post, postId, index, lang, translations) {
        const elements = this.getElements();
        
        // 시간 처리
        let displayTime = '';
        if (post.createdAt && post.createdAt.toDate) {
            const date = post.createdAt.toDate();
            const timeFormat = lang === 'ko' ? 'ko-KR' : 'en-US';
            
            displayTime = date.toLocaleString(timeFormat, {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: lang === 'en'
            });
        } else if (post.date) {
            displayTime = post.date;
        } else {
            displayTime = lang === 'ko' ? '날짜 없음' : 'No date';
        }
        
        const postElement = document.createElement('div');
        postElement.className = 'post-item';
        postElement.dataset.postId = postId;
        
        // 새 게시글 하이라이트 (최근 1시간 내)
        const isNewPost = post.createdAt && 
            (Date.now() - post.createdAt.toDate().getTime()) < 3600000;
        if (isNewPost && !this.lastVisiblePost && index < 3) {
            postElement.classList.add('new-post');
        }
        
        postElement.innerHTML = `
            <div class="post-header">
                <div class="post-title-row hidden sm:contents">
                    <div class="post-title" onclick="window.togglePostContent('${postId}')">${post.title}</div>
                    <div class="post-meta">
                        <span class="post-nickname">${post.nickname}</span>
                        <span class="text-gray-400">|</span>
                        <span>${displayTime}</span>
                    </div>
                    <div class="post-actions">
                        <button onclick="window.showEditForm('${postId}', '${post.title.replace(/'/g, "\\'")}', '${(post.content || '').replace(/'/g, "\\'")}')" 
                                class="btn-small btn-edit">${translations.lounge_edit_btn}</button>
                        <button onclick="window.deletePost('${postId}')" 
                                class="btn-small btn-delete">${translations.lounge_delete_btn}</button>
                    </div>
                </div>
                
                <div class="sm:hidden">
                    <div class="post-title-row flex justify-between items-center mb-2">
                        <div class="post-title flex-1" onclick="window.togglePostContent('${postId}')">${post.title}</div>
                    </div>
                    <div class="post-meta-row flex justify-between items-center text-xs text-gray-500 pt-1 border-t border-gray-100">
                        <span class="post-nickname">${post.nickname}</span>
                        <span>${displayTime}</span>
                    </div>
                </div>
            </div>
            <div id="content-${postId}" class="post-content">
                <div class="p-3 bg-gray-50 rounded text-sm text-gray-700">
                    <p class="whitespace-pre-wrap">${post.content || (lang === 'ko' ? '내용이 없습니다.' : 'No content available.')}</p>
                    <div class="post-actions sm:hidden mt-3 flex justify-end gap-2">
                        <button onclick="window.showEditForm('${postId}', '${post.title.replace(/'/g, "\\'")}', '${(post.content || '').replace(/'/g, "\\'")}')" 
                                class="btn-small btn-edit">${translations.lounge_edit_btn}</button>
                        <button onclick="window.deletePost('${postId}')" 
                                class="btn-small btn-delete">${translations.lounge_delete_btn}</button>
                    </div>
                </div>
            </div>
        `;
        
        elements.postList.appendChild(postElement);
    }

    /**
     * 게시글 내용 토글
     */
    togglePostContent(postId) {
        const contentElement = document.getElementById(`content-${postId}`);
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        
        if (contentElement) {
            contentElement.classList.toggle('expanded');
            
            if (postElement) {
                if (contentElement.classList.contains('expanded')) {
                    postElement.classList.add('content-expanded');
                } else {
                    postElement.classList.remove('content-expanded');
                }
            }
        }
    }

    /**
     * 수정 폼 표시
     */
    showEditForm(postId, title, content) {
        const elements = this.getElements();
        
        this.currentEditingPostId = postId;
        
        elements.editTitle.value = title;
        elements.editContentField.value = content;
        elements.editPassword.value = '';
        
        elements.postFormContainer.classList.add('hidden');
        elements.newPostBtn.classList.remove('hidden');
        elements.editFormContainer.classList.remove('hidden');
    }

    /**
     * 🔐 게시글 삭제 - 해싱된 비밀번호 확인
     */
    async deletePost(postId) {
        const { db } = this.getFirebaseRefs();
        const lang = window.PainoriI18n.currentLang;
        
        const confirmMessage = lang === 'ko' ? 
            '정말로 이 게시글을 삭제하시겠습니까?' : 
            'Are you sure you want to delete this post?';
        
        if (!confirm(confirmMessage)) return;
        
        const password = prompt(lang === 'ko' ? '비밀번호를 입력하세요:' : 'Enter password:');
        if (!password) return;
        
        try {
            const hashedPassword = await this.hashPassword(password);
            const doc = await db.collection("posts").doc(postId).get();
            
            if (doc.exists && doc.data().password === hashedPassword) {
                await db.collection("posts").doc(postId).delete();
                console.log('✅ 게시글 삭제 성공');
                
                this.loadedPostIds.delete(postId);
                this.renderPosts(lang, true);
                
                const successMessage = lang === 'ko' ? '게시글이 삭제되었습니다.' : 'Post deleted successfully.';
                alert(successMessage);
            } else {
                const errorMessage = lang === 'ko' ? '비밀번호가 틀렸습니다.' : 'Incorrect password.';
                alert(errorMessage);
            }
        } catch (error) {
            console.error('❌ 게시글 삭제 에러:', error);
            const errorMessage = lang === 'ko' ? '삭제에 실패했습니다.' : 'Failed to delete post.';
            alert(errorMessage);
        }
    }

    /**
     * 🔐 새 게시글 작성 - 비밀번호 해싱 적용
     */
    async submitPost() {
        const elements = this.getElements();
        const { db, firestore } = this.getFirebaseRefs();
        
        const nickname = elements.postNickname.value.trim();
        const password = elements.postPassword.value.trim();
        const title = elements.postTitle.value.trim();
        const content = elements.postContent.value.trim();

        if (!nickname || !password || !title || !content) {
            alert('Please fill in all fields. / 모든 항목을 입력해주세요.');
            return;
        }
        
        console.log('📝 새 게시글 작성 시작');
        
        try {
            const hashedPassword = await this.hashPassword(password);
            
            const newPost = {
                nickname,
                password: hashedPassword,
                title,
                content,
                createdAt: firestore.FieldValue.serverTimestamp(),
                date: new Date().toISOString().split('T')[0],
                authorTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            };
            
            await db.collection("posts").add(newPost);
            console.log('✅ 게시글 저장 성공');
            
            this.renderPosts(window.PainoriI18n.currentLang, true);
            elements.postFormContainer.classList.add('hidden');
            elements.newPostBtn.classList.remove('hidden');
            this.clearForm();
            
        } catch (error) {
            console.error("❌ 게시글 저장 에러:", error);
            alert("Failed to post. Please try again. / 글을 등록하는데 실패했습니다.");
        }
    }

    /**
     * 🔐 게시글 수정 - 해싱된 비밀번호 확인
     */
    async saveEdit() {
        const elements = this.getElements();
        const { db, firestore } = this.getFirebaseRefs();
        
        if (!this.currentEditingPostId) return;
        
        const password = elements.editPassword.value.trim();
        const title = elements.editTitle.value.trim();
        const content = elements.editContentField.value.trim();
        
        if (!password || !title || !content) {
            alert('Please fill in all fields. / 모든 항목을 입력해주세요.');
            return;
        }
        
        try {
            const hashedPassword = await this.hashPassword(password);
            const doc = await db.collection("posts").doc(this.currentEditingPostId).get();
            
            if (doc.exists && doc.data().password === hashedPassword) {
                await db.collection("posts").doc(this.currentEditingPostId).update({
                    title: title,
                    content: content,
                    updatedAt: firestore.FieldValue.serverTimestamp()
                });
                
                console.log('✅ 게시글 수정 성공');
                this.renderPosts(window.PainoriI18n.currentLang, true);
                elements.editFormContainer.classList.add('hidden');
                this.currentEditingPostId = null;
                this.clearEditForm();
                
                const lang = window.PainoriI18n.currentLang;
                const successMessage = lang === 'ko' ? '게시글이 수정되었습니다.' : 'Post updated successfully.';
                alert(successMessage);
            } else {
                const lang = window.PainoriI18n.currentLang;
                const errorMessage = lang === 'ko' ? '비밀번호가 틀렸습니다.' : 'Incorrect password.';
                alert(errorMessage);
            }
        } catch (error) {
            console.error('❌ 게시글 수정 에러:', error);
            const lang = window.PainoriI18n.currentLang;
            const errorMessage = lang === 'ko' ? '수정에 실패했습니다.' : 'Failed to update post.';
            alert(errorMessage);
        }
    }

    /**
     * 폼 초기화
     */
    clearForm() {
        const elements = this.getElements();
        elements.postNickname.value = '';
        elements.postPassword.value = '';
        elements.postTitle.value = '';
        elements.postContent.value = '';
    }

    /**
     * 수정 폼 초기화
     */
    clearEditForm() {
        const elements = this.getElements();
        elements.editPassword.value = '';
        elements.editTitle.value = '';
        elements.editContentField.value = '';
    }

    /**
     * 이벤트 초기화
     */
    initEvents() {
        const elements = this.getElements();
        
        // 새 글쓰기 버튼
        elements.newPostBtn.addEventListener('click', () => {
            elements.postFormContainer.classList.remove('hidden');
            elements.editFormContainer.classList.add('hidden');
            elements.newPostBtn.classList.add('hidden');
        });

        // 취소 버튼들
        elements.cancelPostBtn.addEventListener('click', () => {
            elements.postFormContainer.classList.add('hidden');
            elements.newPostBtn.classList.remove('hidden');
            this.clearForm();
        });
        
        elements.cancelEditBtn.addEventListener('click', () => {
            elements.editFormContainer.classList.add('hidden');
            this.currentEditingPostId = null;
            this.clearEditForm();
        });
        
        // 제출 버튼들
        elements.submitPostBtn.addEventListener('click', () => this.submitPost());
        elements.saveEditBtn.addEventListener('click', () => this.saveEdit());
        
        // 더보기 버튼
        if (elements.loadMoreBtn) {
            elements.loadMoreBtn.addEventListener('click', () => {
                if (!this.isLoadingPosts && this.hasMorePosts) {
                    this.renderPosts(window.PainoriI18n.currentLang, false);
                }
            });
        }
        
        // 새 글 알림 클릭 이벤트
        if (elements.newPostNotification) {
            elements.newPostNotification.addEventListener('click', () => {
                this.lastVisiblePost = null;
                this.hasMorePosts = true;
                this.loadedPostIds.clear();
                this.renderPosts(window.PainoriI18n.currentLang, true);
                elements.newPostNotification.classList.add('hidden');
            });
        }
        
        console.log('🎮 게시판 이벤트 초기화 완료');
    }

    /**
     * 언어 변경 이벤트 처리
     */
    handleLanguageChange() {
        window.addEventListener('languageChanged', (event) => {
            const lang = event.detail.language;
            console.log('🌐 언어 변경 감지, 게시판 다시 렌더링');
            this.setupPostsListener(lang);
            this.renderPosts(lang, true);
        });
    }

    /**
     * Board Manager 초기화
     */
    async init() {
        try {
            console.log('🚀 Board Manager 초기화 시작');
            
            this.isPageLoaded = false;
            
            // 이벤트 초기화
            this.initEvents();
            
            // 언어 변경 이벤트 처리
            this.handleLanguageChange();
            
            // 실시간 리스너 설정
            this.setupPostsListener(window.PainoriI18n.currentLang);
            
            // 게시글 로딩
            await this.renderPosts(window.PainoriI18n.currentLang, true);
            
            console.log('✅ Board Manager 초기화 완료');
            
        } catch (error) {
            console.error('❌ Board Manager 초기화 실패:', error);
        }
    }

    /**
     * 정리 함수
     */
    cleanup() {
        if (this.postsListener) {
            this.postsListener();
        }
    }
}

// 전역 Board Manager 인스턴스 생성
window.PainoriBoard = new BoardManager();

// 전역 함수로 노출
window.togglePostContent = (postId) => window.PainoriBoard.togglePostContent(postId);
window.showEditForm = (postId, title, content) => window.PainoriBoard.showEditForm(postId, title, content);
window.deletePost = (postId) => window.PainoriBoard.deletePost(postId);

// 초기화 타이밍 - 600ms
// I18n 초기화 완료 후 시작
window.addEventListener('i18nInitialized', () => {
    console.log('📝 I18n 완료 신호 받음, Board Manager 시작');
    window.PainoriBoard.init();
});
// 페이지 언로드 시 정리
window.addEventListener('beforeunload', () => {
    window.PainoriBoard.cleanup();
});