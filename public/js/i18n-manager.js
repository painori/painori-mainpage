/**
 * 다국어 관리 모듈
 * 동적 언어팩 로딩 및 번역 적용, 드롭다운 시스템
 */

class I18nManager {
    constructor() {
        this.currentLang = 'en';
        this.translations = {};
        this.supportedLanguages = [
            'en', 'ko', 'ja', 'es', 'zh', 'zh-TW', 'vi', 'hi', 'id', 
            'fil', 'de', 'ar', 'pt-BR', 'ur', 'fi', 'bn', 'fr', 'tr', 
            'ms', 'th', 'my', 'af'
        ]; // 22개국 언어 지원
        this.fallbackLang = 'en';
        
        // 🌐 22개국 언어 정보
        this.languageInfo = {
            'en': { name: 'English', nativeName: 'English', flag: '🇺🇸' },
            'ko': { name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
            'ja': { name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
            'es': { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
            'zh': { name: 'Chinese (Simplified)', nativeName: '简体中文', flag: '🇨🇳' },
            'zh-TW': { name: 'Chinese (Traditional)', nativeName: '繁體中文', flag: '🇹🇼' },
            'vi': { name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
            'hi': { name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
            'id': { name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
            'fil': { name: 'Filipino', nativeName: 'Filipino', flag: '🇵🇭' },
            'de': { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
            'ar': { name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
            'pt-BR': { name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)', flag: '🇧🇷' },
            'ur': { name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰' },
            'fi': { name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮' },
            'bn': { name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩' },
            'fr': { name: 'French', nativeName: 'Français', flag: '🇫🇷' },
            'tr': { name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
            'ms': { name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾' },
            'th': { name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
            'my': { name: 'Myanmar', nativeName: 'မြန်မာဘာသာ', flag: '🇲🇲' },
            'af': { name: 'Afrikaans', nativeName: 'Afrikaans', flag: '🇿🇦' }
        };
        
        console.log('🌐 I18n Manager 초기화');
    }

    /**
     * 언어팩 파일을 동적으로 로드
     * @param {string} lang - 언어 코드 (en, ko 등)
     * @returns {Object} 번역 데이터
     */
    async loadLanguage(lang) {
        try {
            console.log(`📥 언어팩 로딩 시작: ${lang}`);
            
            const response = await fetch(`/lang/${lang}.json`);
            if (!response.ok) {
                throw new Error(`언어팩 파일을 찾을 수 없습니다: ${lang}`);
            }
            
            const translations = await response.json();
            this.translations[lang] = translations;
            
            console.log(`✅ 언어팩 로딩 완료: ${lang} (${Object.keys(translations).length}개 키)`);
            return translations;
            
        } catch (error) {
            console.error(`❌ 언어팩 로딩 실패: ${lang}`, error);
            
            // 폴백 언어로 재시도
            if (lang !== this.fallbackLang) {
                console.log(`🔄 폴백 언어로 재시도: ${this.fallbackLang}`);
                return await this.loadLanguage(this.fallbackLang);
            }
            
            return {};
        }
    }

    /**
     * 번역 텍스트 가져오기
     * @param {string} key - 번역 키
     * @param {string} lang - 언어 코드 (선택사항)
     * @returns {string} 번역된 텍스트
     */
    t(key, lang = null) {
        const targetLang = lang || this.currentLang;
        
        if (this.translations[targetLang] && this.translations[targetLang][key]) {
            return this.translations[targetLang][key];
        }
        
        // 폴백 언어에서 찾기
        if (targetLang !== this.fallbackLang && 
            this.translations[this.fallbackLang] && 
            this.translations[this.fallbackLang][key]) {
            return this.translations[this.fallbackLang][key];
        }
        
        console.warn(`⚠️ 번역 키를 찾을 수 없음: ${key} (${targetLang})`);
        return key; // 키를 그대로 반환
    }

    /**
     * 🌐 언어 드롭다운 메뉴 생성
     * @param {HTMLElement} container - 드롭다운 메뉴 컨테이너
     * @param {boolean} isMobile - 모바일 버전 여부
     */
    createLanguageDropdown(container, isMobile = false) {
        container.innerHTML = '';
        
        this.supportedLanguages.forEach(langCode => {
            const langInfo = this.languageInfo[langCode];
            if (!langInfo) return;
            
            const option = document.createElement('button');
            option.className = `language-option w-full text-left px-4 py-2 hover:bg-orange-50 transition-colors duration-200 flex items-center space-x-2 ${this.currentLang === langCode ? 'bg-orange-50 text-orange-600 font-semibold' : 'text-gray-700'}`;
            option.dataset.lang = langCode;
            
            option.innerHTML = `
                <span class="text-lg">${langInfo.flag}</span>
                <span class="flex-1">${langInfo.nativeName}</span>
                ${this.currentLang === langCode ? '<span class="text-orange-500">✓</span>' : ''}
            `;
            
            option.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.changeLanguage(langCode);
                this.closeAllDropdowns();
            });
            
            container.appendChild(option);
        });
    }

    /**
     * 🌐 현재 선택된 언어 정보 업데이트
     */
    updateCurrentLanguageDisplay() {
        const currentLangInfo = this.languageInfo[this.currentLang];
        if (!currentLangInfo) return;
        
        // 데스크톱 언어 표시 업데이트
        const currentLangText = document.getElementById('current-language-text');
        if (currentLangText) {
            currentLangText.textContent = currentLangInfo.nativeName;
        }
        
        // 플래그 아이콘 업데이트
        document.querySelectorAll('.flag-icon').forEach(icon => {
            icon.textContent = currentLangInfo.flag;
        });
    }

    /**
     * 🌐 드롭다운 이벤트 초기화 - 🔧 이벤트 처리 완전 재작성
     */
    initDropdownEvents() {
        // 🔧 DOM 로드 완료 후 실행
        const initWhenReady = () => {
            console.log('🔧 드롭다운 이벤트 초기화 시작');
            
            // 데스크톱 드롭다운
            const desktopBtn = document.getElementById('language-dropdown-btn');
            const desktopMenu = document.getElementById('language-dropdown-menu');
            
            if (desktopBtn && desktopMenu) {
                console.log('✅ 데스크톱 드롭다운 요소 발견');
                
                desktopBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🖱️ 데스크톱 언어 버튼 클릭');
                    this.toggleDropdown(desktopMenu, false);
                });
                
                console.log('✅ 데스크톱 드롭다운 이벤트 연결 완료');
            } else {
                console.warn('⚠️ 데스크톱 드롭다운 요소를 찾을 수 없음', {
                    btn: !!desktopBtn,
                    menu: !!desktopMenu
                });
            }
            
            // 모바일 드롭다운
            const mobileBtn = document.getElementById('mobile-language-dropdown-btn');
            const mobileMenu = document.getElementById('mobile-language-dropdown-menu');
            
            if (mobileBtn && mobileMenu) {
                console.log('✅ 모바일 드롭다운 요소 발견');
                
                mobileBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('📱 모바일 언어 버튼 클릭');
                    this.toggleDropdown(mobileMenu, true);
                });
                
                console.log('✅ 모바일 드롭다운 이벤트 연결 완료');
            } else {
                console.warn('⚠️ 모바일 드롭다운 요소를 찾을 수 없음', {
                    btn: !!mobileBtn,
                    menu: !!mobileMenu
                });
            }
            
            // 외부 클릭으로 드롭다운 닫기
            document.addEventListener('click', (e) => {
                // 언어 드롭다운 영역이 아닌 곳을 클릭하면 닫기
                if (!e.target.closest('.language-dropdown')) {
                    this.closeAllDropdowns();
                }
            });
            
            console.log('✅ 외부 클릭 핸들러 설정 완료');
        };
        
        // DOM 상태 확인 후 초기화
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initWhenReady);
        } else {
            // 이미 로드된 경우 바로 실행
            initWhenReady();
        }
        
        console.log('🎮 언어 드롭다운 이벤트 초기화 설정 완료');
    }

    /**
     * 🌐 드롭다운 토글 - 🔧 토글 로직 개선
     */
    toggleDropdown(menu, isMobile) {
        console.log(`🔄 드롭다운 토글 시도: ${isMobile ? '모바일' : '데스크톱'}`);
        
        if (!menu) {
            console.error('❌ 드롭다운 메뉴 요소가 없음');
            return;
        }
        
        const isHidden = menu.classList.contains('hidden');
        
        // 모든 드롭다운 닫기
        this.closeAllDropdowns();
        
        if (isHidden) {
            console.log('📂 드롭다운 열기');
            
            // 드롭다운 내용 생성
            this.createLanguageDropdown(menu, isMobile);
            
            // 드롭다운 표시
            menu.classList.remove('hidden');
            
            // 🔧 애니메이션 효과 개선
            requestAnimationFrame(() => {
                menu.style.opacity = '0';
                menu.style.transform = 'translateY(-10px)';
                menu.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
                
                requestAnimationFrame(() => {
                    menu.style.opacity = '1';
                    menu.style.transform = 'translateY(0)';
                });
            });
        }
    }

    /**
     * 🌐 모든 드롭다운 닫기
     */
    closeAllDropdowns() {
        document.querySelectorAll('.language-dropdown-menu').forEach(menu => {
            menu.classList.add('hidden');
        });
        
        // 드롭다운 버튼의 화살표 회전 초기화
        document.querySelectorAll('.language-dropdown-btn svg').forEach(arrow => {
            arrow.style.transform = 'rotate(0deg)';
        });
    }

    /**
     * DOM 요소들에 번역 적용
     * @param {string} lang - 적용할 언어
     */
    applyTranslations(lang) {
        console.log(`🔄 번역 적용 시작: ${lang}`);
        
        if (!this.translations[lang]) {
            console.error(`❌ 언어 데이터가 없습니다: ${lang}`);
            return;
        }
        
        const translations = this.translations[lang];
        let appliedCount = 0;

        // data-i18n 속성을 가진 모든 요소의 텍스트 변경
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            if (translations[key]) {
                // Pi Browser 정보는 특별 처리 (HTML 포함)
                if (key === 'game_pi_browser_info') {
                    el.innerHTML = translations[key]
                        .replace(/\n/g, '<br>')
                        .replace(/lukep81/g, '<span class="invite-code">lukep81</span>');
                } else {
                    el.textContent = translations[key];
                }
                appliedCount++;
            }
        });
        
        // placeholder 번역
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.dataset.i18nPlaceholder;
            if (translations[key]) {
                el.placeholder = translations[key];
                appliedCount++;
            }
        });

        // 🔧 title 속성 번역 추가 (검색 버튼 등)
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.dataset.i18nTitle;
            if (translations[key]) {
                el.title = translations[key];
                appliedCount++;
            }
        });

        console.log(`✅ 번역 적용 완료: ${appliedCount}개 요소`);
    }

