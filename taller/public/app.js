(function(){
'use strict';
/* ============ Estructura de la ficha ============ */
const INV=['Radio','Cinturón de seguridad','Llave de ruedas','Gata y barra','Extintor','Jaula antivuelco','Cuñas','Alarma de retroceso','Bocina','Rueda de repuesto','Neumáticos / orugas','Llantas / bastidor'];
const SYS=[
 {id:'carga',n:'Sistema de carga',items:['Batería','Alternador','Ramal eléctrico']},
 {id:'luces',n:'Sistema de luces',items:['Estado focos (traseros y delanteros)','Intermitentes','Ampolletas','Pértiga','Baliza']},
 {id:'potencia',n:'Sistema de potencia',items:['Turbocompresor','Filtro DPF','Escape']},
 {id:'motor',n:'Motor',items:['Visual posibles fugas y fallas','Mangueras','Sensores','Cables','Correas']},
 {id:'ruedas',n:'Sistema de ruedas',items:['Estado neumáticos','Estado llantas','Check points','Torque correspondiente','Estado tuercas y pernos']},
 {id:'hidraulico',n:'Sistema hidráulico',edit:true},
 {id:'frenos',n:'Sistema de frenos',edit:true}];
const STEPS=['Datos','Inventario','Chequeo','Trabajo','Cierre'];
const OUTS={conforme:['Conforme','Equipo operativo, ficha cerrada','ok'],no_conforme:['No conforme','Vuelve a reparación','bad'],pendiente:['Queda pendiente','Falta repuesto o prueba','warn'],fuera:['Fuera de servicio','Equipo bloqueado','oos']};
const ROLES={mecanico:'Mecánico',supervisor:'Supervisor',operador:'Operador',admin:'Administrador'};
const LOGO={full:'img/logo-full.png',inv:'img/logo-inv.png',gear:'img/logo-gear.png',gearInv:'img/logo-gear-inv.png'};
const DEF_CFG={turnoActivo:'A',horaTermino:'19:00',intervaloMant:250,hidraulicoDef:[],frenosDef:[],plantillas:{},roles:{}};
const LIB={h2c:'vendor/html2canvas.min.js',pdf:'vendor/jspdf.umd.min.js',qr:'vendor/qrcode.js',jsqr:'vendor/jsQR.js',xlsx:'vendor/xlsx.full.min.js'};

/* ============ Utilidades ============ */
const $=(s,r)=>(r||document).querySelector(s),$$=(s,r)=>Array.from((r||document).querySelectorAll(s));
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=o=>o==null?o:JSON.parse(JSON.stringify(o));
const pad=n=>String(n).padStart(2,'0');
const hhmm=t=>t?new Date(t).toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit',hourCycle:'h23'}):'';
const fecha=t=>t?new Date(t).toLocaleDateString('es-CL',{day:'2-digit',month:'2-digit',year:'numeric'}):'';
const dayKey=t=>{const d=new Date(t);return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())};
const dayLabel=k=>{const p=k.split('-');return p[2]+'-'+p[1]+'-'+p[0]};
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const isObj=v=>v&&typeof v==='object'&&!Array.isArray(v);
function deepMerge(t,p){Object.keys(p).forEach(k=>{const v=p[k];if(isObj(v)&&isObj(t[k]))deepMerge(t[k],v);else t[k]=clone(v)});return t}
function stable(o){if(Array.isArray(o))return '['+o.map(stable).join(',')+']';if(isObj(o))return '{'+Object.keys(o).sort().map(k=>JSON.stringify(k)+':'+stable(o[k])).join(',')+'}';return JSON.stringify(o===undefined?null:o)}
function pathObj(path,v){const k=path.split('.');const o={};let a=o;k.forEach((x,i)=>{if(i===k.length-1)a[x]=v;else{a[x]={};a=a[x]}});return o}
const getP=(o,p)=>p.split('.').reduce((a,k)=>a==null?a:a[k],o);
function buzz(p){try{navigator.vibrate&&navigator.vibrate(p||8)}catch(e){}}
const lsGet=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,v);return true}catch(e){return false}};
const libs={};
function load(name){if(libs[name])return libs[name];libs[name]=new Promise((res,rej)=>{const s=document.createElement('script');s.src=LIB[name];s.onload=res;s.onerror=()=>{delete libs[name];rej(new Error('lib'))};document.head.appendChild(s)});return libs[name]}
const normPlate=p=>String(p||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
const plateOk=p=>{p=normPlate(p);return /^[B-DF-HJ-LPR-TV-Z]{4}\d{2}$/.test(p)||/^[A-Z]{2}\d{4}$/.test(p)};
function plateFmt(p){p=normPlate(p);if(/^[A-Z]{4}\d{2}$/.test(p))return p.slice(0,4)+'·'+p.slice(4);if(/^[A-Z]{2}\d{4}$/.test(p))return p.slice(0,2)+'·'+p.slice(2);return p}
const eqKey=e=>normPlate(e.patente)||(e.interno?'INT-'+normPlate(e.interno):'');
const eqLabel=e=>e.patente?plateFmt(e.patente):(e.interno||'s/n');
const plate=(e,lg)=>`<span class="plate${lg?' lg':''}">${esc(eqLabel(e))}</span>`;
function rutDv(b){let s=0,m=2;for(let i=b.length-1;i>=0;i--){s+=+b[i]*m;m=m===7?2:m+1}const r=11-(s%11);return r===11?'0':r===10?'K':String(r)}
const rutClean=r=>String(r||'').replace(/[^0-9kK]/g,'').toUpperCase();
const rutOk=r=>{r=rutClean(r);return r.length>=7&&r.length<=9&&rutDv(r.slice(0,-1))===r.slice(-1)};
function rutFmt(r){r=rutClean(r);if(r.length<2)return r;return r.slice(0,-1).replace(/\B(?=(\d{3})+(?!\d))/g,'.')+'-'+r.slice(-1)}
const num=v=>{if(typeof v==='number')return v;const n=parseFloat(String(v==null?'':v).replace(/\./g,'').replace(',','.'));return isNaN(n)?null:n};
const fmtN=n=>n==null?'':Number(n).toLocaleString('es-CL');

/* ============ Iconos ============ */
const ic=p=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const I={back:ic('<path d="M15 18l-6-6 6-6"/>'),home:ic('<path d="M3 10.5L12 3l9 7.5V21h-6v-6H9v6H3z"/>'),eq:ic('<rect x="2" y="7" width="13" height="9" rx="1"/><path d="M15 10h4l3 3v3h-7"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>'),scan:ic('<path d="M4 8V5a1 1 0 011-1h3M16 4h3a1 1 0 011 1v3M20 16v3a1 1 0 01-1 1h-3M8 20H5a1 1 0 01-1-1v-3"/><path d="M7 12h10"/>'),turno:ic('<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>'),panel:ic('<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M7 14l3-3 3 2 4-5M8 21h8"/>'),gear:ic('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>'),chev:'<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',mic:ic('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/>'),pen:ic('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/>'),pdf:ic('<path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z"/><path d="M14 3v6h6M12 18v-6M9 15l3 3 3-3"/>'),img:ic('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>'),wa:ic('<path d="M21 12a9 9 0 01-13.5 7.8L3 21l1.3-4.4A9 9 0 1121 12z"/>'),cam:ic('<path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>'),xls:ic('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>')};

/* ============ Estado ============ */
const St={mode:'local',ready:false,fichas:{},equipos:{},personas:{},entregas:{},cfg:clone(DEF_CFG),cfgExists:false,fotos:{},uid:null,profName:'',isEditor:false,canWrite:true,inflight:0,queued:0,online:navigator.onLine,loaded:{},localMe:null};
const ui={view:'inicio',fid:null,ek:null,step:0,filter:'abiertas',open:{},confirm:null,dir:0,justClosed:null,asRole:lsGet('cl-asrole')||'',q:'',eqq:'',pview:'vivo',tplTipo:'',sig:null,tnota:'',dict:null};
let DB=null,USER=null,DL=null,DICT=null,FB=null,FS=null,AUTH=null;
const CFG_PATH='config/app';
const RECENT_DAYS=60;
const LSK='checklis-taller-v2';

function me(){if(St.mode==='local')return St.localMe;return St.uid?St.personas[St.uid]:null}
function realRole(){const m=me();if(!m)return 'mecanico';if(St.mode==='local')return m.rol||'mecanico';return (St.cfg.roles||{})[St.uid]||'mecanico'}
function role(){const r=realRole();if(r==='admin'&&ui.asRole)return ui.asRole;return r}
const isSup=()=>['supervisor','admin'].includes(role());
const myId=()=>St.uid||'local';

/* ============ Persistencia ============ */
const Q={};
function docOf(path){const p=path.split('/');if(p[0]==='sys'||p[0]==='config')return St.cfg;const map={fichas:St.fichas,equipos:St.equipos,personas:St.personas,entregas:St.entregas,fotos:St.fotos};return map[p[0]]&&map[p[0]][p[1]]}
let localT;
function saveLocal(){clearTimeout(localT);localT=setTimeout(()=>{const ok=lsSet(LSK,JSON.stringify({fichas:St.fichas,equipos:St.equipos,personas:St.personas,entregas:St.entregas,cfg:St.cfg,fotos:St.fotos,localMe:St.localMe}));if(!ok&&!saveLocal.w){saveLocal.w=1;toast('Este navegador no permite guardar aquí. Los datos se pierden al cerrar.','bad')}flashSync()},250)}
function write(path,patch,o){o=o||{};if(St.mode==='local'){saveLocal();return}
 if(!St.canWrite)return;
 const q=Q[path]=Q[path]||{patch:null,t:0,busy:false,set:false};
 if(o.set)q.set=true;q.patch=q.patch?deepMerge(q.patch,patch):clone(patch);
 clearTimeout(q.t);q.t=setTimeout(()=>flush(path),o.now?0:450);updSync()}
async function flush(path){const q=Q[path];if(!q||!q.patch)return;
 if(St.mode==='fb'){const p=q.patch,setIt=q.set;q.patch=null;q.set=false;St.inflight++;updSync();const ref=DB.doc(path);(setIt?ref.set(clone(docOf(path)||p)):ref.update(p)).catch(dbFail).finally(()=>{St.inflight--;updSync();flashSync()});return}
 if(q.busy)return;const p=q.patch,setIt=q.set;q.patch=null;q.set=false;q.busy=true;q.sent=p;St.inflight++;updSync();
 const ref=DB.doc(path);
 try{if(setIt){const full=docOf(path);await ref.set(clone(full||p))}else await ref.update(p)}
 catch(e){const c=e&&e.code;
  if(c==='invalid_argument'&&!setIt){try{const full=docOf(path);await ref.set(clone(full||p))}catch(e2){dbFail(e2)}}
  else if(c==='unavailable'||c==='resource_exhausted'){q.patch=q.patch?deepMerge(clone(p),q.patch):p;q.set=q.set||setIt;setTimeout(()=>flush(path),1500+Math.random()*2000)}
  else dbFail(e)}
 finally{q.busy=false;q.recent=Date.now()+4000;St.inflight--;updSync();if(q.patch)flush(path);else flashSync();setTimeout(()=>{if(!q.busy&&!q.patch&&q.recent<=Date.now())q.sent=null},4500)}}
function dbFail(e){const c=e&&e.code;if(c==='quota_exceeded')toast('El almacenamiento compartido está lleno. Pide al administrador borrar datos de ejemplo.','bad');else if(c==='invalid_argument'){St.canWrite=false;toast('Tu acceso es de solo lectura. Pide acceso de colaborador para registrar fichas.','bad');scheduleRender(true)}else if(c==='revoked'){St.canWrite=false}else toast('No se pudo guardar un cambio. Se reintentará al reconectar.','bad')}
function remove(path){const p=path.split('/');if(p[0]==='fotos')delete St.fotos[p[1]];if(St.mode==='local'){saveLocal();return}if(St.canWrite)DB.doc(path).delete().catch(dbFail)}
function updSync(){St.queued=Object.values(Q).filter(q=>q.patch).length;const el=$('.sync');if(!el)return;const n=St.inflight+St.queued;el.className='sync'+(!St.online?' off':n?' busy':'');$('span',el).textContent=syncText()}
function syncText(){const n=St.inflight+St.queued;if(St.mode==='local')return 'En este equipo';if(!St.online)return n?`Sin señal, ${n} por subir`:'Sin señal';if(n)return 'Guardando';return 'Guardado'}
function flashSync(){const el=$('.sync');if(!el)return;updSync();el.classList.remove('pulse');void el.offsetWidth;el.classList.add('pulse')}
['visibilitychange','pagehide'].forEach(t=>addEventListener(t,()=>{if(t==='pagehide'||document.hidden)Object.keys(Q).forEach(p=>{clearTimeout(Q[p].t);flush(p)})}));
addEventListener('online',()=>{St.online=true;updSync();Object.keys(Q).forEach(flush);toast('Conexión recuperada. Subiendo cambios.')});
addEventListener('offline',()=>{St.online=false;updSync();toast('Sin señal. Sigue trabajando: los cambios se suben al volver.','bad')});

/* Fotos y firmas: un documento por imagen */
const fotoCache={};
function getFoto(id){if(!id)return Promise.resolve(null);if(St.fotos[id])return Promise.resolve(St.fotos[id].data);if(fotoCache[id])return fotoCache[id];if(St.mode==='local')return Promise.resolve(null);fotoCache[id]=DB.doc('fotos/'+id).get().then(s=>s.exists?s.data().data:null).catch(()=>{delete fotoCache[id];return null});return fotoCache[id]}
function putFoto(data,fid,kind,extra){const id=uid();St.fotos[id]=Object.assign({data,fid,kind,t:Date.now()},extra||{});if(St.mode!=='local'){fotoCache[id]=Promise.resolve(data);write('fotos/'+id,St.fotos[id],{set:true,now:true})}else saveLocal();return id}
function hydrate(root){$$('img[data-foto]',root||document).forEach(im=>{if(im.getAttribute('src'))return;getFoto(im.dataset.foto).then(d=>{if(d)im.src=d})})}
function compress(file,max,q){return new Promise((res,rej)=>{const url=URL.createObjectURL(file);const img=new Image();img.onload=()=>{const s=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.naturalWidth*s));c.height=Math.max(1,Math.round(img.naturalHeight*s));const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);res(c.toDataURL('image/jpeg',q||.62))};img.onerror=()=>{URL.revokeObjectURL(url);rej(new Error('decode'))};img.src=url})}

/* ============ Modelo ============ */
function itemsOf(f,s){return s.edit?((f.extra&&f.extra[s.id])||[]):s.items}
function allKeys(f){const k=INV.map((_,i)=>'inv:'+i);SYS.forEach(s=>itemsOf(f,s).forEach((_,i)=>k.push('chk:'+s.id+':'+i)));return k}
const mk=(f,k)=>(f.marks&&f.marks[k])||null;
function prog(f){const k=allKeys(f);const d=k.filter(x=>{const m=mk(f,x);return m&&m.v}).length;return {d,t:k.length,pct:k.length?Math.round(d/k.length*100):0}}
function nameOf(f,key){const p=key.split(':');if(p[0]==='inv')return INV[+p[1]];const s=SYS.find(x=>x.id===p[1]);return itemsOf(f,s)[+p[2]]||''}
function secOf(key){const p=key.split(':');if(p[0]==='inv')return 'Inventario';return SYS.find(x=>x.id===p[1]).n}
function faults(f){return allKeys(f).filter(k=>{const m=mk(f,k);return m&&m.v==='M'}).map(k=>({k,sec:secOf(k),n:nameOf(f,k),m:mk(f,k)}))}
function estado(f){if(f.estado==='cerrada'){const o=OUTS[f.salida]||OUTS.conforme;return [f.salida==='conforme'?'Entregado':o[0],o[2]]}if(f.espera)return['Esperando repuesto','bad'];const s=f.step||0;if(s===0)return['Recién llegó','na'];if(s<=2)return['Chequeando','info'];if(s===3)return['En reparación','warn'];return['Listo para firma','ok']}
const tipoKey=t=>String(t||'').trim().toLowerCase();
function newFicha(pre){const m=me();const c=St.cfg;const f={id:uid(),creado:Date.now(),act:Date.now(),estado:'abierta',step:0,
 equipo:{equipo:'',marca:'',modelo:'',patente:'',interno:'',horometro:'',empresa:''},usuario:{nombre:'',area:'',turno:c.turnoActivo||'A',solicita:''},
 mecanico:{nombre:m.nombre,area:m.area||'',turno:m.turno||'A',uid:myId()},marks:{},extra:{hidraulico:clone(c.hidraulicoDef||[]),frenos:clone(c.frenosDef||[])},
 trabajo:'',repuestos:[],espera:false,esperaDet:'',mant:false,salida:'',motivo:'',firmas:{mec:{img:'',nombre:m.nombre,rut:m.rut||''},op:{img:'',nombre:'',rut:''}},
 reingresos:[],anexos:[],papel:'',ev:[{t:Date.now(),who:m.nombre,txt:'abrió el ingreso'}],editando:{},tplApplied:false,horoBajo:false,horoConfirm:false};
 if(pre)Object.assign(f.equipo,pre);return f}
function upd(f,patch,o){f.act=Date.now();patch.act=f.act;deepMerge(f,patch);write('fichas/'+f.id,patch,o);if((ui.view==='ficha'||ui.view==='ver')&&ui.fid===f.id)lastSig=viewSig()}
function ev(f,txt){const m=me();upd(f,{ev:(f.ev||[]).concat({t:Date.now(),who:m?m.nombre:'',txt}).slice(-60)})}
function prevHoro(f){const k=eqKey(f.equipo);if(!k)return null;let best=null;const eq=St.equipos[k];if(eq&&num(eq.horometro)!=null&&eq.ultimaFicha!==f.id)best={h:num(eq.horometro),t:eq.horoT||eq.act};
 Object.values(St.fichas).forEach(o=>{if(o.id===f.id||eqKey(o.equipo)!==k)return;const h=num(o.equipo.horometro);if(h!=null&&(!best||o.creado>(best.t||0)))best={h,t:o.creado}});return best}
function eqHist(k,exclude){return Object.values(St.fichas).filter(o=>eqKey(o.equipo)===k&&o.id!==exclude).sort((a,b)=>b.creado-a.creado)}
function lastFaults(k,exclude){const out=[];eqHist(k,exclude).forEach(o=>faults(o).forEach(x=>out.push({t:o.creado,n:x.n,nota:x.m.nota})));return out.slice(0,3)}
function mantDue(eq){if(!eq)return null;const h=num(eq.horometro),u=num(eq.ultimaMant)||0,iv=num(eq.intervalo)||num(St.cfg.intervaloMant)||250;if(h==null)return null;const r=u+iv-h;return {restante:r,vencida:r<=0,proxima:u+iv}}
function eqEstado(eq){if(!eq)return['Sin registro','na'];const open=Object.values(St.fichas).find(o=>eqKey(o.equipo)===eq.key&&o.estado!=='cerrada');if(open)return estado(open);if(eq.estado==='fuera')return['Fuera de servicio','oos'];if(eq.estado==='pendiente')return['Queda pendiente','warn'];return['Operativo','ok']}
function upsertEq(f,extra){const k=eqKey(f.equipo);if(!k)return;const old=St.equipos[k];const base={key:k,equipo:f.equipo.equipo,marca:f.equipo.marca,modelo:f.equipo.modelo,patente:normPlate(f.equipo.patente),interno:f.equipo.interno,empresa:f.equipo.empresa,ultimaFicha:f.id,act:Date.now()};
 const h=num(f.equipo.horometro);if(h!=null){base.horometro=h;base.horoT=Date.now()}
 Object.assign(base,extra||{});
 if(old){deepMerge(old,base);write('equipos/'+k,base)}else{const doc=Object.assign({intervalo:'',ultimaMant:'',estado:'taller'},base);St.equipos[k]=doc;write('equipos/'+k,doc,{set:true})}}
function dayFichas(day){const today=dayKey(Date.now())===day;return Object.values(St.fichas).filter(f=>dayKey(f.creado)===day||(f.cierre&&dayKey(f.cierre)===day)||(today&&f.estado!=='cerrada'))}
function resumen(list){return {ingresos:list.length,entregados:list.filter(f=>f.estado==='cerrada'&&f.salida==='conforme').length,pendientes:list.filter(f=>f.estado!=='cerrada'||['pendiente','fuera'].includes(f.salida)).length,fuera:list.filter(f=>f.estado==='cerrada'&&f.salida==='fuera').length,fallas:list.reduce((a,f)=>a+faults(f).length,0)}}

