(() => {
  const SOURCE = Array.isArray(window.LEAL_CATALOGO) ? window.LEAL_CATALOGO : [];
  const DRAFT_KEY = 'leal_admin_catalog_draft_v1';
  const CAT_NAMES = { kits:'Kits de Festa', baloes:'Balões', estrutura:'Estrutura', equipamentos:'Equipamentos', servicos:'Serviços' };
  let products = loadDraft() || structuredCloneSafe(SOURCE);
  let selected = products[0]?.id || null;

  const $ = s => document.querySelector(s);
  const els = {
    list: $('#productList'), count: $('#productCount'), form: $('#productForm'), empty: $('#emptyEditor'), editorName: $('#editorName'), photos: $('#photosEditor'), status: $('#saveStatus'), toast: $('#toast')
  };

  function structuredCloneSafe(v){ return JSON.parse(JSON.stringify(v)); }
  function loadDraft(){ try { const v=JSON.parse(localStorage.getItem(DRAFT_KEY)); return Array.isArray(v)?v:null; } catch { return null; } }
  function persist(){ localStorage.setItem(DRAFT_KEY,JSON.stringify(products)); }
  function current(){ return products.find(p=>p.id===selected); }
  function esc(s=''){ return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
  function slug(s=''){ return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
  function imageUrl(img){ return img?.variantes?.sm || img?.src || img?.variantes?.md || img?.variantes?.xl || '../public/images/favicon.svg'; }
  function toast(msg){ els.toast.textContent=msg; els.toast.classList.add('show'); clearTimeout(toast.t); toast.t=setTimeout(()=>els.toast.classList.remove('show'),1800); }

  function renderList(){
    els.count.textContent=`${products.length} ${products.length===1?'item':'itens'}`;
    els.list.innerHTML=products.map((p,i)=>`<button class="product-row ${p.id===selected?'active':''}" data-select="${esc(p.id)}"><img src="../${esc(imageUrl(p.imagens?.[0]))}" onerror="this.src='../public/images/favicon.svg'" alt=""><span><strong>${esc(p.nome)}</strong><small>${esc(p.categoriaNome||CAT_NAMES[p.categoria]||p.categoria)} • R$ ${Number(p.preco||0).toFixed(2).replace('.',',')}</small></span><span class="badges">${p.destaque?'⭐ ':''}${p.ativo===false?'🔴':'🟢'}</span></button>`).join('');
    document.querySelectorAll('[data-select]').forEach(b=>b.onclick=()=>{ selected=b.dataset.select; renderList(); renderEditor(); });
  }

  function renderEditor(){
    const p=current();
    els.form.hidden=!p; els.empty.hidden=!!p;
    if(!p) return;
    els.editorName.textContent=p.nome||'Produto';
    $('#nome').value=p.nome||''; $('#id').value=p.id||''; $('#categoria').value=p.categoria||'kits'; $('#preco').value=p.preco??0; $('#unidade').value=p.unidade||''; $('#descricao').value=p.descricao||''; $('#inclui').value=(p.inclui||[]).join('\n');
    $('#ativo').checked=p.ativo!==false; $('#destaque').checked=!!p.destaque; $('#demo').checked=!!p.demo;
    renderPhotos(p.imagens||[]);
    els.status.textContent='Edite e salve o item.';
  }

  function renderPhotos(images){
    els.photos.innerHTML=images.map((img,i)=>`<div class="photo-row" data-photo="${i}"><img class="photo-preview" src="../${esc(imageUrl(img))}" onerror="this.src='../public/images/favicon.svg'" alt=""><div class="photo-fields"><label class="wide">Texto alternativo<input data-photo-field="alt" value="${esc(img.alt||'')}"></label><label class="wide">Arquivo único<input data-photo-field="src" value="${esc(img.src||'')}" placeholder="public/images/kits/safari/capa.webp"></label><label>800 px<input data-photo-field="sm" value="${esc(img.variantes?.sm||'')}" placeholder="...-800.webp"></label><label>1800 px<input data-photo-field="md" value="${esc(img.variantes?.md||'')}" placeholder="...-1800.webp"></label><label>2560 px<input data-photo-field="xl" value="${esc(img.variantes?.xl||'')}" placeholder="...-2560.webp"></label></div><button type="button" class="photo-remove" data-remove-photo="${i}" title="Remover foto">×</button></div>`).join('') || '<p class="help">Nenhuma foto. Clique em “Adicionar foto”.</p>';
    document.querySelectorAll('[data-remove-photo]').forEach(b=>b.onclick=()=>{ const p=current(); p.imagens.splice(Number(b.dataset.removePhoto),1); persist(); renderPhotos(p.imagens); renderList(); });
  }

  function collectPhotos(){
    return [...document.querySelectorAll('[data-photo]')].map(row=>{
      const value=f=>row.querySelector(`[data-photo-field="${f}"]`)?.value.trim()||'';
      const src=value('src'), sm=value('sm'), md=value('md'), xl=value('xl'), alt=value('alt');
      const out={}; if(src) out.src=src; if(alt) out.alt=alt; const variantes={}; if(sm) variantes.sm=sm; if(md) variantes.md=md; if(xl) variantes.xl=xl; if(Object.keys(variantes).length) out.variantes=variantes; return out;
    }).filter(img=>img.src||img.variantes);
  }

  function saveCurrent(e){
    e?.preventDefault(); const p=current(); if(!p) return;
    const oldId=p.id; const newId=$('#id').value.trim()||slug($('#nome').value)||`item-${Date.now()}`;
    if(products.some(x=>x!==p&&x.id===newId)){ toast('Já existe outro item com esse ID'); return; }
    p.id=newId; p.nome=$('#nome').value.trim()||'Novo item'; p.categoria=$('#categoria').value; p.categoriaNome=CAT_NAMES[p.categoria]||p.categoria; p.preco=Number($('#preco').value||0); p.unidade=$('#unidade').value.trim()||'item'; p.descricao=$('#descricao').value.trim(); p.inclui=$('#inclui').value.split('\n').map(x=>x.trim()).filter(Boolean); p.ativo=$('#ativo').checked; p.destaque=$('#destaque').checked; p.demo=$('#demo').checked; p.imagens=collectPhotos();
    selected=p.id; persist(); renderList(); renderEditor(); els.status.textContent='Alterações salvas no rascunho local.'; toast('Item salvo ✓');
  }

  function addNew(){
    const id=`novo-item-${Date.now()}`; products.push({id,nome:'Novo item',categoria:'kits',categoriaNome:'Kits de Festa',preco:0,unidade:'item',destaque:false,ativo:false,demo:false,descricao:'',inclui:[],imagens:[]}); selected=id; persist(); renderList(); renderEditor(); $('#nome').focus();
  }
  function move(delta){ const i=products.findIndex(p=>p.id===selected); const j=i+delta; if(i<0||j<0||j>=products.length)return; [products[i],products[j]]=[products[j],products[i]]; persist(); renderList(); toast('Ordem alterada'); }
  function remove(){ const p=current(); if(!p)return; if(!confirm(`Excluir “${p.nome}” do catálogo local?`))return; products=products.filter(x=>x.id!==p.id); selected=products[0]?.id||null; persist(); renderList(); renderEditor(); toast('Item removido'); }

  function cleanProduct(p){
    const out={id:p.id,nome:p.nome,categoria:p.categoria,categoriaNome:p.categoriaNome||CAT_NAMES[p.categoria]||p.categoria,preco:Number(p.preco||0),unidade:p.unidade||'item',destaque:!!p.destaque,ativo:p.ativo!==false,demo:!!p.demo,descricao:p.descricao||'',inclui:Array.isArray(p.inclui)?p.inclui:[],imagens:(p.imagens||[]).map(img=>{const x={};if(img.src)x.src=img.src;if(img.alt)x.alt=img.alt;if(img.variantes&&Object.keys(img.variantes).length)x.variantes=img.variantes;return x;})}; return out;
  }
  function catalogText(){ return `// Catálogo gerado pelo Leal Admin em ${new Date().toLocaleString('pt-BR')}\n// Para esconder um item: ativo: false | Para destacar: destaque: true\nwindow.LEAL_CATALOGO = ${JSON.stringify(products.map(cleanProduct),null,2)};\n`; }
  function download(){ const blob=new Blob([catalogText()],{type:'text/javascript;charset=utf-8'}); const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='catalogo.js';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('catalogo.js baixado'); }
  async function copy(){ try{await navigator.clipboard.writeText(catalogText());toast('Catálogo copiado');}catch{toast('Não foi possível copiar');} }
  function reset(){ if(!confirm('Descartar o rascunho local e recarregar o catálogo atual do site?'))return; products=structuredCloneSafe(SOURCE); selected=products[0]?.id||null; localStorage.removeItem(DRAFT_KEY); renderList(); renderEditor(); toast('Catálogo recarregado'); }

  $('#productForm').onsubmit=saveCurrent; $('#newBtn').onclick=addNew; $('#moveUpBtn').onclick=()=>move(-1); $('#moveDownBtn').onclick=()=>move(1); $('#deleteBtn').onclick=remove; $('#downloadBtn').onclick=download; $('#copyBtn').onclick=copy; $('#resetBtn').onclick=reset;
  $('#addPhotoBtn').onclick=()=>{ const p=current(); if(!p)return; p.imagens=p.imagens||[]; p.imagens.push({src:'',alt:p.nome||''}); persist(); renderPhotos(p.imagens); };
  $('#nome').addEventListener('input',()=>{ const id=$('#id'); if(id.value.startsWith('novo-item-')) id.value=slug($('#nome').value); });

  renderList(); renderEditor();
})();