    /**
     * 언어 변경
     * @param {string} lang - 변경할 언어 코드
     */
    async changeLanguage(lang) {
        if (!this.supportedLanguages.includes(lang)) {
            console.warn(`⚠️ 지원하지 않는 언어: ${lang}, 폴백: ${this.fallbackLang}`);
            lang = this.fallbackLang;
        }

        console.log(`🔄 언어 변경: ${this.currentLang} → ${lang}`);
        
        try {
            // 언어팩이 로드되지 않았으면 로드
            if (!this.translations[lang]) {
                await this.loadLanguage(lang);
            }
            
            // HTML lang 속성 변경
            document.documentElement.lang = lang;
            
            // 현재 언어 업데이트
            this.currentLang = lang;
            
            // localStorage에 저장
            localStorage.setItem('painori_lang', lang);
            
            // 번역 적용
            this.applyTranslations(lang);
            
            // 현재 언어 표시 업데이트
            this.updateCurrentLanguageDisplay();
            
            console.log(`✅ 언어 변경 완료: ${lang}`);
            
            // 커스텀 이벤트 발송 (다른 모듈에서 언어 변경을 감지할 수 있도록)
            window.dispatchEvent(new CustomEvent('languageChanged', { 
                detail: { language: lang, translations: this.translations[lang] } 
            }));
            
        } catch (error) {
            console.error(`❌ 언어 변경 실패: ${lang}`, error);
        }
    }