/* ============ Arranque ============ */
const app=$('#app');
function boot(){render();setTimeout(()=>$('#splash').classList.add('gone'),matchMedia('(prefers-reduced-motion: reduce)').matches?0:1100);
 DL={save:saveDownload};DICT=webDict();initDict();registerSW();
 const cfg=window.FIREBASE_CONFIG||{};if(!cfg.apiKey||!window.firebase){startLocal();return}
 St.mode='fb';FB=firebase.initializeApp(cfg);AUTH=firebase.auth();AUTH.languageCode='es';FS=firebase.firestore();
 if(window.FIREBASE_EMULATOR){AUTH.useEmulator('http://127.0.0.1:9099',{disableWarnings:true});FS.useEmulator('127.0.0.1',8080)}
 FS.enablePersistence({synchronizeTabs:true}).catch(()=>{}).finally(()=>{DB=fbDB(FS);
  AUTH.getRedirectResult().catch(e=>authErr(e));
  AUTH.onAuthStateChanged(u=>{unsubAll();if(!u){St.uid=null;St.ready=false;ui.view='auth';St.authReady=true;render();return}
   St.uid=u.uid;St.profName=u.displayName||'';St.email=u.email||'';St.canWrite=true;St.ready=false;St.loaded={};St.dataSubbed=false;ui.view='cargando';render();fbGate()})})}
/* ---- Firebase: adaptador con la misma forma que usa el resto de la app ---- */
const fbErr=e=>({code:{'permission-denied':'invalid_argument','not-found':'invalid_argument','invalid-argument':'invalid_argument','unavailable':'unavailable','resource-exhausted':'quota_exceeded','unauthenticated':'revoked'}[e&&e.code]||'unavailable',message:e&&e.message});
function fbDB(fs){const snap=s=>({id:s.id,exists:s.exists,data:()=>s.data(),metadata:s.metadata});
 return {doc(path){const r=fs.doc(path);return {get:()=>r.get().then(snap).catch(e=>{throw fbErr(e)}),set:d=>r.set(d).catch(e=>{throw fbErr(e)}),update:d=>r.set(d,{merge:true}).catch(e=>{throw fbErr(e)}),delete:()=>r.delete().catch(e=>{throw fbErr(e)}),onSnapshot:(n,er)=>r.onSnapshot(x=>n(snap(x)),e=>er&&er(fbErr(e)))}},
  collection(c,where){let q=fs.collection(c);(where||[]).forEach(w=>{q=q.where(w[0],w[1],w[2])});return {onSnapshot:(n,er)=>q.onSnapshot(x=>n({docs:x.docs.map(snap),size:x.size,empty:x.empty,metadata:x.metadata}),e=>er&&er(fbErr(e))),get:()=>q.get().then(x=>({docs:x.docs.map(snap)}))}}}}
let UNSUB=[];function unsubAll(){UNSUB.forEach(u=>{try{u()}catch(e){}});UNSUB=[]}
function fbGate(){St.loaded.cfg=false;St.loaded.me=false;
 UNSUB.push(DB.doc(CFG_PATH).onSnapshot(s=>{St.cfgExists=s.exists;St.cfg=Object.assign(clone(DEF_CFG),s.exists?clone(s.data()):{});St.loaded.cfg=true;onData()},()=>{St.loaded.cfg=true;onData()}));
 UNSUB.push(DB.doc('personas/'+St.uid).onSnapshot(s=>{if(s.exists)St.personas[St.uid]=clone(s.data());else delete St.personas[St.uid];St.loaded.me=true;onData()},()=>{St.loaded.me=true;onData()}))}
function fbGateView(){if(!St.loaded.cfg||!St.loaded.me)return 'cargando';if(!St.cfgExists)return 'setup';if(!St.personas[St.uid])return 'perfil';const r=(St.cfg.roles||{})[St.uid];if(!r||!ROLES[r])return 'espera';return null}
function startLocal(){St.mode='local';try{const r=JSON.parse(lsGet(LSK)||'null');if(r){['fichas','equipos','personas','entregas','fotos'].forEach(k=>{if(r[k])St[k]=r[k]});St.localMe=r.localMe||null;if(r.cfg)St.cfg=Object.assign(clone(DEF_CFG),r.cfg)}}catch(e){}
 St.ready=true;ui.view=St.localMe?'inicio':'login';render()}
let loadTimer;
function subscribeAll(){loadTimer=setTimeout(()=>{if(!St.ready){St.slow=true;render()}},10000);
 const subs=St.mode==='fb'?[['fichas',[['act','>=',Date.now()-RECENT_DAYS*864e5]]],['fichas',[['estado','==','abierta']]],['equipos'],['personas'],['entregas']]:[['fichas'],['equipos'],['personas'],['entregas']];const parts={};
 subs.forEach(([c,w],ix)=>UNSUB.push(DB.collection(c,w).onSnapshot(snap=>{const o0={};snap.docs.forEach(d=>{o0[d.id]=clone(d.data())});parts[ix]=o0;const o={};subs.forEach((x,j)=>{if(x[0]===c&&parts[j])Object.assign(o,parts[j])});if(c==='personas'&&St.uid&&St.personas[St.uid]&&!o[St.uid])o[St.uid]=St.personas[St.uid];
   Object.keys(Q).forEach(p=>{const s=p.split('/');const q=Q[p];if(s[0]!==c||s.length!==2||!(q.patch||q.busy||q.recent>Date.now()))return;if(!o[s[1]]){const loc=docOf(p);if(loc)o[s[1]]=clone(loc)}else{if(q.sent)deepMerge(o[s[1]],q.sent);if(q.patch)deepMerge(o[s[1]],q.patch)}});
   St[c]=o;St.loaded[c]=true;onData()},()=>{St.loaded[c]=true;onData()})));
 if(St.mode==='fb')return;
 DB.doc(CFG_PATH).onSnapshot(s=>{St.cfgExists=s.exists;St.cfg=Object.assign(clone(DEF_CFG),s.exists?clone(s.data()):{});St.loaded.cfg=true;onData()},()=>{St.loaded.cfg=true;onData()})}
function onData(){
 if(St.mode==='fb'){const gv=fbGateView();if(gv){St.ready=false;if(ui.view!==gv&&!(ui.view==='perfil'&&gv==='perfil')){ui.view=gv;render()}else if(gv==='espera'||gv==='cargando')scheduleRender(true);return}
  if(!St.dataSubbed){St.dataSubbed=true;subscribeAll();return}}
 const all=['fichas','equipos','personas','entregas','cfg'].every(k=>St.loaded[k]);
 if(!St.ready&&all){St.ready=true;clearTimeout(loadTimer);if(!['inicio','equipos','escanear','turno','panel','ajustes','ficha','ver','preview','equipo'].includes(ui.view)||St.mode!=='fb')ui.view=(!St.uid||St.personas[St.uid])?'inicio':'perfil';render();autoEntregas();return}
 if(St.ready)scheduleRender()}
/* Si un día terminó sin entrega del supervisor, se arma el recopilado igual y queda marcado sin firma */
function autoEntregas(){if(!isSup()||!St.canWrite)return;const today=dayKey(Date.now());const days=new Set();Object.values(St.fichas).forEach(f=>{days.add(dayKey(f.creado));if(f.cierre)days.add(dayKey(f.cierre))});
 days.forEach(d=>{if(d>=today||St.entregas[d])return;const list=dayFichas(d);const e={fecha:d,firmado:false,auto:true,t:Date.now(),resumen:resumen(list),fichas:list.map(f=>f.id),nota:'Generada automáticamente: el turno no se entregó.'};St.entregas[d]=e;write('entregas/'+d,e,{set:true})})}

/* ============ Render ============ */
let lastSig='',lastView='',pendingRender=false;
function typing(){const a=document.activeElement;return a&&app.contains(a)&&(a.tagName==='TEXTAREA'||(a.tagName==='INPUT'&&!['checkbox','radio','file'].includes(a.type))||a.tagName==='SELECT')}
function viewSig(){if(ui.view==='ficha'||ui.view==='ver'||ui.view==='preview')return stable([ui.view,ui.step,St.fichas[ui.fid]||null,St.canWrite,ui.confirm]);return stable([ui.view,ui.filter,ui.pview,St.fichas,St.equipos,St.entregas,St.cfg,St.personas,ui.ek,ui.confirm,St.canWrite])}
function scheduleRender(force){if(ui.sig||typing()){pendingRender=true;return}if(!force&&viewSig()===lastSig)return;render()}
document.addEventListener('focusout',()=>setTimeout(()=>{if(pendingRender&&!typing()&&!ui.sig){pendingRender=false;scheduleRender()}},150));

function render(){pendingRender=false;const ae=document.activeElement&&app.contains(document.activeElement)?document.activeElement.id:'';
 if(ui.view==='auth'){app.innerHTML=vAuth();return}if(ui.view==='setup'){app.innerHTML=vSetup();return}if(ui.view==='espera'){app.innerHTML=vEspera();return}if(ui.view==='perfil'&&St.mode==='fb'){app.innerHTML=vPerfil();return}
 if(!St.ready){app.innerHTML=`<div class="shell">${bar('Taller','Conectando con el taller')}<main>${St.slow?'<div class="banner warn"><div><b>Los datos aún no llegan</b>Revisa la señal. La app sigue intentando.</div></div>':''}<div class="skel"></div><div class="skel"></div><div class="skel"></div></main></div>`;return}
 let v=ui.view;if(v==='login'){app.innerHTML=vLogin();return}if(v==='perfil'){app.innerHTML=vPerfil();return}
 const m=me();const f=St.fichas[ui.fid];
 if((v==='ficha'||v==='ver'||v==='preview')&&!f){v=ui.view='inicio'}
 if(v==='ficha'&&(f.estado==='cerrada'||!canCreate())){v=ui.view='ver'}
 const sub=m?`Turno ${m.turno} · ${m.nombre} (${ROLES[role()]})`:'Solo lectura';
 let top='',body='',dock='',fab='',wide=false;
 if(v==='inicio'){top=bar(role()==='operador'?'Estado de equipos':'Taller',sub,{gear:!!m});body=role()==='operador'?vOperador():vInicio();dock=tabs();if(canCreate())fab=`<button class="btn hv fab" data-act="new">+ Nuevo ingreso</button>`}
 else if(v==='ficha'){top=bar(f.equipo.equipo||'Nuevo ingreso',`Paso ${ui.step+1} de 5 · ${STEPS[ui.step]}`,{back:true,extra:`<div class="prog"><i style="width:${(ui.step+1)*20}%"></i></div>`+stepsNav(f)});body=vStep(f);dock=wizDock(f)}
 else if(v==='ver'){top=bar('Ficha '+eqLabel(f.equipo),(f.equipo.equipo+' '+f.equipo.marca).trim(),{back:true});body=vVer(f);dock=`<div class="dock-in"><button class="btn ghost" data-act="home">Inicio</button>${f.estado==='cerrada'?`<button class="btn" data-act="preview">${I.pdf} Vista previa y compartir</button>`:(canCreate()?'<button class="btn" data-act="resume">Continuar ficha</button>':'')}</div>`}
 else if(v==='preview'){top=bar('Vista previa','Ficha '+eqLabel(f.equipo),{back:true,backTo:'ver'});body=vPreview(f);dock=shareDock(f)}
 else if(v==='equipos'){top=bar('Equipos',sub,{gear:!!m});body=vEquipos();dock=tabs()}
 else if(v==='equipo'){const e=St.equipos[ui.ek];top=bar(e?e.equipo:'Equipo',e?(e.marca+' '+e.modelo):'',{back:true,backTo:'equipos'});body=vEquipo(e);dock=e&&canCreate()?`<div class="dock-in"><button class="btn hv" data-act="new-eq" data-k="${esc(e.key)}">+ Nuevo ingreso de este equipo</button></div>`:tabs()}
 else if(v==='escanear'){top=bar('Escanear',sub,{gear:!!m});body=vEscanear();dock=tabs()}
 else if(v==='turno'){top=bar('Entrega de turno',`Turno ${St.cfg.turnoActivo} · ${fecha(Date.now())}`,{gear:!!m});body=vTurno();dock=tabs()}
 else if(v==='panel'){wide=true;top=bar('Panel del taller','Vista del supervisor',{gear:!!m});body=vPanel();dock=tabs()}
 else if(v==='ajustes'){top=bar('Ajustes',sub,{back:true});body=vAjustes();dock=tabs()}
 const anim=ui.dir>0?'enter':ui.dir<0?'back':'';const key=v+ui.step+ui.fid+ui.ek;const changed=lastView!==key;
 app.innerHTML=`<div class="shell${wide?' wide':''}">${top}<main class="${anim}">${body}</main></div><nav class="dock">${dock}</nav>${fab}`;
 ui.dir=0;lastView=key;lastSig=viewSig();
 if(changed)$$('.mini').forEach(x=>x.classList.add('anim'));
 if(ae){const n=document.getElementById(ae);if(n&&n.focus)n.focus({preventScroll:true})}
 hydrate();updSync();
 if(v==='preview')fitPaper();
 if(v==='equipo')drawQR();
}
function bar(t,s,o){o=o||{};return `<header class="ab"><div class="ab-row">${o.back?`<button class="ib" data-act="go" data-v="${o.backTo||'inicio'}" aria-label="Volver">${I.back}</button>`:`<span class="mark"><img src="${LOGO.gearInv}" alt="Mantenimiento Industrial"></span>`}<div class="grow"><div class="t">${esc(t)}</div><div class="s">${esc(s)}</div></div><div class="sync"><i></i><span>${esc(syncText())}</span></div>${o.gear?`<button class="ib" data-act="go" data-v="ajustes" aria-label="Ajustes">${I.gear}</button>`:''}</div>${o.extra||''}</header>`}
function tabs(){const r=role();let t=[['inicio','Inicio',I.home],['equipos','Equipos',I.eq],['escanear','Escanear',I.scan],['turno','Turno',I.turno]];if(r==='operador')t=[['inicio','Inicio',I.home],['escanear','Escanear',I.scan]];if(isSup())t.push(['panel','Panel',I.panel]);const cur=ui.view==='equipo'?'equipos':ui.view;return `<div class="tabs">${t.map(x=>`<button class="tab${cur===x[0]?' on':''}" data-act="go" data-v="${x[0]}"><i>${x[2]}</i>${x[1]}</button>`).join('')}</div>`}
const canCreate=()=>St.canWrite&&!!me()&&role()!=='operador';

/* ---- Login local y perfil ---- */
function turnoChips(sel){return `<div><div class="lbl" style="margin-bottom:6px">Turno (7x7, jornada de día)</div><div class="seg2" id="lg-t">${['A','B'].map(t=>`<button class="chip${sel===t?' on':''}" data-act="pick" data-v="${t}">Turno ${t}</button>`).join('')}</div></div>`}
function vLogin(){const m=St.localMe||{};return `<div class="login"><div class="tape"></div><div class="brand"><img src="${LOGO.full}" alt="Mantenimiento Industrial"><span>Check-Lis Taller</span></div><p class="muted">Ingreso y chequeo de equipos en taller. En esta vista los datos quedan solo en este dispositivo.</p>
<div class="card stack"><h2>Inicia sesión</h2>
<div class="fld"><label class="lbl" for="lg-n">Nombre</label><input id="lg-n" value="${esc(m.nombre||'')}" placeholder="Juan Pérez" autocomplete="name"></div>
<div class="grid2"><div class="fld"><label class="lbl" for="lg-a">Área</label><input id="lg-a" value="${esc(m.area||'Mantención')}"></div><div class="fld"><label class="lbl" for="lg-r">Rol (prueba)</label><select id="lg-r">${Object.keys(ROLES).map(k=>`<option value="${k}" ${(m.rol||'mecanico')===k?'selected':''}>${ROLES[k]}</option>`).join('')}</select></div></div>
${turnoChips(m.turno||'A')}<button class="btn block" data-act="login">Entrar</button></div></div>`}
function vPerfil(){const p=St.personas[St.uid]||{};return `<div class="login"><div class="tape"></div><div class="brand"><img src="${LOGO.full}" alt="Mantenimiento Industrial"><span>Check-Lis Taller</span></div><p class="muted">Completa tus datos una vez. Se usan para llenar las fichas automáticamente.</p>
<div class="card stack"><h2>Tus datos</h2>
<div class="fld"><label class="lbl" for="pf-n">Nombre</label><input id="pf-n" value="${esc(p.nombre||St.profName)}" autocomplete="name"></div>
<div class="grid2"><div class="fld"><label class="lbl" for="pf-a">Área</label><input id="pf-a" value="${esc(p.area||'Mantención')}"></div><div class="fld"><label class="lbl" for="pf-r">RUT</label><input id="pf-r" value="${esc(p.rut||'')}" placeholder="12.345.678-5"></div></div>
${turnoChips(p.turno||St.cfg.turnoActivo)}<button class="btn block" data-act="perfil-save" ${St.canWrite?'':'disabled'}>Guardar y entrar</button>${St.email?`<p class="small muted">Cuenta: ${esc(St.email)}</p><button class="link" data-act="logout" style="align-self:center">Usar otra cuenta</button>`:''}</div>
${St.canWrite?'':'<div class="banner warn"><div><b>Acceso de solo lectura</b>Pide al dueño de la app acceso de colaborador para registrar fichas.</div></div><button class="btn ghost" data-act="go" data-v="inicio">Ver sin registrarme</button>'}</div>`}

/* ---- Inicio ---- */
function banners(){const out=[];
 if(!St.canWrite&&St.mode!=='local')out.push('<div class="banner warn"><div><b>Solo lectura</b>Puedes ver todo, pero no registrar fichas.</div></div>');
 if(isSup()){const oos=Object.values(St.equipos).filter(e=>e.estado==='fuera');if(oos.length)out.push(`<div class="banner oos"><div><b>${oos.length} ${oos.length===1?'equipo fuera de servicio':'equipos fuera de servicio'}</b>${oos.map(e=>esc(eqLabel(e))+' '+esc(e.equipo)).join(', ')}</div></div>`);
  const today=dayKey(Date.now());const hm=(St.cfg.horaTermino||'19:00').split(':').map(Number);const d=new Date();const late=d.getHours()*60+d.getMinutes()>=hm[0]*60+(hm[1]||0);const ent=St.entregas[today];
  if(late&&!(ent&&ent.firmado)&&dayFichas(today).length)out.push(`<div class="banner warn"><div><b>Falta entregar el turno de hoy</b>Son las ${hhmm(Date.now())} y la jornada termina a las ${esc(St.cfg.horaTermino)}.<br>${ui.view!=='turno'?'<button class="btn sm" data-act="go" data-v="turno">Ir a entrega de turno</button>':''}</div></div>`)}
 return out.join('')}
