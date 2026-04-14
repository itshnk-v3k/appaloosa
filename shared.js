// ==========================================
// APPALOOSA — SHARED JS
// ==========================================

// ---- CART STATE ----
let cartItems = JSON.parse(localStorage.getItem('appaloosa_cart') || '[]');

function saveCart() {
  localStorage.setItem('appaloosa_cart', JSON.stringify(cartItems));
}

const colorNames = {
  '#F5EFE0': 'Cream',
  '#6B1A1A': 'Burgundy',
  '#3D3528': 'Espresso',
  '#B0A690': 'Sand',
  '#4A1010': 'Deep Wine',
  '#1A1410': 'Onyx',
  '#EAE0CC': 'Parchment',
};

// ---- CART UI ----
function updateCartBadge() {
  const count = cartItems.reduce((s, i) => s + i.qty, 0);
  document.querySelectorAll('.cart-badge').forEach((el) => {
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

function openCart() {
  renderCart();
  document.getElementById('cartOverlay').classList.add('open');
  document.getElementById('cartDrawer').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cartOverlay')?.classList.remove('open');
  document.getElementById('cartDrawer')?.classList.remove('open');
  document.body.style.overflow = '';
}

function renderCart() {
  const itemsEl = document.getElementById('cartItems');
  const footerEl = document.getElementById('cartFooter');
  const countEl = document.getElementById('cartCount');
  const totalEl = document.getElementById('cartTotal');
  if (!itemsEl) return;

  const total = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
  const count = cartItems.reduce((s, i) => s + i.qty, 0);

  if (countEl) countEl.textContent = count + ' item' + (count !== 1 ? 's' : '');
  if (totalEl) totalEl.textContent = '€' + total;
  updateCartBadge();

  if (cartItems.length === 0) {
    itemsEl.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🛍</div>
        <h3 class="cart-empty-title">Your cart is empty</h3>
        <p class="cart-empty-body">Add a piece you love and it will appear here.</p>
      </div>`;
    if (footerEl) footerEl.style.display = 'none';
    return;
  }

  if (footerEl) footerEl.style.display = 'block';
  itemsEl.innerHTML = cartItems
    .map(
      (item) => `
    <div class="cart-item">
      <div class="cart-item-img"></div>
      <div>
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-meta">${item.meta}</div>
        <div class="cart-item-qty">
          <button class="cart-qty-btn" onclick="changeQty(${item.id}, -1)">−</button>
          <span class="cart-qty-num">${item.qty}</span>
          <button class="cart-qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
        </div>
        <span class="cart-item-remove" onclick="removeFromCart(${item.id})">Remove</span>
      </div>
      <div class="cart-item-price">€${item.price * item.qty}</div>
    </div>
  `,
    )
    .join('');
}

function changeQty(id, delta) {
  const item = cartItems.find((i) => i.id === id);
  if (!item) return;
  item.qty = item.qty + delta;
  if (item.qty <= 0) {
    cartItems = cartItems.filter((i) => i.id !== id);
  }
  saveCart();
  renderCart();
}

function removeFromCart(id) {
  cartItems = cartItems.filter((i) => i.id !== id);
  saveCart();
  renderCart();
}

function addToCart(name, price, meta) {
  const priceNum = parseInt(String(price).replace(/[^0-9]/g, ''));
  const metaStr = meta || '';
  const existing = cartItems.find((i) => i.name === name && i.meta === metaStr);
  if (existing) {
    existing.qty++;
  } else {
    cartItems.push({ id: Date.now(), name, meta: metaStr, price: priceNum, qty: 1 });
  }
  saveCart();
  updateCartBadge();

  // Flash badge
  const badge = document.querySelector('.cart-badge');
  if (badge) {
    badge.style.transform = 'scale(1.6)';
    setTimeout(() => (badge.style.transform = ''), 300);
  }
  openCart();
}

// ---- PRODUCT MODAL ----
let currentSlide = 0;
const TOTAL_SLIDES = 3;
let currentModalProduct = null;

function openProductModal(name, price, origPrice, sizes, colors) {
  currentModalProduct = { name, price };
  const modal = document.getElementById('productModal');
  if (!modal) return;

  document.getElementById('modalTitle').textContent = name;
  document.getElementById('modalPrice').innerHTML = origPrice
    ? `<s>${origPrice}</s> <strong>${price}</strong>`
    : `<strong>${price}</strong>`;

  // Colors
  const colorsWrap = document.getElementById('modalColorsWrap');
  const colorsEl = document.getElementById('modalColors');
  if (colors && colors.length) {
    colorsWrap.style.display = 'block';
    colorsEl.innerHTML = '';
    colors.forEach((c, i) => {
      const btn = document.createElement('button');
      btn.className = 'modal-color-swatch' + (i === 0 ? ' active' : '');
      btn.style.background = c;
      btn.title = colorNames[c] || c;
      btn.onclick = function () {
        document.querySelectorAll('.modal-color-swatch').forEach((b) => b.classList.remove('active'));
        this.classList.add('active');
        document.getElementById('modalColorName').textContent = colorNames[c] || c;
      };
      colorsEl.appendChild(btn);
    });
    document.getElementById('modalColorName').textContent = colorNames[colors[0]] || colors[0];
  } else {
    colorsWrap.style.display = 'none';
  }

  // Sizes
  const sizesWrap = document.getElementById('modalSizesWrap');
  const sizesEl = document.getElementById('modalSizes');
  if (sizes && sizes.length) {
    sizesWrap.style.display = 'block';
    sizesEl.innerHTML = '';
    sizes.forEach((s, i) => {
      const btn = document.createElement('button');
      btn.className = 'modal-size-btn' + (i === 0 ? ' active' : '');
      btn.textContent = s;
      btn.onclick = function () {
        if (this.classList.contains('sold-out')) return;
        document.querySelectorAll('.modal-size-btn').forEach((b) => b.classList.remove('active'));
        this.classList.add('active');
      };
      sizesEl.appendChild(btn);
    });
  } else {
    sizesWrap.style.display = 'none';
  }

  goToSlide(0);
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeProductModal() {
  document.getElementById('productModal')?.classList.remove('active');
  document.body.style.overflow = '';
}

function addToCartFromModal() {
  if (!currentModalProduct) return;
  const selectedSize = document.querySelector('.modal-size-btn.active');
  const selectedColor = document.querySelector('.modal-color-swatch.active');
  const sizeName = selectedSize ? selectedSize.textContent : '';
  const colorName = selectedColor ? colorNames[selectedColor.style.background] || '' : '';
  const meta = [colorName, sizeName ? 'Size ' + sizeName : ''].filter(Boolean).join(' · ');
  addToCart(currentModalProduct.name, currentModalProduct.price, meta);
  closeProductModal();
}

function slideGallery(dir) {
  goToSlide((currentSlide + dir + TOTAL_SLIDES) % TOTAL_SLIDES);
}

function goToSlide(idx) {
  currentSlide = idx;
  const wrapper = document.getElementById('gallerySlides');
  if (wrapper) wrapper.style.transform = `translateX(-${idx * 100}%)`;
  document.querySelectorAll('#galleryDots .product-modal-thumb').forEach((d, i) => {
    d.classList.toggle('active', i === idx);
  });
}

// Touch swipe
document.addEventListener('DOMContentLoaded', () => {
  const gallery = document.getElementById('modalGallery');
  if (gallery) {
    let tx = 0;
    gallery.addEventListener(
      'touchstart',
      (e) => {
        tx = e.touches[0].clientX;
      },
      { passive: true },
    );
    gallery.addEventListener(
      'touchend',
      (e) => {
        const dx = e.changedTouches[0].clientX - tx;
        if (Math.abs(dx) > 40) slideGallery(dx < 0 ? 1 : -1);
      },
      { passive: true },
    );
  }
});

// ---- SEARCH ----
const allProducts = [
  {
    name: 'Classic Linen Shirt',
    price: '€89',
    badge: 'New',
    cat: ['tops', 'new-arrivals'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['#F5EFE0', '#6B1A1A', '#3D3528', '#B0A690'],
  },
  {
    name: 'Heritage Polo',
    price: '€129',
    origPrice: '€169',
    cat: ['tops', 'new-arrivals'],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['#4A1010', '#1A1410', '#F5EFE0'],
  },
  {
    name: 'Equestrian Jacket',
    price: '€249',
    badge: 'Limited',
    cat: ['outerwear', 'new-arrivals'],
    sizes: ['XS', 'S', 'M', 'L'],
    colors: ['#3D3528', '#6B1A1A'],
  },
  {
    name: 'Silk Scarf — Spotted',
    price: '€65',
    cat: ['accessories'],
    colors: ['#6B1A1A', '#B0A690', '#F5EFE0', '#4A1010'],
  },
  {
    name: 'Wide-Leg Linen Trouser',
    price: '€119',
    cat: ['bottoms', 'women'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['#F5EFE0', '#3D3528'],
  },
  {
    name: 'Cotton Shirt Dress',
    price: '€145',
    cat: ['women'],
    sizes: ['XS', 'S', 'M', 'L'],
    colors: ['#F5EFE0', '#6B1A1A'],
  },
  {
    name: 'Tailored Blazer',
    price: '€299',
    cat: ['outerwear', 'women', 'men'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['#3D3528', '#1A1410'],
  },
  {
    name: 'Merino Crew Neck',
    price: '€89',
    origPrice: '€110',
    badge: 'Sale',
    cat: ['tops', 'men', 'sale'],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['#F5EFE0', '#6B1A1A', '#1A1410'],
  },
  {
    name: 'Linen Blazer',
    price: '€229',
    cat: ['outerwear', 'men'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['#EAE0CC', '#3D3528'],
  },
  {
    name: 'Spot-Print Scarf',
    price: '€55',
    origPrice: '€75',
    badge: 'Sale',
    cat: ['accessories', 'sale'],
    colors: ['#6B1A1A', '#F5EFE0'],
  },
  { name: 'Canvas Tote', price: '€45', cat: ['accessories'], colors: ['#F5EFE0', '#3D3528'] },
  {
    name: 'Slim Trousers',
    price: '€139',
    cat: ['bottoms', 'men'],
    sizes: ['28', '30', '32', '34', '36'],
    colors: ['#3D3528', '#1A1410', '#EAE0CC'],
  },
];

const allArticles = [
  { title: 'The Art of Dressing for the In-Between Season', tag: 'Style', date: 'May 2025', slug: 'in-between-season' },
  { title: 'Behind the Seam: Our Portuguese Artisans', tag: 'Craft', date: 'April 2025', slug: 'portuguese-artisans' },
  { title: 'On Slowness: A Case for the Unhurried Life', tag: 'Living', date: 'March 2025', slug: 'on-slowness' },
  {
    title: 'Natural Fibres and Why Well Never Stop Choosing Them',
    tag: 'Sustainability',
    date: 'Feb 2025',
    slug: 'natural-fibres',
  },
  {
    title: 'Five Ways to Wear the Equestrian Jacket Year-Round',
    tag: 'Style',
    date: 'Jan 2025',
    slug: 'equestrian-jacket',
  },
  {
    title: 'The Appaloosa Horse: Symbol of a Free-Spirited Life',
    tag: 'Culture',
    date: 'Dec 2024',
    slug: 'appaloosa-horse',
  },
];

function openSearch() {
  document.getElementById('searchOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('searchInput')?.focus(), 200);
}

function closeSearch() {
  document.getElementById('searchOverlay')?.classList.remove('open');
  document.body.style.overflow = '';
  clearSearchResults();
}

function clearSearchResults() {
  const r = document.getElementById('searchResults');
  if (r) r.innerHTML = '';
}

function runSearch(query) {
  const q = query.toLowerCase().trim();
  const resultsEl = document.getElementById('searchResults');
  if (!resultsEl) return;
  if (!q) {
    resultsEl.innerHTML = '';
    return;
  }

  const matchedProducts = allProducts.filter(
    (p) => p.name.toLowerCase().includes(q) || p.cat.some((c) => c.includes(q)),
  );
  const matchedArticles = allArticles.filter(
    (a) => a.title.toLowerCase().includes(q) || a.tag.toLowerCase().includes(q),
  );

  let html = '';

  if (matchedProducts.length) {
    // Pre-serialize products to avoid inline JS quoting issues
    const productData = matchedProducts.slice(0, 4).map((p) => ({
      name: p.name,
      price: p.price,
      origPrice: p.origPrice || null,
      sizes: p.sizes || null,
      colors: p.colors || null,
    }));

    html += `<div class="search-results-group">
      <span class="search-results-label">Products (${matchedProducts.length})</span>
      ${productData
        .map((p, idx) => {
          const key = 'srp_' + idx + '_' + Date.now();
          // Store data so onclick doesn't need inline JSON
          window.__searchProducts = window.__searchProducts || {};
          window.__searchProducts[idx] = p;
          const isShopPage =
            window.location.pathname.includes('shop.html') || window.location.href.includes('shop.html');
          const clickFn = isShopPage
            ? `closeSearch();var _p=window.__searchProducts[${idx}];openProductModal(_p.name,_p.price,_p.origPrice,_p.sizes,_p.colors)`
            : `var _p=window.__searchProducts[${idx}];sessionStorage.setItem('openProduct',JSON.stringify(_p));closeSearch();window.location.href='shop.html'`;
          return `<div class="search-result-item" onclick="${clickFn}">
          <div class="search-result-img"></div>
          <div>
            <div class="search-result-name">${p.name}</div>
            <div class="search-result-price">${p.origPrice ? '<s>' + p.origPrice + '</s> ' : ''}${p.price}</div>
          </div>
        </div>`;
        })
        .join('')}
    </div>`;
  }

  if (matchedArticles.length) {
    html += `<div class="search-results-group">
      <span class="search-results-label">Journal (${matchedArticles.length})</span>
      ${matchedArticles
        .slice(0, 3)
        .map(
          (a) => `
        <div class="search-result-item" onclick="closeSearch();window.location.href='article.html?slug=${a.slug}'">
          <div class="search-result-img" style="background:var(--cream-dark)"></div>
          <div>
            <div class="search-result-name">${a.title}</div>
            <div class="search-result-price">${a.tag} · ${a.date}</div>
          </div>
        </div>`,
        )
        .join('')}
    </div>`;
  }

  if (!matchedProducts.length && !matchedArticles.length) {
    html = `<div class="search-no-results">No results for "<strong>${query}</strong>"</div>`;
  }

  resultsEl.innerHTML = html;
}

// ---- GALLERY LIGHTBOX ----
function initGalleryLightbox() {
  const items = document.querySelectorAll('.gallery-item');
  if (!items.length) return;

  // Create lightbox if not exists
  let lb = document.getElementById('galleryLightbox');
  if (!lb) {
    lb = document.createElement('div');
    lb.id = 'galleryLightbox';
    lb.innerHTML = `
      <div class="gallery-lb-overlay" onclick="closeLightbox()"></div>
      <div class="gallery-lb-panel">
        <button class="gallery-lb-close" onclick="closeLightbox()">✕</button>
        <button class="gallery-lb-arrow gallery-lb-prev" onclick="lbSlide(-1)">&#8592;</button>
        <button class="gallery-lb-arrow gallery-lb-next" onclick="lbSlide(1)">&#8594;</button>
        <div class="gallery-lb-slide" id="galleryLbSlide"></div>
        <div class="gallery-lb-caption" id="galleryLbCaption"></div>
      </div>
    `;
    lb.style.cssText = `
      position:fixed;inset:0;z-index:4000;
      display:flex;align-items:center;justify-content:center;
      opacity:0;pointer-events:none;transition:opacity 0.3s ease;
    `;
    lb.querySelector('.gallery-lb-overlay').style.cssText = `
      position:absolute;inset:0;background:rgba(74,16,16,0.85);backdrop-filter:blur(6px);
    `;
    lb.querySelector('.gallery-lb-panel').style.cssText = `
      position:relative;z-index:1;width:90%;max-width:900px;max-height:90vh;
      background:var(--cream-dark);display:flex;flex-direction:column;
      align-items:center;justify-content:center;overflow:hidden;
    `;
    lb.querySelector('.gallery-lb-close').style.cssText = `
      position:absolute;top:16px;right:16px;z-index:10;
      width:36px;height:36px;background:rgba(250,246,238,0.9);
      border:1px solid var(--border);display:flex;align-items:center;
      justify-content:center;cursor:pointer;font-size:16px;color:var(--text-muted);
      transition:all 0.2s ease;
    `;
    ['prev', 'next'].forEach((dir) => {
      const btn = lb.querySelector('.gallery-lb-' + dir);
      btn.style.cssText = `
        position:absolute;top:50%;transform:translateY(-50%);z-index:10;
        width:44px;height:44px;background:rgba(250,246,238,0.85);
        border:1px solid var(--border);display:flex;align-items:center;
        justify-content:center;cursor:pointer;font-size:18px;color:var(--burgundy-dark);
        ${dir === 'prev' ? 'left:16px' : 'right:16px'};transition:background 0.2s;
      `;
    });
    lb.querySelector('.gallery-lb-slide').style.cssText = `
      width:100%;min-height:60vh;display:flex;align-items:center;justify-content:center;
      background:var(--cream-dark);position:relative;overflow:hidden;
    `;
    lb.querySelector('.gallery-lb-caption').style.cssText = `
      padding:16px 24px;font-family:var(--font-sans);font-size:10px;
      letter-spacing:0.18em;text-transform:uppercase;color:var(--text-muted);
    `;
    document.body.appendChild(lb);
  }

  let lbIndex = 0;
  const captions = [
    'SS 2025 — Look 01',
    'SS 2025 — Look 02',
    'SS 2025 — Look 03',
    'SS 2025 — Look 04',
    'SS 2025 — Look 05',
    'SS 2025 — Look 06',
  ];

  window.openLightbox = function (idx) {
    lbIndex = idx;
    renderLbSlide();
    lb.style.opacity = '1';
    lb.style.pointerEvents = 'all';
    document.body.style.overflow = 'hidden';
  };

  window.closeLightbox = function () {
    lb.style.opacity = '0';
    lb.style.pointerEvents = 'none';
    document.body.style.overflow = '';
  };

  window.lbSlide = function (dir) {
    lbIndex = (lbIndex + dir + items.length) % items.length;
    renderLbSlide();
  };

  function renderLbSlide() {
    const slide = document.getElementById('galleryLbSlide');
    const caption = document.getElementById('galleryLbCaption');
    // Clone the gallery item inner for display
    slide.innerHTML = `
      <div style="width:100%;min-height:60vh;background:linear-gradient(135deg,var(--cream-dark) 0%,var(--cream) 50%,var(--cream-dark) 100%);
        display:flex;align-items:center;justify-content:center;position:relative;">
        <span style="font-family:var(--font-serif);font-size:6rem;color:rgba(107,26,26,0.12);user-select:none;">
          0${lbIndex + 1}
        </span>
      </div>
    `;
    if (caption) caption.textContent = captions[lbIndex] || '';
  }

  // Attach click to gallery items — also to inner/overlay so no dead zones
  items.forEach((item, i) => {
    item.style.cursor = 'pointer';
    item.addEventListener('click', () => openLightbox(i));
    // Also ensure overlay doesn't block
    const overlay = item.querySelector('.gallery-item-overlay');
    if (overlay) overlay.style.pointerEvents = 'none';
  });

  // Keyboard nav
  document.addEventListener('keydown', (e) => {
    if (!lb || lb.style.opacity === '0') return;
    if (e.key === 'ArrowLeft') lbSlide(-1);
    if (e.key === 'ArrowRight') lbSlide(1);
  });
}

// ---- HEADER SCROLL ----
function initHeader() {
  const header = document.getElementById('siteHeader');
  const announcementBar = document.querySelector('.announcement-bar');
  const filterBar = document.querySelector('.shop-filter-bar');
  if (!header) return;

  const BAR_HEIGHT = announcementBar ? announcementBar.offsetHeight : 36;

  function getHeaderHeight() {
    return header.offsetHeight || 72;
  }

  function updateFilterBarTop() {
    if (!filterBar) return;
    const isHidden = header.classList.contains('hidden');
    if (isHidden) {
      // header slid away — filter bar rises to top of viewport
      document.documentElement.style.setProperty('--filter-bar-top', '0px');
    } else {
      // header visible — filter bar sits directly below it
      document.documentElement.style.setProperty('--filter-bar-top', getHeaderHeight() + 'px');
    }
  }

  let lastY = window.scrollY,
    ticking = false;

  function updateHeader() {
    const cur = window.scrollY;
    if (cur >= BAR_HEIGHT) {
      header.classList.add('scrolled-past-bar');
    } else {
      header.classList.remove('scrolled-past-bar');
    }
    if (cur > lastY && cur > BAR_HEIGHT + 80) {
      header.classList.add('hidden');
    } else {
      header.classList.remove('hidden');
    }
    header.classList.toggle('scrolled', cur > 20);
    lastY = cur;
    ticking = false;
    updateFilterBarTop();
  }

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        requestAnimationFrame(updateHeader);
        ticking = true;
      }
    },
    { passive: true },
  );

  // Initial state — set correct top before first scroll
  updateHeader();
}

// ---- MOBILE MENU ----
function toggleMobileMenu() {
  const btn = document.getElementById('mobileMenuBtn');
  const overlay = document.getElementById('mobileNavOverlay');
  const drawer = document.getElementById('mobileNavDrawer');
  btn?.classList.toggle('open');
  overlay?.classList.toggle('open');
  drawer?.classList.toggle('open');
  document.body.style.overflow = drawer?.classList.contains('open') ? 'hidden' : '';
}

function closeMobileMenu() {
  document.getElementById('mobileMenuBtn')?.classList.remove('open');
  document.getElementById('mobileNavOverlay')?.classList.remove('open');
  document.getElementById('mobileNavDrawer')?.classList.remove('open');
  document.body.style.overflow = '';
}

function toggleMobileShop() {
  document.getElementById('mobileShopSub')?.classList.toggle('open');
}

// ---- SHOP GRID ----
function renderShopGrid(category, sortBy) {
  const grid = document.getElementById('shopGrid');
  if (!grid) return;

  let filtered =
    category && category !== 'all' ? allProducts.filter((p) => p.cat.includes(category)) : [...allProducts];

  // Sort
  if (sortBy === 'price-asc') {
    filtered.sort((a, b) => parseInt(a.price.replace(/\D/g, '')) - parseInt(b.price.replace(/\D/g, '')));
  } else if (sortBy === 'price-desc') {
    filtered.sort((a, b) => parseInt(b.price.replace(/\D/g, '')) - parseInt(a.price.replace(/\D/g, '')));
  } else if (sortBy === 'newest') {
    filtered.reverse();
  }
  // 'featured' = default order

  grid.innerHTML = filtered
    .map(
      (p, idx) => `
    <div class="product-card" data-shop-idx="${idx}">
      <div class="product-card-media">
        <div class="product-card-img-wrap"><div class="product-silhouette"></div></div>
        ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ''}
        <div class="product-card-quick-add" data-idx="${idx}">Quick add</div>
      </div>
      <div class="product-card-name">${p.name}</div>
      <div class="product-card-price">${p.origPrice ? '<s>' + p.origPrice + '</s> ' : ''}${p.price}</div>
    </div>
  `,
    )
    .join('');

  // Attach handlers safely — avoids inline JSON double-quote issues in onclick=""
  grid.querySelectorAll('.product-card').forEach((card, idx) => {
    const p = filtered[idx];
    card.addEventListener('click', () => {
      openProductModal(p.name, p.price, p.origPrice || null, p.sizes || null, p.colors || null);
    });
    const quickAdd = card.querySelector('.product-card-quick-add');
    if (quickAdd) {
      quickAdd.addEventListener('click', (e) => {
        e.stopPropagation();
        addToCart(p.name, p.price, '');
      });
    }
  });
}

let currentCategory = null;
let currentSort = 'featured';

function setShopFilter(btn, cat) {
  document.querySelectorAll('.shop-filter-tab').forEach((t) => t.classList.remove('active'));
  btn.classList.add('active');
  currentCategory = cat === 'all' ? null : cat;
  renderShopGrid(currentCategory, currentSort);
  // Center active tab — scrollIntoView works even when overflow:hidden on parent
  btn.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
}

function setShopSort(val) {
  currentSort = val;
  renderShopGrid(currentCategory, currentSort);
  // Update custom display label
  const sortLabels = {
    featured: 'Featured',
    'price-asc': 'Price: Low–High',
    'price-desc': 'Price: High–Low',
    newest: 'Newest First',
  };
  const labelEl = document.querySelector('.shop-sort-display-label');
  if (labelEl) labelEl.textContent = sortLabels[val] || 'Featured';
}

// ---- SCROLL REVEAL ----
function initReveal() {
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add('visible');
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -30px 0px' },
  );
  document.querySelectorAll('.reveal:not(.visible)').forEach((el) => obs.observe(el));
}

// ---- ACCORDION ----
function toggleAccordion(btn) {
  const item = btn.closest('.info-accordion-item');
  const wasOpen = item.classList.contains('open');
  document.querySelectorAll('.info-accordion-item.open').forEach((i) => i.classList.remove('open'));
  if (!wasOpen) item.classList.add('open');
}

// ---- KEYBOARD SHORTCUTS ----
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeSearch();
    closeProductModal();
    closeCart();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    openSearch();
  }
});

// ---- FOOTER REORDER FIX ----
// Footer is placed before .page-content in HTML template, move it after
function fixFooterOrder() {
  const footer = document.querySelector('.site-footer');
  const pageContent = document.querySelector('.page-content');
  if (footer && pageContent && footer.nextElementSibling === pageContent) {
    pageContent.parentNode.insertBefore(footer, pageContent.nextSibling);
  }
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  fixFooterOrder();
  initHeader();
  updateCartBadge();
  renderCart();
  initReveal();
  initGalleryLightbox();

  // Search input listener
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', () => runSearch(searchInput.value));
  }

  // Article cards are now real <a> tags — no JS needed for navigation

  // Make journal featured cards clickable — now real <a> tags, skip JS handlers

  const shopGrid = document.getElementById('shopGrid');
  if (shopGrid) {
    const params = new URLSearchParams(location.search);
    const cat = params.get('cat') || null;
    currentCategory = cat;
    renderShopGrid(cat, 'featured');

    if (cat) {
      document.querySelectorAll('.shop-filter-tab').forEach((btn) => {
        if (btn.dataset.cat === cat) btn.classList.add('active');
        else btn.classList.remove('active');
      });
    }

    const titles = {
      'new-arrivals': 'New Arrivals',
      women: "Women's Collection",
      men: "Men's Collection",
      accessories: 'Accessories',
      sale: 'Sale',
    };
    const titleEl = document.getElementById('shopPageTitle');
    if (titleEl && cat) titleEl.textContent = titles[cat] || 'All Products';

    // Open product from search redirect
    const pendingProduct = sessionStorage.getItem('openProduct');
    if (pendingProduct) {
      sessionStorage.removeItem('openProduct');
      try {
        const p = JSON.parse(pendingProduct);
        setTimeout(() => openProductModal(p.name, p.price, p.origPrice, p.sizes, p.colors), 300);
      } catch (e) {}
    }
  }
});