    /**
     * 🔧 브라우저 언어 감지 개선
     * @returns {string} 감지된 언어 코드
     */
    detectBrowserLanguage() {
        // navigator.language에서 언어 코드 추출
        const browserLang = navigator.language.toLowerCase();
        
        console.log(`🔍 브라우저 언어 감지: ${navigator.language} → ${browserLang}`);
        
        // 정확한 매칭 확인 (예: ko-KR → ko)
        for (const supportedLang of this.supportedLanguages) {
            if (browserLang.startsWith(supportedLang.toLowerCase())) {
                console.log(`✅ 지원 언어 매칭: ${supportedLang}`);
                return supportedLang;
            }
        }
        
        console.log(`⚠️ 지원하지 않는 언어, 폴백: ${this.fallbackLang}`);
        return this.fallbackLang;
    }

    /**
     * 🔧 초기 언어 설정 개선
     * @returns {string} 설정된 언어 코드
     */
    getInitialLanguage() {
        // 1순위: localStorage에 저장된 언어
        const savedLang = localStorage.getItem('painori_lang');
        if (savedLang && this.supportedLanguages.includes(savedLang)) {
            console.log(`💾 저장된 언어 사용: ${savedLang}`);
            return savedLang;
        }
        
        // 2순위: 브라우저 언어
        const browserLang = this.detectBrowserLanguage();
        
        console.log(`🎯 초기 언어 설정: ${browserLang} (저장된 언어: ${savedLang}, 브라우저: ${navigator.language})`);
        return browserLang;
    }