function vInicio(){const fs=Object.values(St.fichas);const today=dayKey(Date.now());const open=fs.filter(f=>f.estado!=='cerrada');
 const k={taller:open.length,espera:open.filter(f=>f.espera).length,ent:fs.filter(f=>f.estado==='cerrada'&&f.cierre&&dayKey(f.cierre)===today&&f.salida==='conforme').length};
 const F={abiertas:f=>f.estado!=='cerrada',mias:f=>f.mecanico.uid===myId()&&(f.estado!=='cerrada'||dayKey(f.cierre||0)===today),hoy:f=>f.estado==='cerrada'&&dayKey(f.cierre||0)===today,todas:()=>true};
 const list=fs.filter(F[ui.filter]||F.abiertas).sort((a,b)=>(a.estado==='cerrada')-(b.estado==='cerrada')||b.act-a.act);
 return `${banners()}<div class="kpis"><div class="kpi"><b>${k.taller}</b><span class="lbl">En taller</span></div><div class="kpi${k.espera?' alert':''}"><b>${k.espera}</b><span class="lbl">Esperan repuesto</span></div><div class="kpi"><b>${k.ent}</b><span class="lbl">Entregados hoy</span></div></div>
<span class="lbl" style="margin-top:4px">Equipos</span>
<div class="chips">${[['abiertas','En taller'],['mias','Mis equipos'],['hoy','Cerrados hoy'],['todas','Todos']].map(c=>`<button class="chip${ui.filter===c[0]?' on':''}" data-act="filter" data-v="${c[0]}">${c[1]}</button>`).join('')}</div>
${list.length?list.map(eqCard).join(''):`<div class="empty"><h3>No hay equipos aquí</h3><p class="muted small">${fs.length?'Cambia el filtro para ver el resto.':'Registra el primero con Nuevo ingreso.'}</p>${!fs.length&&realRole()==='admin'?'<button class="btn ghost sm" data-act="go" data-v="ajustes">Cargar datos de ejemplo</button>':''}</div>`}`}
function eqCard(f){const e=estado(f),p=prog(f),fl=faults(f).length;const cl=f.estado==='cerrada';const col=cl?(e[1]==='oos'?'oos':e[1]==='warn'?'hv':e[1]):'brand';
 return `<button class="eqc${cl&&f.salida==='fuera'?' oos':''}" data-act="open" data-id="${f.id}"><div class="row">${plate(f.equipo)}<span class="tag ${e[1]}">${e[0]}</span></div><div class="v">${esc(f.equipo.equipo||'Sin nombre')}${f.equipo.marca?' · '+esc((f.equipo.marca+' '+f.equipo.modelo).trim()):''}</div><div class="d">Ingreso ${dayKey(f.creado)===dayKey(Date.now())?hhmm(f.creado):fecha(f.creado)} · ${esc(f.usuario.solicita||'Sin solicitud')}</div><div class="row small muted"><span>${esc(f.mecanico.nombre)}</span>${fl?`<b class="bad-t">${fl} ${fl===1?'falla':'fallas'}</b>`:''}</div><div class="mini"><b style="width:${cl?100:Math.max(p.pct,f.step*10)}%;background:var(--${col})"></b></div></button>`}
function vOperador(){const q=normPlate(ui.q);const eqs=Object.values(St.equipos).filter(e=>!q||normPlate(e.patente+e.interno+e.equipo).includes(q)).sort((a,b)=>(b.act||0)-(a.act||0));
 return `<div class="fld"><label class="lbl" for="op-q">Busca tu equipo</label><input id="op-q" data-q value="${esc(ui.q)}" placeholder="Patente o número interno" autocomplete="off"></div>
 ${eqs.length?eqs.map(e=>{const s=eqEstado(e);return `<button class="eqc" data-act="eq" data-k="${esc(e.key)}"><div class="row">${plate(e)}<span class="tag ${s[1]}">${s[0]}</span></div><div class="v">${esc(e.equipo)} · ${esc(e.marca+' '+e.modelo)}</div></button>`}).join(''):'<div class="empty"><h3>Sin equipos</h3><p class="muted small">Cuando tu equipo ingrese al taller aparecerá aquí.</p></div>'}
 <p class="note">Como operador, firmas en el celular del mecánico al recibir tu equipo. Aquí ves en qué estado está.</p>`}

/* ---- Ficha: pasos ---- */
function stepsNav(f){return `<div class="steps">${STEPS.map((s,i)=>`<button data-act="goto" data-v="${i}" class="${i===ui.step?'now':''}" ${i>f.step?'disabled':''}>${i+1}. ${s}</button>`).join('')}</div>`}
function vStep(f){return [s1,s2,s3,s4,s5][ui.step](f)}
function fld(path,label,o){o=o||{};const f=St.fichas[ui.fid];const v=getP(f,path);const id='i-'+path.replace(/\./g,'-');const mic=o.ta&&DICT?`<button class="mic" data-act="dict" data-t="${id}" aria-label="Dictar">${I.mic}</button>`:'';
 return `<div class="fld${o.full?' full':''}${o.ta&&DICT?' ta':''}" data-f="${path}"><label class="lbl" for="${id}">${label}</label>${o.ta?`<textarea id="${id}" data-bind="${path}" placeholder="${esc(o.ph||'')}">${esc(v)}</textarea>`:o.sel?`<select id="${id}" data-bind="${path}">${o.sel.map(x=>`<option ${v===x?'selected':''}>${x}</option>`).join('')}</select>`:`<input id="${id}" data-bind="${path}" value="${esc(v)}" placeholder="${esc(o.ph||'')}" ${o.im?`inputmode="${o.im}"`:''} ${o.list?`list="${o.list}"`:''} autocomplete="off">`}${mic}${o.hint!==undefined?`<div class="hint" id="h-${id}">${o.hint}</div>`:''}</div>`}
function s1(f){const k=eqKey(f.equipo);const eq=k&&St.equipos[k];const lf=k?lastFaults(k,f.id):[];const md=mantDue(eq);const eqs=Object.values(St.equipos);
 return `${eq&&eq.estado==='fuera'?`<div class="banner oos"><div><b>Este equipo está fuera de servicio</b>Desde ${fecha(eq.fueraT)}: ${esc(eq.fueraMotivo||'')}. Al continuar queda registrado como reingreso.</div></div>`:''}
${md&&md.vencida?`<div class="banner warn"><div><b>Toca mantención preventiva</b>Pasó ${fmtN(-md.restante)} h del intervalo de ${fmtN(num(eq.intervalo)||St.cfg.intervaloMant)} h.</div></div>`:''}
${lf.length?`<div class="banner info"><div><b>Últimas fallas de este equipo</b>${lf.map(x=>`${fecha(x.t)}: ${esc(x.n)}${x.nota?' ('+esc(x.nota)+')':''}`).join('<br>')}</div></div>`:''}
<datalist id="dl-pat">${eqs.filter(e=>e.patente).map(e=>`<option value="${esc(e.patente)}">${esc(e.equipo+' '+e.marca)}</option>`).join('')}</datalist>
<datalist id="dl-int">${eqs.filter(e=>e.interno).map(e=>`<option value="${esc(e.interno)}">${esc(e.equipo+' '+e.marca)}</option>`).join('')}</datalist>
<datalist id="dl-tipo">${[...new Set(eqs.map(e=>e.equipo).filter(Boolean))].map(x=>`<option value="${esc(x)}">`).join('')}</datalist>
<section class="card"><div class="card-h"><span class="lbl">Datos del equipo</span><button class="btn ghost sm" data-act="go" data-v="escanear">${I.scan} QR</button></div><div class="grid2">
${fld('equipo.equipo','Equipo',{ph:'Camión aljibe',list:'dl-tipo'})}${fld('equipo.marca','Marca',{ph:'Mercedes-Benz'})}
${fld('equipo.modelo','Modelo',{ph:'Atego 1726'})}${fld('equipo.patente','Patente',{ph:'HJKL42',list:'dl-pat',hint:plateHint(f)})}
${fld('equipo.interno','Número interno',{ph:'CA-08',list:'dl-int'})}${fld('equipo.horometro','Horómetro',{ph:'8412',im:'decimal',hint:horoHint(f)})}
${fld('equipo.empresa','Empresa',{full:true,ph:'Contratista Norte'})}</div>
${f.horoBajo?`<label class="check" style="margin-top:8px"><input type="checkbox" data-chk="horoConfirm" ${f.horoConfirm?'checked':''}> Confirmo el horómetro (por ejemplo, se cambió el horómetro del equipo)</label>`:''}</section>
<section class="card"><div class="card-h"><span class="lbl">Datos del usuario</span></div><div class="grid3">
${fld('usuario.nombre','Nombre',{ph:'Luis Soto'})}${fld('usuario.area','Área',{ph:'Operación'})}${fld('usuario.turno','Turno',{sel:['A','B']})}
${fld('usuario.solicita','Usuario solicita',{full:true,ta:true,ph:'Lo que pide el usuario al dejar el equipo'})}</div></section>
<section class="card"><div class="card-h"><span class="lbl">Mantenedor mecánico</span><span class="auto">Desde tu sesión</span></div><div class="grid3">
${fld('mecanico.nombre','Nombre')}${fld('mecanico.area','Área')}${fld('mecanico.turno','Turno',{sel:['A','B']})}</div></section>
<section class="card"><div class="card-h"><span class="lbl">¿Se llenó en papel?</span><span class="opt">Opcional</span></div><p class="small muted" style="margin-bottom:8px">Si la ficha se llenó a mano, adjunta una foto de la hoja.</p><div class="photos">${f.papel?`<div class="ph"><img data-foto="${f.papel}" alt="Foto de la ficha en papel"><button data-act="rm-papel" aria-label="Quitar foto">✕</button></div>`:`<label class="addph" style="border-color:var(--brand);color:var(--brand)"><span>+ Foto</span><input type="file" accept="image/*" data-papel aria-label="Adjuntar foto de la ficha en papel"></label>`}</div></section>`}
function plateHint(f){const p=f.equipo.patente;if(!p)return 'Si no tiene patente, usa el número interno.';return plateOk(p)?`<span class="ok">Patente válida: ${esc(plateFmt(p))}</span>`:'<span class="bad">Formato no válido. Ej: HJKL42 o AB1234</span>'}
function horoHint(f){const pv=prevHoro(f);const v=num(f.equipo.horometro);if(!pv)return 'Horas que marca el equipo al ingresar.';if(v!=null&&v<pv.h)return `<span class="bad">Menor al último registro (${fmtN(pv.h)} h, ${fecha(pv.t)}).</span>`;return `Último registro: ${fmtN(pv.h)} h (${fecha(pv.t)})`}
function legend(){return `<div class="row small muted" style="justify-content:flex-start;gap:12px;flex-wrap:wrap"><span><span class="mk B">B</span> Bueno</span><span><span class="mk M">M</span> Malo: describe la falla</span><span><span class="mk NA">N/A</span> No aplica</span></div>`}
function itemRow(f,key,name,rem){const m=mk(f,key)||{};const fotos=m.fotos||[];const id='n-'+key.replace(/:/g,'-');return `<div class="it" data-k="${key}" ${m.v?`data-v="${m.v}"`:''}><div class="it-r"><span class="it-n">${esc(name)}</span>${rem?`<button class="rm" data-act="rm-item" aria-label="Quitar ${esc(name)}">✕</button>`:''}<div class="bm" role="group" aria-label="${esc(name)}">${['B','M','NA'].map(v=>`<button data-act="mark" data-v="${v}" aria-pressed="${m.v===v}">${v==='NA'?'N/A':v}</button>`).join('')}</div></div>
<div class="it-d"><div><div class="fail"><span class="h">Describe la falla (obligatorio)</span><div class="fld${DICT?' ta':''}"><label class="lbl" for="${id}">¿Qué está malo?</label><textarea id="${id}" data-note placeholder="Ej: fuga en vástago, sello dañado">${esc(m.nota||'')}</textarea>${DICT?`<button class="mic" data-act="dict" data-t="${id}" aria-label="Dictar">${I.mic}</button>`:''}</div>
<div class="photos">${fotos.map((p,i)=>`<div class="ph"><img data-foto="${p}" alt="Foto de ${esc(name)}"><button data-act="rm-photo" data-i="${i}" aria-label="Quitar foto">✕</button></div>`).join('')}${fotos.length<3?`<label class="addph"><span>+ Foto</span><input type="file" accept="image/*" data-photo aria-label="Agregar foto de ${esc(name)}"></label>`:''}<span class="opt">Foto opcional</span></div></div></div></div></div>`}
function ring(d,t,bad){const C=2*Math.PI*13;return `<div class="ring${bad?' bad':''}"><svg viewBox="0 0 32 32"><circle class="bg" cx="16" cy="16" r="13"/><circle class="fg" cx="16" cy="16" r="13" stroke-dasharray="${C}" stroke-dashoffset="${t?C*(1-d/t):C}"/></svg><span>${d}/${t}</span></div>`}
function secCount(f,keys){let d=0,b=0;keys.forEach(k=>{const m=mk(f,k);if(m&&m.v){d++;if(m.v==='M')b++}});return [d,b]}
function editingBy(f,sec){const e=f.editando&&f.editando[sec];if(!e||e.uid===myId()||Date.now()-e.t>5*60e3)return '';return `<span class="who">${esc(String(e.who).split(' ')[0])} está revisando</span>`}
const colh='<div class="colh"><span>B</span><span>M</span><span>N/A</span></div>';
function s2(f){const keys=INV.map((_,i)=>'inv:'+i);const c=secCount(f,keys);return `${legend()}<div class="sec open" data-sec="inv"><div class="sec-h">${ring(c[0],keys.length,c[1])}<span class="nm">Inventario / accesorios</span>${editingBy(f,'inv')}</div><div class="sec-b"><div><div class="sec-in">${colh}${INV.map((n,i)=>itemRow(f,'inv:'+i,n)).join('')}<div class="secfoot"><button class="btn ghost sm" data-act="allB" data-sec="inv">Marcar pendientes como B</button></div></div></div></div></div>`}
function s3(f){return legend()+SYS.map(s=>{const its=itemsOf(f,s);const keys=its.map((_,i)=>'chk:'+s.id+':'+i);const c=secCount(f,keys);let open=ui.open[s.id];if(open===undefined){open=c[0]<its.length&&!SYS.some(x=>ui.open[x.id]);if(open)ui.open[s.id]=true}
 return `<div class="sec${open?' open':''}" data-sec="${s.id}"><button class="sec-h" data-act="toggle" data-v="${s.id}" aria-expanded="${!!open}">${ring(c[0],its.length,c[1])}<span class="nm">${s.n}</span>${editingBy(f,s.id)}${c[1]?`<span class="tag bad">${c[1]} ${c[1]===1?'malo':'malos'}</span>`:''}${I.chev}</button><div class="sec-b"><div><div class="sec-in">
 ${its.length?colh:''}${its.map((n,i)=>itemRow(f,'chk:'+s.id+':'+i,n,s.edit)).join('')}
 ${s.edit?`${its.length?'':'<div class="tbd">Ítems por definir. Agrega los que revisas en este sistema.</div>'}<div class="add-it"><input placeholder="Nuevo ítem, ej: Cilindros" data-newitem="${s.id}" aria-label="Nuevo ítem de ${s.n}"><button class="btn sm" data-act="add-item" data-v="${s.id}">Agregar</button></div>`:''}
 ${its.length?`<div class="secfoot"><button class="btn ghost sm" data-act="allB" data-sec="${s.id}">Marcar pendientes como B</button></div>`:''}</div></div></div></div>`}).join('')}
function s4(f){const fl=faults(f);return `<section class="card"><div class="card-h"><span class="lbl">Fallas a resolver</span><span class="tag ${fl.length?'bad':'ok'}">${fl.length}</span></div>${fl.length?fl.map(x=>`<div class="mrow"><span><b>${esc(x.n)}</b><br><span class="small muted">${esc(x.sec)}: ${esc(x.m.nota||'')}</span></span><span class="mk M">M</span></div>`).join(''):'<p class="small muted">No se marcaron ítems malos.</p>'}</section>
<section class="card stack">${fld('trabajo','Observaciones / trabajo realizado',{ta:true,ph:'Anota lo que vas haciendo. Se guarda solo.'})}
<label class="check"><input type="checkbox" data-chk="espera" ${f.espera?'checked':''}> Esperando repuesto</label>
${f.espera?fld('esperaDet','¿Qué repuesto falta?',{ph:'Ej: pastilla de freno, llega mañana 09:00'}):''}
<label class="check"><input type="checkbox" data-chk="mant" ${f.mant?'checked':''}> Se realizó mantención preventiva (reinicia el contador de horas)</label></section>
<section class="card"><div class="card-h"><span class="lbl">Repuestos usados</span><button class="btn ghost sm" data-act="add-rep">+ Agregar</button></div><div class="stack">${f.repuestos.length?f.repuestos.map((r,i)=>`<div class="row" data-i="${i}"><div class="fld" style="flex:1"><label class="lbl" for="rp-d${i}">Repuesto</label><input id="rp-d${i}" data-rep="d" value="${esc(r.d)}"></div><div class="fld" style="width:84px"><label class="lbl" for="rp-c${i}">Cant.</label><input id="rp-c${i}" data-rep="c" value="${esc(r.c)}"></div><button class="rm" data-act="rm-rep" aria-label="Quitar repuesto">✕</button></div>`).join(''):'<p class="small muted">Sin repuestos registrados.</p>'}</div></section>`}
function issues(f){const out=[];const p=prog(f);if(p.d<p.t){const firstInv=INV.some((_,i)=>!(mk(f,'inv:'+i)||{}).v);out.push([`Faltan ${p.t-p.d} ítems por marcar.`,firstInv?1:2])}const sn=faults(f).filter(x=>!String(x.m.nota||'').trim());if(sn.length)out.push([`${sn.length} ${sn.length===1?'ítem malo sin':'ítems malos sin'} descripción.`,sn[0].k.startsWith('inv')?1:2]);return out}
function s5(f){const iss=issues(f);const o=f.salida;return `${iss.length?`<div class="banner warn"><div><b>Antes de cerrar</b>${iss.map(x=>x[0]).join('<br>')}<br><button class="btn sm" data-act="goto" data-v="${iss[0][1]}">Completar</button></div></div>`:''}
<section class="card"><div class="card-h"><span class="lbl">Estado de salida del equipo</span></div><div class="outs">${Object.keys(OUTS).map(k=>`<button class="out${o===k?' on':''}" data-act="out" data-v="${k}"><strong>${OUTS[k][0]}</strong><span>${OUTS[k][1]}</span></button>`).join('')}</div>
${o&&o!=='conforme'?`<div style="margin-top:8px">${fld('motivo',o==='pendiente'?'¿Qué queda pendiente?':o==='fuera'?'Motivo de fuera de servicio':'Motivo de no conformidad',{ta:true,ph:'Describe el motivo'})}</div>`:''}</section>
${sigCard(f,'mec','Mecánico que entrega')}${sigCard(f,'op','Operador que recibe')}
<p class="small muted">La fecha y hora de salida se registran solas al cerrar.</p>`}
function sigCard(f,w,title){const s=f.firmas[w];return `<section class="card stack"><span class="lbl">${title}</span><div class="grid2">${fld('firmas.'+w+'.nombre','Nombre')}${fld('firmas.'+w+'.rut','RUT',{ph:'12.345.678-5',hint:s.rut?(rutOk(s.rut)?'<span class="ok">RUT válido</span>':'<span class="bad">RUT no válido</span>'):''})}</div>
<button class="sigbox${s.img?' done':''}" data-act="sig" data-v="${w}" id="sb-${w}">${s.img?`<img data-foto="${s.img}" alt="Firma de ${title}"><span class="w">Firmado. Toca para firmar de nuevo</span>`:`${I.pen} Toca para firmar`}</button></section>`}
function wizDock(f){const last=ui.step===4;return `<div class="dock-in">${ui.step>0?'<button class="btn ghost" data-act="prev">Atrás</button>':''}${last?'<button class="btn" data-act="close">Cerrar ficha</button>':`<button class="btn" data-act="next">${['Siguiente: inventario','Siguiente: chequeo','Siguiente: trabajo','Siguiente: cierre'][ui.step]}</button>`}</div>`}

