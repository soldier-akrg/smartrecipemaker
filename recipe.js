import { db } from "./firebase-config.js";
import { doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";




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
// 🔹 Get recipe ID from URL
const urlParams = new URLSearchParams(window.location.search);
const recipeId = urlParams.get("id");

const titleEl = document.getElementById("recipeTitle");
const authorEl = document.getElementById("recipeAuthor");
const imageEl = document.getElementById("recipeImage");
const ingredientsEl = document.getElementById("recipeIngredients");
const procedureEl = document.getElementById("recipeProcedure");

if (!recipeId) {
  titleEl.textContent = "Recipe not found!";
} else {
  displayRecipe(recipeId);
}

// 🔹 Main function to fetch and display recipe
async function displayRecipe(id) {
  const docRef = doc(db, "recipes", id);
  const snap = await getDoc(docRef);

  if (!snap.exists()) {
    titleEl.textContent = "Recipe not found!";
    return;
  }

  const data = snap.data();
  titleEl.textContent = data.title;
  authorEl.textContent = `By: ${data.createdByName || data.createdBy}`;
  procedureEl.textContent = data.procedure;

  if (data.imageUrl) {
    imageEl.src = data.imageUrl;
    imageEl.style.display = "block";
  }

  // 🔹 Fetch ingredient names from IDs
  if (data.ingredients && data.ingredients.length > 0) {
    ingredientsEl.innerHTML = ""; // clear
    const ingredientsSnapshot = await getDocs(collection(db, "ingredients"));
    const ingredientsMap = {};
    ingredientsSnapshot.forEach(docSnap => {
      ingredientsMap[docSnap.id] = docSnap.data().name;
    });

    data.ingredients.forEach(id => {
      const li = document.createElement("li");
      li.textContent = ingredientsMap[id] || "Unknown Ingredient";
      ingredientsEl.appendChild(li);
    });
  } else {
    ingredientsEl.innerHTML = "<li>No ingredients listed</li>";
  }
}