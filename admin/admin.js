(() => {
  const SOURCE = Array.isArray(window.LEAL_CATALOGO) ? window.LEAL_CATALOGO : [];
  const DRAFT_KEY = 'leal_admin_catalog_draft_v1';
  const CAT_NAMES = { kits:'Kits de Festa', baloes:'Balões', estrutura:'Estrutura', equipamentos:'Equipamentos', servicos:'Serviços' };
  let products = loadDraft() || clone(SOURCE);
  let selected = products[0] || null;

  // Fotos originais não podem ser persistidas no localStorage. Elas ficam em memória
  // até o usuário baixar o pacote ou recarregar a página.
  const PENDING_PHOTOS = new Map(); // product object -> File[]
  const PENDING_PREVIEWS = new Map(); // product object -> object URLs[]

  const $ = s => document.querySelector(s);
  const els = {
    list: $('#productList'), count: $('#productCount'), form: $('#productForm'), empty: $('#emptyEditor'),
    editorName: $('#editorName'), status: $('#saveStatus'), toast: $('#toast'),
    photoStatus: $('#photoSelectionStatus'), photoGrid: $('#photoPreviewGrid'),
    overlay: $('#packageOverlay'), progress: $('#packageProgress')
  };

  function clone(v){ return JSON.parse(JSON.stringify(v)); }
  function loadDraft(){ try { const v=JSON.parse(localStorage.getItem(DRAFT_KEY)); return Array.isArray(v)?v:null; } catch { return null; } }
  function persist(){ localStorage.setItem(DRAFT_KEY,JSON.stringify(products)); }
  function current(){ return selected; }
  function esc(s=''){ return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
  function slug(s=''){ return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
  function isDemoImage(img){ return [img?.src,img?.variantes?.sm,img?.variantes?.md,img?.variantes?.xl].filter(Boolean).some(x=>String(x).includes('/demo/')); }
  function imagePath(img){ return img?.variantes?.sm || img?.src || img?.variantes?.md || img?.variantes?.xl || ''; }
  function imageUrl(img){ const p=imagePath(img); return p ? `../${p}` : '../public/images/favicon.svg'; }
  function toast(msg){ els.toast.textContent=msg; els.toast.classList.add('show'); clearTimeout(toast.t); toast.t=setTimeout(()=>els.toast.classList.remove('show'),1800); }

  function pendingFiles(p){ return PENDING_PHOTOS.get(p) || []; }
  function revokePendingPreviews(p){ for(const u of PENDING_PREVIEWS.get(p)||[]) URL.revokeObjectURL(u); PENDING_PREVIEWS.delete(p); }
  function pendingPreview(p){ return (PENDING_PREVIEWS.get(p)||[])[0] || ''; }
  function listPreview(p){ return pendingPreview(p) || imageUrl((p.imagens||[])[0]); }

  function normalizeAdminImages(images=[]){
    const out=[], groups=new Map();
    for(const img of images||[]){
      if(img?.variantes && Object.keys(img.variantes).length){ out.push(img); continue; }
      const src=img?.src||''; const m=src.match(/^(.*)-(800|1800|2560)\.webp$/i);
      if(!m){ if(src) out.push(img); continue; }
      const base=m[1], width=m[2], key=width==='800'?'sm':width==='1800'?'md':'xl';
      if(!groups.has(base)) groups.set(base,{alt:img.alt||'',variantes:{}});
      groups.get(base).variantes[key]=src;
    }
    out.push(...groups.values());
    const real=out.filter(img=>!isDemoImage(img));
    return real.length ? real : out;
  }

  products.forEach(p=>{ p.imagens=normalizeAdminImages(p.imagens||[]); if((p.imagens||[]).some(img=>!isDemoImage(img))) p.demo=false; });
  persist();

  function renderList(){
    els.count.textContent=`${products.length} ${products.length===1?'item':'itens'}`;
    els.list.innerHTML=products.map((p,i)=>`<button class="product-row ${p===selected?'active':''}" data-index="${i}"><img src="${esc(listPreview(p))}" onerror="this.onerror=null;this.src='../public/images/favicon.svg'" alt=""><span><strong>${esc(p.nome)}</strong><small>${esc(p.categoriaNome||CAT_NAMES[p.categoria]||p.categoria)} • R$ ${Number(p.preco||0).toFixed(2).replace('.',',')}</small></span><span class="badges">${pendingFiles(p).length?'📸 ':''}${p.destaque?'⭐ ':''}${p.ativo===false?'🔴':'🟢'}</span></button>`).join('');
    document.querySelectorAll('[data-index]').forEach(b=>b.onclick=()=>{
      syncCurrentFromForm();
      selected=products[Number(b.dataset.index)] || null;
      renderList(); renderEditor();
    });
  }

  function renderEditor(){
    const p=current(); els.form.hidden=!p; els.empty.hidden=!!p; if(!p)return;
    els.editorName.textContent=p.nome||'Produto';
    $('#nome').value=p.nome||''; $('#id').value=p.id||''; $('#categoria').value=p.categoria||'kits'; $('#preco').value=p.preco??0;
    $('#unidade').value=p.unidade||''; $('#descricao').value=p.descricao||''; $('#inclui').value=(p.inclui||[]).join('\n');
    $('#complementos').value=(p.complementos||[]).join('\n'); $('#ativo').checked=p.ativo!==false; $('#destaque').checked=!!p.destaque; $('#demo').checked=!!p.demo;
    renderPhotosSummary(p); els.status.textContent='Alterações salvas automaticamente.';
  }

  function syncCurrentFromForm(){
    const p=current(); if(!p || els.form.hidden)return;
    const suggestedId=$('#id').value.trim() || slug($('#nome').value) || p.id || `item-${Date.now()}`;
    p.id=suggestedId; p.nome=$('#nome').value.trim()||'Novo item'; p.categoria=$('#categoria').value; p.categoriaNome=CAT_NAMES[p.categoria]||p.categoria;
    p.preco=Number($('#preco').value||0); p.unidade=$('#unidade').value.trim()||'item'; p.descricao=$('#descricao').value.trim();
    p.inclui=$('#inclui').value.split('\n').map(x=>x.trim()).filter(Boolean); p.complementos=$('#complementos').value.split('\n').map(x=>x.trim()).filter(Boolean);
    p.ativo=$('#ativo').checked; p.destaque=$('#destaque').checked; p.demo=$('#demo').checked;
    persist(); els.editorName.textContent=p.nome; els.status.textContent='Alterações salvas automaticamente.';
  }

  let renderListTimer=null;
  function onFormEdited(){
    syncCurrentFromForm(); clearTimeout(renderListTimer); renderListTimer=setTimeout(renderList,120);
  }

  function renderPhotosSummary(p){
    const files=pendingFiles(p);
    if(files.length){
      els.photoStatus.innerHTML=`<div><strong>${files.length} nova${files.length===1?' foto':'s fotos'} selecionada${files.length===1?'':'s'}</strong><span>Estas fotos substituirão a galeria atual quando você baixar o pacote.</span></div><button type="button" id="clearPendingPhotos" class="btn ghost compact">Manter fotos atuais</button>`;
      els.photoStatus.className='photo-selection-status pending';
      els.photoGrid.innerHTML=(PENDING_PREVIEWS.get(p)||[]).map((url,i)=>`<figure><img src="${esc(url)}" alt=""><figcaption>Nova ${i+1}</figcaption></figure>`).join('');
      $('#clearPendingPhotos').onclick=()=>{ revokePendingPreviews(p); PENDING_PHOTOS.delete(p); renderPhotosSummary(p); renderList(); toast('Seleção de fotos cancelada'); };
      return;
    }
    const images=(p.imagens||[]).filter(Boolean);
    els.photoStatus.innerHTML=`<div><strong>${images.length ? `${images.length} foto${images.length===1?'':'s'} atual${images.length===1?'':'is'}` : 'Sem fotos cadastradas'}</strong><span>${images.length?'Selecione novas fotos somente se quiser substituir esta galeria.':'Selecione as fotos que deseja publicar.'}</span></div>`;
    els.photoStatus.className='photo-selection-status';
    els.photoGrid.innerHTML=images.map((img,i)=>`<figure><img src="${esc(imageUrl(img))}" onerror="this.onerror=null;this.src='../public/images/favicon.svg'" alt=""><figcaption>${isDemoImage(img)?'Demo':'Foto'} ${i+1}</figcaption></figure>`).join('');
  }

  function selectPhotos(files){
    const p=current(); if(!p||!files.length)return;
    revokePendingPreviews(p);
    const clean=[...files].filter(f=>/^image\//.test(f.type));
    PENDING_PHOTOS.set(p,clean);
    PENDING_PREVIEWS.set(p,clean.map(f=>URL.createObjectURL(f)));
    renderPhotosSummary(p); renderList();
    toast(`${clean.length} foto(s) pronta(s) para o pacote`);
  }

  function addNew(){
    syncCurrentFromForm();
    const p={id:`novo-item-${Date.now()}`,nome:'Novo item',categoria:'kits',categoriaNome:'Kits de Festa',preco:0,unidade:'item',destaque:false,ativo:false,demo:false,descricao:'',inclui:[],complementos:[],imagens:[]};
    products.push(p); selected=p; persist(); renderList(); renderEditor(); $('#nome').focus();
  }
  function move(delta){ syncCurrentFromForm(); const i=products.indexOf(selected),j=i+delta; if(i<0||j<0||j>=products.length)return; [products[i],products[j]]=[products[j],products[i]]; persist(); renderList(); toast('Ordem alterada'); }
  function remove(){ const p=current(); if(!p)return; if(!confirm(`Excluir “${p.nome}” do catálogo local?`))return; revokePendingPreviews(p); PENDING_PHOTOS.delete(p); const i=products.indexOf(p); products.splice(i,1); selected=products[Math.min(i,products.length-1)]||null; persist(); renderList(); renderEditor(); toast('Item removido'); }
  function reset(){
    if(!confirm('Descartar todas as alterações locais e recarregar o catálogo que está publicado no site?'))return;
    for(const p of products) revokePendingPreviews(p); PENDING_PHOTOS.clear(); products=clone(SOURCE); products.forEach(p=>p.imagens=normalizeAdminImages(p.imagens||[])); selected=products[0]||null; localStorage.removeItem(DRAFT_KEY); renderList(); renderEditor(); toast('Catálogo recarregado');
  }

  function cleanProduct(p){
    const out={id:p.id,nome:p.nome,categoria:p.categoria,categoriaNome:p.categoriaNome||CAT_NAMES[p.categoria]||p.categoria,preco:Number(p.preco||0),unidade:p.unidade||'item',destaque:!!p.destaque,ativo:p.ativo!==false,demo:!!p.demo,descricao:p.descricao||'',inclui:Array.isArray(p.inclui)?p.inclui:[],complementos:Array.isArray(p.complementos)?p.complementos:[],imagens:(p.imagens||[]).map(img=>{const x={};if(img.src)x.src=img.src;if(img.alt)x.alt=img.alt;if(img.variantes&&Object.keys(img.variantes).length)x.variantes=img.variantes;return x;})}; return out;
  }
  function catalogText(items=products){ return `// Catálogo gerado pelo Leal D’Coração Admin em ${new Date().toLocaleString('pt-BR')}\n// Para esconder um item: ativo: false | Para destacar: destaque: true\nwindow.LEAL_CATALOGO = ${JSON.stringify(items.map(cleanProduct),null,2)};\n`; }
  function validateProducts(items){
    const ids=new Set();
    for(const p of items){
      if(!p.id||!slug(p.id)) return `O produto “${p.nome||'sem nome'}” está sem ID válido.`;
      if(ids.has(p.id)) return `Existem dois produtos com o mesmo ID: ${p.id}.`;
      ids.add(p.id);
      if(!p.nome?.trim()) return `O produto ${p.id} está sem nome.`;
    }
    return '';
  }

  function baseName(name='foto'){ return slug(name.replace(/\.[^.]+$/,'')) || `foto-${Date.now()}`; }
  async function bitmapFromFile(file){ try{return await createImageBitmap(file,{imageOrientation:'from-image'});}catch{return await createImageBitmap(file);} }
  async function resizeWebp(file,targetWidth,quality=.92){
    const bitmap=await bitmapFromFile(file), width=Math.max(1,Math.min(targetWidth,bitmap.width)), height=Math.round(bitmap.height*(width/bitmap.width));
    const canvas=document.createElement('canvas'); canvas.width=width; canvas.height=height; const ctx=canvas.getContext('2d',{alpha:false}); ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high'; ctx.drawImage(bitmap,0,0,width,height); bitmap.close?.();
    return await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Falha ao gerar WebP')),'image/webp',quality));
  }

  const CRC_TABLE=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1);t[n]=c>>>0;}return t;})();
  function crc32(bytes){let c=0xFFFFFFFF;for(const b of bytes)c=CRC_TABLE[(c^b)&0xFF]^(c>>>8);return(c^0xFFFFFFFF)>>>0;}
  function u16(n){return new Uint8Array([n&255,(n>>>8)&255]);} function u32(n){return new Uint8Array([n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255]);}
  function concatBytes(parts){const len=parts.reduce((n,p)=>n+p.length,0),out=new Uint8Array(len);let off=0;for(const p of parts){out.set(p,off);off+=p.length;}return out;}
  function dosDateTime(d=new Date()){const year=Math.max(1980,d.getFullYear());return{time:((d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1))&0xFFFF,date:(((year-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate())&0xFFFF};}
  async function makeZip(entries){
    const enc=new TextEncoder(),locals=[],centrals=[];let offset=0;
    for(const entry of entries){
      const name=enc.encode(entry.path.replace(/\\/g,'/')),data=new Uint8Array(await entry.blob.arrayBuffer()),crc=crc32(data),dt=dosDateTime(entry.date||new Date());
      const local=concatBytes([u32(0x04034b50),u16(20),u16(0x0800),u16(0),u16(dt.time),u16(dt.date),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),name,data]);
      const central=concatBytes([u32(0x02014b50),u16(20),u16(20),u16(0x0800),u16(0),u16(dt.time),u16(dt.date),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),name]);
      locals.push(local);centrals.push(central);offset+=local.length;
    }
    const centralData=concatBytes(centrals),localData=concatBytes(locals),end=concatBytes([u32(0x06054b50),u16(0),u16(0),u16(entries.length),u16(entries.length),u32(centralData.length),u32(localData.length),u16(0)]);
    return new Blob([localData,centralData,end],{type:'application/zip'});
  }
  function downloadBlob(name,blob){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),3000);}
  function packageName(){const d=new Date(),pad=n=>String(n).padStart(2,'0');return `Leal_DCoracao_Atualizacao_${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}.zip`;}

  async function buildCompletePackage(){
    syncCurrentFromForm();
    const validation=validateProducts(products); if(validation){toast(validation);alert(validation);return;}
    const packageProducts=clone(products), entries=[];
    const changed=products.filter(p=>pendingFiles(p).length);
    els.overlay.hidden=false; els.progress.textContent=changed.length?`Preparando fotos de ${changed.length} produto(s)…`:'Preparando catálogo…';
    try{
      for(let pi=0;pi<products.length;pi++){
        const sourceProduct=products[pi], files=pendingFiles(sourceProduct); if(!files.length)continue;
        const targetProduct=packageProducts[pi],safeId=slug(targetProduct.id||targetProduct.nome)||`produto-${Date.now()}`,generated=[];
        for(let fi=0;fi<files.length;fi++){
          const file=files[fi]; els.progress.textContent=`${targetProduct.nome}: foto ${fi+1} de ${files.length}…`;
          const probe=await bitmapFromFile(file),originalWidth=probe.width;probe.close?.();
          const base=`${String(fi+1).padStart(2,'0')}-${baseName(file.name)}`,variants={};
          for(const [key,width] of [['sm',800],['md',1800],['xl',2560]]){
            if(originalWidth<width && key!=='sm')continue;
            const blob=await resizeWebp(file,width,.92),filename=`${base}-${width}.webp`,path=`public/images/catalogo/${safeId}/${filename}`;
            entries.push({path,blob}); variants[key]=path;
          }
          generated.push({alt:`${targetProduct.nome} — foto ${fi+1}`,variantes:variants});
        }
        targetProduct.imagens=generated; targetProduct.demo=false;
      }
      entries.unshift({path:'data/catalogo.js',blob:new Blob([catalogText(packageProducts)],{type:'text/javascript;charset=utf-8'})});
      els.progress.textContent='Montando um único ZIP…';
      const zip=await makeZip(entries); downloadBlob(packageName(),zip);

      // O rascunho passa a refletir o pacote que acabou de ser gerado.
      for(let i=0;i<products.length;i++){
        if(pendingFiles(products[i]).length){ products[i].imagens=clone(packageProducts[i].imagens); products[i].demo=false; }
      }
      persist(); renderList(); renderEditor();
      toast('Atualização completa baixada ✓');
      setTimeout(()=>alert('Pronto! Extraia o ZIP sobre a pasta raiz leal-festas-site, aceite substituir os arquivos e faça um único commit/push no GitHub.'),100);
    }catch(err){ console.error(err); alert(`Não foi possível gerar o pacote: ${err.message||err}`); }
    finally{ els.overlay.hidden=true; }
  }

  // Formulário com autosave: não há mais botão "Salvar item".
  $('#productForm').addEventListener('submit',e=>e.preventDefault());
  $('#productForm').querySelectorAll('input:not([type=file]),select,textarea').forEach(el=>{el.addEventListener('input',onFormEdited);el.addEventListener('change',onFormEdited);});
  $('#nome').addEventListener('input',()=>{const id=$('#id');if(id.value.startsWith('novo-item-'))id.value=slug($('#nome').value);});
  $('#newBtn').onclick=addNew; $('#moveUpBtn').onclick=()=>move(-1); $('#moveDownBtn').onclick=()=>move(1); $('#deleteBtn').onclick=remove; $('#resetBtn').onclick=reset;
  $('#selectPhotosBtn').onclick=()=>$('#productPhotoInput').click();
  $('#productPhotoInput').onchange=e=>{const files=[...e.target.files];e.target.value='';selectPhotos(files);};
  $('#packageBtn').onclick=buildCompletePackage;

  window.addEventListener('beforeunload',e=>{ if([...PENDING_PHOTOS.values()].some(x=>x.length)){e.preventDefault();e.returnValue='';} });
  renderList(); renderEditor();
})();