/* ---- Ver ficha (en la app) ---- */
function vVer(f){const e=f.equipo,u=f.usuario,mc=f.mecanico,cl=f.estado==='cerrada';const st=cl?OUTS[f.salida]:null;const es=estado(f);
 const marks=keys=>keys.map(k=>{const m=mk(f,k)||{};return `<div class="mrow"><span>${esc(nameOf(f,k))}${m.v==='M'&&m.nota?`<br><span class="small bad-t">${esc(m.nota)}</span>`:''}${(m.fotos||[]).length?`<div class="photos" style="margin-top:4px">${m.fotos.map(p=>`<img data-foto="${p}" alt="Foto de la falla">`).join('')}</div>`:''}</span><span class="mk ${m.v||'x'}">${m.v==='NA'?'N/A':m.v||'—'}</span></div>`}).join('');
 return `<section class="card"><div class="row" style="align-items:flex-start"><div class="stack" style="gap:4px">${plate(e,true)}<span class="small muted">Ingreso ${fecha(f.creado)} ${hhmm(f.creado)}${f.cierre?'<br>Salida '+fecha(f.cierre)+' '+hhmm(f.cierre):''}</span></div>${cl?`<span class="stamp ${st[2]}${ui.justClosed===f.id?' anim':''}">${st[0].toUpperCase()}</span>`:`<span class="tag ${es[1]}">${es[0]}</span>`}</div>${cl&&f.motivo?`<p style="margin-top:8px">${esc(f.motivo)}</p>`:''}</section>
${cl?'<div class="banner info"><div><b>Ficha firmada y bloqueada</b>Los cambios se agregan como anexo, con nombre, hora y motivo.</div></div>':''}
<section class="card"><span class="lbl">Datos del equipo</span><div class="dl" style="margin-top:6px">${[['Equipo',e.equipo],['Marca',e.marca],['Modelo',e.modelo],['Patente',plateFmt(e.patente)||'—'],['N° interno',e.interno||'—'],['Horómetro',num(e.horometro)!=null?fmtN(num(e.horometro))+' h':'—'],['Empresa',e.empresa]].map(x=>`<div><span class="lbl">${x[0]}</span><div class="v">${esc(x[1])}</div></div>`).join('')}</div></section>
<section class="card"><span class="lbl">Usuario y mecánico</span><div class="dl" style="margin-top:6px"><div><span class="lbl">Usuario</span><div class="v">${esc(u.nombre)}</div><div class="small muted">${u.area?esc(u.area)+', ':''}turno ${esc(u.turno)}</div></div><div><span class="lbl">Mecánico</span><div class="v">${esc(mc.nombre)}</div><div class="small muted">${esc(mc.area)}, turno ${esc(mc.turno)}</div></div></div>${u.solicita?`<p style="margin-top:8px"><span class="lbl">Usuario solicita</span><br>${esc(u.solicita)}</p>`:''}</section>
<section class="card"><span class="lbl">Inventario / accesorios</span><div class="marks" style="margin-top:4px">${marks(INV.map((_,i)=>'inv:'+i))}</div></section>
${SYS.map(s=>{const its=itemsOf(f,s);return `<section class="card"><span class="lbl">${s.n}</span><div class="marks" style="margin-top:4px">${its.length?marks(its.map((_,i)=>'chk:'+s.id+':'+i)):'<p class="small muted">Sin ítems.</p>'}</div></section>`}).join('')}
<section class="card"><span class="lbl">Observaciones / trabajo realizado</span><p style="margin-top:6px;white-space:pre-wrap">${esc(f.trabajo)||'—'}</p>${f.espera?`<p class="small bad-t" style="margin-top:6px">Esperando repuesto: ${esc(f.esperaDet)}</p>`:''}${f.repuestos.length?`<div style="margin-top:8px">${f.repuestos.map(r=>`<div class="mrow"><span>${esc(r.d)}</span><span class="mono">${esc(r.c)}</span></div>`).join('')}</div>`:''}</section>
${f.papel?`<section class="card"><span class="lbl">Ficha en papel</span><div class="photos" style="margin-top:6px"><img data-foto="${f.papel}" alt="Ficha en papel" style="width:120px;height:150px"></div></section>`:''}
${cl?`<section class="card"><span class="lbl">Firmas</span><div class="grid2" style="margin-top:6px">${['mec','op'].map(w=>{const s=f.firmas[w];return `<div><img data-foto="${s.img}" alt="Firma" style="width:100%;height:70px;object-fit:contain;border-bottom:1px solid var(--ink)"><div class="v">${esc(s.nombre)}</div><div class="small muted">${w==='mec'?'Mecánico que entrega':'Operador que recibe'}${s.rut?', '+esc(rutFmt(s.rut)):''}</div></div>`}).join('')}</div></section>`:''}
${(f.reingresos||[]).length?`<section class="card"><span class="lbl">No conformidades</span>${f.reingresos.map(r=>`<p class="anx">${fecha(r.t)} ${hhmm(r.t)}: ${esc(r.motivo)}</p>`).join('')}</section>`:''}
${cl?`<section class="card stack"><span class="lbl">Anexos</span>${(f.anexos||[]).map(a=>`<div class="anx"><b>${esc(a.motivo)}</b><br>${esc(a.texto)}<br><span class="small muted">${esc(a.who)}, ${fecha(a.t)} ${hhmm(a.t)}</span></div>`).join('')||'<p class="small muted">Sin anexos.</p>'}
${canCreate()?`<div class="fld"><label class="lbl" for="ax-m">Motivo del anexo</label><input id="ax-m" placeholder="Ej: corrección de horómetro"></div><div class="fld"><label class="lbl" for="ax-t">Detalle</label><textarea id="ax-t"></textarea></div><button class="btn ghost" data-act="anexo">Agregar anexo</button>`:''}</section>`:''}
<section class="card"><span class="lbl">Historial de la ficha</span><div class="feed" style="margin-top:4px">${(f.ev||[]).slice().reverse().map(x=>`<div><span class="tm">${hhmm(x.t)}</span><span>${esc(x.who)} ${esc(x.txt)}</span></div>`).join('')}</div></section>`}

/* ---- Hoja imprimible (PDF) ---- */
const BX=v=>`<span class="bx">${v?'✕':''}</span>`;
function paperHTML(f,o){o=o||{};const e=f.equipo,u=f.usuario,mc=f.mecanico,blank=!!o.blank;
 const rows=keys=>keys.map(k=>{const m=mk(f,k)||{};return `<tr><td>${esc(nameOf(f,k))}</td><td>${BX(m.v==='B')}</td><td>${BX(m.v==='M')}</td><td>${BX(m.v==='NA')}</td></tr>${m.v==='M'&&m.nota?`<tr class="nt"><td colspan="4">Falla: ${esc(m.nota)}</td></tr>`:''}`}).join('');
 const kv=a=>a.map(x=>`<div><b>${x[0]}:</b><span>${esc(x[1]==null?'':x[1])}</span></div>`).join('');
 const emptyRows='<tr><td>&nbsp;</td><td>'+BX()+'</td><td>'+BX()+'</td><td>'+BX()+'</td></tr>';
 return `<div class="paper" id="paper"><div class="pp-h"><div><h1>FICHA DE INGRESO A TALLER + CHEQUEO PREVENTIVO</h1><p>Recepción de equipos • Revisión con casillas • Firma de conformidad</p></div><div class="r"><img class="lg" src="${LOGO.inv}" alt="Mantenimiento Industrial">${o.qr?`<img src="${o.qr}" alt="QR del equipo">`:''}</div></div><div class="pp-b">
<h2>DATOS DEL EQUIPO</h2><div class="pp-kv">${kv([['Equipo',e.equipo],['Marca',e.marca],['Modelo',e.modelo],['Patente',plateFmt(e.patente)],['N° interno',e.interno],['Horómetro',num(e.horometro)!=null?fmtN(num(e.horometro))+' h':''],['Empresa',e.empresa],['Fecha ingreso',blank?'':fecha(f.creado)+' '+hhmm(f.creado)]])}</div>
<h2>DATOS DEL USUARIO</h2><div class="pp-kv">${kv([['Nombre',u.nombre],['Área',u.area],['Turno',u.turno]])}</div>
<h2>DATOS DEL MANTENEDOR MECÁNICO</h2><div class="pp-kv">${kv([['Nombre',blank?'':mc.nombre],['Área',blank?'':mc.area],['Turno',blank?'':mc.turno]])}</div>
<h2>USUARIO SOLICITA</h2><div class="pp-box">${esc(u.solicita)}</div>
<h2>INVENTARIO / ACCESORIOS</h2><table class="pp-t"><thead><tr><th>ÍTEM</th><th>BUENO</th><th>MALO</th><th>NO APLICA</th></tr></thead><tbody>${rows(INV.map((_,i)=>'inv:'+i))}</tbody></table>
<h2>CHEQUEO VISUAL PREVENTIVO</h2><table class="pp-t"><thead><tr><th>ÍTEM</th><th>BUENO</th><th>MALO</th><th>NO APLICA</th></tr></thead><tbody>${SYS.map(s=>{const its=itemsOf(f,s);return `<tr class="sub"><td colspan="4">${s.n.toUpperCase()}</td></tr>`+(its.length?rows(its.map((_,i)=>'chk:'+s.id+':'+i)):(blank?emptyRows+emptyRows:''))}).join('')}</tbody></table>
<h2>OBSERVACIONES / TRABAJO REALIZADO</h2><div class="pp-box" style="min-height:50px">${esc(f.trabajo)}</div>
${f.repuestos&&f.repuestos.length?`<h2>REPUESTOS</h2><div class="pp-box">${f.repuestos.map(r=>esc(r.d)+' ('+esc(r.c)+')').join('\n')}</div>`:''}
<h2>ESTADO DE SALIDA</h2><div class="pp-out">${Object.keys(OUTS).map(k=>`<span>${BX(f.salida===k)} ${OUTS[k][0]}</span>`).join('')}</div>${f.motivo?`<div class="pp-box" style="margin-top:6px">${esc(f.motivo)}</div>`:''}
<div class="pp-sig">${['mec','op'].map(w=>{const s=f.firmas[w];return `<div>${s.img&&!blank?`<img data-foto="${s.img}" alt="">`:'<div class="em"></div>'}<div class="ln">${blank?'&nbsp;':esc(s.nombre)}${s.rut&&!blank?' · '+esc(rutFmt(s.rut)):''}</div>${w==='mec'?'Mecánico que entrega':'Operador que recibe'} · Nombre / RUT / Firma</div>`}).join('')}</div>
${(f.anexos||[]).length?`<h2>ANEXOS</h2>${f.anexos.map(a=>`<div class="pp-box" style="margin-bottom:4px"><b>${esc(a.motivo)}</b>: ${esc(a.texto)} (${esc(a.who)}, ${fecha(a.t)} ${hhmm(a.t)})</div>`).join('')}`:''}
<div class="pp-foot"><span>Fecha salida: ${blank||!f.cierre?'____ / ____ / ________':fecha(f.cierre)+' '+hhmm(f.cierre)}</span><span>Mantenimiento Industrial · Check-Lis${blank?'':' · Ficha '+esc(f.id)}</span></div></div></div>`}
function vPreview(f){return `<div class="pp-fit" id="ppfit">${paperHTML(f)}</div><p class="note">Así queda el PDF. Guárdalo para archivarlo o envíalo por WhatsApp. En la app de Claude para iPhone, al guardar se abre el menú para compartir directo.</p>`}
function waText(f){const e=f.equipo;const fl=faults(f);return `Ficha de taller ${eqLabel(e)} ${e.equipo} ${e.marca} ${e.modelo}\nEstado de salida: ${f.salida?OUTS[f.salida][0]:'en taller'}${f.motivo?' ('+f.motivo+')':''}\nIngreso: ${fecha(f.creado)} ${hhmm(f.creado)}${f.cierre?'\nSalida: '+fecha(f.cierre)+' '+hhmm(f.cierre):''}\nHorómetro: ${e.horometro} h\nFallas: ${fl.length?fl.map(x=>x.n+(x.m.nota?' ('+x.m.nota+')':'')).join('; '):'ninguna'}\nTrabajo: ${f.trabajo||'-'}\nEntrega: ${f.firmas.mec.nombre} / Recibe: ${f.firmas.op.nombre}`}
function shareDock(f){return `<div class="dock-in"><button class="btn" data-act="pdf">${I.pdf} PDF</button><button class="btn ghost" data-act="png" aria-label="Guardar imagen">${I.img}</button><a class="btn wa" href="https://wa.me/?text=${encodeURIComponent(waText(f))}" target="_blank" rel="noopener">${I.wa} WhatsApp</a></div>`}
function fitPaper(){const fit=$('#ppfit'),p=$('#paper');if(!fit||!p)return;const s=fit.clientWidth/794;p.style.transform=`scale(${s})`;fit.style.height=Math.ceil(p.offsetHeight*s)+'px';$$('img',p).forEach(im=>{if(!im.complete)im.addEventListener('load',()=>{fit.style.height=Math.ceil(p.offsetHeight*s)+'px'},{once:true})})}
addEventListener('resize',()=>{if(ui.view==='preview')fitPaper()});
async function paperCanvas(html){await load('h2c');const host=document.createElement('div');host.style.cssText='position:fixed;left:-10000px;top:0;width:794px;background:#fff';host.innerHTML=html;document.body.appendChild(host);
 try{await Promise.all($$('img[data-foto]',host).map(im=>getFoto(im.dataset.foto).then(d=>{if(d)im.src=d;else im.remove()})));
 await Promise.all($$('img',host).map(im=>im.complete&&im.naturalWidth?0:new Promise(r=>{im.onload=im.onerror=r})));
 try{if(document.fonts&&document.fonts.ready)await document.fonts.ready}catch(e){}
 return await html2canvas(host.firstElementChild,{scale:2,backgroundColor:'#ffffff',logging:false})}finally{host.remove()}}
async function canvasToPdf(c){await load('pdf');const pdf=new window.jspdf.jsPDF('p','pt','a4');const W=595.28,H=841.89;const ph=Math.floor(c.width*H/W);let y=0,first=true;
 while(y<c.height){const h=Math.min(ph,c.height-y);const part=document.createElement('canvas');part.width=c.width;part.height=h;const x=part.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,h);x.drawImage(c,0,y,c.width,h,0,0,c.width,h);if(!first)pdf.addPage();pdf.addImage(part.toDataURL('image/jpeg',.9),'JPEG',0,0,W,h*W/c.width);first=false;y+=h}
 return pdf.output('blob')}
async function saveFile(filename,data){try{await DL.save({filename,data});return true}catch(e){toast('No se pudo guardar el archivo.','bad');return false}}
const MIME={pdf:'application/pdf',png:'image/png',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',json:'application/json'};
/* Guarda o comparte un archivo: en el celular abre el menú de compartir (WhatsApp, correo, Drive); en el computador lo descarga. */
function saveDownload({filename,data}){const ext=filename.split('.').pop();const blob=data instanceof Blob?data:new Blob([data],{type:MIME[ext]||'application/octet-stream'});const file=new File([blob],filename,{type:blob.type||MIME[ext]});
 const ov=$('#ov');const canShare=!!(navigator.canShare&&navigator.canShare({files:[file]}));
 ov.innerHTML=`<div class="sheet-bg" data-act="sheet-close"></div><div class="sheet" role="dialog" aria-label="Archivo listo"><div class="sheet-h"><b>Archivo listo</b><span class="small muted">${esc(filename)} · ${Math.max(1,Math.round(blob.size/1024))} KB</span></div>${canShare?`<button class="btn wa block" id="sh-share">${I.wa} Compartir (WhatsApp, correo…)</button>`:''}<button class="btn ${canShare?'ghost':''} block" id="sh-dl">${I.pdf} Descargar al dispositivo</button><button class="link" data-act="sheet-close" style="align-self:center">Cerrar</button></div>`;
 return new Promise(res=>{const done=v=>{ov.innerHTML='';res(v)};
  const sh=$('#sh-share');if(sh)sh.onclick=async()=>{try{await navigator.share({files:[file],title:filename});done({status:'saved'})}catch(e){if(e&&e.name==='AbortError')return;toast('No se pudo compartir. Usa Descargar.','bad')}};
  $('#sh-dl').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4000);toast('Descargado: '+filename);done({status:'saved'})};
  ov.querySelectorAll('[data-act="sheet-close"]').forEach(x=>x.onclick=()=>done({status:'closed'}))})}
async function busy(btn,fn){if(btn)btn.classList.add('loading');try{await fn()}catch(e){toast('No se pudo generar el archivo. Revisa la conexión e intenta de nuevo.','bad')}finally{if(btn)btn.classList.remove('loading')}}

/* ---- Equipos y QR ---- */
function vEquipos(){const q=normPlate(ui.eqq);const all=Object.values(St.equipos);const eqs=all.filter(e=>!q||normPlate(e.patente+e.interno+e.equipo+e.marca).includes(q)).sort((a,b)=>(b.act||0)-(a.act||0));
 return `<div class="fld"><label class="lbl" for="eq-q">Buscar</label><input id="eq-q" data-eqq value="${esc(ui.eqq)}" placeholder="Patente, número interno o tipo" autocomplete="off"></div>
 <div class="kpis"><div class="kpi"><b>${all.length}</b><span class="lbl">Registrados</span></div><div class="kpi${all.some(e=>e.estado==='fuera')?' alert':''}"><b>${all.filter(e=>e.estado==='fuera').length}</b><span class="lbl">Fuera de servicio</span></div><div class="kpi"><b>${all.filter(e=>{const m=mantDue(e);return m&&m.vencida}).length}</b><span class="lbl">Mantención vencida</span></div></div>
 ${eqs.length?eqs.map(e=>{const s=eqEstado(e);const md=mantDue(e);return `<button class="eqc${e.estado==='fuera'?' oos':''}" data-act="eq" data-k="${esc(e.key)}"><div class="row">${plate(e)}<span class="tag ${s[1]}">${s[0]}</span></div><div class="v">${esc(e.equipo)} · ${esc((e.marca+' '+e.modelo).trim())}</div><div class="row small muted"><span>${esc(e.empresa||'')}</span><span class="mono">${num(e.horometro)!=null?fmtN(num(e.horometro))+' h':''}</span></div>${md&&md.vencida?'<span class="tag warn" style="align-self:flex-start">Toca mantención preventiva</span>':''}</button>`}).join(''):'<div class="empty"><h3>Sin equipos registrados</h3><p class="muted small">Cada equipo queda registrado en su primer ingreso al taller.</p></div>'}`}
function vEquipo(e){if(!e)return '<div class="empty"><h3>Equipo no encontrado</h3></div>';const s=eqEstado(e);const md=mantDue(e);const hist=eqHist(e.key);
 return `<section class="card"><div class="qr"><img id="qrimg" alt="Código QR del equipo"><div class="stack" style="gap:5px">${plate(e,true)}<span class="tag ${s[1]}" style="align-self:flex-start">${s[0]}</span><span class="small muted">Código CHECKLIS:${esc(e.key)}</span></div></div>
 <div class="row" style="margin-top:10px;gap:6px"><button class="btn ghost sm" data-act="qr-png" style="flex:1">${I.img} Etiqueta QR</button><button class="btn ghost sm" data-act="blank-pdf" style="flex:1">${I.pdf} Ficha en blanco</button></div></section>
 ${e.estado==='fuera'?`<div class="banner oos"><div><b>Fuera de servicio desde ${fecha(e.fueraT)}</b>${esc(e.fueraMotivo||'')}</div></div>`:''}
 <section class="card"><span class="lbl">Datos</span><div class="dl" style="margin-top:6px">${[['Equipo',e.equipo],['Marca',e.marca],['Modelo',e.modelo],['Patente',plateFmt(e.patente)||'—'],['N° interno',e.interno||'—'],['Empresa',e.empresa],['Horómetro',num(e.horometro)!=null?fmtN(num(e.horometro))+' h':'—'],['Última mantención',num(e.ultimaMant)!=null?fmtN(num(e.ultimaMant))+' h':'—']].map(x=>`<div><span class="lbl">${x[0]}</span><div class="v">${esc(x[1])}</div></div>`).join('')}</div>
 ${md?`<p class="small" style="margin-top:8px">${md.vencida?`<b class="bad-t">Mantención preventiva vencida por ${fmtN(-md.restante)} h</b>`:`Próxima mantención a las ${fmtN(md.proxima)} h (faltan ${fmtN(md.restante)} h)`}</p>`:''}
 ${isSup()&&St.canWrite?`<div class="grid2" style="margin-top:8px"><div class="fld"><label class="lbl" for="eq-iv">Intervalo mant. (h)</label><input id="eq-iv" data-eqf="intervalo" inputmode="numeric" value="${esc(e.intervalo==null?'':e.intervalo)}" placeholder="${esc(St.cfg.intervaloMant)}"></div><div class="fld"><label class="lbl" for="eq-um">Última mant. (h)</label><input id="eq-um" data-eqf="ultimaMant" inputmode="numeric" value="${esc(e.ultimaMant==null?'':e.ultimaMant)}"></div></div>`:''}</section>
 <section class="card"><span class="lbl">Historial en taller (${hist.length})</span><div class="stack" style="margin-top:8px">${hist.map(f=>{const es=estado(f);const fl=faults(f);return `<button class="eqc" data-act="open" data-id="${f.id}" style="padding:9px 10px"><div class="row"><span class="small"><b>${fecha(f.creado)}</b> ${esc(f.usuario.solicita||'')}</span><span class="tag ${es[1]}">${es[0]}</span></div>${fl.length?`<span class="small bad-t">${fl.map(x=>esc(x.n)).join(', ')}</span>`:''}</button>`}).join('')||'<p class="small muted">Sin ingresos todavía.</p>'}</div></section>`}
