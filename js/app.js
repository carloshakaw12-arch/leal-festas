(() => {
  const CONFIG = window.LEAL_CONFIG || {};
  const PRODUCTS = (window.LEAL_CATALOGO || []).filter(p => p.ativo !== false);
  const STORAGE = { cart: 'leal_cart_v1', favorites: 'leal_favorites_v1', intro: 'leal_intro_seen_v1' };
  const CATEGORY_META = {
    todos: ['✨','Todos'], kits: ['🎂','Kits'], baloes: ['🎈','Balões'], estrutura: ['🪑','Estrutura'], equipamentos: ['🔊','Equipamentos'], servicos: ['🎨','Serviços']
  };

  let cart = safeLoad(STORAGE.cart, {});
  let favorites = safeLoad(STORAGE.favorites, []);
  let activeCategory = 'todos';
  let searchTerm = '';
  let activeProduct = null;

  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const els = {
    catalog: $('#catalogGrid'), empty: $('#emptyState'), categoryFilters: $('#categoryFilters'), quickCategories: $('#quickCategories'), search: $('#searchInput'),
    cartBtn: $('#cartBtn'), cartDrawer: $('#cartDrawer'), cartItems: $('#cartItems'), cartEmpty: $('#cartEmpty'), cartFooter: $('#cartFooter'), cartCount: $('#cartCount'), floatingCart: $('#floatingCart'), floatingCount: $('#floatingCartCount'), cartTotalItems: $('#cartTotalItems'),
    favoritesBtn: $('#favoritesBtn'), favoritesDrawer: $('#favoritesDrawer'), favoritesItems: $('#favoritesItems'), favoritesEmpty: $('#favoritesEmpty'), favoritesFooter: $('#favoritesFooter'), favoritesCount: $('#favoritesCount'),
    productModal: $('#productModal'), modalImage: $('#modalImage'), modalThumbs: $('#modalThumbs'), modalCategory: $('#modalCategory'), modalTitle: $('#productModalTitle'), modalDescription: $('#modalDescription'), modalIncludes: $('#modalIncludes'), modalIncludesWrap: $('#modalIncludesWrap'), modalPrice: $('#modalPrice'), modalFavorite: $('#modalFavoriteBtn'), modalAdd: $('#modalAddBtn'),
    toast: $('#toast')
  };

  function safeLoad(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
  function save() { localStorage.setItem(STORAGE.cart, JSON.stringify(cart)); localStorage.setItem(STORAGE.favorites, JSON.stringify(favorites)); }
  function money(v) { return new Intl.NumberFormat(CONFIG.locale || 'pt-BR', { style: 'currency', currency: CONFIG.moeda || 'BRL' }).format(v || 0); }
  function getProduct(id) { return PRODUCTS.find(p => p.id === id); }
  function imageSrc(img, preferred='md') { return img?.variantes?.[preferred] || img?.src || img?.variantes?.xl || img?.variantes?.sm || ''; }
  function imageSrcset(img) { if (!img?.variantes) return ''; const v=img.variantes; return [[v.sm,'800w'],[v.md,'1800w'],[v.xl,'2560w']].filter(x=>x[0]).map(x=>x.join(' ')).join(', '); }
  function imageAttrs(img, sizes='(max-width: 780px) 50vw, 25vw') { const src=imageSrc(img); const set=imageSrcset(img); return `src="${src}"${set?` srcset="${set}" sizes="${sizes}"`:''}`; }
  function cartUnits() { return Object.values(cart).reduce((sum, q) => sum + Number(q || 0), 0); }
  function isConfigured(value) { return value && !String(value).includes('SEU_'); }
  function setBodyLock() { const anyOpen = $$('.drawer[aria-hidden="false"], .modal[aria-hidden="false"]').length > 0; document.body.classList.toggle('no-scroll', anyOpen); }

  function initIntro() {
    const intro = $('#entryCelebration');
    if (new URLSearchParams(location.search).has('skipIntro')) { intro.style.display = 'none'; return; }
    if (localStorage.getItem(STORAGE.intro)) { intro.style.display = 'none'; return; }
    entryConfetti();
    setTimeout(() => { intro.style.display = 'none'; localStorage.setItem(STORAGE.intro,'1'); }, 3150);
  }

  function entryConfetti() {
    const layer = $('#confettiLayer'); const colors = ['#b86f78','#d8a2a8','#c39a57','#5f7774','#e9c8b1'];
    for (let i=0;i<45;i++) {
      const el = document.createElement('span'); el.className='confetti-piece entry-confetti';
      el.style.left = `${Math.random()*100}%`; el.style.setProperty('--confetti', colors[i%colors.length]); el.style.setProperty('--duration', `${2.2+Math.random()*1.2}s`); el.style.setProperty('--drift', `${-100+Math.random()*200}px`); el.style.animationDelay = `${Math.random()*.5}s`; layer.appendChild(el);
      setTimeout(()=>el.remove(),4000);
    }
  }

  function burst(x, y, amount=14) {
    const layer = $('#confettiLayer'); const colors = ['#b86f78','#e4a7ad','#c39a57','#6e8580','#f2c986'];
    for (let i=0;i<amount;i++) {
      const el=document.createElement('span'); el.className='confetti-piece'; el.style.left=`${x}px`; el.style.top=`${y}px`; el.style.setProperty('--confetti',colors[i%colors.length]); el.style.setProperty('--rotate',`${Math.random()*180}deg`); el.style.setProperty('--end-rotate',`${500+Math.random()*500}deg`); el.style.setProperty('--x',`${-95+Math.random()*190}px`); el.style.setProperty('--y',`${-90+Math.random()*160}px`); el.style.setProperty('--duration',`${.55+Math.random()*.45}s`); layer.appendChild(el); setTimeout(()=>el.remove(),1100);
    }
  }

  function toast(msg) { els.toast.textContent=msg; els.toast.classList.add('show'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>els.toast.classList.remove('show'),2200); }

  function renderCategories() {
    const present = ['todos', ...Object.keys(CATEGORY_META).filter(c => c !== 'todos' && PRODUCTS.some(p => p.categoria === c))];
    els.categoryFilters.innerHTML = present.map(c => `<button class="filter-btn ${c===activeCategory?'active':''}" data-category="${c}">${CATEGORY_META[c][1]}</button>`).join('');
    if (els.quickCategories) els.quickCategories.innerHTML = present.filter(c=>c!=='todos').map(c => `<button class="quick-category" data-category="${c}"><span>${CATEGORY_META[c][0]}</span>${CATEGORY_META[c][1]}</button>`).join('');
    $$('[data-category]').forEach(btn => btn.addEventListener('click', () => { activeCategory=btn.dataset.category; renderCategories(); renderCatalog(); document.querySelector('#catalogo').scrollIntoView({behavior:'smooth'}); }));
  }

  function filteredProducts() {
    const term = searchTerm.trim().toLowerCase();
    return PRODUCTS.filter(p => (activeCategory==='todos'||p.categoria===activeCategory) && (!term || `${p.nome} ${p.categoriaNome} ${p.descricao}`.toLowerCase().includes(term))).sort((a,b)=>(b.destaque?1:0)-(a.destaque?1:0));
  }

  function renderCatalog() {
    const list=filteredProducts(); els.empty.hidden=list.length>0;
    els.catalog.innerHTML = list.map(p => {
      const fav=favorites.includes(p.id); const img=p.imagens?.[0];
      return `<article class="product-card reveal visible" data-id="${p.id}">
        <div class="product-image-wrap" data-open-product="${p.id}"><img class="product-image" ${imageAttrs(img)} alt="${img.alt||p.nome}" loading="lazy" decoding="async">${p.demo?'<span class="demo-label">Imagem demo</span>':''}<button class="favorite-btn ${fav?'active':''}" data-favorite="${p.id}" aria-label="${fav?'Remover dos':'Adicionar aos'} favoritos">${fav?'♥':'♡'}</button></div>
        <div class="product-body"><div class="product-meta"><span class="category-tag">${p.categoriaNome}</span>${p.destaque?'<span title="Destaque">⭐</span>':''}</div><h3>${p.nome}</h3><p>${p.descricao}</p><div class="product-price"><span>A partir de</span><strong>${money(p.preco)}</strong><small> / ${p.unidade||'item'}</small></div><div class="product-actions"><button class="btn btn-secondary" data-open-product="${p.id}">Detalhes</button><button class="btn btn-primary" data-add="${p.id}">+ Carrinho</button></div></div>
      </article>`;
    }).join('');
    bindProductActions();
  }

  function bindProductActions() {
    $$('[data-open-product]').forEach(el => el.addEventListener('click', e => { if (e.target.closest('[data-favorite]')) return; openProduct(el.dataset.openProduct); }));
    $$('[data-favorite]').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); toggleFavorite(btn.dataset.favorite); }));
    $$('[data-add]').forEach(btn => btn.addEventListener('click', e => { addToCart(btn.dataset.add); const r=btn.getBoundingClientRect(); burst(r.left+r.width/2,r.top+r.height/2); }));
  }

  function toggleFavorite(id) { favorites = favorites.includes(id) ? favorites.filter(x=>x!==id) : [...favorites,id]; save(); updateCounts(); renderCatalog(); renderFavorites(); if(activeProduct?.id===id) els.modalFavorite.classList.toggle('active',favorites.includes(id)), els.modalFavorite.textContent=favorites.includes(id)?'♥':'♡'; toast(favorites.includes(id)?'Salvo nos favoritos ♡':'Removido dos favoritos'); }
  function addToCart(id, qty=1) { cart[id]=(cart[id]||0)+qty; save(); updateCounts(); renderCart(); els.cartBtn.classList.remove('bump'); void els.cartBtn.offsetWidth; els.cartBtn.classList.add('bump'); toast('Adicionado ao orçamento 🎉'); }
  function changeQty(id, delta) { if(!cart[id]) return; cart[id]+=delta; if(cart[id]<=0) delete cart[id]; save(); updateCounts(); renderCart(); }
  function removeCart(id) { delete cart[id]; save(); updateCounts(); renderCart(); }
  function updateCounts() { const total=cartUnits(); els.cartCount.textContent=total; els.floatingCount.textContent=total; els.floatingCart.classList.toggle('visible',total>0); els.favoritesCount.textContent=favorites.length; }

  function renderCart() {
    const items=Object.entries(cart).map(([id,qty])=>({p:getProduct(id),qty})).filter(x=>x.p);
    els.cartEmpty.hidden=items.length>0; els.cartFooter.hidden=items.length===0; els.cartTotalItems.textContent=cartUnits();
    els.cartItems.innerHTML=items.map(({p,qty})=>`<div class="cart-item"><img src="${imageSrc(p.imagens[0],'sm')}" alt=""><div><h4>${p.nome}</h4><small>${money(p.preco)} / ${p.unidade||'item'}</small><div class="qty-control"><button data-qty="${p.id}" data-delta="-1">−</button><strong>${qty}</strong><button data-qty="${p.id}" data-delta="1">+</button></div></div><button class="remove-item" data-remove="${p.id}" aria-label="Remover">×</button></div>`).join('');
    $$('[data-qty]').forEach(b=>b.addEventListener('click',()=>changeQty(b.dataset.qty,Number(b.dataset.delta)))); $$('[data-remove]').forEach(b=>b.addEventListener('click',()=>removeCart(b.dataset.remove)));
  }

  function renderFavorites() {
    const items=favorites.map(getProduct).filter(Boolean); els.favoritesEmpty.hidden=items.length>0; els.favoritesFooter.hidden=items.length===0;
    els.favoritesItems.innerHTML=items.map(p=>`<div class="favorite-item"><img src="${imageSrc(p.imagens[0],'sm')}" alt=""><div><h4>${p.nome}</h4><small>${money(p.preco)} / ${p.unidade||'item'}</small><button class="text-btn" style="padding:6px 0;text-align:left" data-fav-add="${p.id}">+ Adicionar ao carrinho</button></div><button class="remove-item" data-fav-remove="${p.id}" aria-label="Remover favorito">×</button></div>`).join('');
    $$('[data-fav-add]').forEach(b=>b.addEventListener('click',()=>addToCart(b.dataset.favAdd))); $$('[data-fav-remove]').forEach(b=>b.addEventListener('click',()=>toggleFavorite(b.dataset.favRemove)));
  }

  function openDrawer(drawer) { drawer.setAttribute('aria-hidden','false'); setBodyLock(); }
  function closeDrawer(drawer) { drawer.setAttribute('aria-hidden','true'); setBodyLock(); }
  function openModal(modal) { modal.setAttribute('aria-hidden','false'); setBodyLock(); }
  function closeModal(modal) { modal.setAttribute('aria-hidden','true'); setBodyLock(); }

  function openProduct(id) {
    const p=getProduct(id); if(!p) return; activeProduct=p;
    els.modalImage.src=imageSrc(p.imagens[0],'xl'); els.modalImage.srcset=imageSrcset(p.imagens[0]); els.modalImage.sizes='(max-width: 780px) 100vw, 55vw'; els.modalImage.alt=p.imagens[0].alt||p.nome; els.modalCategory.textContent=p.categoriaNome; els.modalTitle.textContent=p.nome; els.modalDescription.textContent=p.descricao; els.modalPrice.textContent=money(p.preco);
    els.modalIncludesWrap.hidden=!p.inclui?.length; els.modalIncludes.innerHTML=(p.inclui||[]).map(x=>`<li>${x}</li>`).join('');
    els.modalThumbs.innerHTML=(p.imagens||[]).map((img,i)=>`<button class="${i===0?'active':''}" data-thumb="${i}"><img src="${imageSrc(img,'sm')}" alt=""></button>`).join('');
    els.modalFavorite.classList.toggle('active',favorites.includes(p.id)); els.modalFavorite.textContent=favorites.includes(p.id)?'♥':'♡';
    $$('[data-thumb]').forEach(b=>b.addEventListener('click',()=>{ const i=Number(b.dataset.thumb); els.modalImage.src=imageSrc(p.imagens[i],'xl'); els.modalImage.srcset=imageSrcset(p.imagens[i]); els.modalImage.alt=p.imagens[i].alt||p.nome; $$('[data-thumb]').forEach(x=>x.classList.remove('active')); b.classList.add('active'); }));
    openModal(els.productModal);
  }

  function buildOrderMessage() {
    const items=Object.entries(cart).map(([id,qty])=>({p:getProduct(id),qty})).filter(x=>x.p);
    const lines=[`Olá! Gostaria de solicitar um orçamento na ${CONFIG.nome || 'Leal Festas & Decorações'} 🎉`, '', '🛒 *Itens selecionados:*'];
    items.forEach(({p,qty})=>{
      const unit = p.unidade ? `/${p.unidade}` : '';
      const price = Number.isFinite(Number(p.preco)) && Number(p.preco) > 0 ? ` — ${money(p.preco)}${unit}` : ' — valor sob consulta';
      lines.push(`• ${qty}x ${p.nome}${price}`);
    });
    lines.push('', 'Gostaria de verificar disponibilidade e o valor final.');
    return lines.join('\n');
  }

  function openWhatsApp(message) {
    if(!isConfigured(CONFIG.whatsapp)) {
      toast('Configure o WhatsApp em js/config.js');
      return;
    }
    window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(message)}`,'_blank','noopener');
  }
  function genericWhatsApp() { openWhatsApp(`Olá! Gostaria de saber mais sobre a ${CONFIG.nome || 'Leal Festas & Decorações'}.`); }

  function checkout(e) {
    if(cartUnits()===0) { toast('Seu carrinho está vazio'); return; }
    const button = e?.currentTarget;
    if(button) {
      const r=button.getBoundingClientRect();
      burst(r.left+r.width/2,r.top+r.height/2,28);
    }
    // O clique do cliente já é a intenção de contato: sem formulário intermediário.
    closeDrawer(els.cartDrawer);
    openWhatsApp(buildOrderMessage());
  }

  function bindStaticActions() {
    els.search.addEventListener('input',()=>{searchTerm=els.search.value;renderCatalog();}); els.cartBtn.addEventListener('click',()=>openDrawer(els.cartDrawer)); els.floatingCart.addEventListener('click',()=>openDrawer(els.cartDrawer)); $('#ctaCartBtn').addEventListener('click',()=>openDrawer(els.cartDrawer));
    els.favoritesBtn.addEventListener('click',()=>openDrawer(els.favoritesDrawer));
    $$('[data-close-drawer]').forEach(x=>x.addEventListener('click',()=>closeDrawer(els.cartDrawer))); $$('[data-close-favorites]').forEach(x=>x.addEventListener('click',()=>closeDrawer(els.favoritesDrawer))); $$('[data-close-product]').forEach(x=>x.addEventListener('click',()=>closeModal(els.productModal)));
    $('#clearCartBtn').addEventListener('click',()=>{cart={};save();updateCounts();renderCart();toast('Carrinho limpo');}); $('#checkoutBtn').addEventListener('click',checkout);
    $('#addAllFavoritesBtn').addEventListener('click',()=>{favorites.forEach(id=>cart[id]=(cart[id]||0)+1);save();updateCounts();renderCart();closeDrawer(els.favoritesDrawer);openDrawer(els.cartDrawer);toast('Favoritos adicionados 🎉');});
    els.modalFavorite.addEventListener('click',()=>activeProduct&&toggleFavorite(activeProduct.id)); els.modalAdd.addEventListener('click',e=>{if(!activeProduct)return;addToCart(activeProduct.id);const r=e.currentTarget.getBoundingClientRect();burst(r.left+r.width/2,r.top+r.height/2,18);});
    const heroWhatsappBtn = $('#heroWhatsappBtn'); if (heroWhatsappBtn) heroWhatsappBtn.addEventListener('click',genericWhatsApp); $('#ctaWhatsappBtn').addEventListener('click',genericWhatsApp); $('#footerWhatsappBtn').addEventListener('click',genericWhatsApp);
    document.addEventListener('keydown',e=>{ if(e.key==='Escape'){closeDrawer(els.cartDrawer);closeDrawer(els.favoritesDrawer);closeModal(els.productModal);} });
  }

  function setupBusinessInfo() { $('#year').textContent=new Date().getFullYear(); $('#serviceArea').textContent=CONFIG.areaAtendimento||'Consulte nossa área de atendimento'; const ig=$('#instagramLink'); if(isConfigured(CONFIG.instagram)) ig.href=CONFIG.instagram; else ig.addEventListener('click',e=>{e.preventDefault();toast('Configure o Instagram em js/config.js');}); }
  function setupReveal() { const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target);}}),{threshold:.1}); $$('.reveal').forEach(el=>io.observe(el)); }

  initIntro(); renderCategories(); renderCatalog(); renderCart(); renderFavorites(); updateCounts(); bindStaticActions(); setupBusinessInfo(); setupReveal();
})();
