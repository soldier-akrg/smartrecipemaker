/* =======================================
   🔥 IMPORT FIREBASE
======================================= */

import { auth, db } from "./firebase-config.js";

import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

/* =======================================
   🌍 GLOBAL VARIABLES
======================================= */

let currentUserName = "";
let currentUserRole = "";

/* =======================================
   🔐 PAGE PROTECTION
======================================= */

async function protectAdminPage(user) {
  if (!user) {
    window.location.href = "login.html";
    return false;
  }

  const snap = await getDoc(doc(db, "users", user.uid));
  if (!snap.exists() || snap.data().role !== "admin") {
    window.location.href = "login.html";
    return false;
  }

  currentUserName = snap.data().name;
  currentUserRole = snap.data().role;
  return true;
}

onAuthStateChanged(auth, async (user) => {
  const ok = await protectAdminPage(user);
  if (ok) {
    // ✅ Load admin data only after verification
    loadCategories();
    loadIngredientCategories();
    loadIngredients();
    loadAllRecipes();
    loadPendingRecipes();
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
   🧠 SECTION NAVIGATION
======================================= */

const navButtons = document.querySelectorAll(".nav-btn");
const sections = document.querySelectorAll(".admin-section");

navButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    sections.forEach(sec => sec.classList.remove("active"));
    document.getElementById(btn.dataset.section).classList.add("active");
  });
});

/* =======================================
   📂 CATEGORY MANAGEMENT (Recipe Categories)
======================================= */

const categoryForm = document.getElementById("categoryForm");
const categorySelect = document.getElementById("categorySelect");

async function loadCategories() {
  const snapshot = await getDocs(collection(db, "categories"));

  categorySelect.innerHTML = "";
  const categoryListDiv = document.getElementById("categoryList");
  categoryListDiv.innerHTML = "";

  snapshot.forEach(docSnap => {
    const data = docSnap.data();

    // Dropdown for recipe form
    const option = document.createElement("option");
    option.value = docSnap.id;
    option.textContent = data.name;
    categorySelect.appendChild(option);

    // Show in customization list
    const div = document.createElement("div");
    div.textContent = data.name;
    categoryListDiv.appendChild(div);
  });
}

categoryForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("newCategory").value.trim();
  if (!name) return;

  await addDoc(collection(db, "categories"), {
    name,
    createdAt: serverTimestamp()
  });

  categoryForm.reset();
  loadCategories();
});

/* =======================================
   🧂 INGREDIENT CATEGORY MANAGEMENT
======================================= */

const ingredientCategoryForm = document.getElementById("ingredientCategoryForm");
const ingredientCategorySelect = document.getElementById("ingredientCategorySelect");
const ingredientCategoryList = document.getElementById("ingredientCategoryList");

async function loadIngredientCategories() {
  const snapshot = await getDocs(collection(db, "ingredientCategories"));
  ingredientCategorySelect.innerHTML = "";
  ingredientCategoryList.innerHTML = "";

  snapshot.forEach(docSnap => {
    const data = docSnap.data();

    // Dropdown for adding ingredient
    const option = document.createElement("option");
    option.value = docSnap.id;
    option.textContent = data.name;
    ingredientCategorySelect.appendChild(option);

    // Show in customization list
    const div = document.createElement("div");
    div.textContent = data.name;
    ingredientCategoryList.appendChild(div);
  });
}

ingredientCategoryForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("newIngredientCategory").value.trim();
  if (!name) return;

  await addDoc(collection(db, "ingredientCategories"), {
    name,
    createdAt: serverTimestamp()
  });

  ingredientCategoryForm.reset();
  loadIngredientCategories();
});

/* =======================================
   🥕 INGREDIENT MANAGEMENT
======================================= */

const ingredientForm = document.getElementById("ingredientForm");
const ingredientContainer = document.getElementById("ingredientContainer");

async function loadIngredients() {
  const snapshot = await getDocs(collection(db, "ingredients"));
  ingredientContainer.innerHTML = "";

  snapshot.forEach(docSnap => {
    const data = docSnap.data();

    const btn = document.createElement("button");
    btn.textContent = data.name + (data.categoryName ? ` (${data.categoryName})` : "");
    btn.dataset.id = docSnap.id;

    btn.addEventListener("click", () => btn.classList.toggle("active"));

    ingredientContainer.appendChild(btn);
  });
}

ingredientForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("newIngredient").value.trim();
  const categoryId = ingredientCategorySelect.value;
  if (!name || !categoryId) return;

  const catSnap = await getDoc(doc(db, "ingredientCategories", categoryId));
  const categoryName = catSnap.exists() ? catSnap.data().name : "";

  await addDoc(collection(db, "ingredients"), {
    name,
    categoryId,
    categoryName,
    createdAt: serverTimestamp()
  });

  ingredientForm.reset();
  loadIngredients();
});

/* =======================================
   🍲 ADD RECIPE
======================================= */

const recipeForm = document.getElementById("recipeForm");

recipeForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("title").value.trim();
  const categoryId = categorySelect.value;
  const procedure = document.getElementById("procedure").value.trim();
  const imageUrl = document.getElementById("imageUrl").value.trim();
  if (!title || !categoryId || !procedure) return;

  const selectedIngredients = [];
  document.querySelectorAll("#ingredientContainer button.active")
    .forEach(btn => selectedIngredients.push(btn.dataset.id));

  await addDoc(collection(db, "recipes"), {
    title,
    categoryId,
    ingredients: selectedIngredients,
    procedure,
    imageUrl,
    createdBy: currentUserName,
    role: currentUserRole,
    status: "approved",
    createdAt: serverTimestamp()
  });

  recipeForm.reset();
});

/* =======================================
   📋 ALL RECIPES
======================================= */

const recipeList = document.getElementById("recipeList");

function loadAllRecipes() {
  onSnapshot(collection(db, "recipes"), snapshot => {
    recipeList.innerHTML = "";
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const div = document.createElement("div");

      div.innerHTML = `
        <h3>${data.title}</h3>
        <button data-delete="${docSnap.id}">Delete</button>
      `;
      recipeList.appendChild(div);
    });
  });
}

document.addEventListener("click", async (e) => {
  if (e.target.dataset.delete) {
    await deleteDoc(doc(db, "recipes", e.target.dataset.delete));
  }
});

/* =======================================
   ⏳ PENDING APPROVAL
======================================= */

const pendingList = document.getElementById("pendingList");

function loadPendingRecipes() {
  const pendingCollection = collection(db, "pendingRecipes");

  onSnapshot(pendingCollection, snapshot => {
    pendingList.innerHTML = "";
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const div = document.createElement("div");

      div.innerHTML = `
        <h3>${data.title}</h3>
        <p>Submitted by: ${data.createdByName}</p>
        <button data-approve="${docSnap.id}">Approve ✅</button>
        <button data-deny="${docSnap.id}">Deny ❌</button>
      `;
      pendingList.appendChild(div);
    });
  });
}

document.addEventListener("click", async (e) => {
  if (e.target.dataset.approve) {
    const docRef = doc(db, "pendingRecipes", e.target.dataset.approve);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      await addDoc(collection(db, "recipes"), {
        ...data,
        status: "approved",
        approvedAt: serverTimestamp()
      });
      await deleteDoc(docRef);
    }
  }
  if (e.target.dataset.deny) {
    await deleteDoc(doc(db, "pendingRecipes", e.target.dataset.deny));
  }
});

/* =======================================
   🔥 INITIAL LOAD
======================================= */

window.addEventListener("DOMContentLoaded", async () => {
  await loadCategories();
  await loadIngredientCategories();
  await loadIngredients();
});