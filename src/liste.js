// liste.js

const shoppingListBody = document.getElementById("liste-course-body");
const totalAmountElement = document.getElementById("total-general");
const clearButton = document.getElementById("vider-liste");

const loadShoppingList = () => {
    const shoppingList = getShoppingList();
    shoppingListBody.innerHTML = "";

    let total = 0;

    shoppingList.forEach((product, index) => {
        const row = createProductRow(product, index);
        const subtotal = product.prix_unitaire * product.quantite_stock;
        total += subtotal;
        shoppingListBody.appendChild(row);
    });

    totalAmountElement.textContent = `${total.toFixed(2)} €`;

    bindRowListeners();
};

const getShoppingList = () => {
    return JSON.parse(localStorage.getItem("listeCourse") || "[]");
};

const saveShoppingList = (list) => {
    localStorage.setItem("listeCourse", JSON.stringify(list));
};

const createProductRow = (product, index) => {
    const tr = document.createElement("tr");
    const subtotal = product.prix_unitaire * product.quantite_stock;

    tr.innerHTML = `
    <td class="p-2">${product.nom}</td>
    <td class="p-2">${product.prix_unitaire.toFixed(2)} €</td>
    <td class="p-2">
      <input type="number" min="1" value="${product.quantite_stock}" data-index="${index}" class="w-16 p-1 border rounded">
    </td>
    <td class="p-2">${subtotal.toFixed(2)} €</td>
    <td class="p-2">
      <button class="bg-red-400 text-white px-2 py-1 rounded" data-delete="${index}">SUPPRIMER</button>
    </td>
  `;

    return tr;
};

const bindRowListeners = () => {
    shoppingListBody.querySelectorAll('input[type="number"]').forEach(
        (input) => {
            input.addEventListener("input", handleQuantityChange);
        },
    );

    shoppingListBody.querySelectorAll("[data-delete]").forEach((button) => {
        button.addEventListener("click", handleDeleteProduct);
    });
};

const handleQuantityChange = (event) => {
    const index = event.target.dataset.index;
    const newQuantity = parseInt(event.target.value);
    const list = getShoppingList();

    if (!isNaN(newQuantity) && newQuantity > 0) {
        list[index].quantite_stock = newQuantity;
        saveShoppingList(list);
        loadShoppingList();
    }
};

const handleDeleteProduct = (event) => {
    const index = event.target.dataset.delete;
    const list = getShoppingList();
    list.splice(index, 1);
    saveShoppingList(list);
    loadShoppingList();
};

const handleClearList = () => {
    if (confirm("Voulez-vous vraiment vider la liste ?")) {
        localStorage.removeItem("listeCourse");
        loadShoppingList();
    }
};

clearButton.addEventListener("click", handleClearList);

loadShoppingList();
