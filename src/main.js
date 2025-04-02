// main.js

const productListElement = document.getElementById("liste-produits");
const productCounterElement = document.getElementById("compteur-produits");
const searchInput = document.getElementById("recherche");
const sortSelect = document.getElementById("tri");
const resetButton = document.getElementById("reset-filtres");

let allProducts = [];
let filteredProducts = [];

export const fetchProducts = async () => {
  const response = await fetch("/data.json");
  return await response.json();
};

const renderProducts = (products) => {
  productListElement.innerHTML = "";
  productCounterElement.textContent = `${products.length} produits`;

  products.forEach((product, index) => {
    const productElement = createProductElement(product, index);
    productListElement.appendChild(productElement);
  });
};

const createProductElement = (product, index) => {
  const li = document.createElement("li");
  li.className = "bg-white p-4 rounded shadow";
  li.innerHTML = `
    <h2 class="card-title text-lg font-bold">${product.nom}</h2>
    <p>Quantité en stock : ${product.quantite_stock}</p>
    <p>Prix unitaire : ${product.prix_unitaire.toFixed(2)} €</p>
    <button class="mt-2 bg-blue-600 text-white px-3 py-1 rounded" data-index="${index}">AJOUTER À LA LISTE</button>
  `;

  li.querySelector("button").addEventListener("click", () => {
    addToShoppingList(product);
  });

  return li;
};

const addToShoppingList = (product) => {
  const list = JSON.parse(localStorage.getItem("listeCourse") || "[]");
  const existingProduct = list.find((p) => p.nom === product.nom);

  if (existingProduct) {
    existingProduct.quantite += 1;
  } else {
    list.push({ ...product, quantite: 1 });
  }

  localStorage.setItem("listeCourse", JSON.stringify(list));
};

const handleSearch = () => {
  const searchValue = searchInput.value.toLowerCase();
  filteredProducts = allProducts.filter((product) =>
    product.nom.toLowerCase().includes(searchValue)
  );
  renderProducts(filteredProducts);
};

const handleSort = () => {
  const sortBy = sortSelect.value;
  filteredProducts.sort((a, b) => a[sortBy] > b[sortBy] ? 1 : -1);
  renderProducts(filteredProducts);
};

const resetFilters = () => {
  searchInput.value = "";
  sortSelect.value = "nom";
  filteredProducts = [...allProducts];
  renderProducts(filteredProducts);
};

const init = async () => {
  allProducts = await fetchProducts();
  filteredProducts = [...allProducts];
  renderProducts(allProducts);
  bindEventListeners();
};

const bindEventListeners = () => {
  searchInput.addEventListener("input", handleSearch);
  sortSelect.addEventListener("change", handleSort);
  resetButton.addEventListener("click", resetFilters);
};

init();
