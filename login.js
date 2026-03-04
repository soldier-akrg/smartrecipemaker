/* =======================================
   🔥 IMPORT FIREBASE
======================================= */

import { auth, db } from "./firebase-config.js";

import {
  signInAnonymously,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";





document.addEventListener("DOMContentLoaded", () => {

  const menuBtn = document.getElementById('menuBtn');
  const menuContainer = document.getElementById('menuContainer');

  if (menuBtn && menuContainer) {
    menuBtn.addEventListener('click', () => {
      if (menuContainer.style.display === 'grid') {
        menuContainer.style.display = 'none';
      } else {
        menuContainer.style.display = 'grid';
      }
    });
  }

});
/* =======================================
   🔁 AUTO REDIRECT (LOGIN PAGE ONLY)
======================================= */

let redirecting = false;

async function handleRedirect(user) {
  if (!user || redirecting) return;

  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    if (!snap.exists()) return;

    const role = snap.data().role;
    redirecting = true;

    if (role === "admin") {
      window.location.href = "admin.html";
    } else {
      window.location.href = "user.html";
    }

  } catch (error) {
    console.error("Redirect error:", error);
  }
}

onAuthStateChanged(auth, handleRedirect);

/* =======================================
   👤 USER LOGIN (ANONYMOUS)
======================================= */

const userBtn = document.getElementById("userLoginBtn");

if (userBtn) {
  userBtn.addEventListener("click", async () => {
    const username = document.getElementById("userNameInput").value.trim();
    if (!username) {
      alert("Enter your name");
      return;
    }

    try {
      const userCredential = await signInAnonymously(auth);

      await setDoc(doc(db, "users", userCredential.user.uid), {
        name: username,
        role: "user",
        createdAt: serverTimestamp()
      });

      // ✅ No manual redirect needed; onAuthStateChanged handles it

    } catch (error) {
      console.error("User login failed:", error);
      alert("Login failed. Try again!");
    }
  });
}

/* =======================================
   👑 ADMIN LOGIN
======================================= */

const adminBtn = document.getElementById("adminLoginBtn");

if (adminBtn) {
  adminBtn.addEventListener("click", async () => {
    const email = document.getElementById("adminEmailInput").value.trim();
    const password = document.getElementById("adminPasswordInput").value.trim();

    if (!email || !password) {
      alert("Enter email and password");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      await setDoc(doc(db, "users", userCredential.user.uid), {
        name: "Admin",
        role: "admin",
        email: email
      }, { merge: true });

      // ✅ No manual redirect; onAuthStateChanged handles it

    } catch (error) {
      console.error("Admin login failed:", error);
      alert("Invalid Admin Credentials");
    }
  });
}