async function qrData(text,cell){await load('qr');const q=qrcode(0,'M');q.addData(text);q.make();return q.createDataURL(cell||5,4)}
function drawQR(){const e=St.equipos[ui.ek];const im=$('#qrimg');if(!e||!im)return;qrData('CHECKLIS:'+e.key,5).then(d=>{im.src=d}).catch(()=>{im.alt='No se pudo generar el QR'})}

/* ---- Escanear ---- */
function vEscanear(){const q=normPlate(ui.q);const eqs=q?Object.values(St.equipos).filter(e=>normPlate(e.patente+' '+e.interno).includes(q)).slice(0,8):[];
 return `<section class="card stack" style="align-items:center;text-align:center;padding:22px 16px"><div style="width:64px;height:64px;border-radius:16px;background:var(--brand-soft);color:var(--brand);display:grid;place-items:center">${I.scan.replace('<svg','<svg style="width:34px;height:34px"')}</div><h2>Escanea el QR del equipo</h2><p class="small muted">Apunta la cámara al código pegado en el equipo. La app lo lee y abre su registro.</p>
 <button class="btn hv block" data-act="cam">${I.scan} Escanear con la cámara</button><label class="btn ghost block" style="position:relative">${I.cam} Fotografiar código QR<input type="file" accept="image/*" data-scan style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%" aria-label="Fotografiar código QR"></label></section>
 <div class="fld"><label class="lbl" for="sc-q">O escribe la patente o número interno</label><input id="sc-q" data-q value="${esc(ui.q)}" placeholder="HJKL42 o CA-08" autocomplete="off"></div>
 ${eqs.map(e=>{const s=eqEstado(e);return `<button class="eqc" data-act="eq" data-k="${esc(e.key)}"><div class="row">${plate(e)}<span class="tag ${s[1]}">${s[0]}</span></div><div class="v">${esc(e.equipo)} · ${esc(e.marca)}</div></button>`}).join('')}
 ${q&&!eqs.length&&canCreate()?`<button class="btn hv" data-act="new-pat">+ Nuevo ingreso con ${esc(ui.q.toUpperCase())}</button>`:''}`}
async function decodeQR(file){await load('jsqr');const url=URL.createObjectURL(file);try{const img=await new Promise((r,j)=>{const i=new Image();i.onload=()=>r(i);i.onerror=j;i.src=url});
 for(const max of [1200,800,1800]){const s=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));const c=document.createElement('canvas');c.width=Math.round(img.naturalWidth*s);c.height=Math.round(img.naturalHeight*s);const x=c.getContext('2d');x.drawImage(img,0,0,c.width,c.height);const d=x.getImageData(0,0,c.width,c.height);const r=jsQR(d.data,c.width,c.height,{inversionAttempts:'attemptBoth'});if(r)return r.data}
 return null}finally{URL.revokeObjectURL(url)}}

/* ---- Turno ---- */
function vTurno(){const today=dayKey(Date.now());const list=dayFichas(today);const r=resumen(list);const ent=St.entregas[today];const sup=isSup();
 const secs=[['Inventario','inv:']].concat(SYS.map(s=>[s.n,'chk:'+s.id+':']));const counts=secs.map(s=>[s[0],list.reduce((a,f)=>a+Object.keys(f.marks||{}).filter(k=>k.startsWith(s[1])&&(f.marks[k]||{}).v==='M').length,0)]).filter(x=>x[1]).sort((a,b)=>b[1]-a[1]);const mx=Math.max(1,...counts.map(c=>c[1]));
 const pend=list.filter(f=>f.estado!=='cerrada'||['pendiente','fuera'].includes(f.salida));
 return `${sup?banners():'<div class="banner info"><div><b>La entrega de turno la hace el supervisor</b>Aquí ves el resumen del día. Tus fichas se suman solas.</div></div>'}
<div class="kpis k4"><div class="kpi"><b>${r.ingresos}</b><span class="lbl">Ingresos</span></div><div class="kpi"><b>${r.entregados}</b><span class="lbl">Entregados</span></div><div class="kpi"><b>${r.pendientes}</b><span class="lbl">Pendientes</span></div><div class="kpi${r.fallas?' alert':''}"><b>${r.fallas}</b><span class="lbl">Fallas</span></div></div>
<section class="card"><span class="lbl">Fallas por sistema</span><div style="margin-top:8px">${counts.length?counts.map(c=>`<div class="hb"><span>${c[0]}</span><i><b style="width:${c[1]/mx*100}%"></b></i><strong>${c[1]}</strong></div>`).join(''):'<p class="small muted">Sin fallas registradas hoy.</p>'}</div></section>
<section class="card"><span class="lbl">Pasan al siguiente turno</span><div class="stack" style="margin-top:8px">${pend.length?pend.map(f=>{const e=estado(f);return `<div class="row"><div class="row" style="justify-content:flex-start;min-width:0">${plate(f.equipo)}<span class="small" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(f.equipo.equipo)}${f.motivo||f.esperaDet?': '+esc(f.motivo||f.esperaDet):''}</span></div><span class="tag ${e[1]}">${e[0]}</span></div>`}).join(''):'<p class="small muted">Nada pendiente.</p>'}</div></section>
${ent?`<section class="card stack"><div class="row"><span class="lbl">Turno de hoy</span><span class="tag ${ent.firmado?'ok':'warn'}">${ent.firmado?'Entregado y firmado':'Sin firma'}</span></div>${ent.firmado?`<p class="small">Entregado por <b>${esc(ent.sup&&ent.sup.nombre)}</b> a las ${hhmm(ent.t)}.</p>${ent.firma?`<img data-foto="${ent.firma}" alt="Firma del supervisor" style="height:60px;object-fit:contain;align-self:flex-start">`:''}`:''}${ent.nota?`<p class="small">${esc(ent.nota)}</p>`:''}</section>`:''}
${sup&&St.canWrite&&!(ent&&ent.firmado)?`<section class="card stack"><span class="lbl">Entregar turno</span><div class="fld${DICT?' ta':''}"><label class="lbl" for="t-nota">Nota para el siguiente turno</label><textarea id="t-nota" data-tnota placeholder="Ej: MC-017, llega pastilla de freno mañana 09:00">${esc(ui.tnota)}</textarea>${DICT?`<button class="mic" data-act="dict" data-t="t-nota" aria-label="Dictar">${I.mic}</button>`:''}</div><button class="btn block" data-act="entregar" ${list.length?'':'disabled'}>${I.pen} Firmar y entregar turno</button></section>`:''}
<div class="row" style="gap:8px"><button class="btn ghost" style="flex:1" data-act="turno-pdf">${I.pdf} PDF del turno</button><button class="btn ghost" style="flex:1" data-act="xlsx">${I.xls} Excel</button></div>
<a class="btn wa" href="https://wa.me/?text=${encodeURIComponent(turnoText(today))}" target="_blank" rel="noopener">${I.wa} Enviar resumen por WhatsApp</a>
<section class="card"><span class="lbl">Turnos anteriores</span><div class="stack" style="margin-top:8px">${Object.values(St.entregas).filter(x=>x.fecha!==today).sort((a,b)=>a.fecha<b.fecha?1:-1).slice(0,10).map(x=>`<div class="row"><span class="small"><b>${dayLabel(x.fecha)}</b> · ${x.resumen?x.resumen.ingresos+' ingresos, '+x.resumen.pendientes+' pendientes':''}</span><span class="tag ${x.firmado?'ok':'warn'}">${x.firmado?'Firmado':'Sin firma'}</span></div>`).join('')||'<p class="small muted">Aún no hay turnos anteriores.</p>'}</div></section>`}
function turnoText(day){const list=dayFichas(day);const r=resumen(list);return `Entrega de turno ${dayLabel(day)} (Turno ${St.cfg.turnoActivo})\nIngresos: ${r.ingresos}, entregados: ${r.entregados}, pendientes: ${r.pendientes}, fallas: ${r.fallas}\n`+list.map(f=>`- ${eqLabel(f.equipo)} ${f.equipo.equipo}: ${estado(f)[0]}${f.motivo?' ('+f.motivo+')':''}`).join('\n')+(ui.tnota?'\nNota: '+ui.tnota:'')}
function turnoPaper(day){const list=dayFichas(day);const r=resumen(list);const ent=St.entregas[day];return `<div class="paper"><div class="pp-h"><div><h1>ENTREGA DE TURNO</h1><p>Turno ${esc(St.cfg.turnoActivo)} • ${dayLabel(day)} • Recopilado del día</p></div><div class="r"><img class="lg" src="${LOGO.inv}" alt="Mantenimiento Industrial"></div></div><div class="pp-b">
<h2>RESUMEN</h2><div class="pp-kv">${[['Ingresos',r.ingresos],['Entregados',r.entregados],['Pendientes',r.pendientes],['Fuera de servicio',r.fuera],['Fallas detectadas',r.fallas]].map(x=>`<div><b>${x[0]}:</b><span>${x[1]}</span></div>`).join('')}</div>
<h2>EQUIPOS</h2><table class="pp-t"><thead><tr><th>EQUIPO</th><th>MECÁNICO</th><th>FALLAS</th><th>ESTADO</th></tr></thead><tbody>${list.map(f=>`<tr><td>${esc(eqLabel(f.equipo)+' '+f.equipo.equipo)}</td><td>${esc(f.mecanico.nombre)}</td><td>${faults(f).length}</td><td>${esc(estado(f)[0])}</td></tr>`).join('')}</tbody></table>
<h2>NOTA PARA EL SIGUIENTE TURNO</h2><div class="pp-box">${esc((ent&&ent.nota)||ui.tnota||'')}</div>
<div class="pp-sig"><div>${ent&&ent.firma?`<img data-foto="${ent.firma}" alt="">`:'<div class="em"></div>'}<div class="ln">${esc(ent&&ent.sup?ent.sup.nombre:'')}&nbsp;</div>Supervisor · Firma</div><div><div class="em"></div><div class="ln">${ent?hhmm(ent.t):''}&nbsp;</div>Hora de entrega</div></div>
<div class="pp-foot"><span>${ent&&!ent.firmado?'Generada sin firma del supervisor':''}</span><span>Mantenimiento Industrial · Check-Lis</span></div></div></div>`}

/* ---- Panel y reportes ---- */
function feedAll(){const out=[];Object.values(St.fichas).forEach(f=>(f.ev||[]).forEach(x=>out.push({t:x.t,txt:x.who+' '+x.txt+' ('+eqLabel(f.equipo)+')'})));return out.sort((a,b)=>b.t-a.t).slice(0,25)}
function vPanel(){return `<div class="chips">${[['vivo','En vivo'],['reportes','Reportes']].map(c=>`<button class="chip${ui.pview===c[0]?' on':''}" data-act="pview" data-v="${c[0]}">${c[1]}</button>`).join('')}</div>${ui.pview==='reportes'?vReportes():vVivo()}`}
function vVivo(){const fs=Object.values(St.fichas);const open=fs.filter(f=>f.estado!=='cerrada');const cl=fs.filter(f=>f.cierre);const avg=cl.length?(cl.reduce((a,f)=>a+(f.cierre-f.creado),0)/cl.length/36e5).toFixed(1).replace('.',',')+' h':'–';const eqs=Object.values(St.equipos);
 return `${banners()}<span class="live"><i></i>${St.mode!=='local'?'En vivo: se actualiza solo':'Datos de este dispositivo'}</span>
<div class="kpis"><div class="kpi"><b>${open.length}</b><span class="lbl">En taller</span></div><div class="kpi"><b>${open.filter(f=>f.step>=1&&f.step<=2).length}</b><span class="lbl">Chequeos en curso</span></div><div class="kpi${open.some(f=>f.espera)?' alert':''}"><b>${open.filter(f=>f.espera).length}</b><span class="lbl">Esperan repuesto</span></div><div class="kpi${eqs.some(e=>e.estado==='fuera')?' alert':''}"><b>${eqs.filter(e=>e.estado==='fuera').length}</b><span class="lbl">Fuera de servicio</span></div><div class="kpi"><b>${avg}</b><span class="lbl">Tiempo medio</span></div></div>
<div class="panel"><section class="card" style="min-width:0"><span class="lbl">Equipos</span><div class="tw" style="margin-top:6px">${fs.length?`<table class="t"><thead><tr><th>Equipo</th><th>Mecánico</th><th>Etapa</th><th>Avance</th><th>Fallas</th><th>Estado</th></tr></thead><tbody>${fs.slice().sort((a,b)=>(a.estado==='cerrada')-(b.estado==='cerrada')||b.act-a.act).map(f=>{const e=estado(f),p=prog(f);const c=f.estado==='cerrada';return `<tr data-act="open" data-id="${f.id}"><td><div class="row" style="justify-content:flex-start">${plate(f.equipo)}<span class="small">${esc(f.equipo.equipo)}</span></div></td><td>${esc(f.mecanico.nombre)}</td><td>${c?'Cerrada':STEPS[f.step]}</td><td><span class="bar"><b style="width:${c?100:p.pct}%"></b></span><span class="mono small">${c?100:p.pct}%</span></td><td>${faults(f).length}</td><td><span class="tag ${e[1]}">${e[0]}</span></td></tr>`}).join('')}</tbody></table>`:'<p class="small muted">Sin fichas todavía.</p>'}</div></section>
<section class="card"><span class="lbl">Actividad</span><div class="feed" style="margin-top:4px">${feedAll().map(x=>`<div><span class="tm">${hhmm(x.t)}</span><span>${esc(x.txt)}</span></div>`).join('')||'<p class="small muted">Aquí aparece cada acción de los mecánicos.</p>'}</div></section></div>`}
function vReportes(){const fs=Object.values(St.fichas);const byEq={},byIt={},byTipo={},byMec={};
 fs.forEach(f=>{const fl=faults(f);const k=eqLabel(f.equipo)+' '+f.equipo.equipo;byEq[k]=(byEq[k]||0)+fl.length;fl.forEach(x=>{byIt[x.n]=(byIt[x.n]||0)+1});if(f.cierre){const t=f.equipo.equipo||'Otro';byTipo[t]=byTipo[t]||[0,0];byTipo[t][0]+=(f.cierre-f.creado)/36e5;byTipo[t][1]++}byMec[f.mecanico.nombre]=(byMec[f.mecanico.nombre]||0)+1});
 const bars=(o,cls,fmt)=>{const a=Object.entries(o).filter(x=>x[1]).sort((x,y)=>y[1]-x[1]).slice(0,8);const mx=Math.max(1,...a.map(x=>x[1]));return a.length?a.map(x=>`<div class="hb"><span>${esc(x[0])}</span><i><b class="${cls||''}" style="width:${x[1]/mx*100}%"></b></i><strong>${fmt?fmt(x[1]):x[1]}</strong></div>`).join(''):'<p class="small muted">Sin datos todavía.</p>'};
 const tiempos={};Object.entries(byTipo).forEach(([k,v])=>tiempos[k]=v[0]/v[1]);const nc=fs.reduce((a,f)=>a+(f.reingresos||[]).length,0);
 return `<div class="kpis"><div class="kpi"><b>${fs.length}</b><span class="lbl">Fichas</span></div><div class="kpi"><b>${fs.reduce((a,f)=>a+faults(f).length,0)}</b><span class="lbl">Fallas</span></div><div class="kpi${nc?' alert':''}"><b>${nc}</b><span class="lbl">No conformidades</span></div></div>
<div class="panel"><section class="card"><span class="lbl">Fallas por equipo</span><div style="margin-top:8px">${bars(byEq)}</div></section><section class="card"><span class="lbl">Ítems que más fallan</span><div style="margin-top:8px">${bars(byIt)}</div></section>
<section class="card"><span class="lbl">Tiempo promedio en taller (horas)</span><div style="margin-top:8px">${bars(tiempos,'br',v=>v.toFixed(1).replace('.',','))}</div></section><section class="card"><span class="lbl">Fichas por mecánico</span><div style="margin-top:8px">${bars(byMec,'br')}</div></section></div>
<button class="btn ghost" data-act="xlsx-all">${I.xls} Descargar todas las fichas en Excel</button>`}

