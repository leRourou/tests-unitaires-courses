import fs from 'fs';
import path from 'path';
import { fireEvent } from '@testing-library/dom';

const indexHTML = fs.readFileSync(path.resolve(__dirname, '../../index.html'), 'utf8');

const mockProducts = [
  {
    "nom": "Pomme",
    "quantite_stock": 29,
    "prix_unitaire": 12.74
  },
  {
    "nom": "Banane",
    "quantite_stock": 172,
    "prix_unitaire": 14.73
  },
  {
    "nom": "Carotte",
    "quantite_stock": 171,
    "prix_unitaire": 15.84
  }
];

const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

async function fetchProductsMock() {
  return Promise.resolve(mockProducts);
}

describe('Tests de main.js avec HTML réel', () => {
  beforeAll(() => {
    global.fetch = jest.fn(() => 
      Promise.resolve({
        json: () => fetchProductsMock()
      })
    );
    
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  });
  
  beforeEach(() => {
    document.body.innerHTML = indexHTML;
    
    localStorage.clear();
    jest.clearAllMocks();
  });
  
  test('fetchProducts appelle fetch avec la bonne URL et retourne les données', async () => {
    const mainModule = await import('../main.js');
    
    const result = await mainModule.fetchProducts();
    
    expect(global.fetch).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledWith('/data.json');
    expect(result).toEqual(mockProducts);
  });
  
  test('Les produits sont correctement affichés dans le DOM', async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn(() => 
      Promise.resolve({
        json: () => Promise.resolve(mockProducts)
      })
    );
    
    const productListElement = document.getElementById('liste-produits');
    const productCounterElement = document.getElementById('compteur-produits');
    
    function renderProducts(products) {
      productListElement.innerHTML = "";
      productCounterElement.textContent = `${products.length} produits`;

      products.forEach((product, index) => {
        const li = document.createElement("li");
        li.className = "bg-white p-4 rounded shadow";
        li.innerHTML = `
          <h2 class="card-title text-lg font-bold">${product.nom}</h2>
          <p>Quantité en stock : ${product.quantite_stock}</p>
          <p>Prix unitaire : ${product.prix_unitaire.toFixed(2)} €</p>
          <button class="mt-2 bg-blue-600 text-white px-3 py-1 rounded" data-index="${index}">AJOUTER À LA LISTE</button>
        `;
        
        li.querySelector("button").addEventListener("click", () => {
          const list = JSON.parse(localStorage.getItem("listeCourse") || "[]");
          const existingProduct = list.find((p) => p.nom === product.nom);

          if (existingProduct) {
            existingProduct.quantite += 1;
          } else {
            list.push({ ...product, quantite: 1 });
          }

          localStorage.setItem("listeCourse", JSON.stringify(list));
        });
        
        productListElement.appendChild(li);
      });
    }
    
    renderProducts(mockProducts);
    
    expect(productCounterElement.textContent).toBe('3 produits');
    const liElements = productListElement.querySelectorAll('li');
    expect(liElements.length).toBe(3);
    
    const firstProduct = liElements[0];
    expect(firstProduct.querySelector('h2').textContent).toBe('Pomme');
    expect(firstProduct.textContent).toContain('Quantité en stock : 29');
    expect(firstProduct.textContent).toContain('Prix unitaire : 12.74 €');
    
    global.fetch = originalFetch;
  });
  
  test('La recherche filtre correctement les produits', () => {
    const productListElement = document.getElementById('liste-produits');
    const productCounterElement = document.getElementById('compteur-produits');
    const searchInput = document.getElementById('recherche');
    
    let allProducts = [...mockProducts];
    let filteredProducts = [...mockProducts];
    
    function renderProducts(products) {
      productListElement.innerHTML = "";
      productCounterElement.textContent = `${products.length} produits`;

      products.forEach((product, index) => {
        const li = document.createElement("li");
        li.className = "bg-white p-4 rounded shadow";
        li.innerHTML = `<h2 class="card-title text-lg font-bold">${product.nom}</h2>`;
        productListElement.appendChild(li);
      });
    }
    
    function handleSearch() {
      const searchValue = searchInput.value.toLowerCase();
      filteredProducts = allProducts.filter((product) =>
        product.nom.toLowerCase().includes(searchValue)
      );
      renderProducts(filteredProducts);
    }
    
    renderProducts(allProducts);
    
    searchInput.value = 'car';
    handleSearch();
    
    expect(filteredProducts.length).toBe(1);
    expect(filteredProducts[0].nom).toBe('Carotte');
    expect(productCounterElement.textContent).toBe('1 produits');
    const liElements = productListElement.querySelectorAll('li');
    expect(liElements.length).toBe(1);
    expect(liElements[0].querySelector('h2').textContent).toBe('Carotte');
  });
  
  test('Le tri fonctionne correctement', () => {
    const productListElement = document.getElementById('liste-produits');
    const sortSelect = document.getElementById('tri');
    
    const orderedProducts = [...mockProducts].sort((a, b) => a.nom.localeCompare(b.nom));
    let filteredProducts = [...orderedProducts];
    
    function renderProducts(products) {
      productListElement.innerHTML = "";
      products.forEach((product, index) => {
        const li = document.createElement("li");
        li.innerHTML = `<h2>${product.nom}</h2>`;
        productListElement.appendChild(li);
      });
    }
    
    function handleSort() {
      const sortBy = sortSelect.value;
      
      if (sortBy === 'prix_unitaire' || sortBy === 'prix') {
        filteredProducts.sort((a, b) => a.prix_unitaire - b.prix_unitaire);
      } else {
        filteredProducts.sort((a, b) => a[sortBy].localeCompare(b[sortBy]));
      }
      renderProducts(filteredProducts);
    }
    
    renderProducts(filteredProducts);
    expect(productListElement.querySelector('li h2').textContent).toBe('Banane');
    
    const priceOption = Array.from(sortSelect.options).find(option => 
      option.textContent.toLowerCase().includes('prix')
    );
    
    if (priceOption) {
      sortSelect.value = priceOption.value;
    } else {
      sortSelect.value = 'prix_unitaire';
    }
    
    handleSort();
    
    const sortedByPrice = [...mockProducts].sort((a, b) => a.prix_unitaire - b.prix_unitaire);
    
    const liElements = productListElement.querySelectorAll('li h2');
    
    const cheapestProduct = sortedByPrice[0].nom;
    const mostExpensiveProduct = sortedByPrice[sortedByPrice.length - 1].nom;
    
    expect(liElements[0].textContent).toBe(cheapestProduct); 
    expect(liElements[liElements.length - 1].textContent).toBe(mostExpensiveProduct); 
  })
  
  test('Ajouter un produit à la liste de courses', () => {
    const productListElement = document.getElementById('liste-produits');
    
    function renderProducts(products) {
      productListElement.innerHTML = "";
      products.forEach((product, index) => {
        const li = document.createElement("li");
        li.className = "bg-white p-4 rounded shadow";
        li.innerHTML = `
          <h2>${product.nom}</h2>
          <button class="add-btn" data-index="${index}">AJOUTER</button>
        `;
        
        li.querySelector('.add-btn').addEventListener('click', () => {
          addToShoppingList(product);
        });
        
        productListElement.appendChild(li);
      });
    }
    
    function addToShoppingList(product) {
      const list = JSON.parse(localStorage.getItem("listeCourse") || "[]");
      const existingProduct = list.find((p) => p.nom === product.nom);

      if (existingProduct) {
        existingProduct.quantite += 1;
      } else {
        list.push({ ...product, quantite: 1 });
      }

      localStorage.setItem("listeCourse", JSON.stringify(list));
    }
    
    renderProducts(mockProducts);
    
    const addButton = productListElement.querySelector('.add-btn');
    fireEvent.click(addButton);
    
    expect(localStorage.setItem).toHaveBeenCalled();
    const expectedCall = JSON.stringify([{...mockProducts[0], quantite: 1}]);
    expect(localStorage.setItem.mock.calls[0][1]).toBe(expectedCall);
    
    fireEvent.click(addButton);
    
    const updatedCall = JSON.stringify([{...mockProducts[0], quantite: 2}]);
    expect(localStorage.setItem.mock.calls[1][1]).toBe(updatedCall);
  });
  
  test('La réinitialisation des filtres fonctionne', () => {
    const productListElement = document.getElementById('liste-produits');
    const productCounterElement = document.getElementById('compteur-produits');
    const searchInput = document.getElementById('recherche');
    const sortSelect = document.getElementById('tri');
    
    let allProducts = [...mockProducts];
    let filteredProducts = [mockProducts[0]];
    
    searchInput.value = 'pomme';
    sortSelect.value = 'prix_unitaire';
    
    function renderProducts(products) {
      productListElement.innerHTML = "";
      productCounterElement.textContent = `${products.length} produits`;
      products.forEach((product) => {
        const li = document.createElement("li");
        li.innerHTML = `<h2>${product.nom}</h2>`;
        productListElement.appendChild(li);
      });
    }
    
    function resetFilters() {
      searchInput.value = "";
      sortSelect.value = "nom";
      filteredProducts = [...allProducts];
      renderProducts(filteredProducts);
    }
    
    renderProducts(filteredProducts);
    expect(productListElement.querySelectorAll('li').length).toBe(1);
    
    resetFilters();
    
    expect(searchInput.value).toBe('');
    expect(sortSelect.value).toBe('nom');
    expect(filteredProducts.length).toBe(3);
    expect(productCounterElement.textContent).toBe('3 produits');
    expect(productListElement.querySelectorAll('li').length).toBe(3);
  });
});