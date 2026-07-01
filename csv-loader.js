/* ==========================================================================
   csv-loader.js
   Reads products.csv, converts rows into product objects, and exposes them
   on window.PERFECTWATCHHUB.products. Only the first 4 rows are ever shown, per spec.
   Edit products.csv (export from Excel) and refresh — no code changes needed.
   ========================================================================== */

window.PERFECTWATCHHUB = window.PERFECTWATCHHUB || {};

(function () {
  const CSV_PATH = 'products.csv';
  const STORAGE_KEY = 'perfectWatchHubCsv';
  const MAX_PRODUCTS = 4;
  let lastLoadedText = '';

  function parseCSV(text) {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const next = text[i + 1];

      if (inQuotes) {
        if (char === '"' && next === '"') { field += '"'; i++; }
        else if (char === '"') { inQuotes = false; }
        else { field += char; }
      } else {
        if (char === '"') inQuotes = true;
        else if (char === ',') { row.push(field); field = ''; }
        else if (char === '\r') { /* ignore */ }
        else if (char === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
        else field += char;
      }
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }
    return rows.filter(r => r.length > 1 || (r.length === 1 && r[0].trim() !== ''));
  }

  function rowsToObjects(rows) {
    const headers = rows[0].map(h => h.trim());
    return rows.slice(1).map(r => {
      const obj = {};
      headers.forEach((h, idx) => { obj[h] = (r[idx] !== undefined ? r[idx].trim() : ''); });
      obj.price = parseFloat(obj.price) || 0;
      obj.oldPrice = parseFloat(obj.oldPrice) || 0;
      obj.discount = parseFloat(obj.discount) || 0;
      obj.stock = parseInt(obj.stock, 10) || 0;
      obj.rating = parseFloat(obj.rating) || 0;
      obj.features = obj.features ? obj.features.split('|').map(f => f.trim()).filter(Boolean) : [];
      obj.images = [obj.image, obj.image2, obj.image3, obj.image4].filter(Boolean);
      return obj;
    });
  }

  async function loadProducts() {
    try {
      const storedText = localStorage.getItem(STORAGE_KEY);
      const text = storedText || await fetch(CSV_PATH, { cache: 'no-store' }).then(res => {
        if (!res.ok) throw new Error('CSV not found: ' + res.status);
        return res.text();
      });
      if (!text) throw new Error('Empty CSV');
      const rows = parseCSV(text);
      const all = rowsToObjects(rows);
      window.PERFECTWATCHHUB.products = all.slice(0, MAX_PRODUCTS);
      lastLoadedText = text;
    } catch (err) {
      console.error('Perfect Watch Hub: failed to load product CSV', err);
      window.PERFECTWATCHHUB.products = [];
    }
    document.dispatchEvent(new CustomEvent('perfectwatchhub:products-ready', { detail: window.PERFECTWATCHHUB.products }));
  }

  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY && event.newValue && event.newValue !== lastLoadedText) {
      loadProducts();
    }
  });

  setInterval(() => {
    const currentText = localStorage.getItem(STORAGE_KEY) || '';
    if (currentText && currentText !== lastLoadedText) {
      loadProducts();
    }
  }, 1200);

  loadProducts();
})();