/* ---- Ajustes ---- */
function vAjustes(){const m=me()||{};const r=realRole();const adm=r==='admin';const c=St.cfg;const tipos=[...new Set(Object.values(St.equipos).map(e=>e.equipo).filter(Boolean))];const tp=ui.tplTipo||tipos[0]||'';const tpl=(c.plantillas||{})[tipoKey(tp)]||{na:[]};const tf={extra:{hidraulico:c.hidraulicoDef||[],frenos:c.frenosDef||[]}};
 return `<section class="card stack"><span class="lbl">Mis datos</span><div class="grid2"><div class="fld"><label class="lbl" for="pf-n">Nombre</label><input id="pf-n" value="${esc(m.nombre||'')}"></div><div class="fld"><label class="lbl" for="pf-a">Área</label><input id="pf-a" value="${esc(m.area||'')}"></div><div class="fld"><label class="lbl" for="pf-r">RUT</label><input id="pf-r" value="${esc(m.rut||'')}"></div><div class="fld"><label class="lbl" for="pf-t">Turno (7x7, día)</label><select id="pf-t">${['A','B'].map(t=>`<option ${m.turno===t?'selected':''}>${t}</option>`).join('')}</select></div></div><button class="btn" data-act="perfil-upd" ${St.canWrite?'':'disabled'}>Guardar mis datos</button>
<p class="small muted">Rol: <b>${ROLES[r]}</b>${St.mode==='local'?'. Para cambiar de rol, cierra sesión.':''}</p>${St.email?`<p class="small muted">Cuenta: ${esc(St.email)}</p>`:''}<button class="link" data-act="logout">Cerrar sesión</button></section>
<section class="card stack"><span class="lbl">Instalar en el celular</span><p class="small muted">Instalada, la app se abre desde su ícono y funciona sin internet. Lo que registres sin señal se sube solo al volver la conexión.</p>${matchMedia('(display-mode: standalone)').matches||navigator.standalone?'<span class="tag ok" style="align-self:flex-start">Ya está instalada</span>':`<button class="btn ghost" data-act="install">${deferredInstall?'Instalar app':'Cómo instalar'}</button>`}</section>
${adm?`<section class="card stack"><span class="lbl">Probar la app como</span><div class="chips">${[['','Administrador'],['supervisor','Supervisor'],['mecanico','Mecánico'],['operador','Operador']].map(x=>`<button class="chip${ui.asRole===x[0]?' on':''}" data-act="asrole" data-v="${x[0]}">${x[1]}</button>`).join('')}</div><p class="small muted">Solo cambia lo que ves tú, para revisar cada vista. Vuelve aquí desde el engranaje.</p></section>
<section class="card stack"><span class="lbl">Turno y horarios</span><div class="grid3"><div class="fld"><label class="lbl" for="c-ta">Turno activo</label><select id="c-ta" data-cfg="turnoActivo">${['A','B'].map(t=>`<option ${c.turnoActivo===t?'selected':''}>${t}</option>`).join('')}</select></div><div class="fld"><label class="lbl" for="c-ht">Fin jornada</label><input id="c-ht" type="time" data-cfg="horaTermino" value="${esc(c.horaTermino)}"></div><div class="fld"><label class="lbl" for="c-im">Mant. cada (h)</label><input id="c-im" data-cfg="intervaloMant" inputmode="numeric" value="${esc(c.intervaloMant)}"></div></div><p class="small muted">Turnos 7x7: el turno A trabaja 7 días y el B los 7 siguientes, siempre de día.</p></section>
<section class="card stack"><span class="lbl">Ítems de hidráulico y frenos</span><p class="small muted">Se cargan en cada ficha nueva. Sepáralos con comas.</p><div class="fld"><label class="lbl" for="c-hd">Sistema hidráulico</label><input id="c-hd" data-cfgl="hidraulicoDef" value="${esc((c.hidraulicoDef||[]).join(', '))}" placeholder="Cilindros, Mangueras, Nivel aceite hidráulico"></div><div class="fld"><label class="lbl" for="c-fr">Sistema de frenos</label><input id="c-fr" data-cfgl="frenosDef" value="${esc((c.frenosDef||[]).join(', '))}" placeholder="Freno de servicio, Freno de mano"></div></section>
<section class="card"><span class="lbl">Plantillas por tipo de equipo</span><p class="small muted" style="margin:4px 0 8px">Activa los ítems que no aplican a ese tipo. Se marcan N/A solos en sus fichas.</p>
<div class="fld"><label class="lbl" for="tp-t">Tipo de equipo</label><input id="tp-t" data-tpl value="${esc(tp)}" list="dl-tp" placeholder="Mini cargador"><datalist id="dl-tp">${tipos.map(t=>`<option value="${esc(t)}">`).join('')}</datalist></div>
${tp?`<div style="margin-top:6px">${allKeys(tf).map(k=>`<label class="tpl"><span class="small">${esc(nameOf(tf,k))} <span class="muted">(${esc(secOf(k))})</span></span><span class="sw"><input type="checkbox" data-tplk="${k}" ${tpl.na.includes(k)?'checked':''} aria-label="No aplica: ${esc(nameOf(tf,k))}"><i></i></span></label>`).join('')}</div>`:''}</section>
${St.mode!=='local'?(()=>{const ps=Object.entries(St.personas).sort((a,b)=>(!!(c.roles||{})[a[0]])-(!!(c.roles||{})[b[0]]));const pend=ps.filter(([id])=>!(c.roles||{})[id]).length;return `<section class="card"><div class="row"><span class="lbl">Personas y roles</span>${pend?`<span class="tag warn">${pend} por aprobar</span>`:''}</div><div style="margin-top:6px">${ps.map(([id,p])=>{const r=(c.roles||{})[id]||'';return `<div class="person"><div class="grow"><b>${esc(p.nombre)}</b>${r?'':' <span class="tag warn">Pendiente</span>'}<div class="small muted">${esc(p.email||'')}${p.area?' · '+esc(p.area):''}${p.turno?', turno '+esc(p.turno):''}</div></div><select data-role="${esc(id)}" aria-label="Rol de ${esc(p.nombre)}"><option value="" ${r?'':'selected'}>Sin acceso</option>${Object.keys(ROLES).map(x=>`<option value="${x}" ${r===x?'selected':''}>${ROLES[x]}</option>`).join('')}</select></div>`}).join('')}</div><p class="small muted" style="margin-top:6px">Cada persona aparece aquí al entrar por primera vez y completar sus datos. Elige su rol para darle acceso, o "Sin acceso" para quitárselo.</p></section>
<section class="card stack"><span class="lbl">Datos antiguos</span><p class="small muted">El plan gratuito guarda hasta 1 GB (miles de fichas con fotos). Cada cierto tiempo, descarga un respaldo en Excel y borra las fichas cerradas antiguas para mantener la app rápida.</p>
<button class="btn ghost" data-act="backup">${I.xls} Descargar respaldo completo (Excel)</button>
${ui.confirm==='clean'?`<div class="confirm"><b>Respaldar y borrar fichas antiguas</b><div class="fld" style="background:#fff"><label class="lbl" for="cl-m">Fichas cerradas hace más de</label><select id="cl-m"><option value="2">2 meses</option><option value="3" selected>3 meses</option><option value="6">6 meses</option></select></div><p class="small">Primero se descarga un Excel con esas fichas. Después se borran con sus fotos y firmas.</p><div class="row"><button class="btn ghost" data-act="cancel">Cancelar</button><button class="btn danger" data-act="clean">Respaldar y borrar</button></div></div>`:`<button class="btn ghost" style="color:var(--bad);box-shadow:inset 0 0 0 1.5px var(--bad)" data-act="ask-clean">Respaldar y borrar fichas antiguas</button>`}</section>`})():''}
<section class="card stack"><span class="lbl">Datos de prueba</span><p class="small muted">Carga equipos y fichas de ejemplo para probar. Quedan marcados como ejemplo y se pueden borrar.</p>${ui.confirm==='wipe'?`<div class="confirm"><b>¿Borrar todos los datos de ejemplo?</b><div class="row"><button class="btn ghost" data-act="cancel">Cancelar</button><button class="btn danger" data-act="wipe">Borrar</button></div></div>`:`<div class="row"><button class="btn ghost" style="flex:1" data-act="seed">Cargar ejemplos</button><button class="btn ghost" style="flex:1;color:var(--bad);box-shadow:inset 0 0 0 1.5px var(--bad)" data-act="ask-wipe">Borrar ejemplos</button></div>`}</section>`:''}
<p class="note">${St.mode!=='local'?'Los datos se comparten en vivo entre todos los que usan la app. Si no hay señal, quedan guardados en el celular y se suben al volver.':'Modo demostración: falta configurar Firebase (archivo firebase-config.js). Los datos quedan solo en este dispositivo.'}</p>`}
function cfgWrite(patch){deepMerge(St.cfg,patch);if(St.mode!=='local'){write(CFG_PATH,St.cfgExists?patch:St.cfg,{set:!St.cfgExists});St.cfgExists=true}else saveLocal()}

/* ============ Firma a pantalla completa ============ */
function openSig(title,name,done){ui.sig={done};const ov=$('#ov');ov.innerHTML=`<div class="sigov" role="dialog" aria-label="Firma"><div class="top"><div class="grow"><b>Firma</b><span>${esc(title)}${name?': '+esc(name):''}</span></div><button class="ib" data-act="sig-cancel" aria-label="Cerrar">✕</button></div><div class="area"><canvas></canvas><span class="x">✕</span><div class="line"></div><div class="ph">Firma sobre la línea con el dedo</div></div><div class="rot">Gira el celular para tener más espacio</div><div class="bot"><button class="btn ghost" data-act="sig-clear">Borrar</button><button class="btn" data-act="sig-save">Guardar firma</button></div></div>`;
 document.body.style.overflow='hidden';const root=$('.sigov'),wrap=$('.area',root),cv=$('canvas',wrap);let ctx,drawn=false;
 const size=()=>{const r=wrap.getBoundingClientRect(),d=devicePixelRatio||1;const old=drawn?cv.toDataURL():null;cv.width=Math.max(1,r.width*d);cv.height=Math.max(1,r.height*d);ctx=cv.getContext('2d');ctx.scale(d,d);ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#13306e';ctx.fillStyle='#13306e';if(old){const im=new Image();im.onload=()=>ctx.drawImage(im,0,0,r.width,r.height);im.src=old}};
 size();ui.sig.resize=size;addEventListener('resize',size);
 let dn=false,last=null,w=3,bx=[1e9,1e9,-1e9,-1e9];const pt=e=>{const b=cv.getBoundingClientRect();const p={x:e.clientX-b.left,y:e.clientY-b.top,t:performance.now()};bx=[Math.min(bx[0],p.x),Math.min(bx[1],p.y),Math.max(bx[2],p.x),Math.max(bx[3],p.y)];return p};
 cv.addEventListener('pointerdown',e=>{e.preventDefault();dn=true;try{cv.setPointerCapture(e.pointerId)}catch(_){}last=pt(e);ctx.beginPath();ctx.arc(last.x,last.y,1.4,0,7);ctx.fill();if(!drawn){drawn=true;root.classList.add('drawn');buzz(8)}});
 cv.addEventListener('pointermove',e=>{if(!dn)return;const p=pt(e);const v=Math.hypot(p.x-last.x,p.y-last.y)/Math.max(1,p.t-last.t);w=w*.65+Math.max(1.6,Math.min(4.2,4.4-v*1.6))*.35;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(p.x,p.y);ctx.stroke();last=p});
 const up=()=>{dn=false};cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
 ui.sig.clear=()=>{ctx.clearRect(0,0,cv.width,cv.height);drawn=false;bx=[1e9,1e9,-1e9,-1e9];root.classList.remove('drawn')};
 /* Recorta el espacio vacío alrededor de los trazos para que la firma se vea grande en la ficha */
 ui.sig.get=()=>{if(!drawn)return null;const d=devicePixelRatio||1,padd=14;const x0=Math.max(0,(bx[0]-padd)*d),y0=Math.max(0,(bx[1]-padd)*d),x1=Math.min(cv.width,(bx[2]+padd)*d),y1=Math.min(cv.height,(bx[3]+padd)*d);const sw=Math.max(1,x1-x0),sh=Math.max(1,y1-y0);const s=Math.min(1,640/sw);const o=document.createElement('canvas');o.width=Math.max(1,Math.round(sw*s));o.height=Math.max(1,Math.round(sh*s));o.getContext('2d').drawImage(cv,x0,y0,sw,sh,0,0,o.width,o.height);return o.toDataURL('image/png')}}
function closeSig(){if(ui.sig)removeEventListener('resize',ui.sig.resize);$('#ov').innerHTML='';document.body.style.overflow='';ui.sig=null;if(pendingRender)scheduleRender()}

/* ============ Toast ============ */
let toastT;function toast(msg,kind){const t=$('#toast');t.className='toast'+(kind==='bad'?' bad':'');t.innerHTML=(kind==='bad'?'':'<i>✓</i>')+esc(msg);requestAnimationFrame(()=>t.classList.add('show'));clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),3200)}

/* ============ Acciones ============ */
function go(v,dir){ui.view=v;ui.confirm=null;ui.dir=dir||0;render();scrollTo({top:0})}
const cur=()=>St.fichas[ui.fid];
function startFicha(pre){const f=newFicha(pre);St.fichas[f.id]=f;write('fichas/'+f.id,f,{set:true,now:true});ui.fid=f.id;ui.step=0;ui.open={};go('ficha',1);return f}
function markEditing(f,sec){if(!f||f.estado==='cerrada'||!canCreate())return;const e=f.editando&&f.editando[sec];if(e&&e.uid===myId()&&Date.now()-e.t<60e3)return;upd(f,{editando:{[sec]:{who:me().nombre,uid:myId(),t:Date.now()}}})}
function applyTpl(f){if(f.tplApplied)return;const t=(St.cfg.plantillas||{})[tipoKey(f.equipo.equipo)];const p={tplApplied:true};let n=0;if(t&&t.na&&t.na.length){p.marks={};t.na.forEach(k=>{if(!mk(f,k)&&allKeys(f).includes(k)){p.marks[k]={v:'NA',tpl:true};n++}})}upd(f,p);if(n)toast('Plantilla de '+f.equipo.equipo+': '+n+' ítems marcados N/A')}
function shake(el){if(!el)return;el.classList.remove('err');void el.offsetWidth;el.classList.add('err')}
function stepCheck(f){$$('.fld.err,.fail.err').forEach(x=>x.classList.remove('err'));
 if(ui.step===0){const bad=[];const E=f.equipo;if(!String(E.equipo).trim())bad.push('equipo.equipo');if(!String(E.patente).trim()&&!String(E.interno).trim())bad.push('equipo.patente','equipo.interno');const patBad=String(E.patente).trim()&&!plateOk(E.patente);if(patBad)bad.push('equipo.patente');if(num(E.horometro)==null)bad.push('equipo.horometro');if(!String(f.usuario.nombre).trim())bad.push('usuario.nombre');
  if(bad.length){bad.forEach(p=>shake($(`[data-f="${p}"]`)));const el=$(`[data-f="${bad[0]}"] input`);el&&el.focus();toast(patBad?'Revisa la patente. Si el equipo no tiene, déjala vacía y usa el número interno.':bad[0]==='equipo.horometro'?'Escribe el horómetro del equipo.':'Completa equipo, patente o número interno, horómetro y nombre del usuario.','bad');buzz([20,40,20]);return false}
  const pv=prevHoro(f);const low=!!(pv&&num(E.horometro)<pv.h);if(low!==!!f.horoBajo)upd(f,{horoBajo:low});if(low&&!f.horoConfirm){render();toast('El horómetro es menor al último registro. Corrígelo o confírmalo.','bad');setTimeout(()=>{const c=$('[data-chk="horoConfirm"]');c&&c.scrollIntoView({block:'center',behavior:'smooth'})},50);return false}return true}
 if(ui.step===1||ui.step===2){const pre=ui.step===1?'inv:':'chk:';const sn=faults(f).filter(x=>x.k.startsWith(pre)&&!String(x.m.nota||'').trim());if(sn.length){const it=$(`.it[data-k="${sn[0].k}"]`);if(it){const sec=it.closest('.sec');if(sec&&!sec.classList.contains('open')){sec.classList.add('open');ui.open[sec.dataset.sec]=true}shake($('.fail',it));setTimeout(()=>{it.scrollIntoView({block:'center',behavior:'smooth'});const ta=$('textarea',it);ta&&ta.focus({preventScroll:true})},250)}toast('Describe la falla de '+sn[0].n+' para continuar.','bad');buzz([20,40,20]);return false}}
 return true}
