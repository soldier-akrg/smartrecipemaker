import { db } from "./firebase-config.js";
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

// DOM Elements
const recipeResults = document.querySelector(".RecipeResults");

// =====================================================
// 📦 CREATE RECIPE CARD
// =====================================================
function createRecipeCard(id, data) {
    const div = document.createElement("div");
    div.classList.add("recipe-card");
    div.innerHTML = `
        ${data.imageUrl ? `<img src="${data.imageUrl}" alt="${data.title}"/>` : ''}
        <h3>${data.title}</h3>
        <p>Prep: ${data.prep || 'N/A'} | Cook: ${data.cook || 'N/A'}</p>
        <a href="recipe.html?id=${id}" class="view-recipe-btn">View Recipe</a>
    `;
    return div;
}

// =====================================================
// 🍲 LOAD ALL RECIPES GROUPED BY CATEGORY
// =====================================================
async function loadRecipesByCategory() {
    recipeResults.innerHTML = "<h2>All Recipes by Category:</h2>";

    // Step 1: Get all categories
    const categoriesSnap = await getDocs(collection(db, "categories"));
    const categories = [];
    categoriesSnap.forEach(doc => {
        categories.push({ id: doc.id, name: doc.data().name });
    });

    // Step 2: Get all recipes
    const recipesSnap = await getDocs(collection(db, "recipes"));
    const recipes = [];
    recipesSnap.forEach(doc => {
        const data = doc.data();
        recipes.push({ id: doc.id, ...data });
    });

    // Step 3: Group recipes by category
    categories.forEach(cat => {
        const catRecipes = recipes.filter(r => r.categoryId === cat.id);

        if (catRecipes.length > 0) {
            // Category title
            const catTitle = document.createElement("h3");
            catTitle.textContent = cat.name;
            recipeResults.appendChild(catTitle);

            // Container for recipe cards
            const container = document.createElement("div");
            container.classList.add("recipes-container"); // use your grid styling

            catRecipes.forEach(recipe => {
                const card = createRecipeCard(recipe.id, recipe);
                container.appendChild(card);
            });

            recipeResults.appendChild(container);
        }
    });
}

// =====================================================
// 🚀 INITIAL LOAD
// =====================================================
document.addEventListener("DOMContentLoaded", () => {
    loadRecipesByCategory();
});