    /**
     * 🔧 I18n Manager 초기화 순서 개선
     */
    async init() {
        try {
            console.log('🚀 I18n Manager 초기화 시작');
            
            // 1. 초기 언어 결정
            const initialLang = this.getInitialLanguage();
            console.log(`🎯 초기 언어 결정: ${initialLang}`);
            
            // 2. 언어팩 로드
            await this.loadLanguage(initialLang);
            
            // 3. 언어 변경 (UI 업데이트 포함)
            await this.changeLanguage(initialLang);
            
            // 4. 🔧 드롭다운 이벤트 설정 - 타이밍 조정
            setTimeout(() => {
                this.initDropdownEvents();
            }, 50); // 50ms 후 드롭다운 초기화
            
            console.log('✅ I18n Manager 초기화 완료');
            
            // 다른 모듈들에게 초기화 완료 신호 전송
            window.dispatchEvent(new CustomEvent('i18nInitialized'));
            console.log('📡 I18n 초기화 완료 이벤트 발송');
            
        } catch (error) {
            console.error('❌ I18n Manager 초기화 실패:', error);
        }
    }

    /**
     * 🔧 향후 확장: 새 언어 추가
     * @param {string} langCode - 언어 코드
     * @param {Object} langInfo - 언어 정보
     */
    addLanguage(langCode, langInfo) {
        this.languageInfo[langCode] = langInfo;
        if (!this.supportedLanguages.includes(langCode)) {
            this.supportedLanguages.push(langCode);
        }
        console.log(`🌐 새 언어 추가: ${langCode} (${langInfo.nativeName})`);
    }

    /**
     * 🔧 디버그: 지원 언어 목록 출력
     */
    debugLanguages() {
        console.log('🌐 지원 언어 목록:', {
            current: this.currentLang,
            supported: this.supportedLanguages,
            available: Object.keys(this.languageInfo),
            loaded: Object.keys(this.translations)
        });
    }
}

// 전역 I18n Manager 인스턴스 생성
window.PainoriI18n = new I18nManager();

// 🔧 초기화 타이밍 통일 - 300ms로 조정 (다른 모듈과 맞춤)
window.addEventListener('load', () => {
    setTimeout(() => {
        window.PainoriI18n.init();
    }, 300);
});