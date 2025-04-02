import '@testing-library/jest-dom';

const localStorageMock = (function() {
  let store = {};
  return {
    getItem: function(key) {
      return store[key] || null;
    },
    setItem: function(key, value) {
      store[key] = value.toString();
    },
    removeItem: function(key) {
      delete store[key];
    },
    clear: function() {
      store = {};
    }
  };
})();

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
  })
);

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

beforeEach(() => {
  window.localStorage.clear();
  document.body.innerHTML = '';
  jest.clearAllMocks();
});