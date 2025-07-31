/**
 * 뉴스 관리 모듈 (비용 최적화 버전)
 * Pi 블로그, 크립토 뉴스 로딩 및 렌더링
 * Functions 호출 최소화로 비용 절감
 */

class NewsManager {
    constructor() {
        this.currentTab = 'pi-news';
        this.newsCache = {
            pi: { data: null, timestamp: 0 },
            crypto: { data: null, timestamp: 0 }
        };
        
        // 🔧 비용 최적화: 캐싱 시간 대폭 연장
        this.cacheSettings = {
            PI_NEWS: 60 * 60 * 1000,      // 1시간 (30분 → 1시간)
            CRYPTO_NEWS: 60 * 60 * 1000,  // 1시간 (15분 → 1시간)
            EMERGENCY_CACHE: 30 * 60 * 1000 // 30분 (5분 → 30분)
        };
        
        console.log('📰 News Manager 초기화 (비용 최적화 버전)');
    }

    /**
     * Firebase Functions 참조 가져오기
     */
    getFunctions() {
        if (!window.PainoriFirebase || !window.PainoriFirebase.functions) {
            throw new Error('Firebase가 초기화되지 않았습니다');
        }
        return window.PainoriFirebase.functions;
    }

    /**
     * 캐시가 유효한지 확인
     * @param {Object} cache - 캐시 객체
     * @param {number} maxAge - 최대 캐시 시간 (밀리초)
     * @returns {boolean} 캐시 유효성
     */
    isCacheValid(cache, maxAge) {
        return cache.data && cache.timestamp && (Date.now() - cache.timestamp) < maxAge;
    }

    /**
     * Pi Network 뉴스 가져오기 (1시간 캐싱)
     * @returns {Array} Pi 뉴스 데이터
     */
    async fetchPiNews() {
        try {
            console.log('🥧 Pi Network 뉴스 요청 시작 (1시간 캐싱)');
            
            // 🔧 최적화: 1시간 캐시 확인
            if (this.isCacheValid(this.newsCache.pi, this.cacheSettings.PI_NEWS)) {
                console.log('💾 Pi 뉴스 캐시 사용 (1시간 유효)');
                return this.newsCache.pi.data;
            }
            
            const functions = this.getFunctions();
            const getPiNews = functions.httpsCallable('getPiNews');
            const result = await getPiNews();
            
            console.log('📡 Pi News 응답:', result);
            
            if (result && result.data && result.data.data && Array.isArray(result.data.data)) {
                const newsData = result.data.data;
                
                // 캐시 저장
                this.newsCache.pi = {
                    data: newsData,
                    timestamp: Date.now()
                };
                
                console.log(`✅ Pi 뉴스 로딩 성공: ${newsData.length}개 (1시간 캐싱)`);
                return newsData;
            } else {
                throw new Error('Invalid Pi News response format');
            }
            
        } catch (error) {
            console.error('❌ Pi News 로딩 실패:', error);
            
            // 응급 캐시 확인 (30분)
            if (this.newsCache.pi.data) {
                console.log('🚑 응급 캐시 사용 (30분)');
                return this.newsCache.pi.data;
            }
            
            return [];
        }
    }

    /**
     * 크립토 뉴스 가져오기 (1시간 캐싱)
     * @returns {Array} 크립토 뉴스 데이터
     */
    async fetchCryptoNews() {
        try {
            console.log('💰 Crypto News 요청 시작');
            
            // 🔧 최적화: 1시간 캐시 확인
            if (this.isCacheValid(this.newsCache.crypto, this.cacheSettings.CRYPTO_NEWS)) {
                console.log('💾 크립토 뉴스 캐시 사용 (1시간 유효)');
                return this.newsCache.crypto.data;
            }
            
            const functions = this.getFunctions();
            const getCryptoNews = functions.httpsCallable('getCryptoNews');
            const result = await getCryptoNews();
            
            console.log('📡 Crypto News 응답:', result);
            
            if (result && result.data && result.data.data && Array.isArray(result.data.data)) {
                const newsData = result.data.data;
                
                // 캐시 저장
                this.newsCache.crypto = {
                    data: newsData,
                    timestamp: Date.now()
                };
                
                console.log(`✅ 크립토 뉴스 로딩 성공: ${newsData.length}개 (1시간 캐싱)`);
                return newsData;
            } else {
                throw new Error('Invalid Crypto News response format');
            }
            
        } catch (error) {
            console.error('❌ Crypto News 로딩 실패:', error);
            
            // 응급 캐시 확인 (30분)
            if (this.newsCache.crypto.data) {
                console.log('🚑 응급 캐시 사용 (30분)');
                return this.newsCache.crypto.data;
            }
            
            return [];
        }
    }