const ACT={
 go(b){const v=b.dataset.v||'inicio';go(v,-1)},
 home(){go('inicio',-1)},
 pick(b){$$('.chip',b.parentElement).forEach(c=>c.classList.toggle('on',c===b))},
 login(){const n=$('#lg-n').value.trim();if(!n){shake($('#lg-n').parentElement);toast('Escribe tu nombre para entrar.','bad');return}St.localMe={nombre:n,area:$('#lg-a').value.trim()||'Mantención',rol:$('#lg-r').value,turno:($('#lg-t .chip.on')||{dataset:{v:'A'}}).dataset.v,rut:''};saveLocal();go('inicio',1);toast('Hola, '+n.split(' ')[0])},
 logout(){if(St.mode==='fb'){unsubAll();St.fichas={};St.equipos={};St.personas={};St.entregas={};St.fotos={};AUTH.signOut();return}St.localMe=null;saveLocal();go('login')},
 'perfil-save'(){const n=$('#pf-n').value.trim();if(!n){shake($('#pf-n').parentElement);toast('Escribe tu nombre.','bad');return}const r=$('#pf-r').value.trim();if(r&&!rutOk(r)){shake($('#pf-r').parentElement);toast('El RUT no es válido. Revisa el dígito verificador.','bad');return}const p={nombre:n,area:$('#pf-a').value.trim(),rut:r?rutFmt(r):'',turno:($('#lg-t .chip.on')||{dataset:{v:'A'}}).dataset.v,t:Date.now()};if(St.mode==='fb'){p.email=St.email||'';p.uid=St.uid}St.personas[St.uid]=p;write('personas/'+St.uid,p,{set:true,now:true});if(St.mode==='fb'){ui.view='cargando';onData();toast('Datos guardados');return}go('inicio',1);autoEntregas();toast('Listo, '+n.split(' ')[0])},
 'perfil-upd'(){const r=$('#pf-r').value.trim();if(r&&!rutOk(r)){toast('El RUT no es válido.','bad');return}const p={nombre:$('#pf-n').value.trim(),area:$('#pf-a').value.trim(),rut:r?rutFmt(r):'',turno:$('#pf-t').value};if(!p.nombre){toast('Escribe tu nombre.','bad');return}if(St.mode==='local'){Object.assign(St.localMe,p);saveLocal()}else{const had=!!St.personas[St.uid];St.personas[St.uid]=Object.assign(St.personas[St.uid]||{},p);write('personas/'+St.uid,had?p:St.personas[St.uid],{set:!had})}render();toast('Datos guardados')},
 asrole(b){ui.asRole=b.dataset.v;lsSet('cl-asrole',ui.asRole);render();toast('Viendo la app como '+(ui.asRole?ROLES[ui.asRole]:'Administrador'))},
 filter(b){ui.filter=b.dataset.v;render()},
 pview(b){ui.pview=b.dataset.v;render()},
 new(){if(canCreate())startFicha()},
 'new-eq'(b){const e=St.equipos[b.dataset.k];if(!e||!canCreate())return;startFicha({equipo:e.equipo,marca:e.marca,modelo:e.modelo,patente:e.patente,interno:e.interno,empresa:e.empresa});toast('Datos del equipo cargados. Escribe el horómetro.')},
 'new-pat'(){const v=ui.q.trim();const pre=plateOk(v)?{patente:normPlate(v)}:{interno:v.toUpperCase()};ui.q='';startFicha(pre)},
 open(b){const f=St.fichas[b.dataset.id];if(!f)return;ui.fid=f.id;ui.open={};ui.justClosed=null;if(f.estado==='cerrada'||!canCreate())go('ver',1);else{ui.step=Math.min(f.step,4);go('ficha',1)}},
 resume(){ui.step=Math.min(cur().step,4);go('ficha',1)},
 eq(b){ui.ek=b.dataset.k;go('equipo',1)},
 next(){const f=cur();if(!stepCheck(f))return;
  if(ui.step===0){const k=eqKey(f.equipo);const eq=St.equipos[k];if(eq&&eq.estado==='fuera'&&!f.reingresoFuera){upd(f,{reingresoFuera:true});ev(f,'reingresó un equipo fuera de servicio')}upsertEq(f,{estado:'taller'});if(!f.firmas.op.nombre)upd(f,{firmas:{op:{nombre:f.usuario.nombre}}});applyTpl(f)}
  ui.step++;if(ui.step===3&&f.step<3)ev(f,'terminó el chequeo');if(ui.step>f.step)upd(f,{step:ui.step});if(ui.step===1)markEditing(f,'inv');ui.dir=1;render();scrollTo({top:0})},
 prev(){ui.step--;ui.dir=-1;render();scrollTo({top:0})},
 goto(b){const v=+b.dataset.v,f=cur();if(v>f.step)return;ui.dir=v>ui.step?1:-1;ui.step=v;render();scrollTo({top:0})},
 toggle(b){const sec=b.closest('.sec');const o=!sec.classList.contains('open');sec.classList.toggle('open',o);b.setAttribute('aria-expanded',o);ui.open[b.dataset.v]=o;if(o)markEditing(cur(),b.dataset.v)},
 mark(b){const it=b.closest('.it'),k=it.dataset.k,f=cur(),v=b.dataset.v;if(!f||f.estado==='cerrada')return;const old=mk(f,k)||{};const nv=old.v===v?'':v;
  const nm=Object.assign({},old,{v:nv});delete nm.tpl;upd(f,{marks:{[k]:nm}});if(nv)it.dataset.v=nv;else it.removeAttribute('data-v');$$('.bm button',it).forEach(x=>x.setAttribute('aria-pressed',x.dataset.v===nv));
  b.classList.remove('pop');void b.offsetWidth;if(nv)b.classList.add('pop');buzz(nv==='M'?[10,40,10]:8);
  if(nv==='M'){ev(f,'marcó M en '+nameOf(f,k));setTimeout(()=>{const ta=$('textarea',it);ta&&ta.focus({preventScroll:true})},300)}
  updRings();
  const sec=it.closest('.sec');if(nv&&nv!=='M'&&sec&&sec.dataset.sec!=='inv'){const its=$$('.it',sec);if(its.every(x=>x.dataset.v)&&!its.some(x=>x.dataset.v==='M'&&!String((mk(f,x.dataset.k)||{}).nota||'').trim())){setTimeout(()=>{sec.classList.remove('open');ui.open[sec.dataset.sec]=false;$('.sec-h',sec).setAttribute('aria-expanded','false');let nx=sec.nextElementSibling;while(nx&&nx.classList.contains('sec')&&$$('.it',nx).length&&$$('.it',nx).every(x=>x.dataset.v))nx=nx.nextElementSibling;if(nx&&nx.classList.contains('sec')){nx.classList.add('open');ui.open[nx.dataset.sec]=true;markEditing(f,nx.dataset.sec);setTimeout(()=>nx.scrollIntoView({behavior:'smooth',block:'start'}),300)}},420)}}},
 allB(b){const f=cur(),id=b.dataset.sec;const sec=$(`.sec[data-sec="${id}"]`);const p={};const its=$$('.it',sec).filter(it=>!(mk(f,it.dataset.k)||{}).v);if(!its.length){toast('No quedan ítems sin marcar en esta sección.');return}its.forEach((it,i)=>{p[it.dataset.k]={v:'B'};setTimeout(()=>{it.dataset.v='B';const bb=$('[data-v="B"]',it);bb.classList.add('pop');bb.setAttribute('aria-pressed','true')},i*45)});upd(f,{marks:p});setTimeout(updRings,its.length*45+20);buzz(12)},
 'add-item'(b){const id=b.dataset.v,inp=$(`[data-newitem="${id}"]`),n=inp.value.trim();if(!n){inp.focus();return}const f=cur();upd(f,{extra:{[id]:((f.extra||{})[id]||[]).concat(n)}});ui.open[id]=true;render();toast('Ítem agregado: '+n)},
 'rm-item'(b){const it=b.closest('.it'),p=it.dataset.k.split(':'),f=cur(),id=p[1],i=+p[2];const arr=f.extra[id].slice();arr.splice(i,1);const mp={};for(let j=i;j<=arr.length;j++)mp['chk:'+id+':'+j]=j<arr.length?(mk(f,'chk:'+id+':'+(j+1))||null):null;upd(f,{extra:{[id]:arr},marks:mp});render()},
 'rm-photo'(b){const it=b.closest('.it'),f=cur(),k=it.dataset.k;const m=mk(f,k);const fotos=(m.fotos||[]).slice();const gone=fotos.splice(+b.dataset.i,1)[0];upd(f,{marks:{[k]:Object.assign({},m,{fotos})}});if(gone)remove('fotos/'+gone);rerenderItem(it)},
 'rm-papel'(){const f=cur();const id=f.papel;upd(f,{papel:''});if(id)remove('fotos/'+id);render()},
 'add-rep'(){const f=cur();upd(f,{repuestos:f.repuestos.concat({d:'',c:'1'})});render();const ins=$$('[data-rep="d"]');ins[ins.length-1].focus()},
 'rm-rep'(b){const f=cur();const a=f.repuestos.slice();a.splice(+b.closest('[data-i]').dataset.i,1);upd(f,{repuestos:a});render()},
 out(b){const f=cur();upd(f,{salida:b.dataset.v});buzz(10);render();if(f.salida!=='conforme')setTimeout(()=>{const t=$('[data-bind="motivo"]');t&&t.focus({preventScroll:true})},50)},
 sig(b){const f=cur(),w=b.dataset.v;const title=w==='mec'?'Mecánico que entrega':'Operador que recibe';openSig(title,f.firmas[w].nombre,data=>{const old=f.firmas[w].img;const id=putFoto(data,f.id,'firma');upd(f,{firmas:{[w]:{img:id}}});if(old)remove('fotos/'+old);ev(f,'registró la firma del '+(w==='mec'?'mecánico':'operador'));render();toast('Firma guardada')})},
 'sig-clear'(){ui.sig&&ui.sig.clear()},
 'sig-cancel'(){closeSig()},
 'sig-save'(){const d=ui.sig&&ui.sig.get();if(!d){toast('Firma antes de guardar.','bad');return}const done=ui.sig.done;closeSig();buzz([10,30,10]);done(d)},
 close(b){const f=cur();const errs=[];const iss=issues(f);if(iss.length)errs.push([iss[0][0]+' Complétalo antes de cerrar.',null]);if(!f.salida)errs.push(['Elige el estado de salida del equipo.','.outs']);if(f.salida&&f.salida!=='conforme'&&!String(f.motivo||'').trim())errs.push(['Escribe el motivo del estado de salida.','[data-f="motivo"]']);
  ['mec','op'].forEach(w=>{const s=f.firmas[w];const t=w==='mec'?'del mecánico':'del operador';if(!String(s.nombre||'').trim())errs.push(['Falta el nombre '+t+'.',`[data-f="firmas.${w}.nombre"]`]);if(!rutOk(s.rut))errs.push([s.rut?'El RUT '+t+' no es válido.':'Falta el RUT '+t+'.',`[data-f="firmas.${w}.rut"]`]);if(!s.img)errs.push(['Falta la firma '+t+'.','#sb-'+w])});
  if(errs.length){toast(errs[0][0],'bad');buzz([20,40,20]);const el=errs[0][1]&&$(errs[0][1]);if(el){el.scrollIntoView({block:'center',behavior:'smooth'});shake(el)}return}
  b.classList.add('loading');b.textContent='Cerrando ficha';
  setTimeout(()=>{const now=Date.now();
   if(f.salida==='no_conforme'){const old=[f.firmas.mec.img,f.firmas.op.img];upd(f,{reingresos:(f.reingresos||[]).concat({t:now,motivo:f.motivo}),step:3,salida:'',motivo:'',firmas:{mec:{img:''},op:{img:''}}});ev(f,'cerró como NO conforme. Vuelve a reparación');old.forEach(x=>x&&remove('fotos/'+x));ui.step=3;ui.dir=-1;render();scrollTo({top:0});toast('Vuelve a reparación con el motivo registrado.');return}
   upd(f,{estado:'cerrada',cierre:now,step:4,espera:false,firmas:{mec:{rut:rutFmt(f.firmas.mec.rut)},op:{rut:rutFmt(f.firmas.op.rut)}}},{now:true});ev(f,'cerró la ficha: '+OUTS[f.salida][0].toLowerCase());
   const ex={estado:f.salida==='fuera'?'fuera':f.salida==='pendiente'?'pendiente':'operativo'};if(f.salida==='fuera'){ex.fueraT=now;ex.fueraMotivo=f.motivo}if(f.mant&&num(f.equipo.horometro)!=null)ex.ultimaMant=num(f.equipo.horometro);upsertEq(f,ex);
   ui.justClosed=f.id;buzz([15,60,25]);go('ver',1);toast(f.salida==='fuera'?'Equipo bloqueado como fuera de servicio. El supervisor lo ve en su panel.':'Ficha cerrada')},800)},
 anexo(){const f=cur();const m=$('#ax-m').value.trim(),t=$('#ax-t').value.trim();if(!m||!t){toast('Escribe el motivo y el detalle del anexo.','bad');return}upd(f,{anexos:(f.anexos||[]).concat({t:Date.now(),who:me().nombre,motivo:m,texto:t})});ev(f,'agregó un anexo: '+m);render();toast('Anexo agregado')},
 preview(){go('preview',1)},
 pdf(b){const f=cur();busy(b,async()=>{const c=await paperCanvas(paperHTML(f));await saveFile(`ficha-${normPlate(eqLabel(f.equipo))}-${dayKey(f.cierre||f.creado)}.pdf`,await canvasToPdf(c))})},
 png(b){const f=cur();busy(b,async()=>{const c=await paperCanvas(paperHTML(f));const blob=await new Promise(r=>c.toBlob(r,'image/png'));await saveFile(`ficha-${normPlate(eqLabel(f.equipo))}-${dayKey(f.cierre||f.creado)}.png`,blob)})},
 'qr-png'(b){const e=St.equipos[ui.ek];busy(b,async()=>{const d=await qrData('CHECKLIS:'+e.key,10);const im=await new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=d});const c=document.createElement('canvas');c.width=600;c.height=760;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,600,760);x.fillStyle='#002a4a';x.fillRect(0,0,600,100);x.fillStyle='#ee8600';x.fillRect(0,100,600,6);const lg=await new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=LOGO.inv});x.drawImage(lg,20,12,236,77);x.fillStyle='#fff';x.font='700 30px Barlow, sans-serif';x.textAlign='right';x.fillText('CHECK-LIS',575,62);x.textAlign='left';x.imageSmoothingEnabled=false;x.drawImage(im,75,115,450,450);x.fillStyle='#141a26';x.strokeStyle='#141a26';x.lineWidth=5;x.strokeRect(130,595,340,84);x.font='700 46px "JetBrains Mono", monospace';x.textAlign='center';x.fillText(eqLabel(e),300,652);x.font='500 24px Barlow, sans-serif';x.fillText((e.equipo+' '+e.marca).slice(0,40),300,722);const blob=await new Promise(r=>c.toBlob(r,'image/png'));await saveFile('qr-'+e.key+'.png',blob)})},
 'blank-pdf'(b){const e=St.equipos[ui.ek];busy(b,async()=>{const f=newFicha({equipo:e.equipo,marca:e.marca,modelo:e.modelo,patente:e.patente,interno:e.interno,empresa:e.empresa});f.usuario.turno='';const qr=await qrData('CHECKLIS:'+e.key,4);const c=await paperCanvas(paperHTML(f,{blank:true,qr}));await saveFile('ficha-en-blanco-'+e.key+'.pdf',await canvasToPdf(c))})},
 'turno-pdf'(b){const d=dayKey(Date.now());busy(b,async()=>{const c=await paperCanvas(turnoPaper(d));await saveFile('entrega-turno-'+d+'.pdf',await canvasToPdf(c))})},
 xlsx(b){const d=dayKey(Date.now());busy(b,()=>xlsxOf(dayFichas(d),'turno-'+d+'.xlsx'))},
 'xlsx-all'(b){busy(b,()=>xlsxOf(Object.values(St.fichas),'fichas-taller-'+dayKey(Date.now())+'.xlsx'))},
 entregar(){const today=dayKey(Date.now());const list=dayFichas(today);const m=me();openSig('Supervisor que entrega el turno',m.nombre,data=>{const fid=putFoto(data,'turno-'+today,'firma');const e={fecha:today,firmado:true,auto:false,t:Date.now(),sup:{uid:myId(),nombre:m.nombre},firma:fid,nota:ui.tnota||'',resumen:resumen(list),fichas:list.map(f=>f.id),turno:St.cfg.turnoActivo};St.entregas[today]=e;write('entregas/'+today,e,{set:true,now:true});ui.tnota='';render();toast('Turno entregado y firmado')})},
 seed(){seed();render();toast('Datos de ejemplo cargados')},
 'ask-wipe'(){ui.confirm='wipe';render()},cancel(){ui.confirm=null;render()},
 wipe(){['fichas','equipos','entregas'].forEach(c=>Object.keys(St[c]).forEach(id=>{if(St[c][id].ejemplo){delete St[c][id];remove(c+'/'+id)}}));Object.keys(St.fotos).forEach(id=>{if(St.fotos[id].ejemplo)remove('fotos/'+id)});ui.confirm=null;if(St.mode==='local')saveLocal();render();toast('Datos de ejemplo borrados')},
 dict(b){if(!DICT)return;const t=document.getElementById(b.dataset.t);if(!t)return;if(ui.dict){const d=ui.dict;DICT.stop().catch(()=>{});d.b.classList.remove('rec');ui.dict=null;return}let p;try{p=DICT.start()}catch(e){return}ui.dict={t,b};b.classList.add('rec');Promise.resolve(p).catch(e=>{b.classList.remove('rec');ui.dict=null;toast(e&&e.code==='not_granted'?'El dictado no está permitido en este navegador.':'No se pudo iniciar el dictado.','bad')})}
};
async function xlsxOf(list,name){await load('xlsx');const rows=list.map(f=>{const fl=faults(f);return {Ingreso:fecha(f.creado)+' '+hhmm(f.creado),Salida:f.cierre?fecha(f.cierre)+' '+hhmm(f.cierre):'',Equipo:f.equipo.equipo,Marca:f.equipo.marca,Modelo:f.equipo.modelo,Patente:plateFmt(f.equipo.patente),'N° interno':f.equipo.interno,Horómetro:num(f.equipo.horometro),Empresa:f.equipo.empresa,Usuario:f.usuario.nombre,'Área usuario':f.usuario.area,Mecánico:f.mecanico.nombre,Turno:f.mecanico.turno,Estado:estado(f)[0],Motivo:f.motivo||'',Fallas:fl.length,'Detalle fallas':fl.map(x=>x.n+': '+(x.m.nota||'')).join(' | '),'Trabajo realizado':f.trabajo,Repuestos:(f.repuestos||[]).map(r=>r.d+' ('+r.c+')').join(', '),Recibe:f.firmas.op.nombre,'RUT recibe':f.firmas.op.rut}});
 const wb=XLSX.utils.book_new();const ws=XLSX.utils.json_to_sheet(rows.length?rows:[{Mensaje:'Sin fichas'}]);ws['!cols']=Object.keys(rows[0]||{a:1}).map(()=>({wch:18}));XLSX.utils.book_append_sheet(wb,ws,'Fichas');
 const det=[];list.forEach(f=>allKeys(f).forEach(k=>{const m=mk(f,k)||{};det.push({Ficha:eqLabel(f.equipo)+' '+fecha(f.creado),Sección:secOf(k),Ítem:nameOf(f,k),Estado:m.v==='NA'?'N/A':m.v||'',Detalle:m.nota||''})}));XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(det.length?det:[{Mensaje:'Sin datos'}]),'Chequeo');
 const buf=XLSX.write(wb,{type:'array',bookType:'xlsx'});await saveFile(name,new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}))}
function updRings(){const f=cur();$$('.sec').forEach(sec=>{const keys=$$('.it',sec).map(x=>x.dataset.k);const c=secCount(f,keys);const r=$('.ring',sec);if(!r)return;const C=2*Math.PI*13;r.classList.toggle('bad',!!c[1]);$('.fg',r).style.strokeDashoffset=keys.length?C*(1-c[0]/keys.length):C;$('span',r).textContent=c[0]+'/'+keys.length})}
function rerenderItem(it){const f=cur(),k=it.dataset.k;const p=k.split(':');const s=p[0]==='chk'&&SYS.find(x=>x.id===p[1]);const tmp=document.createElement('div');tmp.innerHTML=itemRow(f,k,nameOf(f,k),!!(s&&s.edit));const n=tmp.firstElementChild;it.replaceWith(n);hydrate(n)}

/* ============ Eventos ============ */
document.addEventListener('click',e=>{const a=e.target.closest('[data-act]');if(!a||a.disabled)return;const fn=ACT[a.dataset.act];if(fn){e.preventDefault();fn(a,e)}});
document.addEventListener('pointerdown',e=>{const b=e.target.closest('.btn,.out,.eqc');if(!b||b.closest('.chips,.tw'))return;if(!b||b.disabled)return;const r=b.getBoundingClientRect(),s=Math.max(r.width,r.height)*2;const sp=document.createElement('span');sp.className='ripple';sp.style.cssText=`width:${s}px;height:${s}px;left:${e.clientX-r.left-s/2}px;top:${e.clientY-r.top-s/2}px`;if(getComputedStyle(b).position==='static')b.style.position='relative';b.style.overflow='hidden';b.appendChild(sp);setTimeout(()=>sp.remove(),600)});
const typeT={};
document.addEventListener('input',e=>{const t=e.target;const f=ui.fid&&St.fichas[ui.fid];
 if(t.dataset.bind&&f&&f.estado!=='cerrada'){const path=t.dataset.bind;const v=t.value;
  deepMerge(f,pathObj(path,v));clearTimeout(typeT[path]);typeT[path]=setTimeout(()=>upd(f,pathObj(path,getP(f,path))),400);
  const fl=t.closest('.fld');fl&&fl.classList.remove('err');
  if(path==='equipo.patente'||path==='equipo.interno'||path==='equipo.horometro'){const h=$('#h-i-equipo-patente');h&&(h.innerHTML=plateHint(f));const hh=$('#h-i-equipo-horometro');hh&&(hh.innerHTML=horoHint(f))}
  if(path.endsWith('.rut')){const h=$('#h-i-'+path.replace(/\./g,'-'));h&&(h.innerHTML=v?(rutOk(v)?'<span class="ok">RUT válido</span>':'<span class="bad">RUT no válido</span>'):'')}
  if(path==='equipo.equipo'){const tt=$('.ab .t');tt&&(tt.textContent=v||'Nuevo ingreso')}}
 if(t.dataset.note!==undefined&&f){const k=t.closest('.it').dataset.k;f.marks[k]=Object.assign({},mk(f,k)||{},{nota:t.value});const fa=t.closest('.fail');fa&&fa.classList.remove('err');clearTimeout(typeT[k]);typeT[k]=setTimeout(()=>upd(f,{marks:{[k]:{nota:f.marks[k].nota}}}),400)}
 if(t.dataset.rep&&f){const i=+t.closest('[data-i]').dataset.i;f.repuestos[i][t.dataset.rep]=t.value;clearTimeout(typeT.rep);typeT.rep=setTimeout(()=>upd(f,{repuestos:f.repuestos}),500)}
 if(t.dataset.tnota!==undefined)ui.tnota=t.value;
 if(t.dataset.q!==undefined){ui.q=t.value;const pos=t.selectionStart;render();const n=document.getElementById(t.id);if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(_){}}}
 if(t.dataset.eqq!==undefined){ui.eqq=t.value;const pos=t.selectionStart;render();const n=$('#eq-q');if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(_){}}}
});
document.addEventListener('change',async e=>{const t=e.target;const f=ui.fid&&St.fichas[ui.fid];
 if(t.dataset.chk&&f){upd(f,{[t.dataset.chk]:t.checked});if(t.dataset.chk==='espera')ev(f,t.checked?'marcó esperando repuesto':'quitó esperando repuesto');render();return}
 if(t.dataset.bind&&t.tagName==='SELECT'&&f){upd(f,pathObj(t.dataset.bind,t.value));return}
 if(t.dataset.bind==='equipo.patente'&&f&&t.value){const p=normPlate(t.value);t.value=p;upd(f,{equipo:{patente:p}});const eq=St.equipos[p];if(eq&&!f.equipo.marca){upd(f,{equipo:{equipo:f.equipo.equipo||eq.equipo,marca:eq.marca,modelo:eq.modelo,interno:f.equipo.interno||eq.interno,empresa:f.equipo.empresa||eq.empresa}});toast('Equipo conocido: datos cargados.');render()}return}
 if(t.dataset.bind==='equipo.interno'&&f&&t.value&&!f.equipo.marca){const eq=St.equipos['INT-'+normPlate(t.value)]||Object.values(St.equipos).find(x=>normPlate(x.interno)===normPlate(t.value));if(eq){upd(f,{equipo:{equipo:f.equipo.equipo||eq.equipo,marca:eq.marca,modelo:eq.modelo,patente:f.equipo.patente||eq.patente,empresa:f.equipo.empresa||eq.empresa}});render();toast('Equipo conocido: datos cargados.')}return}
 if(t.dataset.bind&&t.dataset.bind.endsWith('.rut')&&f&&rutOk(t.value)){const v=rutFmt(t.value);t.value=v;upd(f,pathObj(t.dataset.bind,v));return}
 if(t.dataset.photo!==undefined&&f){const it=t.closest('.it');const k=it.dataset.k;const lab=t.closest('.addph');const file=t.files&&t.files[0];if(!file)return;lab.classList.add('busy');$('span',lab).textContent='Subiendo';
  try{const d=await compress(file,900,.6);const id=putFoto(d,f.id,'falla');const m=mk(f,k)||{};upd(f,{marks:{[k]:Object.assign({},m,{fotos:(m.fotos||[]).concat(id).slice(-3)})}});const live=$(`.it[data-k="${k}"]`);if(live)rerenderItem(live);toast('Foto agregada')}
  catch(err){lab.classList.remove('busy');$('span',lab).textContent='+ Foto';t.value='';toast('No se pudo leer la foto. Prueba con una foto JPG o una captura de pantalla.','bad')}return}
 if(t.dataset.papel!==undefined&&f){const file=t.files&&t.files[0];if(!file)return;try{const d=await compress(file,1400,.65);const id=putFoto(d,f.id,'papel');upd(f,{papel:id});ev(f,'adjuntó la foto de la ficha en papel');render();toast('Foto de la hoja agregada')}catch(err){t.value='';toast('No se pudo leer la foto. Prueba con una foto JPG.','bad')}return}
 if(t.dataset.scan!==undefined){const file=t.files&&t.files[0];t.value='';if(!file)return;toast('Leyendo código');try{const txt=await decodeQR(file);if(!txt){toast('No se encontró un código QR en la foto. Acércate y evita reflejos.','bad');return}handleCode(txt)}catch(err){toast('No se pudo leer la foto. Intenta de nuevo.','bad')}return}
 if(t.dataset.cfg){let v=t.value;if(t.dataset.cfg==='intervaloMant')v=num(v)||250;cfgWrite({[t.dataset.cfg]:v});toast('Ajuste guardado');return}
 if(t.dataset.cfgl){cfgWrite({[t.dataset.cfgl]:t.value.split(',').map(s=>s.trim()).filter(Boolean)});render();toast('Ítems guardados');return}
 if(t.dataset.tpl!==undefined){ui.tplTipo=t.value.trim();render();return}
 if(t.dataset.tplk){const tp=tipoKey(ui.tplTipo||$('#tp-t').value);if(!tp)return;const arr=(((St.cfg.plantillas||{})[tp]||{}).na||[]).slice();const k=t.dataset.tplk;const i=arr.indexOf(k);if(t.checked&&i<0)arr.push(k);if(!t.checked&&i>=0)arr.splice(i,1);cfgWrite({plantillas:{[tp]:{na:arr}}});return}
 if(t.dataset.role){const id=t.dataset.role,v=t.value;const admins=Object.entries(St.cfg.roles||{}).filter(([k,r])=>r==='admin'&&k!==id).length;if(id===St.uid&&v!=='admin'&&!admins){t.value='admin';toast('Debe quedar al menos un administrador. Asigna otro antes de cambiar tu rol.','bad');return}cfgWrite({roles:{[id]:v}});toast(v?'Rol actualizado: '+ROLES[v]:'Acceso quitado');render();return}
 if(t.dataset.eqf){const eq=St.equipos[ui.ek];const v=num(t.value);eq[t.dataset.eqf]=v==null?'':v;write('equipos/'+eq.key,{[t.dataset.eqf]:eq[t.dataset.eqf]});if(St.mode==='local')saveLocal();render();toast('Equipo actualizado')}
});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.dataset&&e.target.dataset.newitem){e.preventDefault();ACT['add-item']({dataset:{v:e.target.dataset.newitem}})}});
function initDict(){if(!DICT)return;try{DICT.onFinal(({text})=>{if(!ui.dict||!text)return;const t=ui.dict.t;t.value=(t.value?t.value.replace(/\s*$/,' '):'')+text;t.dispatchEvent(new Event('input',{bubbles:true}))});DICT.onState(({state})=>{if(state==='idle'&&ui.dict){ui.dict.b.classList.remove('rec');ui.dict=null}})}catch(e){}}

