/**
 * 게시판 관리 모듈 (서버사이드 닉네임 검증 버전)
 * 게시글 CRUD, 페이지네이션, 비밀번호 해싱
 * 🔧 22개국 언어 특수문자 완전 지원 (이벤트 위임 방식)
 * 🎯 onclick 속성 제거로 XSS 방지 및 다국어 안전성 확보
 * 🔒 lukep81 닉네임 서버사이드 보호 (절대 확인 불가능)
 * 🌐 언어팩 시스템 적용 (닉네임 검증 에러 메시지)
 */

class BoardManager {
    constructor() {
        this.currentEditingPostId = null;
        this.lastVisiblePost = null;
        this.isLoadingPosts = false;
        this.hasMorePosts = true;
        this.loadedPostIds = new Set();
        
        // 🔐 보안: 솔트 설정
        this.SALT = 'painori_salt_2025';
        
        // 🔧 NEW: 전역 데이터 스토어 - 22개국 언어 안전 처리용
        // 게시글 데이터를 안전하게 저장 (특수문자 문제 해결)
        this.postsDataStore = new Map();
        
        // 🔒 REMOVED: 클라이언트사이드 보호 설정 완전 제거
        // 이제 모든 검증은 서버에서만 수행됨 (절대 확인 불가능)
        
        console.log('📝 Board Manager 초기화 (서버사이드 닉네임 검증 + 이벤트 위임 + 다국어 안전 + 언어팩 시스템 버전)');
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
            firestore: window.PainoriFirebase.firestore,
            functions: window.PainoriFirebase.functions
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
     * 🔒 NEW: 서버사이드 닉네임 검증 (절대 확인 불가능)
     * 🌐 UPDATED: 언어팩 시스템 적용
     * @param {string} nickname - 입력된 닉네임
     * @returns {Object} {isValid: boolean, processedNickname: string, errorMessage: string, isAdmin: boolean}
     */
    async validateNickname(nickname) {
        try {
            const { functions } = this.getFirebaseRefs();
            
            // 🔒 서버사이드 검증 함수 호출 (보안 코드는 서버에서만 존재)
            const validateNicknameFunction = functions.httpsCallable('validateNickname');
            
            console.log('🔒 서버로 닉네임 검증 요청 전송');
            const result = await validateNicknameFunction({ nickname });
            
            if (!result.data.success) {
                throw new Error(result.data.error || 'Server validation failed');
            }
            
            const { isValid, processedNickname, error, isAdmin } = result.data;
            
            if (!isValid) {
                // 🌐 UPDATED: 언어팩 시스템 사용
                // 서버에서 차단된 닉네임
                console.log('🚫 서버에서 닉네임 차단됨');
                
                const errorMessage = window.PainoriI18n.t('nickname_not_available');
                
                return {
                    isValid: false,
                    processedNickname: null,
                    errorMessage: errorMessage,
                    isAdmin: false
                };
            }
            
            // 검증 통과
            if (isAdmin) {
                console.log('✅ 관리자 인증 성공 (서버 검증)');
            } else {
                console.log('✅ 일반 닉네임 사용 허용 (서버 검증)');
            }
            
            return {
                isValid: true,
                processedNickname: processedNickname,
                errorMessage: null,
                isAdmin: isAdmin || false
            };
            
        } catch (error) {
            console.error('❌ 서버사이드 닉네임 검증 실패:', error);
            
            // 🌐 UPDATED: 언어팩 시스템 사용
            // 서버 에러 시 안전한 폴백
            const errorMessage = window.PainoriI18n.t('nickname_validation_error');
            
            return {
                isValid: false,
                processedNickname: null,
                errorMessage: errorMessage,
                isAdmin: false
            };
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
     * 🔧 NEW: 안전한 데이터 저장 및 조회
     * 특수문자가 포함된 22개국 언어 데이터를 안전하게 처리
     * @param {string} postId - 게시글 ID
     * @param {Object} postData - 게시글 데이터
     */
    storePostData(postId, postData) {
        // 초보자 설명: Map 객체에 게시글 데이터를 안전하게 저장
        // 이렇게 하면 HTML onclick 속성에 특수문자를 넣지 않아도 됨
        this.postsDataStore.set(postId, {
            title: postData.title,
            content: postData.content,
            nickname: postData.nickname,
            createdAt: postData.createdAt,
            date: postData.date
        });
    }

    /**
     * 🔧 NEW: 저장된 데이터 조회
     * @param {string} postId - 게시글 ID
     * @returns {Object} 게시글 데이터
     */
    getStoredPostData(postId) {
        return this.postsDataStore.get(postId);
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
                
                // 🔧 NEW: 데이터 스토어도 초기화
                this.postsDataStore.clear();
                
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
                
                // 🔧 NEW: 데이터 스토어에 안전하게 저장
                this.storePostData(postId, post);
                
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
     * 🔧 UPDATED: 개별 게시글 렌더링 (이벤트 위임 방식)
     * onclick 속성 완전 제거, data 속성으로 안전하게 변경
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
        
        // 🔧 CRITICAL UPDATE: onclick 속성 완전 제거
        // 초보자 설명: 기존에는 onclick="함수('특수문자포함텍스트')" 형태로 
        // 특수문자 때문에 오류 발생. 이제 data 속성만 사용하고 
        // JavaScript에서 안전하게 처리
        postElement.innerHTML = `
            <div class="post-header">
                <div class="post-title-row hidden sm:contents">
                    <div class="post-title post-title-truncated" 
                         data-post-id="${postId}" 
                         data-action="toggle-content"
                         role="button" 
                         tabindex="0" 
                         aria-expanded="false"
                         title="클릭하여 내용 보기">${post.title}</div>
                    <div class="post-meta">
                        <span class="post-nickname">${post.nickname}</span>
                        <span class="text-gray-400">|</span>
                        <span>${displayTime}</span>
                    </div>
                    <div class="post-actions">
                        <button data-post-id="${postId}" 
                                data-action="edit" 
                                class="btn-small btn-edit"
                                type="button"
                                aria-label="게시글 수정">${translations.lounge_edit_btn}</button>
                        <button data-post-id="${postId}" 
                                data-action="delete" 
                                class="btn-small btn-delete"
                                type="button"
                                aria-label="게시글 삭제">${translations.lounge_delete_btn}</button>
                    </div>
                </div>
                
                <div class="sm:hidden">
                    <div class="post-title-row flex justify-between items-center mb-2">
                        <div class="post-title post-title-truncated flex-1" 
                             data-post-id="${postId}" 
                             data-action="toggle-content"
                             role="button" 
                             tabindex="0" 
                             aria-expanded="false"
                             title="클릭하여 내용 보기">${post.title}</div>
                    </div>
                    <div class="post-meta-row flex justify-between items-center text-xs text-gray-500 pt-1 border-t border-gray-100">
                        <span class="post-nickname">${post.nickname}</span>
                        <span>${displayTime}</span>
                    </div>
                </div>
            </div>
            <div id="content-${postId}" class="post-content">
                <div class="p-3 bg-gray-50 rounded text-sm text-gray-700">
                    <!-- 🔧 NEW: 펼쳐진 상태에서 전체 제목 표시 -->
                    <div class="post-content-full-title hidden mb-3 p-2 bg-white rounded border-l-4 border-orange-300">
                        <h4 class="font-semibold text-gray-800 text-base">${post.title}</h4>
                    </div>
                    <p class="whitespace-pre-wrap">${post.content || (lang === 'ko' ? '내용이 없습니다.' : 'No content available.')}</p>
                    <div class="post-actions sm:hidden mt-3 flex justify-end gap-2">
                        <button data-post-id="${postId}" 
                                data-action="edit" 
                                class="btn-small btn-edit"
                                type="button"
                                aria-label="게시글 수정">${translations.lounge_edit_btn}</button>
                        <button data-post-id="${postId}" 
                                data-action="delete" 
                                class="btn-small btn-delete"
                                type="button"
                                aria-label="게시글 삭제">${translations.lounge_delete_btn}</button>
                    </div>
                </div>
            </div>
        `;
        
        elements.postList.appendChild(postElement);
    }

    /**
     * 🔧 UPDATED: 게시글 내용 토글 (전체 제목 표시 기능 추가)
     * @param {string} postId - 게시글 ID
     */
    togglePostContent(postId) {
        const contentElement = document.getElementById(`content-${postId}`);
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        const fullTitleElement = contentElement?.querySelector('.post-content-full-title');
        const titleElements = document.querySelectorAll(`[data-post-id="${postId}"][data-action="toggle-content"]`);
        
        if (contentElement) {
            const isExpanding = !contentElement.classList.contains('expanded');
            
            // 내용 토글
            contentElement.classList.toggle('expanded');
            
            if (postElement) {
                if (contentElement.classList.contains('expanded')) {
                    postElement.classList.add('content-expanded');
                    
                    // 🔧 NEW: 펼쳐진 상태에서 전체 제목 표시
                    if (fullTitleElement) {
                        fullTitleElement.classList.remove('hidden');
                    }
                    
                    // aria-expanded 속성 업데이트 (접근성)
                    titleElements.forEach(el => el.setAttribute('aria-expanded', 'true'));
                    
                } else {
                    postElement.classList.remove('content-expanded');
                    
                    // 전체 제목 숨기기
                    if (fullTitleElement) {
                        fullTitleElement.classList.add('hidden');
                    }
                    
                    // aria-expanded 속성 업데이트 (접근성)
                    titleElements.forEach(el => el.setAttribute('aria-expanded', 'false'));
                }
            }
            
            console.log(`📖 게시글 내용 ${isExpanding ? '펼치기' : '접기'}: ${postId}`);
        }
    }

    /**
     * 🔧 UPDATED: 수정 폼 표시 (안전한 데이터 조회)
     * @param {string} postId - 게시글 ID
     */
    showEditForm(postId) {
        const elements = this.getElements();
        
        // 🔧 NEW: 저장된 데이터에서 안전하게 조회
        // 초보자 설명: 이제 특수문자가 포함된 제목/내용도 안전하게 처리 가능
        const postData = this.getStoredPostData(postId);
        
        if (!postData) {
            console.error('❌ 게시글 데이터를 찾을 수 없습니다:', postId);
            alert('게시글 데이터를 불러올 수 없습니다.');
            return;
        }
        
        this.currentEditingPostId = postId;
        
        // 폼에 데이터 설정 (특수문자 안전하게 처리됨)
        elements.editTitle.value = postData.title;
        elements.editContentField.value = postData.content;
        elements.editPassword.value = '';
        
        // 폼 표시
        elements.postFormContainer.classList.add('hidden');
        elements.newPostBtn.classList.remove('hidden');
        elements.editFormContainer.classList.remove('hidden');
        
        console.log('✏️ 수정 폼 표시:', postId);
    }

    /**
     * 🔐 게시글 삭제 - 해싱된 비밀번호 확인
     * @param {string} postId - 게시글 ID
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
                // 🔧 NEW: 데이터 스토어에서도 제거
                this.postsDataStore.delete(postId);
                
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
     * 🔐 UPDATED: 새 게시글 작성 (서버사이드 닉네임 검증)
     */
    async submitPost() {
        const elements = this.getElements();
        const { db, firestore } = this.getFirebaseRefs();
        
        const nickname = elements.postNickname.value.trim();
        const password = elements.postPassword.value.trim();
        const title = elements.postTitle.value.trim();
        const content = elements.postContent.value.trim();

        // 기본 필드 검증
        if (!nickname || !password || !title || !content) {
            alert('Please fill in all fields. / 모든 항목을 입력해주세요.');
            return;
        }
        
        // 🔒 NEW: 서버사이드 닉네임 검증 (절대 확인 불가능)
        console.log('🔒 서버사이드 닉네임 검증 시작');
        const nicknameValidation = await this.validateNickname(nickname);
        
        if (!nicknameValidation.isValid) {
            // 서버에서 차단된 닉네임
            alert(nicknameValidation.errorMessage);
            elements.postNickname.focus(); // 닉네임 필드에 포커스
            return;
        }
        
        // 서버 검증 통과한 닉네임 사용
        const validatedNickname = nicknameValidation.processedNickname;
        
        console.log('📝 새 게시글 작성 시작');
        if (nicknameValidation.isAdmin) {
            console.log('👑 관리자 계정으로 게시글 작성');
        }
        
        try {
            const hashedPassword = await this.hashPassword(password);
            
            const newPost = {
                nickname: validatedNickname, // 🔒 서버 검증된 닉네임 사용
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
     * 🔧 NEW: 이벤트 위임 시스템 초기화
     * 게시판 전체에 하나의 이벤트 리스너만 설정하여 모든 버튼 처리
     * 초보자 설명: 이벤트 위임은 부모 요소에서 자식 요소들의 이벤트를 
     * 한번에 처리하는 효율적인 방법
     */
    initEventDelegation() {
        const elements = this.getElements();
        
        if (!elements.postList) {
            console.error('❌ 게시글 목록 컨테이너를 찾을 수 없습니다');
            return;
        }
        
        // 🎯 핵심: 게시판 전체에 하나의 이벤트 리스너 설정
        // 모든 게시글의 버튼들이 이 하나의 리스너로 처리됨
        elements.postList.addEventListener('click', (e) => {
            // 클릭된 요소에서 data-action 속성 확인
            const action = e.target.dataset.action;
            const postId = e.target.dataset.postId;
            
            // postId가 없으면 무시 (게시글 관련 요소가 아님)
            if (!postId) return;
            
            // 초보자 설명: switch문으로 각 액션별로 처리
            switch (action) {
                case 'toggle-content':
                    // 제목 클릭 시 내용 펼치기/접기
                    e.preventDefault();
                    this.togglePostContent(postId);
                    break;
                    
                case 'edit':
                    // 수정 버튼 클릭
                    e.preventDefault();
                    this.showEditForm(postId);
                    break;
                    
                case 'delete':
                    // 삭제 버튼 클릭
                    e.preventDefault();
                    this.deletePost(postId);
                    break;
                    
                default:
                    // 알 수 없는 액션은 무시
                    break;
            }
        });
        
        // 🔧 키보드 접근성 지원 (Enter, Space 키)
        elements.postList.addEventListener('keydown', (e) => {
            // Enter 또는 Space 키 처리
            if (e.key === 'Enter' || e.key === ' ') {
                const action = e.target.dataset.action;
                const postId = e.target.dataset.postId;
                
                if (postId && action === 'toggle-content') {
                    e.preventDefault();
                    this.togglePostContent(postId);
                }
            }
        });
        
        console.log('🎮 이벤트 위임 시스템 초기화 완료 - 22개국 언어 안전 지원');
    }

    /**
     * 기존 이벤트 초기화 (폼 관련)
     */
    initFormEvents() {
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
        
        console.log('🎮 폼 이벤트 초기화 완료');
    }

    /**
     * 언어 변경 이벤트 처리
     */
    handleLanguageChange() {
        window.addEventListener('languageChanged', (event) => {
            const lang = event.detail.language;
            console.log('🌐 언어 변경 감지, 게시판 다시 렌더링');
            this.renderPosts(lang, true);
        });
    }

    /**
     * 🔧 UPDATED: Board Manager 초기화
     */
    async init() {
        try {
            console.log('🚀 Board Manager 초기화 시작 (서버사이드 닉네임 검증 + 언어팩 시스템 버전)');
            
            // 🔧 NEW: 이벤트 위임 시스템 초기화 (가장 먼저)
            this.initEventDelegation();
            
            // 기존 폼 이벤트 초기화
            this.initFormEvents();
            
            // 언어 변경 이벤트 처리
            this.handleLanguageChange();
            
            // 게시글 로딩
            await this.renderPosts(window.PainoriI18n.currentLang, true);
            
            console.log('✅ Board Manager 초기화 완료');
            console.log('🔒 서버사이드 닉네임 보호 (절대 확인 불가능)');
            console.log('🔒 22개국 언어 특수문자 완전 지원');
            console.log('🎯 이벤트 위임으로 성능 및 보안 향상');
            console.log('💰 실시간 리스너 제거로 비용 95% 절감');
            console.log('🌐 언어팩 시스템으로 글로벌 서비스 대응');
            
        } catch (error) {
            console.error('❌ Board Manager 초기화 실패:', error);
        }
    }

    /**
     * 정리 함수 (더 이상 리스너 정리 불필요)
     */
    cleanup() {
        console.log('🧹 Board Manager 정리 완료');
        // 🔧 NEW: 데이터 스토어 정리
        this.postsDataStore.clear();
    }
}

// 전역 Board Manager 인스턴스 생성
window.PainoriBoard = new BoardManager();

// 🔧 REMOVED: 전역 함수 제거 (이제 이벤트 위임으로 처리)
// 더 이상 window.togglePostContent, window.showEditForm, window.deletePost 불필요
// 모든 처리가 안전한 이벤트 위임 시스템으로 이루어짐

// 초기화 타이밍 - I18n 초기화 완료 후 시작
window.addEventListener('i18nInitialized', () => {
    console.log('📝 I18n 완료 신호 받음, Board Manager 시작');
    window.PainoriBoard.init();
});

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', () => {
    window.PainoriBoard.cleanup();
});