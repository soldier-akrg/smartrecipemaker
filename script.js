// ==============================
// 🔥 IMPORT FIREBASE
// ==============================

import { db } from "./firebase-config.js";
import {
    collection,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

// =====================================================
// 📂 GLOBAL VARIABLES
// =====================================================

let selectedIngredients = [];
let ingredientMap = {};
let categoryMap = {};

const ingredientCategoryContainer = document.getElementById("ingredientCategoryContainer");
const ingredientButtonsContainer = document.getElementById("ingredientButtonsContainer");
const selectedDiv = document.getElementById("selectedIngredientsContainer");
const recipeResults = document.getElementById("RecipeResultsId");
const categoryContainer = document.querySelector(".CategoryContainer");
const latestContainer = document.getElementById("LatestRecipesId");
const recipeSearchInput = document.getElementById("recipeSearch");
const searchBtn = document.getElementById("searchBtn");

// =====================================================
// 🔎 SEARCH BUTTON TRIGGER
// =====================================================

searchBtn.addEventListener("click", () => {
    recipeSearchInput.dispatchEvent(new Event("input"));
});

// =====================================================
// 🥕 LOAD INGREDIENT CATEGORIES
// =====================================================

async function loadIngredientCategories() {

    const snapshot = await getDocs(collection(db, "ingredientCategories"));

    ingredientCategoryContainer.innerHTML = "";

    snapshot.forEach(docSnap => {

        const data = docSnap.data();

        const btn = document.createElement("button");
        btn.classList.add("main-button");
        btn.textContent = data.name;

        btn.addEventListener("click", () => {
            loadIngredients(docSnap.id);
        });

        ingredientCategoryContainer.appendChild(btn);
    });
}

// =====================================================
// 🧂 LOAD INGREDIENTS BY CATEGORY
// =====================================================

async function loadIngredients(categoryId) {

    const snapshot = await getDocs(collection(db, "ingredients"));

    ingredientButtonsContainer.innerHTML = "";

    snapshot.forEach(docSnap => {

        const data = docSnap.data();

        if (data.categoryId === categoryId) {

            ingredientMap[docSnap.id] = data.name;

            const btn = document.createElement("button");
            btn.textContent = data.name;
            btn.dataset.id = docSnap.id;
            btn.classList.add("ingredient-btn");

            btn.addEventListener("click", () => {
                toggleIngredient(docSnap.id);
                btn.classList.toggle("active");
            });

            ingredientButtonsContainer.appendChild(btn);
        }
    });
}

// =====================================================
// ✅ TOGGLE INGREDIENT
// =====================================================

function toggleIngredient(id) {

    if (selectedIngredients.includes(id)) {
        selectedIngredients = selectedIngredients.filter(item => item !== id);
    } else {
        selectedIngredients.push(id);
    }

    displaySelected();
    filterRecipes();
}

// =====================================================
// 📌 DISPLAY SELECTED INGREDIENT NAMES (WITH REMOVE BUTTON)
// =====================================================

function displaySelected() {

    selectedDiv.innerHTML = "";

    selectedIngredients.forEach(id => {

        const wrapper = document.createElement("div");
        wrapper.style.display = "inline-block";
        wrapper.style.margin = "5px";

        const span = document.createElement("span");
        span.textContent = ingredientMap[id] + " ";

        const removeBtn = document.createElement("button");
        removeBtn.textContent = "✖";
        removeBtn.style.marginLeft = "5px";
        removeBtn.style.cursor = "pointer";
        removeBtn.style.border = "none";
        removeBtn.style.background = "transparent";
        removeBtn.style.color = "red";
        removeBtn.style.fontWeight = "bold";

        removeBtn.addEventListener("click", () => {

            selectedIngredients = selectedIngredients.filter(item => item !== id);

            const originalBtn = document.querySelector(
                `.ingredient-btn[data-id="${id}"]`
            );

            if (originalBtn) {
                originalBtn.classList.remove("active");
            }

            displaySelected();
            filterRecipes();
        });

        wrapper.appendChild(span);
        wrapper.appendChild(removeBtn);

        selectedDiv.appendChild(wrapper);
    });
}

// =====================================================
// 🍲 FILTER RECIPES BY INGREDIENTS
// =====================================================

async function filterRecipes() {

    const snapshot = await getDocs(collection(db, "recipes"));

    recipeResults.innerHTML = "";
    let found = false;

    snapshot.forEach(docSnap => {

        const data = docSnap.data();

        const match = selectedIngredients.every(id =>
            data.ingredients?.includes(id)
        );

        if (match) {
            const card = createRecipeCard(docSnap.id, data);
            recipeResults.appendChild(card);
            found = true;
        }
    });

    if (!found) {
        recipeResults.innerHTML = "<p>No recipes found.</p>";
    }
}

// =====================================================
// 📂 LOAD RECIPE CATEGORIES
// =====================================================

async function loadRecipeCategories() {

    const snapshot = await getDocs(collection(db, "categories"));

    categoryContainer.innerHTML = "";

    snapshot.forEach(docSnap => {

        const data = docSnap.data();
        categoryMap[docSnap.id] = data.name;

        const btn = document.createElement("button");
        btn.textContent = data.name;

        btn.addEventListener("click", () => {
            filterByCategory(docSnap.id);
        });

        categoryContainer.appendChild(btn);
    });
}

// =====================================================
// 🍛 FILTER BY CATEGORY
// =====================================================

async function filterByCategory(categoryId) {

    const q = query(
        collection(db, "recipes"),
        where("categoryId", "==", categoryId)
    );

    const snapshot = await getDocs(q);

    recipeResults.innerHTML = "";
    let found = false;

    snapshot.forEach(docSnap => {
        const card = createRecipeCard(docSnap.id, docSnap.data());
        recipeResults.appendChild(card);
        found = true;
    });

    if (!found) {
        recipeResults.innerHTML = "<p>No recipes found.</p>";
    }
}

// =====================================================
// 📦 RECIPE CARD
// =====================================================

function createRecipeCard(id, data) {

    const div = document.createElement("div");
    div.classList.add("recipe-card");

    div.innerHTML = `
        <h4>${data.title}</h4>
        ${data.imageUrl ? `<img src="${data.imageUrl}" />` : ''}
        <a href="recipe.html?id=${id}" class="view-recipe-btn">View Recipe</a>
    `;

    return div;
}

// =====================================================
// 🆕 LATEST RECIPES
// =====================================================

function loadLatest() {

    const q = query(
        collection(db, "recipes"),
        orderBy("createdAt", "desc"),
        limit(5)
    );

    onSnapshot(q, snapshot => {

        latestContainer.innerHTML = "";

        snapshot.forEach(docSnap => {
            const div = createRecipeCard(docSnap.id, docSnap.data());
            latestContainer.appendChild(div);
        });

    });
}

// =====================================================
// 🔎 SEARCH BY TITLE
// =====================================================

recipeSearchInput.addEventListener("input", async () => {

    const text = recipeSearchInput.value.toLowerCase();
    const snapshot = await getDocs(collection(db, "recipes"));

    recipeResults.innerHTML = "";
    let found = false;

    snapshot.forEach(docSnap => {

        const data = docSnap.data();

        if (data.title?.toLowerCase().includes(text)) {
            const card = createRecipeCard(docSnap.id, data);
            recipeResults.appendChild(card);
            found = true;
        }
    });

    if (!found) {
        recipeResults.innerHTML = "<p>No recipes found.</p>";
    }
});

// =====================================================
// 🚀 INITIAL LOAD
// =====================================================

loadIngredientCategories();
loadRecipeCategories();
loadLatest();