/* =======================================
   🔥 IMPORT FIREBASE
======================================= */

import { auth, db } from "./firebase-config.js";

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

/* =======================================
   🌍 GLOBAL VARIABLES
======================================= */

let currentUserId = "";
let currentUserName = "";
let selectedIngredients = [];

let unsubscribePending = null;
let unsubscribeApproved = null;

/* =======================================
   🔐 PAGE PROTECTION
======================================= */

async function protectUserPage(user) {
  if (!user) {
    window.location.href = "login.html";
    return false;
  }

  const snap = await getDoc(doc(db, "users", user.uid));

  if (!snap.exists() || snap.data().role !== "user") {
    window.location.href = "login.html";
    return false;
  }

  currentUserId = user.uid;
  currentUserName = snap.data().name;
  return true;
}

onAuthStateChanged(auth, async (user) => {
  const ok = await protectUserPage(user);
  if (ok) {
    loadCategories();
    loadIngredientCategories();
    loadUserRecipes();
  }
});

/* =======================================
   🚪 LOGOUT
======================================= */

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "login.html";
  });
}

/* =======================================
   📂 CATEGORY + INGREDIENTS
======================================= */

const categorySelect = document.getElementById("userCategorySelect");
const ingredientCategorySelect = document.getElementById("userIngredientCategorySelect");
const ingredientContainer = document.getElementById("userIngredientContainer");
const form = document.getElementById("userRecipeForm");
const userRecipesList = document.getElementById("userRecipesList");

/* -------- Load Recipe Categories -------- */

async function loadCategories() {
  const snapshot = await getDocs(collection(db, "categories"));
  categorySelect.innerHTML = "";

  snapshot.forEach(docSnap => {
    const option = document.createElement("option");
    option.value = docSnap.id;
    option.textContent = docSnap.data().name;
    categorySelect.appendChild(option);
  });
}

/* -------- Load Ingredient Categories -------- */

async function loadIngredientCategories() {
  const snapshot = await getDocs(collection(db, "ingredientCategories"));
  ingredientCategorySelect.innerHTML = "";

  snapshot.forEach(docSnap => {
    const option = document.createElement("option");
    option.value = docSnap.id;
    option.textContent = docSnap.data().name;
    ingredientCategorySelect.appendChild(option);
  });

  if (ingredientCategorySelect.value) {
    loadIngredients(ingredientCategorySelect.value);
  }
}

ingredientCategorySelect.addEventListener("change", () => {
  loadIngredients(ingredientCategorySelect.value);
});

/* -------- Load Ingredients By Category -------- */

async function loadIngredients(ingredientCategoryId) {

  selectedIngredients = [];
  ingredientContainer.innerHTML = "";

  const snapshot = await getDocs(collection(db, "ingredients"));

  snapshot.forEach(docSnap => {

    const data = docSnap.data();

    if (data.categoryId === ingredientCategoryId) {

      const btn = document.createElement("button");
      btn.textContent = data.name;
      btn.type = "button";
      btn.classList.add("ingredient-btn");

      btn.addEventListener("click", () => {

        btn.classList.toggle("active");

        if (selectedIngredients.includes(docSnap.id)) {
          selectedIngredients = selectedIngredients.filter(id => id !== docSnap.id);
        } else {
          selectedIngredients.push(docSnap.id);
        }

      });

      ingredientContainer.appendChild(btn);
    }
  });
}

/* =======================================
   🍲 SUBMIT RECIPE
======================================= */

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("userTitle").value.trim();
  const categoryId = categorySelect.value;
  const procedure = document.getElementById("userProcedure").value.trim();
  const imageUrl = document.getElementById("userImageUrl").value.trim();

  if (!title || !procedure) return;

  await addDoc(collection(db, "pendingRecipes"), {
    title,
    categoryId,
    ingredients: selectedIngredients,
    procedure,
    imageUrl,
    createdBy: currentUserId,
    createdByName: currentUserName,
    status: "pending",
    createdAt: serverTimestamp()
  });

  alert("Recipe Submitted! Waiting for Admin Approval 🔥");

  form.reset();
  selectedIngredients = [];
  ingredientContainer.innerHTML = "";
});

/* =======================================
   📋 LOAD USER RECIPES
======================================= */

function loadUserRecipes() {

  userRecipesList.innerHTML = "";

  if (unsubscribePending) unsubscribePending();
  if (unsubscribeApproved) unsubscribeApproved();

  const pendingQuery = query(
    collection(db, "pendingRecipes"),
    where("createdBy", "==", currentUserId)
  );

  unsubscribePending = onSnapshot(pendingQuery, snapshot => {

    userRecipesList.innerHTML = "<h4>Pending:</h4>";

    snapshot.forEach(docSnap => {
      const div = document.createElement("div");
      div.classList.add("user-recipe-card");

      div.innerHTML = `
        <strong>${docSnap.data().title}</strong>
        <p class="status-pending">Status: Pending ⏳</p>
      `;

      userRecipesList.appendChild(div);
    });

  });

  const approvedQuery = query(
    collection(db, "recipes"),
    where("createdBy", "==", currentUserId)
  );

  unsubscribeApproved = onSnapshot(approvedQuery, snapshot => {

    const approvedHeader = document.createElement("h4");
    approvedHeader.textContent = "Approved:";
    userRecipesList.appendChild(approvedHeader);

    snapshot.forEach(docSnap => {
      const div = document.createElement("div");
      div.classList.add("user-recipe-card");

      div.innerHTML = `
        <strong>${docSnap.data().title}</strong>
        <p class="status-approved">Status: Approved ✅</p>
      `;

      userRecipesList.appendChild(div);
    });

  });
}