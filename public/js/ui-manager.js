/**
 * UI 관리 모듈
 * 모바일 메뉴, 부드러운 스크롤, 전체 UI 상호작용
 * 🔧 localStorage 기반 DEBUG_MODE 적용
 */

// 🔧 디버그 모드 설정 (localStorage 기반)

class UIManager {
    constructor() {
        this.isMobileMenuOpen = false;
        this.isInitialized = false;
        
        if (window.isDebugMode()) console.log('🎮 UI Manager 초기화');
    }

    /**
     * 모바일 메뉴 토글
     */
    toggleMobileMenu() {
        const mobileMenu = document.getElementById('mobile-menu');
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        
        if (!mobileMenu || !mobileMenuButton) {
            console.warn('⚠️ 모바일 메뉴 요소를 찾을 수 없음');
            return;
        }
        
        this.isMobileMenuOpen = !this.isMobileMenuOpen;
        
        if (this.isMobileMenuOpen) {
            mobileMenu.classList.remove('hidden');
            if (window.isDebugMode()) console.log('📱 모바일 메뉴 열림');
        } else {
            mobileMenu.classList.add('hidden');
            if (window.isDebugMode()) console.log('📱 모바일 메뉴 닫힘');
        }
    }

    /**
     * 모바일 메뉴 닫기
     */
    closeMobileMenu() {
        const mobileMenu = document.getElementById('mobile-menu');
        
        if (mobileMenu && this.isMobileMenuOpen) {
            mobileMenu.classList.add('hidden');
            this.isMobileMenuOpen = false;
            if (window.isDebugMode()) console.log('📱 모바일 메뉴 자동 닫힘');
        }
    }

