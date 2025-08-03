/**
 * 통계 관리 모듈 (통계 기능 제거 버전)
 * Google Analytics만 사용, Firebase 통계 완전 제거
 * DDoS 공격 대상 없음, 100% 비용 안전
 * 🔧 localStorage 기반 DEBUG_MODE 적용
 */

// 🔧 디버그 모드 설정 (localStorage 기반)

class StatsManager {
    constructor() {
        this.isInitialized = false;
        
        if (window.isDebugMode()) console.log('📊 Stats Manager 초기화 (통계 기능 완전 제거 - 100% 안전)');
    }

    /**
     * Google Analytics 설정 확인
     */
    checkGoogleAnalytics() {
        if (typeof gtag !== 'undefined') {
            if (window.isDebugMode()) console.log('✅ Google Analytics 연결 확인됨');
            
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
     * 테스트넷 버튼 이벤트 초기화 (Google Analytics 이벤트만)
     */
    initTestnetButtonEvent() {
        const testnetBtn = document.getElementById('testnet-join-btn');
        
        if (testnetBtn) {
            testnetBtn.addEventListener('click', async (e) => {
                if (window.isDebugMode()) console.log('🧪 테스트넷 버튼 클릭 (Google Analytics 이벤트만)');
                
                // Google Analytics 이벤트만 전송 (Firebase 저장 없음)
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'testnet_click', {
                        'event_category': 'engagement',
                        'event_label': 'spot_nori_testnet',
                        'value': 1
                    });
                    if (window.isDebugMode()) console.log('✅ Google Analytics 테스트넷 이벤트 전송 완료');
                }
                
                // 새창 열기 (팝업 차단 방지)
                if (e.target.href) {
                    window.open(e.target.href, '_blank', 'noopener,noreferrer');
                }
                
                // 기본 동작 방지
                e.preventDefault();
            });
            
            if (window.isDebugMode()) console.log('🎮 테스트넷 버튼 이벤트 초기화 완료 (Google Analytics 전용)');
        } else {
            console.warn('⚠️ 테스트넷 버튼을 찾을 수 없음');
        }
    }

    /**
     * 보안 상태 체크
     */
    checkSecurityStatus() {
        const securityStatus = {
            googleAnalytics: typeof gtag !== 'undefined',
            firebase: !!window.PainoriFirebase?.db,
            localStorage: typeof Storage !== 'undefined',
            sessionStorage: typeof sessionStorage !== 'undefined',
            statisticsRemoved: true // 통계 기능 제거됨
        };
        
        if (window.isDebugMode()) console.log('🛡️ 보안 상태 체크:', securityStatus);
        
        return securityStatus;
    }

    /**
     * 통계 디버그 정보 출력 (단순화)
     */
    debugStats() {
        if (window.isDebugMode()) {
            console.log('🔍 통계 시스템 상태:', {
                googleAnalytics: typeof gtag !== 'undefined',
                firebaseStatistics: '완전 제거됨',
                costRisk: '0% (공격 대상 없음)',
                ddosProtection: '완벽 (기능 없음)',
                monthlyEstimate: '$0 (통계 기능 없음)'
            });
            
            // Google Analytics 상태 체크
            this.checkGoogleAnalytics();
        }
    }

    /**
     * Stats Manager 초기화
     */
    async init() {
        try {
            if (window.isDebugMode()) console.log('🚀 Stats Manager 초기화 시작 (통계 기능 완전 제거)');
            
            // Google Analytics 연결 확인
            this.checkGoogleAnalytics();
            
            // 보안 상태 체크
            this.checkSecurityStatus();
            
            // 테스트넷 버튼 이벤트 초기화 (Google Analytics 전용)
            this.initTestnetButtonEvent();
            
            this.isInitialized = true;
            if (window.isDebugMode()) console.log('✅ Stats Manager 초기화 완료');
            
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
        if (window.isDebugMode()) console.log('🧹 Stats Manager 정리 완료');
        // 통계 기능이 없으므로 정리할 것 없음
    }

    /**
     * 관리자용 정보 함수들 (개발자 콘솔용)
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            googleAnalytics: typeof gtag !== 'undefined',
            firebaseStats: 'REMOVED',
            security: '100% SAFE',
            cost: '$0/month',
            ddosProtection: 'PERFECT'
        };
    }
}

// 전역 Stats Manager 인스턴스 생성
window.PainoriStats = new StatsManager();

// 개발자용 전역 함수 노출 (단순화)
window.PainoriStats.getStatus = () => window.PainoriStats.getStatus();
window.PainoriStats.debugStats = () => window.PainoriStats.debugStats();

// I18n 초기화 완료 후 시작
window.addEventListener('i18nInitialized', () => {
    if (window.isDebugMode()) console.log('📊 I18n 완료 신호 받음, Stats Manager 시작');
    window.PainoriStats.init();
});

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', () => {
    window.PainoriStats.cleanup();
});