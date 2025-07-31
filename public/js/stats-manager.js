/**
 * 통계 관리 모듈
 * 테스트넷 클릭 통계 (방문자 통계는 Google Analytics 사용)
 */

class StatsManager {
    constructor() {
        this.isInitialized = false;
        
        console.log('📊 Stats Manager 초기화 (Google Analytics 통합)');
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
     * 간단한 사용자 식별자 생성 (테스트넷 클릭 중복 방지용)
     * @returns {string} 식별자 문자열
     */
    generateSimpleIdentifier() {
        try {
            // 간단한 브라우저 식별자 (방문자 추적용 아님, 테스트넷 중복 방지용만)
            const identifier = btoa(
                navigator.userAgent.substring(0, 50) + 
                screen.width + 'x' + screen.height +
                navigator.language
            ).substring(0, 12);
            
            console.log('🔍 테스트넷 식별자 생성:', identifier);
            return identifier;
            
        } catch (error) {
            console.error('❌ 식별자 생성 실패:', error);
            // 폴백: 세션 기반 랜덤 ID
            if (!sessionStorage.getItem('painori_session_id')) {
                sessionStorage.setItem('painori_session_id', 
                    'session_' + Math.random().toString(36).substring(2, 15));
            }
            return sessionStorage.getItem('painori_session_id');
        }
    }

    /**
     * 오늘 날짜 문자열 가져오기 (YYYY-MM-DD)
     * @returns {string} 오늘 날짜
     */
    getTodayString() {
        return new Date().toISOString().split('T')[0];
    }

    /**
     * 테스트넷 클릭 통계 업데이트 (기기별 1일 1회)
     */
    async updateTestnetStats() {
        const { db, firestore } = this.getFirebaseRefs();
        const today = this.getTodayString();
        const identifier = this.generateSimpleIdentifier();
        
        // localStorage 기반 중복 체크 (기기별 1일 1회)
        const todayClickKey = `testnet_click_${today}_${identifier}`;
        const alreadyClickedToday = localStorage.getItem(todayClickKey);
        
        console.log('🔧 [DEBUG] 테스트넷 클릭 체크:', {
            todayClickKey,
            alreadyClicked: !!alreadyClickedToday,
            today,
            identifier
        });
        
        if (alreadyClickedToday) {
            console.log('⏳ 오늘 이미 테스트넷 클릭함 (기기별 1일 1회 제한)');
            return false;
        }
        
        try {
            console.log('🧪 테스트넷 클릭 통계 업데이트');
            
            // localStorage 저장 (중복 방지)
            localStorage.setItem(todayClickKey, 'true');
            console.log('✅ [DEBUG] localStorage 저장 완료:', todayClickKey);
            
            // Google Analytics 이벤트 전송
            if (typeof gtag !== 'undefined') {
                gtag('event', 'testnet_click', {
                    'event_category': 'engagement',
                    'event_label': 'spot_nori_testnet',
                    'value': 1
                });
                console.log('✅ Google Analytics 이벤트 전송 완료');
            }
            
            // Firebase 카운터 업데이트 (기존 방식 유지)
            await db.collection("dailyStats").doc(today).set({
                testnetClicks: firestore.FieldValue.increment(1)
            }, { merge: true });
            
            await db.collection("stats").doc('total').set({
                testnetClicks: firestore.FieldValue.increment(1)
            }, { merge: true });
            
            console.log('✅ 테스트넷 통계 업데이트 완료');
            
            // 통계 표시 업데이트
            this.loadStats();
            return true;
            
        } catch (error) {
            console.error('❌ 테스트넷 통계 업데이트 오류:', error);
            // 실패 시 localStorage에서 제거 (롤백)
            localStorage.removeItem(todayClickKey);
            console.log('🔧 [DEBUG] 실패로 인한 localStorage 롤백');
            return false;
        }
    }

    /**
     * 통계 데이터 로드 및 UI 업데이트 (테스트넷 클릭만)
     */
    async loadStats() {
        const { db } = this.getFirebaseRefs();
        const today = this.getTodayString();
        
        try {
            console.log('📈 테스트넷 통계 데이터 로딩');
            
            // 오늘 테스트넷 통계 로드
            const todayDoc = await db.collection("dailyStats").doc(today).get();
            const todayStats = todayDoc.exists ? todayDoc.data() : {};
            
            // 전체 테스트넷 통계 로드
            const totalDoc = await db.collection("stats").doc('total').get();
            const totalStats = totalDoc.exists ? totalDoc.data() : {};
            
            // UI 업데이트 (테스트넷만)
            this.updateStatsUI({
                todayTestnet: todayStats.testnetClicks || 0,
                totalTestnet: totalStats.testnetClicks || 0
            });
            
            console.log('✅ 테스트넷 통계 UI 업데이트 완료', {
                today: { testnet: todayStats.testnetClicks || 0 },
                total: { testnet: totalStats.testnetClicks || 0 }
            });
            
        } catch (error) {
            console.error('❌ 통계 로드 오류:', error);
            
            // 오류 시 기본값 표시
            this.updateStatsUI({
                todayTestnet: 0,
                totalTestnet: 0
            });
        }
    }

    /**
     * 통계 UI 업데이트 (테스트넷만)
     * @param {Object} stats - 통계 데이터
     */
    updateStatsUI(stats) {
        const elements = {
            todayTestnet: document.getElementById('today-testnet'),
            totalTestnet: document.getElementById('total-testnet')
        };
        
        // 테스트넷 통계만 업데이트 (방문자는 Google Analytics가 처리)
        if (elements.todayTestnet) {
            elements.todayTestnet.textContent = stats.todayTestnet.toLocaleString();
        }
        if (elements.totalTestnet) {
            elements.totalTestnet.textContent = stats.totalTestnet.toLocaleString();
        }
    }

    /**
     * 테스트넷 버튼 이벤트 초기화
     */
    initTestnetButtonEvent() {
        const testnetBtn = document.getElementById('testnet-join-btn');
        
        if (testnetBtn) {
            testnetBtn.addEventListener('click', async (e) => {
                console.log('🧪 테스트넷 버튼 클릭');
                
                // 통계 업데이트 (동기적 처리)
                const success = await this.updateTestnetStats();
                
                if (success) {
                    console.log('✅ 테스트넷 클릭 통계 기록됨');
                } else {
                    console.log('⏳ 테스트넷 클릭 제한됨 (오늘 이미 클릭함)');
                }
                
                // 새창 열기 (팝업 차단 방지)
                if (e.target.href) {
                    window.open(e.target.href, '_blank', 'noopener,noreferrer');
                }
                
                // 기본 동작 방지
                e.preventDefault();
            });
            
            console.log('🎮 테스트넷 버튼 이벤트 초기화 완료');
        } else {
            console.warn('⚠️ 테스트넷 버튼을 찾을 수 없음');
        }
    }

    /**
     * 정기 통계 업데이트 설정 (10분마다)
     */
    setupPeriodicUpdate() {
        setInterval(() => {
            console.log('⏰ 정기 테스트넷 통계 업데이트');
            this.loadStats();
        }, 600000); // 10분마다
        
        console.log('⏰ 정기 통계 업데이트 설정 완료 (10분 간격)');
    }

    /**
     * Google Analytics 설정 확인
     */
    checkGoogleAnalytics() {
        if (typeof gtag !== 'undefined') {
            console.log('✅ Google Analytics 연결 확인됨');
            
            // 페이지뷰 이벤트 (자동으로 전송되지만 확인용)
            gtag('event', 'page_view', {
                'page_title': 'Painori Homepage',
                'page_location': window.location.href
            });
            
            return true;
        } else {
            console.warn('⚠️ Google Analytics가 로드되지 않았습니다');
            return false;
        }
    }

    /**
     * 통계 디버그 정보 출력
     */
    debugStats() {
        const today = this.getTodayString();
        const identifier = this.generateSimpleIdentifier();
        const todayClickKey = `testnet_click_${today}_${identifier}`;
        
        console.log('🔍 통계 디버그 정보:', {
            identifier: identifier,
            today: today,
            isInitialized: this.isInitialized,
            googleAnalytics: typeof gtag !== 'undefined',
            localStorage: {
                painoriLang: localStorage.getItem('painori_lang'),
                todayTestnetClick: localStorage.getItem(todayClickKey),
                allTestnetKeys: Object.keys(localStorage).filter(key => key.startsWith('testnet_click_'))
            },
            sessionStorage: {
                sessionId: sessionStorage.getItem('painori_session_id')
            },
            firebase: {
                app: window.PainoriFirebase?.app?.name || 'undefined',
                db: !!window.PainoriFirebase?.db,
                online: navigator.onLine
            }
        });
        
        // Google Analytics 상태 체크
        this.checkGoogleAnalytics();
        
        // localStorage 테스트넷 키들만 출력
        console.log('🔍 [DEBUG] 테스트넷 localStorage 키들:');
        Object.keys(localStorage)
            .filter(key => key.startsWith('testnet_click_'))
            .forEach(key => {
                console.log(`  ${key}: ${localStorage.getItem(key)}`);
            });
    }

    /**
     * Stats Manager 초기화
     */
    async init() {
        try {
            console.log('🚀 Stats Manager 초기화 시작 (Google Analytics 모드)');
            
            // Google Analytics 연결 확인
            this.checkGoogleAnalytics();
            
            // 현재 테스트넷 통계 로드
            await this.loadStats();
            
            // 테스트넷 버튼 이벤트 초기화
            this.initTestnetButtonEvent();
            
            // 정기 업데이트 설정
            this.setupPeriodicUpdate();
            
            this.isInitialized = true;
            console.log('✅ Stats Manager 초기화 완료');
            console.log('📊 방문자 통계: Google Analytics 자동 처리');
            console.log('🧪 테스트넷 클릭: Firebase 직접 관리');
            
            // 디버그 정보 출력 (개발 시에만)
            if (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1')) {
                this.debugStats();
            }
            
        } catch (error) {
            console.error('❌ Stats Manager 초기화 실패:', error);
        }
    }

    /**
     * 정리 함수 (페이지 언로드 시)
     */
    cleanup() {
        console.log('🧹 Stats Manager 정리');
        // 필요한 경우 이벤트 리스너 제거 등의 정리 작업
    }

    /**
     * 테스트넷 통계 초기화 (관리자용)
     */
    async resetTestnetStats() {
        if (!confirm('정말로 테스트넷 통계를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
            return;
        }
        
        try {
            const { db } = this.getFirebaseRefs();
            
            // 테스트넷 통계만 초기화
            await db.collection("stats").doc('total').set({
                testnetClicks: 0
            }, { merge: true });
            
            console.log('🔄 테스트넷 통계 초기화 완료');
            this.loadStats();
            
        } catch (error) {
            console.error('❌ 테스트넷 통계 초기화 실패:', error);
        }
    }

    /**
     * localStorage 테스트넷 기록 정리 (관리자용)
     */
    clearTestnetLocalStorage() {
        const testnetKeys = Object.keys(localStorage).filter(key => key.startsWith('testnet_click_'));
        
        if (testnetKeys.length === 0) {
            console.log('🧹 정리할 테스트넷 localStorage 키가 없습니다');
            return;
        }
        
        if (!confirm(`${testnetKeys.length}개의 테스트넷 localStorage 키를 정리하시겠습니까?`)) {
            return;
        }
        
        testnetKeys.forEach(key => {
            localStorage.removeItem(key);
        });
        
        console.log(`🧹 ${testnetKeys.length}개의 테스트넷 localStorage 키 정리 완료`);
    }
}

// 전역 Stats Manager 인스턴스 생성
window.PainoriStats = new StatsManager();

// 개발자용 전역 함수 노출
window.PainoriStats.resetTestnetStats = () => window.PainoriStats.resetTestnetStats();
window.PainoriStats.debugStats = () => window.PainoriStats.debugStats();
window.PainoriStats.clearTestnetLocalStorage = () => window.PainoriStats.clearTestnetLocalStorage();

// I18n 초기화 완료 후 시작
window.addEventListener('i18nInitialized', () => {
    console.log('📊 I18n 완료 신호 받음, Stats Manager 시작');
    window.PainoriStats.init();
});

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', () => {
    window.PainoriStats.cleanup();
});