/**
 * Firebase 설정 및 초기화
 * Painori 프로젝트 Firebase 연결 관리
 */

// Firebase 설정 객체
const firebaseConfig = {
    apiKey: "AIzaSyBa1u3tVq7NoFzD4gzndT_A_nDl2p_zfQk",
    authDomain: "painori-web.firebaseapp.com",
    projectId: "painori-web",
    storageBucket: "painori-web.firebasestorage.app",
    messagingSenderId: "423743376937",
    appId: "1:423743376937:web:4e77251616508269d7d638",
    measurementId: "G-4RHNE60YV5"
};

// Firebase 초기화
console.log('🔥 Firebase 초기화 시작');
const app = firebase.initializeApp(firebaseConfig);
console.log('✅ Firebase 앱 초기화 완료');

// Firebase 서비스 참조 생성
const db = firebase.firestore();
const functions = firebase.functions();

console.log('✅ Firestore 및 Functions 참조 생성 완료');

// 전역 객체로 export (다른 모듈에서 사용)
window.PainoriFirebase = {
    app: app,
    db: db,
    functions: functions,
    firestore: firebase.firestore // Firestore 네임스페이스도 함께 export
};

console.log('🚀 Firebase 설정 완료 - 다른 모듈에서 window.PainoriFirebase로 접근 가능');