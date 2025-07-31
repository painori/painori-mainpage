/**
 * 통계 관리 모듈
 * 방문자 추적, 테스트넷 클릭 통계, 사용자 지문 생성
 */

class StatsManager {
    constructor() {
        this.userFingerprint = null;
        this.isInitialized = false;
        
        console.log('📊 Stats Manager 초기화');
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
     * 사용자 지문 생성 (개인정보 보호형)
     * @returns {string} 고유 지문 문자열
     */
    generateUserFingerprint() {
        try {
            // Canvas 지문 생성
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillText('Painori fingerprint', 2, 2);
            
            // 브라우저 환경 정보 수집 (개인정보 제외)
            const fingerprint = btoa(
                navigator.userAgent + 
                screen.width + screen.height + 
                navigator.language +
                new Date().getTimezoneOffset() +
                canvas.toDataURL()
            ).substring(0, 16);
            
            console.log('🔍 사용자 지문 생성 완료:', fingerprint);
            return fingerprint;
            
        } catch (error) {
            console.error('❌ 지문 생성 실패:', error);
            // 폴백: 랜덤 ID 생성
            return 'fallback_' + Math.random().toString(36).substring(2, 15);
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
     * 방문자 통계 업데이트 (기기별 1일 1회)
     */
    async updateVisitorStats() {
        const { db, firestore } = this.getFirebaseRefs();
        const today = this.getTodayString();
        const userFingerprint = this.userFingerprint;
        
        try {
            console.log('👥 방문자 통계 업데이트 시작');
            
            // 오늘 이미 방문했는지 확인
            const visitorDocId = `${today}_${userFingerprint}`;
            const visitorDoc = await db.collection("dailyStats").doc(visitorDocId).get();
            
            if (!visitorDoc.exists) {
                console.log('🆕 새 방문자 기록');
                
                // 새 방문자 기록 생성
                await db.collection("dailyStats").doc(visitorDocId).set({
                    date: today,
                    timestamp: firestore.FieldValue.serverTimestamp(),
                    userAgent: navigator.userAgent.substring(0, 100), // 100자 제한
                    fingerprint: userFingerprint
                });
                
                // 오늘 방문자 수 증가
                await db.collection("dailyStats").doc(today).set({
                    visitors: firestore.FieldValue.increment(1)
                }, { merge: true });
                
                // 전체 방문자 수 증가
                await db.collection("stats").doc('total').set({
                    visitors: firestore.FieldValue.increment(1)
                }, { merge: true });
                
                console.log('✅ 방문자 통계 업데이트 완료');
            } else {
                console.log('🔄 기존 방문자 (중복 제거)');
            }
            
        } catch (error) {
            console.error('❌ 방문자 통계 업데이트 오류:', error);
        }
    }

    /**
     * 테스트넷 클릭 통계 업데이트 (1시간 쿨다운)
     */
    async updateTestnetStats() {
        const { db, firestore } = this.getFirebaseRefs();
        const today = this.getTodayString();
        const userFingerprint = this.userFingerprint;
        const lastClickKey = `testnet_click_${userFingerprint}`;
        const lastClickTime = localStorage.getItem(lastClickKey);
        const now = Date.now();
        
        // 1시간 쿨다운 체크 (3600000ms = 1시간)
        // 기기별 1일 1회 체크
        const todayClickKey = `testnet_click_${today}_${userFingerprint}`;
        const alreadyClickedToday = localStorage.getItem(todayClickKey);
        
        if (alreadyClickedToday) {
            console.log('⏳ 오늘 이미 테스트넷 클릭함 (기기별 1일 1회 제한)');
            return false;
        }
        
        try {
            console.log('🧪 테스트넷 클릭 통계 업데이트');
            
            // 쿨다운 시간 기록
            localStorage.setItem(lastClickKey, now.toString());
            
            // 오늘 테스트넷 클릭 수 증가
            await db.collection("dailyStats").doc(today).set({
                testnetClicks: firestore.FieldValue.increment(1)
            }, { merge: true });
            
            // 전체 테스트넷 클릭 수 증가
            await db.collection("stats").doc('total').set({
                testnetClicks: firestore.FieldValue.increment(1)
            }, { merge: true });
            
            console.log('✅ 테스트넷 통계 업데이트 완료');
            
            // 통계 표시 업데이트
            this.loadStats();
            return true;
            
        } catch (error) {
            console.error('❌ 테스트넷 통계 업데이트 오류:', error);
            return false;
        }
    }

    /**
     * 통계 데이터 로드 및 UI 업데이트
     */
    async loadStats() {
        const { db } = this.getFirebaseRefs();
        const today = this.getTodayString();
        
        try {
            console.log('📈 통계 데이터 로딩');
            
            // 오늘 통계 로드
            const todayDoc = await db.collection("dailyStats").doc(today).get();
            const todayStats = todayDoc.exists ? todayDoc.data() : {};
            
            // 전체 통계 로드
            const totalDoc = await db.collection("stats").doc('total').get();
            const totalStats = totalDoc.exists ? totalDoc.data() : {};
            
            // UI 업데이트
            this.updateStatsUI({
                todayVisitors: todayStats.visitors || 0,
                todayTestnet: todayStats.testnetClicks || 0,
                totalVisitors: totalStats.visitors || 0,
                totalTestnet: totalStats.testnetClicks || 0
            });
            
            console.log('✅ 통계 UI 업데이트 완료', {
                today: { visitors: todayStats.visitors || 0, testnet: todayStats.testnetClicks || 0 },
                total: { visitors: totalStats.visitors || 0, testnet: totalStats.testnetClicks || 0 }
            });
            
        } catch (error) {
            console.error('❌ 통계 로드 오류:', error);
            
            // 오류 시 기본값 표시
            this.updateStatsUI({
                todayVisitors: 0,
                todayTestnet: 0,
                totalVisitors: 0,
                totalTestnet: 0
            });
        }
    }

    /**
     * 통계 UI 업데이트
     * @param {Object} stats - 통계 데이터
     */
    updateStatsUI(stats) {
        const elements = {
            todayVisitors: document.getElementById('today-visitors'),
            todayTestnet: document.getElementById('today-testnet'),
            totalVisitors: document.getElementById('total-visitors'),
            totalTestnet: document.getElementById('total-testnet')
        };
        
        // 요소가 존재하는 경우에만 업데이트
        if (elements.todayVisitors) {
            elements.todayVisitors.textContent = stats.todayVisitors.toLocaleString();
        }
        if (elements.todayTestnet) {
            elements.todayTestnet.textContent = stats.todayTestnet.toLocaleString();
        }
        if (elements.totalVisitors) {
            elements.totalVisitors.textContent = stats.totalVisitors.toLocaleString();
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
                
                // 통계 업데이트 (비동기, 페이지 이동을 막지 않음)
                this.updateTestnetStats().then(success => {
                    if (success) {
                        console.log('✅ 테스트넷 클릭 통계 기록됨');
                    }
                });
                
                // 버튼의 기본 동작(링크 이동)은 그대로 진행
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
            console.log('⏰ 정기 통계 업데이트');
            this.loadStats();
        }, 600000); // 10분마다
        
        console.log('⏰ 정기 통계 업데이트 설정 완료 (10분 간격)');
    }

    /**
     * 통계 디버그 정보 출력
     */
    debugStats() {
        console.log('🔍 통계 디버그 정보:', {
            userFingerprint: this.userFingerprint,
            today: this.getTodayString(),
            isInitialized: this.isInitialized,
            localStorage: {
                testnetClickTime: localStorage.getItem(`testnet_click_${this.userFingerprint}`)
            }
        });
    }

    /**
     * Stats Manager 초기화
     */
    async init() {
        try {
            console.log('🚀 Stats Manager 초기화 시작');
            
            // 사용자 지문 생성
            this.userFingerprint = this.generateUserFingerprint();
            
            // 방문자 통계 업데이트
            await this.updateVisitorStats();
            
            // 현재 통계 로드
            await this.loadStats();
            
            // 테스트넷 버튼 이벤트 초기화
            this.initTestnetButtonEvent();
            
            // 정기 업데이트 설정
            this.setupPeriodicUpdate();
            
            this.isInitialized = true;
            console.log('✅ Stats Manager 초기화 완료');
            
            // 디버그 정보 출력 (개발 시에만)
            if (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1')) {
                this.debugStats();
            }
            
        } catch (error) {
            console.error('❌ Stats Manager 초기화 실패:', error);
        }
    }

    /**
     * ✅ 추가: 정리 함수 (페이지 언로드 시)
     */
    cleanup() {
        console.log('🧹 Stats Manager 정리');
        // 필요한 경우 이벤트 리스너 제거 등의 정리 작업
        // 현재는 특별한 정리 작업이 필요하지 않음
    }

    /**
     * 통계 초기화 (관리자용 - 개발/테스트 시에만 사용)
     */
    async resetStats() {
        if (!confirm('정말로 모든 통계를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
            return;
        }
        
        try {
            const { db } = this.getFirebaseRefs();
            
            // 전체 통계 초기화
            await db.collection("stats").doc('total').set({
                visitors: 0,
                testnetClicks: 0
            });
            
            console.log('🔄 통계 초기화 완료');
            this.loadStats();
            
        } catch (error) {
            console.error('❌ 통계 초기화 실패:', error);
        }
    }
}

// 전역 Stats Manager 인스턴스 생성
window.PainoriStats = new StatsManager();

// 개발자용 전역 함수 노출
window.PainoriStats.resetStats = () => window.PainoriStats.resetStats();
window.PainoriStats.debugStats = () => window.PainoriStats.debugStats();

// I18n 초기화 완료 후 시작
window.addEventListener('i18nInitialized', () => {
    console.log('📊 I18n 완료 신호 받음, Stats Manager 시작');
    window.PainoriStats.init();
});

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', () => {
    window.PainoriStats.cleanup();
});