    /**
     * 부드러운 스크롤 처리
     * @param {string} targetId - 스크롤할 대상 ID
     */
    smoothScrollTo(targetId) {
        const target = document.querySelector(targetId);
        
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            
            if (window.isDebugMode()) console.log(`📜 부드러운 스크롤: ${targetId}`);
            
            // 모바일 메뉴 자동 닫기
            this.closeMobileMenu();
        } else {
            console.warn(`⚠️ 스크롤 대상을 찾을 수 없음: ${targetId}`);
        }
    }

    /**
     * 모바일 메뉴 이벤트 초기화
     */
    initMobileMenuEvents() {
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        
        if (mobileMenuButton) {
            mobileMenuButton.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
            
            if (window.isDebugMode()) console.log('📱 모바일 메뉴 버튼 이벤트 초기화 완료');
        } else {
            console.warn('⚠️ 모바일 메뉴 버튼을 찾을 수 없음');
        }
    }

    /**
     * 부드러운 스크롤 이벤트 초기화
     */
    initSmoothScrollEvents() {
        // 앵커 링크가 있는 모든 요소에 부드러운 스크롤 적용
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = anchor.getAttribute('href');
                
                if (targetId && targetId !== '#') {
                    this.smoothScrollTo(targetId);
                }
            });
        });
        
        if (window.isDebugMode()) console.log('📜 부드러운 스크롤 이벤트 초기화 완료');
    }

    /**
     * 외부 클릭으로 모바일 메뉴 닫기
     */
    initOutsideClickHandler() {
        document.addEventListener('click', (e) => {
            const mobileMenu = document.getElementById('mobile-menu');
            const mobileMenuButton = document.getElementById('mobile-menu-button');
            
            // 모바일 메뉴가 열려있고, 클릭이 메뉴나 버튼 외부에서 발생한 경우
            if (this.isMobileMenuOpen && 
                mobileMenu && 
                mobileMenuButton &&
                !mobileMenu.contains(e.target) && 
                !mobileMenuButton.contains(e.target)) {
                
                this.closeMobileMenu();
            }
        });
        
        if (window.isDebugMode()) console.log('🖱️ 외부 클릭 핸들러 초기화 완료');
    }

    /**
     * 키보드 이벤트 처리 (ESC 키로 모바일 메뉴 닫기)
     */
    initKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            // ESC 키로 모바일 메뉴 닫기
            if (e.key === 'Escape' && this.isMobileMenuOpen) {
                this.closeMobileMenu();
            }
        });
        
        if (window.isDebugMode()) console.log('⌨️ 키보드 이벤트 초기화 완료');
    }

    /**
     * 리사이즈 이벤트 처리 (데스크톱 크기로 변경 시 모바일 메뉴 자동 닫기)
     */
    initResizeHandler() {
        window.addEventListener('resize', () => {
            // 데스크톱 크기 (768px 이상)로 변경 시 모바일 메뉴 자동 닫기
            if (window.innerWidth >= 768 && this.isMobileMenuOpen) {
                this.closeMobileMenu();
            }
        });
        
        if (window.isDebugMode()) console.log('📏 리사이즈 핸들러 초기화 완료');
    }

    /**
     * 스크롤 이벤트 처리 (헤더 배경 변경 등)
     */
    initScrollEffects() {
        let ticking = false;
        
        const handleScroll = () => {
            const header = document.querySelector('header');
            const scrollY = window.scrollY;
            
            if (header) {
                // 스크롤 시 헤더에 그림자 추가/제거
                if (scrollY > 10) {
                    header.classList.add('shadow-md');
                } else {
                    header.classList.remove('shadow-md');
                }
            }
            
            ticking = false;
        };
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(handleScroll);
                ticking = true;
            }
        });
        
        if (window.isDebugMode()) console.log('📜 스크롤 효과 초기화 완료');
    }

    /**
     * 폼 개선 이벤트 (자동 리사이즈 등)
     */
    initFormEnhancements() {
        // textarea 자동 높이 조절
        document.querySelectorAll('textarea').forEach(textarea => {
            textarea.addEventListener('input', () => {
                textarea.style.height = 'auto';
                textarea.style.height = textarea.scrollHeight + 'px';
            });
        });
        
        // 입력 필드 포커스 효과
        document.querySelectorAll('input, textarea').forEach(input => {
            input.addEventListener('focus', () => {
                input.parentElement?.classList.add('focused');
            });
            
            input.addEventListener('blur', () => {
                input.parentElement?.classList.remove('focused');
            });
        });
        
        if (window.isDebugMode()) console.log('📝 폼 개선사항 초기화 완료');
    }

    /**
     * 접근성 개선
     */
    initAccessibilityFeatures() {
        // 키보드 네비게이션 개선
        document.addEventListener('keydown', (e) => {
            // Tab 키 네비게이션 시 포커스 표시 강화
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });
        
        // 마우스 클릭 시 포커스 표시 약화
        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });
        
        // 건너뛰기 링크 추가 (접근성)
        this.addSkipLinks();
        
        if (window.isDebugMode()) console.log('♿ 접근성 기능 초기화 완료');
    }

    /**
     * 건너뛰기 링크 추가
     */
    addSkipLinks() {
        const skipLinks = document.createElement('div');
        skipLinks.className = 'sr-only focus-within:not-sr-only fixed top-0 left-0 z-50 bg-orange-500 text-white p-2 rounded-br';
        skipLinks.innerHTML = `
            <a href="#main" class="text-white underline">메인 콘텐츠로 건너뛰기</a>
        `;
        
        document.body.insertBefore(skipLinks, document.body.firstChild);
        
        // main 요소에 id 추가
        const main = document.querySelector('main');
        if (main && !main.id) {
            main.id = 'main';
        }
    }

    /**
     * 성능 최적화 - 이미지 지연 로딩
     */
    initLazyLoading() {
        // Intersection Observer를 지원하는 브라우저에서만 실행
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        observer.unobserve(img);
                    }
                });
            });
            
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
            
            if (window.isDebugMode()) console.log('🖼️ 이미지 지연 로딩 초기화 완료');
        }
    }

    /**
     * 에러 핸들링
     */
    initErrorHandling() {
        // 전역 에러 핸들러
        window.addEventListener('error', (e) => {
            console.error('🚨 전역 에러 발생:', e.error);
            
            // 프로덕션 환경에서는 에러 로깅 서비스로 전송
            if (window.location.hostname !== 'localhost') {
                // 여기에 에러 로깅 로직 추가 (예: Sentry, LogRocket 등)
            }
        });
        
        // Promise rejection 핸들러
        window.addEventListener('unhandledrejection', (e) => {
            console.error('🚨 처리되지 않은 Promise 거부:', e.reason);
            e.preventDefault(); // 콘솔 에러 방지
        });
        
        if (window.isDebugMode()) console.log('🛡️ 에러 핸들링 초기화 완료');
    }

    /**
     * 개발자 도구 (개발 환경에서만)
     */
    initDeveloperTools() {
        if (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1')) {
            // 개발 환경에서만 실행
            if (window.isDebugMode()) console.log('🛠️ 개발자 모드 활성화');
            
            // 전역 디버그 함수들
            window.PainoriDebug = {
                getFirebase: () => window.PainoriFirebase,
                getI18n: () => window.PainoriI18n,
                getNews: () => window.PainoriNews,
                getBoard: () => window.PainoriBoard,
                getStats: () => window.PainoriStats,
                getUI: () => window.PainoriUI,
                
                // 유틸리티 함수들
                showAllGlobals: () => {
                    console.log('🌐 모든 Painori 전역 객체:', {
                        Firebase: window.PainoriFirebase,
                        I18n: window.PainoriI18n,
                        News: window.PainoriNews,
                        Board: window.PainoriBoard,
                        Stats: window.PainoriStats,
                        UI: window.PainoriUI
                    });
                }
            };
            
            if (window.isDebugMode()) console.log('🛠️ 개발자 도구 초기화 완료 - window.PainoriDebug 사용 가능');
        }
    }

    /**
     * UI Manager 초기화
     */
    async init() {
        try {
            if (window.isDebugMode()) console.log('🚀 UI Manager 초기화 시작');
            
            // 모바일 메뉴 이벤트
            this.initMobileMenuEvents();
            
            // 부드러운 스크롤
            this.initSmoothScrollEvents();
            
            // 외부 클릭 핸들러
            this.initOutsideClickHandler();
            
            // 키보드 이벤트
            this.initKeyboardEvents();
            
            // 리사이즈 핸들러
            this.initResizeHandler();
            
            // 스크롤 효과
            this.initScrollEffects();
            
            // 폼 개선사항
            this.initFormEnhancements();
            
            // 접근성 기능
            this.initAccessibilityFeatures();
            
            // 이미지 지연 로딩
            this.initLazyLoading();
            
            // 에러 핸들링
            this.initErrorHandling();
            
            // 개발자 도구
            this.initDeveloperTools();
            
            this.isInitialized = true;
            if (window.isDebugMode()) console.log('✅ UI Manager 초기화 완료');
            
        } catch (error) {
            console.error('❌ UI Manager 초기화 실패:', error);
        }
    }

    /**
     * 정리 함수 (페이지 언로드 시)
     */
    cleanup() {
        if (window.isDebugMode()) console.log('🧹 UI Manager 정리');
        // 필요한 경우 이벤트 리스너 제거
    }
}

// 전역 UI Manager 인스턴스 생성
window.PainoriUI = new UIManager();

// 🔧 초기화 순서 조정 - 다른 모듈과 타이밍 통일
window.addEventListener('load', () => {
    setTimeout(() => {
        window.PainoriUI.init();
    }, 100); // UI는 가장 먼저 초기화
});
// 페이지 언로드 시 정리
window.addEventListener('beforeunload', () => {
    window.PainoriUI.cleanup();
});