/* ============ Datos de ejemplo ============ */
function fakeSig(k){const c=document.createElement('canvas');c.width=640;c.height=240;const x=c.getContext('2d');x.strokeStyle='#13306e';x.lineWidth=4;x.lineCap='round';x.beginPath();let px=60;x.moveTo(px,150);for(let i=0;i<14;i++){const nx=px+30+((i*k)%11),ny=90+((i*7*k)%80);x.quadraticCurveTo(px+14,ny-30,nx,ny);px=nx}x.stroke();x.beginPath();x.moveTo(70,190);x.lineTo(560,178);x.stroke();return c.toDataURL('image/png')}
function rutFor(b){return rutFmt(b+rutDv(b))}
function seed(){const now=Date.now(),H=36e5;
 const mkF=o=>{const f=newFicha();f.ejemplo=true;Object.assign(f.equipo,o.e);Object.assign(f.usuario,o.u);f.creado=now-o.ago*H;f.act=now-o.ago/3*H;f.step=o.step;f.mecanico=Object.assign({},f.mecanico,o.mec||{});f.firmas.mec.nombre=f.mecanico.nombre;f.firmas.op.nombre=o.u.nombre;f.ev=[{t:f.creado,who:f.mecanico.nombre,txt:'abrió el ingreso'}];f.tplApplied=true;return f};
 const allB=f=>allKeys(f).forEach(k=>{f.marks[k]={v:'B'}});
 const sig=k=>putFoto(fakeSig(k),'ejemplo','firma',{ejemplo:true});
 const a=mkF({e:{equipo:'Camión aljibe',marca:'Mercedes-Benz',modelo:'Atego 1726',patente:'HJKL42',interno:'CA-08',horometro:'8412',empresa:'Contratista Norte'},u:{nombre:'Luis Soto',area:'Operación',turno:'A',solicita:'Pierde aceite por cilindro de pluma'},ago:3.5,step:3});
 a.extra.hidraulico=['Cilindros','Mangueras','Nivel aceite hidráulico'];allB(a);a.marks['inv:4']={v:'M',nota:'Carga vencida 08/2026'};a.marks['chk:hidraulico:0']={v:'M',nota:'Fuga en vástago, sello dañado'};a.trabajo='Se desarma cilindro de pluma y se cambia kit de sellos.';a.repuestos=[{d:'Kit sellos cilindro 63 mm',c:'1'}];a.ev.push({t:now-3*H,who:a.mecanico.nombre,txt:'marcó M en Cilindros'});
 const b=mkF({e:{equipo:'Mini cargador',marca:'Bobcat',modelo:'S570',patente:'',interno:'MC-017',horometro:'3120',empresa:'Contratista Norte'},u:{nombre:'Pedro Vera',area:'Operación',turno:'A',solicita:'Freno de mano no sujeta en pendiente'},ago:1.2,step:3,mec:{nombre:'Rodrigo Díaz',uid:'ejemplo-rd'}});
 b.extra.frenos=['Freno de servicio','Freno de mano'];allB(b);b.marks['inv:0']={v:'NA'};b.marks['chk:frenos:1']={v:'M',nota:'Pastillas gastadas, no sujeta'};b.espera=true;b.esperaDet='Pastilla de freno, llega mañana 09:00';b.ev.push({t:now-.5*H,who:'Rodrigo Díaz',txt:'marcó esperando repuesto'});
 const c=mkF({e:{equipo:'Camioneta',marca:'Toyota',modelo:'Hilux 2.4',patente:'GTRS18',interno:'CM-22',horometro:'4870',empresa:'Flota propia'},u:{nombre:'Ana Rojas',area:'Prevención',turno:'A',solicita:'Mantención 10.000 km'},ago:5,step:4,mec:{nombre:'Carla Rojas',uid:'ejemplo-cr'}});
 allB(c);c.trabajo='Cambio de aceite y filtros.';c.mant=true;c.repuestos=[{d:'Filtro de aceite',c:'1'},{d:'Aceite 15W-40',c:'7 L'}];c.salida='conforme';
 const d=mkF({e:{equipo:'Excavadora',marca:'CAT',modelo:'320',patente:'',interno:'EX-204',horometro:'11250',empresa:'Contratista Sur'},u:{nombre:'Mario Fuentes',area:'Movimiento de tierra',turno:'A',solicita:'Brazo sin fuerza al levantar'},ago:7,step:4});
 d.extra.hidraulico=['Bomba hidráulica','Cilindros','Mangueras'];allB(d);d.marks['chk:hidraulico:0']={v:'M',nota:'Bomba sin presión, ruido metálico'};d.marks['inv:9']={v:'NA'};d.trabajo='Presión de bomba 40% bajo lo nominal. Requiere cambio de bomba.';d.estado='cerrada';d.salida='fuera';d.motivo='Bomba hidráulica sin presión. Se pidió repuesto a bodega central.';d.cierre=now-1*H;d.firmas.mec=Object.assign(d.firmas.mec,{img:sig(3),rut:rutFor('15678234')});d.firmas.op={img:sig(5),nombre:'Mario Fuentes',rut:rutFor('13456789')};d.ev.push({t:now-1*H,who:d.mecanico.nombre,txt:'cerró la ficha: fuera de servicio'});
 const e=mkF({e:{equipo:'Camión tolva',marca:'Volvo',modelo:'FMX 500',patente:'PRZX77',interno:'CT-31',horometro:'15302',empresa:'Contratista Norte'},u:{nombre:'Jorge Muñoz',area:'Operación',turno:'A',solicita:'Baliza no enciende'},ago:6,step:4,mec:{nombre:'Carla Rojas',uid:'ejemplo-cr'}});
 allB(e);e.marks['chk:luces:4']={v:'M',nota:'Baliza quemada'};e.trabajo='Cambio de baliza y fusible.';e.repuestos=[{d:'Baliza LED ámbar',c:'1'}];e.estado='cerrada';e.salida='conforme';e.cierre=now-2.5*H;e.firmas.mec=Object.assign(e.firmas.mec,{img:sig(2),rut:rutFor('16234567')});e.firmas.op={img:sig(4),nombre:'Jorge Muñoz',rut:rutFor('11222333')};e.ev.push({t:now-2.5*H,who:'Carla Rojas',txt:'cerró la ficha: conforme'});
 const prev=mkF({e:{equipo:'Camión aljibe',marca:'Mercedes-Benz',modelo:'Atego 1726',patente:'HJKL42',interno:'CA-08',horometro:'8390',empresa:'Contratista Norte'},u:{nombre:'Luis Soto',area:'Operación',turno:'A',solicita:'Revisión de luces'},ago:26,step:4});allB(prev);prev.marks['chk:luces:1']={v:'M',nota:'Intermitente trasero izquierdo no funciona'};prev.estado='cerrada';prev.salida='conforme';prev.cierre=now-24*H;prev.trabajo='Cambio de ampolleta.';prev.firmas.mec.rut=rutFor('15678234');prev.firmas.op.rut=rutFor('12345678');
 [prev,a,b,c,d,e].forEach(f=>{St.fichas[f.id]=f;write('fichas/'+f.id,f,{set:true,now:true})});
 [prev,a,b,c,d,e].forEach(f=>{const k=eqKey(f.equipo);const eq={key:k,equipo:f.equipo.equipo,marca:f.equipo.marca,modelo:f.equipo.modelo,patente:f.equipo.patente,interno:f.equipo.interno,empresa:f.equipo.empresa,horometro:num(f.equipo.horometro),horoT:f.creado,intervalo:'',ultimaMant:f===c?4870:f===e?15000:num(f.equipo.horometro)-300,estado:f===d?'fuera':f.estado==='cerrada'?'operativo':'taller',ultimaFicha:f.id,act:f.act,ejemplo:true};if(f===d){eq.fueraT=d.cierre;eq.fueraMotivo=d.motivo}St.equipos[k]=eq});
 Object.keys(St.equipos).forEach(k=>{if(St.equipos[k].ejemplo)write('equipos/'+k,St.equipos[k],{set:true,now:true})});
 const y=dayKey(now-24*H);const en={fecha:y,firmado:false,auto:true,t:now-12*H,resumen:resumen([prev]),fichas:[prev.id],nota:'Generada automáticamente: el turno no se entregó.',ejemplo:true};St.entregas[y]=en;write('entregas/'+y,en,{set:true,now:true});
 if(St.mode==='local')saveLocal()}

/* ============ Acceso (Firebase) ============ */
const AUTH_MSG={'auth/invalid-email':'El correo no es válido.','auth/user-not-found':'No hay una cuenta con ese correo. Usa Crear cuenta.','auth/wrong-password':'La contraseña no es correcta.','auth/invalid-credential':'Correo o contraseña incorrectos.','auth/invalid-login-credentials':'Correo o contraseña incorrectos.','auth/email-already-in-use':'Ese correo ya tiene cuenta. Usa Entrar.','auth/weak-password':'La contraseña debe tener al menos 6 caracteres.','auth/network-request-failed':'Sin conexión. Para entrar la primera vez necesitas internet.','auth/too-many-requests':'Demasiados intentos. Espera unos minutos.','auth/popup-closed-by-user':'Se cerró la ventana de Google antes de terminar.','auth/unauthorized-domain':'Este dominio no está autorizado en Firebase (Authentication → Configuración → Dominios autorizados).','auth/operation-not-allowed':'Este método de acceso no está activado en Firebase.'};
function authErr(e){if(!e||!e.code)return;if(e.code==='auth/popup-closed-by-user'||e.code==='auth/cancelled-popup-request')return;toast(AUTH_MSG[e.code]||'No se pudo entrar. Intenta de nuevo.','bad')}
function vAuth(){return `<div class="login"><div class="tape"></div><div class="brand"><img src="${LOGO.full}" alt="Mantenimiento Industrial"><span>Check-Lis Taller</span></div><p class="muted">Ingreso y chequeo de equipos en taller. Entra con tu cuenta para registrar fichas.</p>
<div class="card stack"><button class="btn block gbtn" data-act="google"><svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg> Entrar con Google</button>
<div class="or"><span>o con tu correo</span></div>
<div class="fld"><label class="lbl" for="au-e">Correo</label><input id="au-e" type="email" autocomplete="email" inputmode="email" placeholder="nombre@empresa.cl"></div>
<div class="fld"><label class="lbl" for="au-p">Contraseña</label><input id="au-p" type="password" autocomplete="current-password" placeholder="Mínimo 6 caracteres"></div>
<div class="row"><button class="btn" style="flex:1" data-act="email-in">Entrar</button><button class="btn ghost" style="flex:1" data-act="email-up">Crear cuenta</button></div>
<button class="link" data-act="reset" style="align-self:center">Olvidé mi contraseña</button></div>
<p class="small muted">Después de entrar por primera vez, el administrador del taller debe aprobar tu acceso.</p></div>`}
function vSetup(){return `<div class="login"><div class="tape"></div><div class="brand"><img src="${LOGO.full}" alt="Mantenimiento Industrial"><span>Configurar el taller</span></div>
<div class="card stack"><h2>Eres la primera persona en entrar</h2><p class="muted">Al crear el taller quedas como <b>administrador</b>: apruebas a cada persona que se registre y le asignas su rol (mecánico, supervisor u operador).</p><p class="small muted">Cuenta: ${esc(St.email)}</p>
<button class="btn block" data-act="setup-create">Crear el taller y ser administrador</button><button class="link" data-act="logout" style="align-self:center">Usar otra cuenta</button></div></div>`}
function vEspera(){const p=St.personas[St.uid]||{};return `<div class="login"><div class="tape"></div><div class="brand"><img src="${LOGO.full}" alt="Mantenimiento Industrial"><span>Check-Lis Taller</span></div>
<div class="card stack"><h2>Tu acceso está pendiente</h2><p class="muted">Hola, ${esc((p.nombre||'').split(' ')[0])}. El administrador del taller debe aprobar tu cuenta y asignarte un rol. Avísale para que te habilite: esta pantalla se actualiza sola.</p><p class="small muted">Cuenta: ${esc(St.email)}</p><span class="live"><i></i>Esperando aprobación</span>
<button class="link" data-act="logout" style="align-self:center">Cerrar sesión</button></div></div>`}
Object.assign(ACT,{
 google(){const pr=new firebase.auth.GoogleAuthProvider();pr.setCustomParameters({prompt:'select_account'});const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone;(standalone?AUTH.signInWithRedirect(pr):AUTH.signInWithPopup(pr)).catch(e=>{if(e&&['auth/popup-blocked','auth/operation-not-supported-in-this-environment'].includes(e.code))return AUTH.signInWithRedirect(pr).catch(authErr);authErr(e)})},
 'email-in'(b){const e=$('#au-e').value.trim(),pw=$('#au-p').value;if(!e||!pw){toast('Escribe tu correo y contraseña.','bad');return}b.classList.add('loading');AUTH.signInWithEmailAndPassword(e,pw).catch(authErr).finally(()=>b.classList.remove('loading'))},
 'email-up'(b){const e=$('#au-e').value.trim(),pw=$('#au-p').value;if(!e||pw.length<6){toast('Escribe tu correo y una contraseña de al menos 6 caracteres.','bad');return}b.classList.add('loading');AUTH.createUserWithEmailAndPassword(e,pw).catch(authErr).finally(()=>b.classList.remove('loading'))},
 reset(){const e=$('#au-e').value.trim();if(!e){toast('Escribe tu correo arriba y vuelve a tocar Olvidé mi contraseña.','bad');return}AUTH.sendPasswordResetEmail(e).then(()=>toast('Te enviamos un correo para cambiar la contraseña.')).catch(authErr)},
 'setup-create'(b){b.classList.add('loading');const c=Object.assign(clone(DEF_CFG),{roles:{[St.uid]:'admin'},creado:Date.now(),creadoPor:St.email||''});FS.doc(CFG_PATH).set(c).then(()=>toast('Taller creado. Ahora completa tus datos.')).catch(e=>{b.classList.remove('loading');toast(e&&e.code==='permission-denied'?'El taller ya fue creado por otra persona. Pídele acceso al administrador.':'No se pudo crear el taller. Revisa la conexión.','bad')})},
 'setrole'(){},
 cam(){openCam()},
 'cam-close'(){closeCam()},
 install(){if(!deferredInstall){toast('En iPhone: toca Compartir y luego "Agregar a inicio".');return}deferredInstall.prompt();deferredInstall.userChoice.finally(()=>{deferredInstall=null;render()})},
 'ask-clean'(){ui.confirm='clean';render()},
 async clean(b){const months=+($('#cl-m')||{value:3}).value||3;const cut=Date.now()-months*30*864e5;b.classList.add('loading');
  try{let list;if(St.mode==='fb'){const r=await DB.collection('fichas',[['cierre','<',cut]]).get();list=r.docs.map(d=>Object.assign({id:d.id},d.data()))}else list=Object.values(St.fichas).filter(f=>f.cierre&&f.cierre<cut);
   list=list.filter(f=>f.estado==='cerrada');if(!list.length){toast('No hay fichas cerradas de más de '+months+' meses.');ui.confirm=null;render();return}
   await xlsxOf(list,'respaldo-fichas-antes-de-'+dayKey(cut)+'.xlsx');
   for(const f of list){const ids=[f.papel,f.firmas&&f.firmas.mec&&f.firmas.mec.img,f.firmas&&f.firmas.op&&f.firmas.op.img].concat(...Object.values(f.marks||{}).map(m=>(m&&m.fotos)||[])).filter(Boolean);ids.forEach(id=>remove('fotos/'+id));delete St.fichas[f.id];remove('fichas/'+f.id)}
   Object.keys(St.entregas).forEach(d=>{if(d<dayKey(cut)){delete St.entregas[d];remove('entregas/'+d)}});
   ui.confirm=null;render();toast(list.length+' fichas antiguas respaldadas en Excel y borradas.')}
  catch(e){toast('No se pudo completar la limpieza. Revisa la conexión.','bad')}finally{b.classList.remove('loading')}},
 async backup(b){busy(b,()=>xlsxOf(Object.values(St.fichas),'respaldo-completo-'+dayKey(Date.now())+'.xlsx'))}
});

/* ============ Dictado por voz (navegador) ============ */
function webDict(){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return null;let rec=null,fin=null,st=null;
 return {start(){rec=new SR();rec.lang='es-CL';rec.interimResults=false;rec.continuous=true;rec.onresult=e=>{for(let i=e.resultIndex;i<e.results.length;i++)if(e.results[i].isFinal&&fin)fin({text:e.results[i][0].transcript.trim()})};rec.onend=()=>st&&st({state:'idle'});rec.onerror=()=>st&&st({state:'idle'});try{rec.start()}catch(e){return Promise.reject({code:'unavailable'})}return Promise.resolve()},stop(){try{rec&&rec.stop()}catch(e){}return Promise.resolve()},onFinal(f){fin=f},onState(f){st=f}}}

/* ============ App instalable y sin conexión ============ */
let deferredInstall=null;
addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;if(ui.view==='ajustes')render()});
function registerSW(){if('serviceWorker' in navigator&&location.protocol!=='file:'&&!window.NO_SW){navigator.serviceWorker.register('sw.js').catch(()=>{})}}

/* ============ Escáner QR con cámara en vivo ============ */
let camStream=null,camRaf=0;
async function openCam(){if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){toast('Este navegador no permite usar la cámara. Usa Fotografiar código QR.','bad');return}
 try{await load('jsqr')}catch(e){toast('No se pudo cargar el lector. Revisa la conexión.','bad');return}
 const ov=$('#ov');ov.innerHTML=`<div class="camov" role="dialog" aria-label="Escanear código QR"><video playsinline muted autoplay></video><div class="frame"><i></i></div><div class="cam-top"><b>Apunta al código QR del equipo</b><button class="ib" data-act="cam-close" aria-label="Cerrar">✕</button></div></div>`;
 const v=$('.camov video');try{camStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:false});v.srcObject=camStream;await v.play()}catch(e){closeCam();toast('No se pudo abrir la cámara. Revisa el permiso de cámara del navegador.','bad');return}
 const c=document.createElement('canvas'),x=c.getContext('2d',{willReadFrequently:true});
 const tick=()=>{if(!camStream)return;if(v.readyState>=2){const s=Math.min(1,640/Math.max(v.videoWidth,v.videoHeight));c.width=v.videoWidth*s;c.height=v.videoHeight*s;x.drawImage(v,0,0,c.width,c.height);const d=x.getImageData(0,0,c.width,c.height);const r=jsQR(d.data,c.width,c.height,{inversionAttempts:'dontInvert'});if(r&&r.data){buzz([10,40,10]);closeCam();handleCode(r.data);return}}camRaf=requestAnimationFrame(tick)};tick()}
function closeCam(){cancelAnimationFrame(camRaf);if(camStream){camStream.getTracks().forEach(t=>t.stop());camStream=null}$('#ov').innerHTML=''}
function handleCode(txt){const key=String(txt).replace(/^CHECKLIS:/,'');if(St.equipos[key]){ui.ek=key;go('equipo',1);toast('Equipo encontrado')}else{ui.q=key.replace(/^INT-/,'');go('escanear');toast('El código no corresponde a un equipo registrado. Puedes crear el ingreso.','bad')}}

boot();
})();
