(() => {
  const SOURCE = Array.isArray(window.LEAL_CATALOGO) ? window.LEAL_CATALOGO : [];
  const DRAFT_KEY = 'leal_admin_catalog_draft_v1';
  const CAT_NAMES = { kits:'Kits de Festa', baloes:'Balões', estrutura:'Estrutura', equipamentos:'Equipamentos', servicos:'Serviços' };
  let products = loadDraft() || structuredCloneSafe(SOURCE);
  let selected = products[0]?.id || null;
  const LOCAL_PREVIEWS = new Map();

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
  function imageKey(img){ return img?.variantes?.sm || img?.src || img?.variantes?.md || img?.variantes?.xl || ''; }
  function imageUrl(img){ const key=imageKey(img); return LOCAL_PREVIEWS.get(key) || (key ? `../${key}` : '../public/images/favicon.svg'); }
  function isDemoImage(img){ const paths=[img?.src,img?.variantes?.sm,img?.variantes?.md,img?.variantes?.xl].filter(Boolean); return paths.some(x=>String(x).includes('/demo/')); }
  function addRealImages(product,newImages){
    const existing=(product.imagens||[]).filter(img=>!isDemoImage(img));
    product.imagens=[...existing,...newImages];
    product.demo=false;
  }
  function normalizeAdminImages(images=[]){
    const out=[]; const groups=new Map();
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
  function toast(msg){ els.toast.textContent=msg; els.toast.classList.add('show'); clearTimeout(toast.t); toast.t=setTimeout(()=>els.toast.classList.remove('show'),1800); }

  function renderList(){
    els.count.textContent=`${products.length} ${products.length===1?'item':'itens'}`;
    els.list.innerHTML=products.map((p,i)=>`<button class="product-row ${p.id===selected?'active':''}" data-select="${esc(p.id)}"><img src="${esc(imageUrl(p.imagens?.[0]))}" onerror="this.onerror=null;this.src='../public/images/favicon.svg'" alt=""><span><strong>${esc(p.nome)}</strong><small>${esc(p.categoriaNome||CAT_NAMES[p.categoria]||p.categoria)} • R$ ${Number(p.preco||0).toFixed(2).replace('.',',')}</small></span><span class="badges">${p.destaque?'⭐ ':''}${p.ativo===false?'🔴':'🟢'}</span></button>`).join('');
    document.querySelectorAll('[data-select]').forEach(b=>b.onclick=()=>{ selected=b.dataset.select; renderList(); renderEditor(); });
  }

  function renderEditor(){
    const p=current();
    els.form.hidden=!p; els.empty.hidden=!!p;
    if(!p) return;
    els.editorName.textContent=p.nome||'Produto';
    $('#nome').value=p.nome||''; $('#id').value=p.id||''; $('#categoria').value=p.categoria||'kits'; $('#preco').value=p.preco??0; $('#unidade').value=p.unidade||''; $('#descricao').value=p.descricao||''; $('#inclui').value=(p.inclui||[]).join('\n'); $('#complementos').value=(p.complementos||[]).join('\n');
    $('#ativo').checked=p.ativo!==false; $('#destaque').checked=!!p.destaque; $('#demo').checked=!!p.demo;
    renderPhotos(p.imagens||[]);
    els.status.textContent='Edite e salve o item.';
  }

  function renderPhotos(images){
    els.photos.innerHTML=images.map((img,i)=>`<div class="photo-row" data-photo="${i}"><img class="photo-preview" src="${esc(imageUrl(img))}" onerror="this.onerror=null;this.src='../public/images/favicon.svg'" alt=""><div class="photo-fields"><label class="wide">Texto alternativo<input data-photo-field="alt" value="${esc(img.alt||'')}"></label><label class="wide">Arquivo único<input data-photo-field="src" value="${esc(img.src||'')}" placeholder="public/images/kits/safari/capa.webp"></label><label>800 px<input data-photo-field="sm" value="${esc(img.variantes?.sm||'')}" placeholder="...-800.webp"></label><label>1800 px<input data-photo-field="md" value="${esc(img.variantes?.md||'')}" placeholder="...-1800.webp"></label><label>2560 px<input data-photo-field="xl" value="${esc(img.variantes?.xl||'')}" placeholder="...-2560.webp"></label></div><button type="button" class="photo-remove" data-remove-photo="${i}" title="Remover foto">×</button></div>`).join('') || '<p class="help">Nenhuma foto. Use “Otimizar fotos originais” ou “Adicionar fotos prontas”.</p>';
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
    p.id=newId; p.nome=$('#nome').value.trim()||'Novo item'; p.categoria=$('#categoria').value; p.categoriaNome=CAT_NAMES[p.categoria]||p.categoria; p.preco=Number($('#preco').value||0); p.unidade=$('#unidade').value.trim()||'item'; p.descricao=$('#descricao').value.trim(); p.inclui=$('#inclui').value.split('\n').map(x=>x.trim()).filter(Boolean); p.complementos=$('#complementos').value.split('\n').map(x=>x.trim()).filter(Boolean); p.ativo=$('#ativo').checked; p.destaque=$('#destaque').checked; p.demo=$('#demo').checked; p.imagens=collectPhotos();
    selected=p.id; persist(); renderList(); renderEditor(); els.status.textContent='Alterações salvas no rascunho local.'; toast('Item salvo ✓');
  }

  function addNew(){
    const id=`novo-item-${Date.now()}`; products.push({id,nome:'Novo item',categoria:'kits',categoriaNome:'Kits de Festa',preco:0,unidade:'item',destaque:false,ativo:false,demo:false,descricao:'',inclui:[],imagens:[]}); selected=id; persist(); renderList(); renderEditor(); $('#nome').focus();
  }
  function move(delta){ const i=products.findIndex(p=>p.id===selected); const j=i+delta; if(i<0||j<0||j>=products.length)return; [products[i],products[j]]=[products[j],products[i]]; persist(); renderList(); toast('Ordem alterada'); }
  function remove(){ const p=current(); if(!p)return; if(!confirm(`Excluir “${p.nome}” do catálogo local?`))return; products=products.filter(x=>x.id!==p.id); selected=products[0]?.id||null; persist(); renderList(); renderEditor(); toast('Item removido'); }

  function cleanProduct(p){
    const out={id:p.id,nome:p.nome,categoria:p.categoria,categoriaNome:p.categoriaNome||CAT_NAMES[p.categoria]||p.categoria,preco:Number(p.preco||0),unidade:p.unidade||'item',destaque:!!p.destaque,ativo:p.ativo!==false,demo:!!p.demo,descricao:p.descricao||'',inclui:Array.isArray(p.inclui)?p.inclui:[],complementos:Array.isArray(p.complementos)?p.complementos:[],imagens:(p.imagens||[]).map(img=>{const x={};if(img.src)x.src=img.src;if(img.alt)x.alt=img.alt;if(img.variantes&&Object.keys(img.variantes).length)x.variantes=img.variantes;return x;})}; return out;
  }
  function catalogText(){ return `// Catálogo gerado pelo Leal D’Coração Admin em ${new Date().toLocaleString('pt-BR')}\n// Para esconder um item: ativo: false | Para destacar: destaque: true\nwindow.LEAL_CATALOGO = ${JSON.stringify(products.map(cleanProduct),null,2)};\n`; }
  function download(){ const blob=new Blob([catalogText()],{type:'text/javascript;charset=utf-8'}); const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='catalogo.js';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('catalogo.js baixado'); }
  async function copy(){ try{await navigator.clipboard.writeText(catalogText());toast('Catálogo copiado');}catch{toast('Não foi possível copiar');} }
  function reset(){ if(!confirm('Descartar o rascunho local e recarregar o catálogo atual do site?'))return; products=structuredCloneSafe(SOURCE); selected=products[0]?.id||null; localStorage.removeItem(DRAFT_KEY); renderList(); renderEditor(); toast('Catálogo recarregado'); }

  function setOptimizerStatus(message, type='working'){
    const box=$('#optimizerStatus'); if(!box)return; box.hidden=false; box.className=`optimizer-status ${type}`; box.textContent=message;
  }
  function baseName(name='foto'){
    return slug(name.replace(/\.[^.]+$/,'')) || `foto-${Date.now()}`;
  }
  async function bitmapFromFile(file){
    try { return await createImageBitmap(file,{imageOrientation:'from-image'}); }
    catch { return await createImageBitmap(file); }
  }
  async function resizeWebp(file, targetWidth, quality=.92){
    const bitmap=await bitmapFromFile(file);
    const width=targetWidth;
    const height=Math.round(bitmap.height*(width/bitmap.width));
    const canvas=document.createElement('canvas'); canvas.width=width; canvas.height=height;
    const ctx=canvas.getContext('2d',{alpha:false}); ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high'; ctx.drawImage(bitmap,0,0,width,height); bitmap.close?.();
    return await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Falha ao gerar WebP')),'image/webp',quality));
  }
  async function nestedDirectory(root, parts){
    let dir=root; for(const part of parts) dir=await dir.getDirectoryHandle(part,{create:true}); return dir;
  }
  async function writeBlob(dir,name,blob){
    const handle=await dir.getFileHandle(name,{create:true}); const writable=await handle.createWritable(); await writable.write(blob); await writable.close();
  }
  function downloadBlob(name,blob){
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),1500);
  }

  // ZIP simples (STORE, sem recompressão). WebP já é comprimido, então isso evita
  // baixar dezenas de arquivos separadamente quando o Admin está rodando no Render.
  const CRC_TABLE=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1);t[n]=c>>>0;}return t;})();
  function crc32(bytes){let c=0xFFFFFFFF;for(const b of bytes)c=CRC_TABLE[(c^b)&0xFF]^(c>>>8);return (c^0xFFFFFFFF)>>>0;}
  function u16(n){return new Uint8Array([n&255,(n>>>8)&255]);}
  function u32(n){return new Uint8Array([n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255]);}
  function concatBytes(parts){const len=parts.reduce((n,p)=>n+p.length,0),out=new Uint8Array(len);let off=0;for(const p of parts){out.set(p,off);off+=p.length;}return out;}
  function dosDateTime(d=new Date()){
    const year=Math.max(1980,d.getFullYear());
    return {time:((d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1))&0xFFFF,date:(((year-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate())&0xFFFF};
  }
  async function makeZip(entries){
    const enc=new TextEncoder(), locals=[], centrals=[]; let offset=0;
    for(const entry of entries){
      const name=enc.encode(entry.path.replace(/\\/g,'/')), data=new Uint8Array(await entry.blob.arrayBuffer()), crc=crc32(data), dt=dosDateTime(entry.date||new Date());
      const local=concatBytes([u32(0x04034b50),u16(20),u16(0x0800),u16(0),u16(dt.time),u16(dt.date),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),name,data]);
      const central=concatBytes([u32(0x02014b50),u16(20),u16(20),u16(0x0800),u16(0),u16(dt.time),u16(dt.date),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),name]);
      locals.push(local); centrals.push(central); offset+=local.length;
    }
    const centralData=concatBytes(centrals), localData=concatBytes(locals);
    const end=concatBytes([u32(0x06054b50),u16(0),u16(0),u16(entries.length),u16(entries.length),u32(centralData.length),u32(localData.length),u16(0)]);
    return new Blob([localData,centralData,end],{type:'application/zip'});
  }

  async function optimizeOriginals(files){
    const p=current(); if(!p||!files.length)return;
    const safeId=slug(p.id||p.nome)||`produto-${Date.now()}`;
    let rootHandle=null, directSave=false;
    if('showDirectoryPicker' in window){
      try { rootHandle=await window.showDirectoryPicker({mode:'readwrite'}); directSave=true; }
      catch(err){
        // Cancelar a escolha de pasta no Admin online não deve cancelar a otimização:
        // seguimos no modo ZIP. Só erros inesperados são registrados no console.
        if(err?.name!=='AbortError') console.warn('Gravação direta indisponível; usando ZIP.',err);
      }
    }
    const dest=directSave ? await nestedDirectory(rootHandle,['public','images','catalogo',safeId]) : null;
    const generated=[], zipEntries=[];
    for(let index=0; index<files.length; index++){
      const file=files[index]; setOptimizerStatus(`Otimizando ${index+1} de ${files.length}: ${file.name}…`,'working');
      const probe=await bitmapFromFile(file); const originalWidth=probe.width; probe.close?.();
      const base=`${String(index+1).padStart(2,'0')}-${baseName(file.name)}`;
      const variants={};
      for(const [key,width] of [['sm',800],['md',1800],['xl',2560]]){
        if(originalWidth < width && key!=='sm') continue;
        const outputWidth=Math.max(1,Math.min(width,originalWidth));
        const blob=await resizeWebp(file,outputWidth,.92);
        const filename=`${base}-${width}.webp`;
        if(directSave) await writeBlob(dest,filename,blob);
        else zipEntries.push({path:`public/images/catalogo/${safeId}/${filename}`,blob});
        variants[key]=`public/images/catalogo/${safeId}/${filename}`;
      }
      const generatedImage={alt:`${p.nome} — foto ${index+1}`,variantes:variants};
      generated.push(generatedImage);
      // No Admin online, os arquivos ainda não existem no Render.
      // Use a versão 800 px recém-gerada como prévia temporária, sem criar 3 miniaturas.
      const previewEntry=zipEntries.find(x=>x.path===variants.sm);
      if(previewEntry) LOCAL_PREVIEWS.set(imageKey(generatedImage),URL.createObjectURL(previewEntry.blob));
      else if(directSave && file) LOCAL_PREVIEWS.set(imageKey(generatedImage),URL.createObjectURL(file));
    }
    if(!directSave && zipEntries.length){
      setOptimizerStatus('Gerando pacote ZIP das fotos…','working');
      const zip=await makeZip(zipEntries);
      downloadBlob(`fotos-${safeId}.zip`,zip);
    }
    addRealImages(p,generated); persist(); renderPhotos(p.imagens); renderList();
    setOptimizerStatus(directSave
      ? `Pronto: ${generated.length} foto(s) otimizadas e gravadas diretamente em public/images/catalogo/${safeId}/. Os caminhos já foram adicionados ao produto.`
      : `Pronto: ${generated.length} foto(s) processadas. Foi baixado o arquivo fotos-${safeId}.zip. Extraia esse ZIP sobre a pasta raiz leal-festas-site; ele já contém public/images/catalogo/${safeId}/ com os arquivos nos lugares corretos.`,'done');
    toast('Fotos otimizadas ✓');
  }

  function addReadyPhotos(files){
    const p=current(); if(!p||!files.length)return;
    const safeId=slug(p.id||p.nome)||`produto-${Date.now()}`;
    const groups=new Map();
    const previews=new Map();
    for(const file of files){
      const name=file.name;
      const match=name.match(/^(.*)-(800|1800|2560)\.webp$/i);
      if(match){
        const base=match[1], width=match[2], key=width==='800'?'sm':width==='1800'?'md':'xl';
        if(!groups.has(base)) groups.set(base,{alt:`${p.nome}`,variantes:{}});
        groups.get(base).variantes[key]=`public/images/catalogo/${safeId}/${name}`;
        if(width==='800' || !previews.has(base)) previews.set(base,file);
      } else {
        const groupKey=`single-${name}`;
        groups.set(groupKey,{src:`public/images/catalogo/${safeId}/${name}`,alt:`${p.nome}`});
        previews.set(groupKey,file);
      }
    }
    const added=[...groups.entries()].map(([groupKey,img])=>{
      const previewFile=previews.get(groupKey);
      if(previewFile) LOCAL_PREVIEWS.set(imageKey(img),URL.createObjectURL(previewFile));
      return img;
    });
    addRealImages(p,added); persist(); renderPhotos(p.imagens); renderList();
    setOptimizerStatus(`${added.length} foto(s) adicionadas ao catálogo. Confirme que esses arquivos estão fisicamente em public/images/catalogo/${safeId}/ antes do git push.`,'done');
    toast('Fotos adicionadas ✓');
  }

  $('#productForm').onsubmit=saveCurrent; $('#newBtn').onclick=addNew; $('#moveUpBtn').onclick=()=>move(-1); $('#moveDownBtn').onclick=()=>move(1); $('#deleteBtn').onclick=remove; $('#downloadBtn').onclick=download; $('#copyBtn').onclick=copy; $('#resetBtn').onclick=reset;
  $('#addPhotoBtn').onclick=()=>$('#readyPhotoInput').click();
  $('#readyPhotoInput').onchange=e=>{ const files=[...e.target.files]; e.target.value=''; try{addReadyPhotos(files);}catch(err){console.error(err);setOptimizerStatus(`Erro ao adicionar: ${err.message||err}`,'error');toast('Erro ao adicionar fotos');} };
  $('#optimizePhotoBtn').onclick=()=>$('#optimizeFileInput').click(); $('#optimizeFileInput').onchange=async e=>{ const files=[...e.target.files]; e.target.value=''; try{await optimizeOriginals(files);}catch(err){console.error(err);setOptimizerStatus(`Erro ao otimizar: ${err.message||err}`,'error');toast('Erro ao otimizar fotos');} };
  $('#nome').addEventListener('input',()=>{ const id=$('#id'); if(id.value.startsWith('novo-item-')) id.value=slug($('#nome').value); });

  // Repara automaticamente rascunhos antigos: agrupa 800/1800/2560 e remove demos quando já há foto real.
  products.forEach(p=>{ p.imagens=normalizeAdminImages(p.imagens||[]); if((p.imagens||[]).some(img=>!isDemoImage(img))) p.demo=false; });
  persist();
  renderList(); renderEditor();
})();
