import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

// Your Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCQ4-If0RuqSNHwGp1LvBo3FS4qYKkIGyc",
  authDomain: "my-project-e26e0.firebaseapp.com",
  projectId: "my-project-e26e0",
  storageBucket: "my-project-e26e0.firebasestorage.app",
  messagingSenderId: "231636533543",
  appId: "1:231636533543:web:0ce0bf64350d4fd676e902",
  measurementId: "G-SQXFPN6M1Z"
};


const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };