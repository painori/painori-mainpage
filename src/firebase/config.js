import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
    apiKey: "AIzaSyBa1u3tVq7NoFzD4gzndT_A_nDl2p_zfQk",
    authDomain: "painori-web.firebaseapp.com",
    projectId: "painori-web",
    storageBucket: "painori-web.firebasestorage.app",
    messagingSenderId: "423743376937",
    appId: "1:423743376937:web:4e77251616508269d7d638",
    measurementId: "G-4RHNE60YV5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const functions = getFunctions(app);

export { app, db, functions };
