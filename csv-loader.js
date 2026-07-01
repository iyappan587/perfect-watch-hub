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

  const FALLBACK_PRODUCTS = [
    {
      id: 1,
      name: 'Classic Royal',
      brand: 'Perfect Watch Hub',
      category: 'Formal',
      price: 12999,
      oldPrice: 14999,
      discount: 13,
      description: 'A refined gold-toned watch for office wear, family events, and festive occasions.',
      features: ['Stainless Steel', 'Date Display', 'Water Resistant', 'Gift Friendly'],
      stock: 12,
      rating: 4.8,
      images: [
        'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1533139502658-0198f920d8e8?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=900&q=80'
      ],
      badge: 'Best Seller',
      color: 'Gold',
      gender: 'Men',
      delivery: 'Fast Delivery',
      productLink: ''
    },
    {
      id: 2,
      name: 'Smart Sport',
      brand: 'Perfect Watch Hub',
      category: 'Sports',
      price: 15999,
      oldPrice: 18999,
      discount: 15,
      description: 'A sporty watch with a bold dial and durable strap for daily use and travel.',
      features: ['Chronograph', 'Shock Resistant', 'Luminous Hands', 'Comfort Strap'],
      stock: 8,
      rating: 4.7,
      images: [
        'https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1596519135081-eebfe4e2b9de?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1523170335258-f5c216a8f2a1?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?auto=format&fit=crop&w=900&q=80'
      ],
      badge: 'New Arrival',
      color: 'Silver',
      gender: 'Unisex',
      delivery: 'Fast Delivery',
      productLink: ''
    },
    {
      id: 3,
      name: 'Elegant Sheen',
      brand: 'Perfect Watch Hub',
      category: 'Luxury',
      price: 10999,
      oldPrice: 12999,
      discount: 15,
      description: 'A slim and graceful watch designed for women who love simple elegance and comfort.',
      features: ['Quartz', 'Slim Case', 'Leather Strap', 'Easy to Wear'],
      stock: 14,
      rating: 4.6,
      images: [
        'https://images.unsplash.com/photo-1585123334904-845d60e97b29?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1622434641406-a158123450f9?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1495856458515-0637185db551?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1622434641057-6ee76a7bda6a?auto=format&fit=crop&w=900&q=80'
      ],
      badge: 'Limited Edition',
      color: 'Rose Gold',
      gender: 'Women',
      delivery: 'Fast Delivery',
      productLink: ''
    },
    {
      id: 4,
      name: 'Adventure Pro',
      brand: 'Perfect Watch Hub',
      category: 'Diver',
      price: 18999,
      oldPrice: 21999,
      discount: 13,
      description: 'A strong everyday watch with a classic look and dependable finish for active lifestyles.',
      features: ['Water Resistant', 'Bold Bezel', 'Durable Case', 'Easy Grip'],
      stock: 10,
      rating: 4.9,
      images: [
        'https://images.unsplash.com/photo-1548171915-e79a380a2a4b?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1548169874-53e85f753f1e?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=900&q=80'
      ],
      badge: 'Trending',
      color: 'Black',
      gender: 'Men',
      delivery: 'Fast Delivery',
      productLink: ''
    }
  ];

  function normalizeProduct(product) {
    const normalized = { ...product };
    normalized.id = String(normalized.id ?? '');
    normalized.price = parseFloat(normalized.price) || 0;
    normalized.oldPrice = parseFloat(normalized.oldPrice) || 0;
    normalized.discount = parseFloat(normalized.discount) || 0;
    normalized.stock = parseInt(normalized.stock, 10) || 0;
    normalized.rating = parseFloat(normalized.rating) || 0;
    normalized.features = Array.isArray(normalized.features)
      ? normalized.features
      : String(normalized.features || '').split('|').map(f => f.trim()).filter(Boolean);
    normalized.images = Array.isArray(normalized.images)
      ? normalized.images.filter(Boolean)
      : [normalized.image, normalized.image2, normalized.image3, normalized.image4].filter(Boolean);
    return normalized;
  }

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

  function notifyProductsReady() {
    document.dispatchEvent(new CustomEvent('perfectwatchhub:products-ready', {
      detail: window.PERFECTWATCHHUB.products
    }));
  }

  async function loadProducts() {
    let products = [];
    let text = '';

    try {
      const storedText = localStorage.getItem(STORAGE_KEY);
      if (storedText) {
        text = storedText;
      } else {
        const response = await fetch(CSV_PATH, { cache: 'no-store' });
        if (!response.ok) throw new Error('CSV not found: ' + response.status);
        text = await response.text();
      }

      if (!text) throw new Error('Empty CSV');
      const rows = parseCSV(text);
      if (!rows.length) throw new Error('No rows in CSV');
      const all = rowsToObjects(rows).map(normalizeProduct);
      products = all.filter(product => product.name || product.id);
      lastLoadedText = text;
      try { localStorage.setItem(STORAGE_KEY, text); } catch {}
    } catch (err) {
      console.warn('Perfect Watch Hub: falling back to built-in products', err);
      products = FALLBACK_PRODUCTS.map(normalizeProduct);
    }

    window.PERFECTWATCHHUB.products = products.slice(0, MAX_PRODUCTS);
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', notifyProductsReady, { once: true });
    } else {
      setTimeout(notifyProductsReady, 0);
    }
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