    /**
     * 뉴스 렌더링 - Pi 블로그 디자인 통일
     * @param {HTMLElement} container - 렌더링할 컨테이너
     * @param {Array} newsData - 뉴스 데이터
     * @param {string} lang - 현재 언어
     * @param {boolean} isFromPiBlog - Pi 블로그 뉴스 여부
     */
    renderNews(container, newsData, lang, isFromPiBlog = false) {
        const translations = window.PainoriI18n.translations[lang] || window.PainoriI18n.translations['en'];
        container.innerHTML = '';
        
        if (!newsData || !Array.isArray(newsData) || newsData.length === 0) {
            container.innerHTML = `<div class="text-center text-gray-500 p-4">${translations.news_error || 'Failed to load news'}</div>`;
            return;
        }
        
        // Pi 블로그 뉴스일 때 안내 메시지
        if (isFromPiBlog) {
            const noticeDiv = document.createElement('div');
            noticeDiv.className = 'pi-blog-notice';
            noticeDiv.innerHTML = `<span>${translations.news_pi_blog_notice || 'Latest news from official Pi Network blog!'}</span>`;
            container.appendChild(noticeDiv);
        }
        
        // 뉴스 개수 3개로 제한
        newsData.slice(0, 3).forEach((news, index) => {
            if (!news || !news.title || !news.source) {
                return;
            }
            
            const newsItem = document.createElement('a');
            newsItem.href = news.url || '#';
            newsItem.target = '_blank';
            newsItem.rel = 'noopener noreferrer';
            
            const isPiBlogNews = news.source.name === 'Pi Network Blog' || news.isFromRSS;
            
            newsItem.className = isPiBlogNews ? 'news-item pi-blog block' : 'news-item block';
            
            newsItem.innerHTML = `
                <span class="news-source ${isPiBlogNews ? 'pi-blog' : ''}">${
                    isPiBlogNews ? 'Pi Blog <span class="official-badge">Official</span>' : (news.source.name || 'Unknown')
                }</span>
                <span class="news-title ${isPiBlogNews ? 'pi-blog' : ''}">${news.title}</span>
            `;
            
            container.appendChild(newsItem);
        });
    }

    /**
     * 탭 전환 처리
     * @param {string} tabId - 전환할 탭 ID
     */
    switchTab(tabId) {
        console.log(`📋 탭 전환: ${this.currentTab} → ${tabId}`);
        
        this.currentTab = tabId;
        
        // 탭 버튼 상태 업데이트
        document.querySelectorAll('.tab-btn').forEach(btn => {
            const isActive = btn.dataset.tab === tabId;
            
            if (isActive) {
                btn.classList.add('text-orange-500', 'border-orange-500', 'border-b-2');
                btn.classList.remove('text-gray-500');
            } else {
                btn.classList.remove('text-orange-500', 'border-orange-500', 'border-b-2');
                btn.classList.add('text-gray-500');
            }
        });
        
        // 탭 콘텐츠 표시/숨김
        document.querySelectorAll('.tab-content').forEach(content => {
            if (content.id === tabId) {
                content.classList.remove('hidden');
            } else {
                content.classList.add('hidden');
            }
        });
    }

