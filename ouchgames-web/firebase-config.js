// Firebase Configuration for Ouch Games Leaderboards
const firebaseConfig = {
    apiKey: "AIzaSyAN3490790iZ6iP39ylIDISWQbNkGQXByQ",
    authDomain: "ouch-leaderboard.firebaseapp.com",
    projectId: "ouch-leaderboard",
    storageBucket: "ouch-leaderboard.firebasestorage.app",
    messagingSenderId: "324234671341",
    appId: "1:324234671341:web:5b3d437c7a2d0092ae48e4"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const db = firebase.firestore();
const storage = firebase.storage();
const auth = firebase.auth();
