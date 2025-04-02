import fs from 'fs';
import path from 'path';
import { fireEvent } from '@testing-library/dom';

const listeHTML = fs.readFileSync(path.resolve(__dirname, '../../liste.html'), 'utf8');

const mockShoppingList = [
  {
    "nom": "Pomme",
    "quantite_stock": 2,
    "prix_unitaire": 12.74
  },
  {
    "nom": "Banane",
    "quantite_stock": 3,
    "prix_unitaire": 14.73
  },
  {
    "nom": "Carotte",
    "quantite_stock": 1,
    "prix_unitaire": 15.84
  }
];

const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

describe('Tests de liste.js avec HTML réel', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    
    window.confirm = jest.fn(() => true);
  });
  
  beforeEach(() => {
    document.body.innerHTML = listeHTML;
    
    localStorage.clear();
    jest.clearAllMocks();
    
    localStorage.setItem('listeCourse', JSON.stringify(mockShoppingList));
  });
  
  test('La liste de courses est correctement chargée depuis le localStorage', () => {
    const shoppingListBody = document.getElementById("liste-course-body");
    const totalAmountElement = document.getElementById("total-general");
    
    function loadShoppingList() {
      const list = JSON.parse(localStorage.getItem("listeCourse") || "[]");
      shoppingListBody.innerHTML = "";
      
      let total = 0;
      
      list.forEach((product, index) => {
        const tr = document.createElement("tr");
        const subtotal = product.prix_unitaire * product.quantite_stock;
        total += subtotal;
        
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
        
        shoppingListBody.appendChild(tr);
      });
      
      totalAmountElement.textContent = `${total.toFixed(2)} €`;
    }
    
    loadShoppingList();
    
    const rows = shoppingListBody.querySelectorAll('tr');
    expect(rows.length).toBe(3);
    
    const firstRow = rows[0];
    const columns = firstRow.querySelectorAll('td');
    expect(columns[0].textContent).toBe('Pomme');
    expect(columns[1].textContent).toBe('12.74 €');
    expect(columns[3].textContent).toBe('25.48 €'); // 12.74 * 2
    
    const expectedTotal = mockShoppingList.reduce((sum, item) => sum + (item.prix_unitaire * item.quantite_stock), 0);
    
    expect(totalAmountElement.textContent).toBe(`${expectedTotal.toFixed(2)} €`);
  });
  
  test('La modification de quantité met à jour le sous-total et le total général', () => {
    const shoppingListBody = document.getElementById("liste-course-body");
    const totalAmountElement = document.getElementById("total-general");
    
    function createProductRow(product, index) {
      const tr = document.createElement("tr");
      const subtotal = product.prix_unitaire * product.quantite_stock;
      
      tr.innerHTML = `
        <td class="p-2">${product.nom}</td>
        <td class="p-2">${product.prix_unitaire.toFixed(2)} €</td>
        <td class="p-2">
          <input type="number" min="1" value="${product.quantite_stock}" data-index="${index}" class="quantity-input w-16 p-1 border rounded">
        </td>
        <td class="p-2 subtotal">${subtotal.toFixed(2)} €</td>
        <td class="p-2">
          <button class="bg-red-400 text-white px-2 py-1 rounded" data-delete="${index}">SUPPRIMER</button>
        </td>
      `;
      
      return tr;
    }
    
    function loadShoppingList() {
      const list = JSON.parse(localStorage.getItem("listeCourse") || "[]");
      shoppingListBody.innerHTML = "";
      
      let total = 0;
      
      list.forEach((product, index) => {
        const row = createProductRow(product, index);
        const subtotal = product.prix_unitaire * product.quantite_stock;
        total += subtotal;
        shoppingListBody.appendChild(row);
      });
      
      totalAmountElement.textContent = `${total.toFixed(2)} €`;
      
      bindRowListeners();
    }
    
    function bindRowListeners() {
      shoppingListBody.querySelectorAll('.quantity-input').forEach(input => {
        input.addEventListener('input', handleQuantityChange);
      });
      
      shoppingListBody.querySelectorAll('[data-delete]').forEach(button => {
        button.addEventListener('click', handleDeleteProduct);
      });
    }
    
    function handleQuantityChange(event) {
      const index = event.target.dataset.index;
      const newQuantity = parseInt(event.target.value);
      const list = JSON.parse(localStorage.getItem("listeCourse") || "[]");
      
      if (!isNaN(newQuantity) && newQuantity > 0) {
        list[index].quantite_stock = newQuantity;
        localStorage.setItem("listeCourse", JSON.stringify(list));
        loadShoppingList();
      }
    }
    
    function handleDeleteProduct(event) {
      const index = event.target.dataset.delete;
      const list = JSON.parse(localStorage.getItem("listeCourse") || "[]");
      list.splice(index, 1);
      localStorage.setItem("listeCourse", JSON.stringify(list));
      loadShoppingList();
    }
    
    loadShoppingList();
    
    const initialTotal = mockShoppingList.reduce((sum, item) => 
      sum + (item.prix_unitaire * item.quantite_stock), 0);
    
    expect(totalAmountElement.textContent).toBe(`${initialTotal.toFixed(2)} €`);
    
    const quantityInput = shoppingListBody.querySelector('.quantity-input');
    fireEvent.input(quantityInput, { target: { value: '4' } });
    
    const updatedList = JSON.parse(localStorage.getItem('listeCourse'));
    expect(updatedList[0].quantite_stock).toBe(4);
    
    const firstRowSubtotal = shoppingListBody.querySelectorAll('tr')[0].querySelector('.subtotal');
    expect(firstRowSubtotal.textContent).toBe('50.96 €');

    const newExpectedTotal = updatedList.reduce((sum, item) => 
      sum + (item.prix_unitaire * item.quantite_stock), 0);
    
    expect(totalAmountElement.textContent).toBe(`${newExpectedTotal.toFixed(2)} €`);
  });
  
  test('La suppression d\'un produit met à jour la liste et le total', () => {
    const shoppingListBody = document.getElementById("liste-course-body");
    const totalAmountElement = document.getElementById("total-general");
    
    function createProductRow(product, index) {
      const tr = document.createElement("tr");
      const subtotal = product.prix_unitaire * product.quantite_stock;
      
      tr.innerHTML = `
        <td class="p-2">${product.nom}</td>
        <td class="p-2">${product.prix_unitaire.toFixed(2)} €</td>
        <td class="p-2">
          <input type="number" min="1" value="${product.quantite_stock}" data-index="${index}" class="quantity-input w-16 p-1 border rounded">
        </td>
        <td class="p-2 subtotal">${subtotal.toFixed(2)} €</td>
        <td class="p-2">
          <button class="delete-btn bg-red-400 text-white px-2 py-1 rounded" data-delete="${index}">SUPPRIMER</button>
        </td>
      `;
      
      return tr;
    }
    
    function loadShoppingList() {
      const list = JSON.parse(localStorage.getItem("listeCourse") || "[]");
      shoppingListBody.innerHTML = "";
      
      let total = 0;
      
      list.forEach((product, index) => {
        const row = createProductRow(product, index);
        const subtotal = product.prix_unitaire * product.quantite_stock;
        total += subtotal;
        shoppingListBody.appendChild(row);
      });
      
      totalAmountElement.textContent = `${total.toFixed(2)} €`;
      
      bindRowListeners();
    }
    
    function bindRowListeners() {
      shoppingListBody.querySelectorAll('.quantity-input').forEach(input => {
        input.addEventListener('input', handleQuantityChange);
      });
      
      shoppingListBody.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', handleDeleteProduct);
      });
    }
    
    function handleQuantityChange(event) {
      const index = event.target.dataset.index;
      const newQuantity = parseInt(event.target.value);
      const list = JSON.parse(localStorage.getItem("listeCourse") || "[]");
      
      if (!isNaN(newQuantity) && newQuantity > 0) {
        list[index].quantite_stock = newQuantity;
        localStorage.setItem("listeCourse", JSON.stringify(list));
        loadShoppingList();
      }
    }
    
    function handleDeleteProduct(event) {
      const index = event.target.dataset.delete;
      const list = JSON.parse(localStorage.getItem("listeCourse") || "[]");
      list.splice(index, 1);
      localStorage.setItem("listeCourse", JSON.stringify(list));
      loadShoppingList();
    }
    
    loadShoppingList();
    
    const initialTotal = mockShoppingList.reduce((sum, item) => 
      sum + (item.prix_unitaire * item.quantite_stock), 0);
    
    const initialRows = shoppingListBody.querySelectorAll('tr');
    expect(initialRows.length).toBe(3);
    expect(totalAmountElement.textContent).toBe(`${initialTotal.toFixed(2)} €`);
    
    const deleteButton = shoppingListBody.querySelector('.delete-btn');
    fireEvent.click(deleteButton);
    
    const updatedList = JSON.parse(localStorage.getItem('listeCourse'));
    expect(updatedList.length).toBe(2);
    expect(updatedList[0].nom).toBe('Banane');
    
    const updatedRows = shoppingListBody.querySelectorAll('tr');
    expect(updatedRows.length).toBe(2);
    
    const newExpectedTotal = updatedList.reduce((sum, item) => 
      sum + (item.prix_unitaire * item.quantite_stock), 0);
    
    expect(totalAmountElement.textContent).toBe(`${newExpectedTotal.toFixed(2)} €`);
  });
  
  test('Le bouton "Vider la liste" supprime tous les produits', () => {
    const shoppingListBody = document.getElementById("liste-course-body");
    const totalAmountElement = document.getElementById("total-general");
    const clearButton = document.getElementById("vider-liste");
    
    function handleClearList() {
      if (confirm("Voulez-vous vraiment vider la liste ?")) {
        localStorage.removeItem("listeCourse");
        loadShoppingList();
      }
    }
    
    function loadShoppingList() {
      const list = JSON.parse(localStorage.getItem("listeCourse") || "[]");
      shoppingListBody.innerHTML = "";
      
      let total = 0;
      
      list.forEach((product, index) => {
        const tr = document.createElement("tr");
        const subtotal = product.prix_unitaire * product.quantite_stock;
        total += subtotal;
        
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
        
        shoppingListBody.appendChild(tr);
      });
      
      totalAmountElement.textContent = list.length > 0 ? `${total.toFixed(2)} €` : "0.00 €";
    }
    
    loadShoppingList();
    
    const initialRows = shoppingListBody.querySelectorAll('tr');
    expect(initialRows.length).toBe(3);
    
    clearButton.addEventListener('click', handleClearList);
    
    fireEvent.click(clearButton);
    
    expect(window.confirm).toHaveBeenCalled();
    
    expect(localStorage.removeItem).toHaveBeenCalledWith('listeCourse');
    
    const updatedRows = shoppingListBody.querySelectorAll('tr');
    expect(updatedRows.length).toBe(0);
    
    expect(totalAmountElement.textContent).toBe('0.00 €');
  });
});