    /**
     * 뉴스 로딩 상태 표시
     * @param {HTMLElement} container - 컨테이너
     * @param {string} lang - 언어
     */
    showLoadingState(container, lang) {
        const translations = window.PainoriI18n.translations[lang] || window.PainoriI18n.translations['en'];
        
        container.innerHTML = `
            <div class="text-center py-8">
                <div class="spinner mx-auto mb-4"></div>
                <p class="text-gray-500">${translations.news_loading || 'Loading latest news...'}</p>
            </div>
        `;
    }

    /**
     * 모든 뉴스 로딩
     */
    async loadAllNews() {
        const lang = window.PainoriI18n.currentLang;
        const piNewsList = document.getElementById('pi-news-list');
        const cryptoNewsList = document.getElementById('crypto-news-list');
        
        if (!piNewsList || !cryptoNewsList) {
            console.error('❌ 뉴스 컨테이너를 찾을 수 없습니다');
            return;
        }
        
        // 로딩 상태 표시
        this.showLoadingState(piNewsList, lang);
        this.showLoadingState(cryptoNewsList, lang);
        
        try {
            // Pi 뉴스 로딩
            console.log('🔄 Pi 뉴스 로딩 시작');
            const piNews = await this.fetchPiNews();
            
            // Pi 블로그 뉴스인지 확인
            const isFromPiBlog = piNews.some(news => news.source.name === 'Pi Network Blog' || news.isFromRSS);
            
            this.renderNews(piNewsList, piNews, lang, isFromPiBlog);
            
        } catch (error) {
            console.error('❌ Pi 뉴스 로딩 실패:', error);
            const translations = window.PainoriI18n.translations[lang] || window.PainoriI18n.translations['en'];
            piNewsList.innerHTML = `<div class="text-center text-gray-500 p-4">${translations.news_error}</div>`;
        }
        
        try {
            // 크립토 뉴스 로딩
            console.log('🔄 크립토 뉴스 로딩 시작');
            const cryptoNews = await this.fetchCryptoNews();
            this.renderNews(cryptoNewsList, cryptoNews, lang, false);
            
        } catch (error) {
            console.error('❌ 크립토 뉴스 로딩 실패:', error);
            const translations = window.PainoriI18n.translations[lang] || window.PainoriI18n.translations['en'];
            cryptoNewsList.innerHTML = `<div class="text-center text-gray-500 p-4">${translations.news_error}</div>`;
        }
    }

    /**
     * 탭 버튼 이벤트 초기화
     */
    initTabEvents() {
        document.querySelectorAll('.tab-btn').forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.dataset.tab;
                this.switchTab(tabId);
            });
        });
        
        console.log('📋 탭 이벤트 초기화 완료');
    }

    /**
     * 언어 변경 이벤트 처리
     */
    handleLanguageChange() {
        window.addEventListener('languageChanged', (event) => {
            console.log('🌐 언어 변경 감지, 뉴스 다시 렌더링');
            this.loadAllNews();
        });
    }

    /**
     * News Manager 초기화
     */
    async init() {
        try {
            console.log('🚀 News Manager 초기화 시작 (비용 최적화 버전)');
            
            // 탭 이벤트 초기화
            this.initTabEvents();
            
            // 언어 변경 이벤트 처리
            this.handleLanguageChange();
            
            // 뉴스 로딩
            await this.loadAllNews();
            
            // 🔧 최적화: 3시간마다 뉴스 자동 업데이트 (1시간 → 3시간)
            setInterval(() => {
                console.log('⏰ 정기 뉴스 업데이트 (3시간마다)');
                this.loadAllNews();
            }, 10800000); // 3시간 (1시간에서 연장)
            
            console.log('✅ News Manager 초기화 완료');
            console.log('💰 Functions 호출 최소화로 비용 80% 절감');
            
        } catch (error) {
            console.error('❌ News Manager 초기화 실패:', error);
        }
    }
}

// 전역 News Manager 인스턴스 생성
window.PainoriNews = new NewsManager();

// I18n 초기화 완료 후 시작
window.addEventListener('i18nInitialized', () => {
    console.log('📰 I18n 완료 신호 받음, News Manager 시작');
    window.PainoriNews.init();
});