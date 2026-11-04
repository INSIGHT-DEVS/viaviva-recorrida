/* ================== LÓGICA ================== */
const $ = s => document.querySelector(s);
const NS = "http://www.w3.org/2000/svg";
const KEY = "viaviva-por-dentro-esquiu";
let state = {quiz:{}, int:[], knew:null};
try{ const s = JSON.parse(localStorage.getItem(KEY)||"null"); if(s) state = Object.assign(state,s); }catch(e){}
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(state)); }catch(e){} }
function el(tag, attrs={}, kids=[]){
  const isSvg = ["svg","g","line","circle","text","rect"].includes(tag);
  const e = isSvg ? document.createElementNS(NS,tag) : document.createElement(tag);
  for(const [k,v] of Object.entries(attrs)){ if(k==="text") e.textContent=v; else e.setAttribute(k,v); }
  kids.forEach(k=>k && e.appendChild(k)); return e;
}

/* Mapa */
const X = 150;
function drawMap(){
  const svg = $("#map"); svg.innerHTML="";
  CALLES.forEach(c=>{
    svg.appendChild(el("line",{x1:X-44,x2:X+20,y1:c.y,y2:c.y,stroke:"var(--line)","stroke-width":2}));
    svg.appendChild(el("text",{x:X-48,y:c.y+4,"text-anchor":"end",text:c.n}));
  });
  svg.appendChild(el("line",{x1:X,x2:X,y1:40,y2:585,stroke:"var(--line)","stroke-width":6}));
  SEG.forEach(s=>{
    const ln = el("line",{x1:X,x2:X,y1:s.y1,y2:s.y2,"stroke-width":12,"stroke-dasharray":s.t==="hipodromo"?"10 6":"none"});
    ln.style.stroke = `var(${TRAMOS[s.t].color})`; svg.appendChild(ln);
  });
  for(let y=46;y<585;y+=14) svg.appendChild(el("line",{x1:X-10,x2:X+10,y1:y,y2:y,stroke:"var(--card)","stroke-width":2}));
  [["chino",160,"Barrio Chino"],["libertador",405,"Libertador"],["hipodromo",528,"Hipódromo"]].forEach(([t,y,n])=>{
    const tx = el("text",{x:22,y:y,"text-anchor":"middle",transform:`rotate(-90 22 ${y})`,text:n.toUpperCase()});
    tx.style.fill=`var(${TRAMOS[t].color})`; tx.style.fontWeight="500"; tx.style.letterSpacing=".12em"; tx.style.fontSize="12px";
    svg.appendChild(tx);
  });
  PUNTOS.forEach(p=>{
    const g = el("g",{class:"pin",tabindex:0,role:"button","aria-label":p.label,"data-id":p.id});
    g.appendChild(el("circle",{class:"hit",cx:X+60,cy:p.y,r:24}));
    g.appendChild(el("line",{x1:X+10,x2:X+22,y1:p.y,y2:p.y,stroke:"var(--ink)","stroke-width":1.5}));
    const ring = el("circle",{class:"ring",cx:X,cy:p.y,r:10}); ring.style.stroke=`var(${TRAMOS[p.t].color})`; g.appendChild(ring);
    g.appendChild(el("text",{class:"pl",x:X+28,y:p.y+5,text:p.label}));
    if(p.sub) g.appendChild(el("text",{x:X+28,y:p.y+21,text:p.sub}));
    g.addEventListener("click",()=>select(p.id,true));
    g.addEventListener("keydown",e=>{ if(e.key==="Enter"||e.key===" "){e.preventDefault();select(p.id,true);} });
    svg.appendChild(g);
  });
}
function select(id,go){
  const p = PUNTOS.find(x=>x.id===id), tr = TRAMOS[p.t];
  document.querySelectorAll(".pin").forEach(g=>g.classList.toggle("active",g.dataset.id===id));
  const panel = $("#panel"); panel.style.setProperty("--tc",`var(${tr.color})`); panel.innerHTML="";
  panel.append(
    el("span",{class:"logo "+tr.logo,role:"img","aria-label":tr.nombre}),
    el("h3",{text:p.titulo}), el("p",{text:p.texto}),
    el("ul",{},p.items.map(i=>el("li",{text:i}))),
    el("p",{class:"note",text:tr.nombre+": de "+tr.calles+"."})
  );
  const back = el("button",{type:"button",class:"tolink",id:"map-back",text:"Volver al mapa ↑"});
  back.addEventListener("click",()=>{ $("#map").scrollIntoView({behavior: matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth", block:"start"}); });
  panel.appendChild(back);
  if(go){
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    panel.classList.remove("flash"); void panel.offsetWidth; panel.classList.add("flash");
    const top = panel.getBoundingClientRect().top;
    if(top < 0 || top > window.innerHeight*0.45) panel.scrollIntoView({behavior:reduce?"auto":"smooth",block:"start"});
    panel.focus({preventScroll:true});
  }
}

/* Antes / después */
function drawBA(){
  const box = $("#ba"); box.innerHTML="";
  const frame = el("div",{class:"ba-frame"});
  const r = el("input",{type:"range",min:0,max:100,value:50,class:"ba-range",id:"ba-0","aria-label":"Comparar el terreno antes y hoy"});
  r.addEventListener("input",()=>frame.style.setProperty("--pos",r.value+"%"));
  frame.append(
    el("img",{src:PAR.antes,alt:"El terreno bajo el viaducto antes de la obra, con pastizal"}),
    el("img",{src:PAR.despues,alt:"El paseo hoy, de noche, con luces y mucha gente",class:"ba-after"}),
    el("div",{class:"ba-handle"}),el("span",{class:"ba-tag l",text:PAR.tagA}),el("span",{class:"ba-tag r",text:PAR.tagD}),r);
  box.appendChild(frame);
}
function drawSteps(){
  const box = $("#steps"); box.innerHTML="";
  STEPS.forEach((st,i)=>{
    const b = el("div",{class:"step-b"},[el("span",{class:"mono",text:"Paso "+(i+1)+" de "+STEPS.length}),el("b",{text:st.t}),el("p",{text:st.p})]);
    if(st.of) b.appendChild(el("span",{class:"chip",text:st.of}));
    const go = el("button",{type:"button",class:"tolink",id:"step-go-"+i,text:"Ver quién lo hizo ↓"});
    go.addEventListener("click",()=>{ const t=document.getElementById("oficios"); if(t) t.scrollIntoView({behavior: matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth", block:"start"}); });
    b.appendChild(go);
    box.appendChild(el("article",{class:"step"+(st.last?" last":"")},[el("img",{src:st.img,alt:st.t,loading:"lazy"}),b]));
  });
}

/* Backstage */
function drawInt(){
  const box = $("#int"); box.innerHTML="";
  INTERESES.forEach(it=>{
    const on = state.int.includes(it.id);
    const b = el("button",{type:"button",id:"int-"+it.id,"aria-pressed":on?"true":"false",text:it.t});
    b.addEventListener("click",()=>{ state.int = on ? state.int.filter(x=>x!==it.id) : state.int.concat(it.id); save(); drawInt(); drawGroups(); });
    box.appendChild(b);
  });
}
function drawGroups(){
  const box = $("#groups"); box.innerHTML="";
  const hits = [];
  GRUPOS.forEach(g=>{
    const grid = el("div",{class:"oficios"});
    g.oficios.forEach(o=>{
      const hit = o.int.some(x=>state.int.includes(x));
      if(hit) hits.push(o.titulo);
      const card = el("article",{class:"of"+(hit?" hit":"")},[
        el("h3",{text:o.titulo}), el("p",{text:o.texto}),
        el("span",{class:"study",text:"Qué se estudia"}),
        el("div",{class:"chips"},o.carreras.map(c=>el("span",{class:"chip",text:c})))
      ]);
      if(hit) card.appendChild(el("span",{class:"fit",text:"Para vos"}));
      grid.appendChild(card);
    });
    box.appendChild(el("div",{class:"group"},[
      el("div",{class:"group-h"},[el("span",{class:"mono",text:"Parte "+g.n}),el("h3",{text:g.titulo})]), grid
    ]));
  });
  const out = $("#match-out"); out.innerHTML="";
  if(state.int.length){
    out.append(el("span",{text:"Podrías trabajar en estas áreas. Las marcamos abajo:"}), el("div",{class:"chips"},hits.map(h=>el("span",{class:"chip",style:"background:var(--green-dark);color:var(--on-brand);border-color:var(--green-dark)",text:h}))));
  }
}

/* ================== CUENTAS, TRIVIA, RANKING, PANEL Y ENCUESTA ================== */
/* Dos modos:
   - Práctica (sin Supabase configurado, por ejemplo en claude.ai): la trivia se corrige en el celular,
     sin ranking, y la encuesta abre el Google Form.
   - En vivo (con config.js de Supabase): cuentas con mail y contraseña, la trivia la corrige el servidor,
     ranking en vivo, encuesta guardada en la base y panel de anfitriona para cuentas administradoras. */
const CFG = window.VIAVIVA_CONFIG || {};
const SB = (CFG.supabaseUrl && CFG.supabaseAnonKey && window.supabase && window.supabase.createClient)
  ? window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, {auth:{persistSession:true, autoRefreshToken:true, detectSessionInUrl:true}})
  : null;
const LIVE = !!SB;

function fmtTime(sec){ sec=Math.max(0,Math.round(sec||0)); const m=Math.floor(sec/60), s2=sec%60; return m+":"+String(s2).padStart(2,"0"); }
function cleanName(v){ return String(v||"").replace(/\s+/g," ").trim(); }
function store(k,v){ try{ if(v===undefined) return JSON.parse(localStorage.getItem(k)||"null"); localStorage.setItem(k,JSON.stringify(v)); }catch(e){ return null; } }
async function rpc(fn, args){
  const {data, error} = await SB.rpc(fn, args||{});
  if(error) throw error;
  return data;
}

/* ---------- Sesión ---------- */
let me = {session:null, estado:null, loading:LIVE, recovery:false};
async function refreshMe(){
  if(!LIVE) return;
  const {data} = await SB.auth.getSession();
  me.session = data ? data.session : null;
  me.estado = null;
  if(me.session){
    try{ const e = await rpc("mi_estado"); if(e && e.ok) me.estado = e; }catch(err){ me.estado = null; }
  }
  me.loading = false;
  syncTriviaFromServer();
  drawAll();
}
function drawAll(){ drawGate(); drawTrivia(); drawRank(); drawSurvey(); drawHost(); }
function myName(){ return me.estado ? cleanName(me.estado.nombre+" "+me.estado.apellido) : ""; }

function errText(e){
  const m = String((e && (e.message||e.error_description||e.code)) || e || "").toLowerCase();
  if(m.includes("invalid login")) return "El mail o la contraseña no son correctos.";
  if(m.includes("already registered") || m.includes("already been registered") || m.includes("user_already_exists")) return "Ya hay una cuenta con ese mail. Tocá “Ingresar”.";
  if(m.includes("password") && (m.includes("at least") || m.includes("short") || m.includes("weak"))) return "La contraseña tiene que tener al menos 6 caracteres.";
  if(m.includes("email") && (m.includes("invalid") || m.includes("valid"))) return "Revisá el mail: parece que está mal escrito.";
  if(m.includes("not confirmed")) return "Falta confirmar tu mail. Revisá tu casilla (y Spam).";
  if(m.includes("rate") || m.includes("too many") || m.includes("429")) return "Hubo muchos intentos seguidos. Esperá un minuto y probá de nuevo.";
  if(m.includes("fetch") || m.includes("network") || m.includes("failed")) return "No hay conexión. Revisá internet y probá de nuevo.";
  return "Algo salió mal. Probá de nuevo.";
}

/* ---------- Caja de cuenta (crear / ingresar / recuperar) ---------- */
let auth = {mode:"signup", err:"", info:"", busy:false, vals:{}};
function authBox(context){
  const box = el("div",{class:"acct"});
  if(me.recovery){
    box.append(el("h3",{text:"Elegí una contraseña nueva"}));
    const p = el("input",{type:"password",id:"acct-newpass",autocomplete:"new-password",minlength:"6"});
    box.append(el("label",{for:"acct-newpass"},[document.createTextNode("Contraseña nueva (mínimo 6 caracteres)"),p]));
    const err = el("p",{class:"err",text:auth.err});
    const b = el("button",{type:"button",class:"btn",id:"acct-save",text:auth.busy?"Guardando…":"Guardar"});
    if(auth.busy) b.disabled=true;
    b.addEventListener("click",async()=>{
      if((p.value||"").length<6){ auth.err="La contraseña tiene que tener al menos 6 caracteres."; drawAll(); return; }
      auth.busy=true; drawAll();
      const {error} = await SB.auth.updateUser({password:p.value});
      auth.busy=false;
      if(error){ auth.err=errText(error); drawAll(); return; }
      me.recovery=false; auth.err=""; auth.info="Listo, ya cambiaste tu contraseña."; refreshMe();
    });
    box.append(err,b);
    return box;
  }
  const tabs = el("div",{class:"acct-tabs",role:"tablist"});
  [["signup","Crear cuenta"],["login","Ingresar"]].forEach(([m,t])=>{
    const b = el("button",{type:"button",role:"tab",id:"acct-tab-"+m+"-"+context,"aria-selected":auth.mode===m?"true":"false",text:t});
    b.addEventListener("click",()=>{ auth.mode=m; auth.err=""; auth.info=""; drawAll(); });
    tabs.appendChild(b);
  });
  if(auth.mode!=="reset") box.append(tabs);
  const why = context==="gate" ? "Creá tu cuenta con tu nombre y apellido, o ingresá si ya la tenés. Con ella jugás la trivia, entrás al ranking y respondés la encuesta."
            : context==="trivia" ? "Para jugar la trivia necesitás una cuenta. Así queda tu puntaje y entrás al ranking."
            : context==="survey" ? "Para responder la encuesta necesitás una cuenta. Si ya la creaste para la trivia, ingresá con la misma."
            : "Ingresá con tu cuenta de administradora.";
  box.append(el("p",{class:"note",style:"font-size:15px",text:why}));
  const f = {};
  const field = (id,label,type,ac,extra={})=>{ const i=el("input",Object.assign({type,id:id+"-"+context,autocomplete:ac},extra)); f[id]=i; box.append(el("label",{for:id+"-"+context},[document.createTextNode(label),i])); return i; };
  if(auth.mode==="signup"){
    const row = el("div",{class:"acct-row"}); box.append(row);
    const n=el("input",{type:"text",id:"acct-nombre-"+context,autocomplete:"given-name",maxlength:"40"}); f.nombre=n;
    const a=el("input",{type:"text",id:"acct-apellido-"+context,autocomplete:"family-name",maxlength:"40"}); f.apellido=a;
    row.append(el("label",{for:n.id},[document.createTextNode("Nombre"),n]), el("label",{for:a.id},[document.createTextNode("Apellido"),a]));
    field("acct-mail","Mail","email","email",{inputmode:"email",maxlength:"120"});
    field("acct-pass","Contraseña (mínimo 6 caracteres)","password","new-password",{minlength:"6"});
    const ck = el("input",{type:"checkbox",id:"acct-ok-"+context}); f.ok=ck;
    box.append(el("label",{class:"acct-check",for:ck.id},[ck, el("span",{text:"Acepto que mi nombre y la inicial de mi apellido aparezcan en el ranking de la trivia."})]));
  } else if(auth.mode==="login"){
    field("acct-mail","Mail","email","email",{inputmode:"email"});
    field("acct-pass","Contraseña","password","current-password");
  } else {
    box.append(el("h3",{text:"Recuperar contraseña"}));
    field("acct-mail","Tu mail","email","email",{inputmode:"email"});
  }
  const err = el("p",{class:"err",text:auth.err});
  const info = auth.info ? el("p",{class:"ok-msg",text:auth.info}) : null;
  const label = auth.mode==="signup" ? "Crear cuenta y seguir" : auth.mode==="login" ? "Ingresar" : "Mandarme el link";
  const b = el("button",{type:"button",class:"btn",id:"acct-go-"+context,text:auth.busy?"Un momento…":label});
  if(auth.busy) b.disabled=true;
  const go = async()=>{
    const mail = cleanName(f["acct-mail"].value).toLowerCase();
    auth.err=""; auth.info="";
    if(auth.mode==="signup"){
      const nombre=cleanName(f.nombre.value), apellido=cleanName(f.apellido.value), pass=f["acct-pass"].value||"";
      if(!nombre || !apellido){ auth.err="Escribí tu nombre y tu apellido."; drawAll(); return; }
      if(!/^\S+@\S+\.\S+$/.test(mail)){ auth.err="Revisá el mail: parece que está mal escrito."; drawAll(); return; }
      if(pass.length<6){ auth.err="La contraseña tiene que tener al menos 6 caracteres."; drawAll(); return; }
      if(!f.ok.checked){ auth.err="Para participar tenés que aceptar que tu nombre aparezca en el ranking."; drawAll(); return; }
      auth.busy=true; drawAll();
      const {data,error} = await SB.auth.signUp({email:mail,password:pass,options:{data:{nombre,apellido}}});
      auth.busy=false;
      if(error){ auth.err=errText(error); drawAll(); return; }
      if(data && data.user && Array.isArray(data.user.identities) && data.user.identities.length===0){ auth.err="Ya hay una cuenta con ese mail. Tocá “Ingresar”."; auth.mode="login"; drawAll(); return; }
      if(!data.session){ auth.info="Te mandamos un mail para confirmar la cuenta. Abrilo y volvé a esta página."; drawAll(); return; }
      auth.vals={}; refreshMe();
    } else if(auth.mode==="login"){
      const pass=f["acct-pass"].value||"";
      if(!mail || !pass){ auth.err="Escribí tu mail y tu contraseña."; drawAll(); return; }
      auth.busy=true; drawAll();
      const {error} = await SB.auth.signInWithPassword({email:mail,password:pass});
      auth.busy=false;
      if(error){ auth.err=errText(error); drawAll(); return; }
      auth.vals={}; refreshMe();
    } else {
      if(!/^\S+@\S+\.\S+$/.test(mail)){ auth.err="Revisá el mail: parece que está mal escrito."; drawAll(); return; }
      auth.busy=true; drawAll();
      const {error} = await SB.auth.resetPasswordForEmail(mail,{redirectTo: location.origin+location.pathname});
      auth.busy=false;
      if(error){ auth.err=errText(error); drawAll(); return; }
      auth.info="Si hay una cuenta con ese mail, te llega un link para elegir una contraseña nueva."; drawAll();
    }
  };
  b.addEventListener("click",go);
  box.querySelectorAll("input:not([type=checkbox])").forEach(i=>i.addEventListener("keydown",e=>{ if(e.key==="Enter") go(); }));
  // conservar lo escrito si la caja se vuelve a dibujar (por ejemplo, al mostrar un error)
  box.querySelectorAll("input").forEach(i=>{
    const k=i.id.replace("-"+context,"");
    if(i.type==="checkbox"){ if(auth.vals[k]) i.checked=true; i.addEventListener("change",()=>{ auth.vals[k]=i.checked; }); }
    else { if(auth.vals[k]!==undefined) i.value=auth.vals[k]; i.addEventListener("input",()=>{ auth.vals[k]=i.value; }); }
  });
  box.append(err); if(info) box.append(info); box.append(b);
  const alt = el("button",{type:"button",class:"linkbtn",id:"acct-alt-"+context,text: auth.mode==="reset" ? "Volver" : auth.mode==="login" ? "Me olvidé la contraseña" : ""});
  if(auth.mode!=="signup"){ alt.addEventListener("click",()=>{ auth.mode = auth.mode==="reset" ? "login" : "reset"; auth.err=""; auth.info=""; drawAll(); }); box.append(alt); }
  box.append(el("p",{class:"note",style:"font-size:13px",text:"Usamos tu nombre solo para la trivia y tu mail solo para que puedas volver a entrar. No compartimos tus datos."}));
  return box;
}
function whoBar(){
  const bar = el("div",{class:"who"});
  bar.append(el("span",{text:"Ingresaste como "+(myName()||"tu cuenta")}));
  const out = el("button",{type:"button",class:"linkbtn",text:"Salir"});
  out.addEventListener("click",async()=>{ await SB.auth.signOut(); tv = blankTv(); tvSave(); refreshMe(); });
  bar.append(out);
  return bar;
}

/* ---------- Trivia ---------- */
const TV_KEY = "viaviva-trivia-esquiu-v3";
function blankTv(){ return {phase:"ready", owner:null, name:"", idx:0, answers:[], t0:0, result:null}; }
let tv = Object.assign(blankTv(), store(TV_KEY)||{});
function tvSave(){ store(TV_KEY, tv); }
let tvBusy=false, tvError="", tvTimer=null;

function syncTriviaFromServer(){
  if(!LIVE) return;
  const uid = me.session ? me.session.user.id : null;
  if(!uid){ if(tv.phase!=="ready"){ tv = blankTv(); tvSave(); } return; }
  if(tv.owner && tv.owner!==uid){ tv = blankTv(); }
  tv.owner = uid;
  const it = me.estado && me.estado.intento;
  if(it && it.estado==="terminado"){
    tv.phase="done"; tv.answers = it.answers||tv.answers;
    tv.result = {score:it.score, seconds:it.seconds, correct:it.correct, position:it.position};
  } else if(it && it.estado==="jugando"){
    if(tv.phase!=="playing" && tv.phase!=="sending"){ tv.phase="playing"; tv.idx = Math.min(tv.idx||0, TRIVIA.length-1); }
    tv.t0 = Date.now() - (it.transcurrido||0)*1000;
    if(tv.idx>=TRIVIA.length) tv.phase="sending";
  } else if(tv.phase!=="ready"){ tv = Object.assign(blankTv(),{owner:uid}); }
  tvSave();
}

function drawTrivia(){
  const box = $("#tv"); if(!box) return; box.innerHTML="";
  clearInterval(tvTimer);
  if(LIVE && me.loading){ box.append(el("p",{text:"Cargando…"})); return; }
  if(LIVE && !me.session){ box.append(authBox("trivia")); return; }
  if(LIVE) box.append(whoBar());

  if(tv.phase==="ready"){
    if(LIVE){
      const open = !me.estado || me.estado.abierta;
      box.append(el("h3",{text: open ? "¿Listo para jugar?" : "La trivia está cerrada"}));
      if(open){
        box.append(el("p",{style:"font-size:17px",text:"Vas a jugar como "+myName()+". En el ranking se ve tu nombre y la inicial de tu apellido."}));
        box.append(el("p",{class:"note",text:"Tenés una sola oportunidad: cuando elegís una respuesta no se puede cambiar, y el tiempo corre desde que tocás Empezar."}));
        const err = el("p",{class:"err",text:tvError});
        const go = el("button",{type:"button",class:"btn",id:"tv-start",text:tvBusy?"Entrando…":"Empezar"});
        if(tvBusy) go.disabled=true;
        go.addEventListener("click",async()=>{
          tvBusy=true; tvError=""; drawTrivia();
          try{
            const r = await rpc("trivia_empezar");
            tvBusy=false;
            if(!r.ok){
              tvError = r.error==="ya_participo" ? "Ya jugaste con esta cuenta." : r.error==="cerrada" ? "La trivia ya cerró." : r.error==="sin_nombre" ? "Tu cuenta no tiene nombre y apellido. Creá una cuenta nueva con tus datos." : "No pudimos empezar. Probá de nuevo.";
              if(r.error==="ya_participo") return refreshMe();
              drawTrivia(); return;
            }
            tv.phase="playing"; tv.idx=0; tv.answers=[]; tv.t0=Date.now()-(r.transcurrido||0)*1000; tvSave(); drawTrivia();
          }catch(e){ tvBusy=false; tvError=errText(e); drawTrivia(); }
        });
        box.append(err, go);
      } else {
        box.append(el("p",{text:"Mirá el ranking para ver quién ganó."}));
      }
    } else if(!TRIVIA_KEY){
      box.append(el("h3",{text:"La trivia todavía no está conectada"}), el("p",{class:"note",text:"Falta completar config.js con los datos de Supabase."}));
    } else {
      box.append(el("h3",{text:"Probá la trivia"}));
      const lab = el("label",{for:"tv-name"},[document.createTextNode("Tu nombre")]);
      const inp = el("input",{type:"text",id:"tv-name",autocomplete:"given-name",maxlength:"60",placeholder:"Ej: Sofía"});
      inp.value = tv.name||""; lab.appendChild(inp);
      const err = el("p",{class:"err",id:"tv-err",text:tvError});
      const go = el("button",{type:"button",class:"btn",id:"tv-start",text:"Empezar"});
      const start = ()=>{ const n=cleanName(inp.value); if(!n){ tvError="Escribí tu nombre."; drawTrivia(); return; } tv.name=n; tvError=""; tv.t0=Date.now(); tv.idx=0; tv.answers=[]; tv.phase="playing"; tvSave(); drawTrivia(); };
      go.addEventListener("click",start); inp.addEventListener("keydown",e=>{ if(e.key==="Enter") start(); });
      box.append(lab, err, go, el("p",{class:"note",text:"Modo práctica: tus respuestas no se guardan."}));
    }
    return;
  }
  if(tv.phase==="playing"){
    const i = tv.idx, q = TRIVIA[i];
    const time = el("span",{id:"tv-time",text:fmtTime((Date.now()-tv.t0)/1000)});
    box.append(
      el("div",{class:"tv-top"},[el("span",{text:"Pregunta "+(i+1)+" de "+TRIVIA.length}), time]),
      el("div",{class:"tv-bar"},[el("i",{style:"width:"+(i/TRIVIA.length*100)+"%"})]),
      el("p",{class:"tv-q",text:q.q})
    );
    const opts = el("div",{class:"tv-opts"});
    q.o.forEach((o,j)=>{
      const b = el("button",{type:"button",id:`tv-${i}-${j}`,text:o});
      b.addEventListener("click",()=>{
        opts.querySelectorAll("button").forEach(x=>x.disabled=true); b.classList.add("picked");
        tv.answers[i]=j; tv.idx=i+1; if(tv.idx>=TRIVIA.length) tv.phase="sending"; tvSave();
        setTimeout(()=>{ if(tv.phase==="sending") finish(); else drawTrivia(); }, 350);
      });
      opts.appendChild(b);
    });
    box.appendChild(opts);
    tvTimer = setInterval(()=>{ const t=$("#tv-time"); if(t) t.textContent=fmtTime((Date.now()-tv.t0)/1000); },1000);
    return;
  }
  if(tv.phase==="sending"){
    box.append(el("h3",{text:"Enviando tus respuestas…"}));
    if(tvError){
      box.append(el("p",{class:"err",text:tvError}));
      const r = el("button",{type:"button",class:"btn",id:"tv-retry",text:"Reintentar"});
      r.addEventListener("click",finish); box.append(r);
    }
    return;
  }
  if(tv.phase==="done" && tv.result){
    const R = tv.result;
    box.append(el("span",{class:"mono note",text: LIVE ? myName() : tv.name}));
    box.append(el("div",{class:"res-score"},[el("b",{text:R.score+"/"+TRIVIA.length}), el("span",{text:"en "+fmtTime(R.seconds)})]));
    let msg = R.score===TRIVIA.length ? "Perfecto. Sabés de VIAVIVA más que muchos porteños." : R.score>=7 ? "Muy bien. Prestaste atención." : "Nada mal. Ahora ya sabés un poco más de VIAVIVA.";
    if(R.position) msg = "Vas "+R.position+"° en el ranking. "+msg;
    box.append(el("p",{style:"font-size:18px",text:msg}));
    const ul = el("ul",{class:"review"});
    TRIVIA.forEach((q,i)=>{
      const ok = R.correct && R.correct[i]===tv.answers[i];
      const li = el("li",{},[el("span",{class:"mk "+(ok?"ok":"no"),text:ok?"✓":"✗"})]);
      const d = el("div",{},[el("span",{text:q.q})]);
      d.appendChild(el("small",{text:(ok?"":"Tu respuesta: "+(q.o[tv.answers[i]]||"sin responder")+". ")+q.fb}));
      li.appendChild(d); ul.appendChild(li);
    });
    box.append(ul);
    if(!LIVE){
      const again = el("button",{type:"button",class:"btn ghost",id:"tv-again",text:"Jugar de nuevo"});
      again.addEventListener("click",()=>{ tv=Object.assign(blankTv(),{name:tv.name}); tvSave(); drawTrivia(); });
      box.append(again);
    }
  }
}
async function finish(){
  const secs = (Date.now()-tv.t0)/1000;
  if(!LIVE){
    const score = TRIVIA_KEY.filter((k,i)=>tv.answers[i]===k).length;
    tv.result = {score, seconds:secs, correct:TRIVIA_KEY.slice(), position:null};
    tv.phase="done"; tvSave(); drawTrivia(); return;
  }
  tv.phase="sending"; tvError=""; tvSave(); drawTrivia();
  try{
    const answers = TRIVIA.map((q,i)=> Number.isInteger(tv.answers[i]) ? tv.answers[i] : -1);
    const r = await rpc("trivia_enviar",{respuestas:answers});
    if(!r || !r.ok){ tvError = r && r.error==="cerrada" ? "La trivia ya cerró y no se pudo sumar tu resultado." : "No pudimos guardar tus respuestas. Probá de nuevo."; drawTrivia(); return; }
    tv.result = {score:r.score, seconds:r.seconds, correct:r.correct, position:r.position};
    tv.phase="done"; tvSave(); drawTrivia(); loadRank();
  }catch(e){ tvError="No hay conexión. Tus respuestas quedaron guardadas: tocá Reintentar."; drawTrivia(); }
}

/* ---------- Ranking ---------- */
let rankRows=null, rankOpen=true, rankErr=false;
function drawRank(){
  const box = $("#rank"), grid = $(".tv-grid"); if(!box) return;
  if(!LIVE){ box.hidden = true; grid.classList.remove("has-rank"); return; }
  box.hidden = false; grid.classList.add("has-rank"); box.innerHTML="";
  box.append(el("span",{class:"mono",text: rankOpen ? "En vivo" : "Trivia cerrada"}), el("h3",{text:"Ranking"}));
  if(rankRows===null){ box.append(el("p",{class:"empty",text: rankErr ? "No pudimos cargar el ranking." : "Cargando…"})); }
  else if(!rankRows.length){ box.append(el("p",{class:"empty",text:"Todavía nadie terminó. ¿Sos el primero?"})); }
  else{
    if(!rankOpen) box.append(el("p",{class:"win",text:"Ganó "+rankRows[0].nombre+" con "+rankRows[0].score+"/"+TRIVIA.length+"."}));
    const ol = el("ol");
    const mine = tv.phase==="done" && tv.result ? tv.result.position : null;
    rankRows.slice(0,10).forEach((r,i)=>{
      ol.appendChild(el("li",{class: mine===i+1 ? "me" : ""},[
        el("span",{class:"pos",text:(i+1)+"°"}), el("span",{class:"nm",text:r.nombre}),
        el("span",{class:"pt",text:r.score+"/"+TRIVIA.length}), el("span",{class:"tm",text:fmtTime(r.seconds)})
      ]));
    });
    box.append(ol);
    if(rankRows.length>10) box.append(el("p",{class:"empty",text:"Y "+(rankRows.length-10)+" más."}));
  }
  const rf = el("button",{type:"button",id:"rank-refresh",text:"Actualizar"});
  rf.addEventListener("click",loadRank); box.append(rf);
}
async function loadRank(){
  if(!LIVE) return;
  try{ const j = await rpc("trivia_ranking"); if(j && j.ok){ rankRows=j.rows||[]; rankOpen=j.open!==false; rankErr=false; } }
  catch(e){ rankErr=true; }
  drawRank();
}
let rankVisible=false;
if(LIVE){
  try{ new IntersectionObserver(es=>{ rankVisible = es.some(e=>e.isIntersecting); }).observe(document.getElementById("trivia")); }catch(e){ rankVisible=true; }
  setInterval(()=>{ if(rankVisible && !document.hidden) loadRank(); }, 20000);
}

/* ---------- Ingreso general (#gate) ---------- */
/* Con Supabase configurado, la página entera queda tapada hasta que haya sesión: la cuenta se crea
   (o se ingresa) acá, una sola vez, y después se ve la recorrida completa. En modo práctica no aparece. */
function drawGate(){
  const sec = $("#gate"); if(!sec) return;
  const show = LIVE && (me.loading || !me.session);
  sec.hidden = !show; document.body.classList.toggle("gated", show);
  sec.innerHTML = "";
  if(!show) return;
  const wrap = el("div",{class:"gate-in"}); sec.appendChild(wrap);
  const fecha = document.querySelector(".hero .mono");
  wrap.append(
    el("span",{class:"mono",text: fecha ? fecha.textContent : "Recorrida"}),
    el("span",{class:"logo wordmark",role:"img","aria-label":"VIAVIVA"}),
    el("h1",{text:"Vamos a VIAVIVA."})
  );
  if(me.loading){ wrap.append(el("p",{class:"gate-lead",text:"Cargando…"})); return; }
  if(hostOn() && auth.mode==="signup" && !auth.err && !auth.info) auth.mode="login"; // la anfitriona ya tiene cuenta
  wrap.append(el("p",{class:"gate-lead",text: hostOn() ? "Panel de anfitriona. Ingresá con tu cuenta de administradora." : "Hoy recorrés VIAVIVA por dentro. Para entrar, primero creá tu cuenta."}));
  const b = authBox("gate"); b.classList.add("acct-dark"); wrap.append(b);
}

/* ---------- Panel de anfitriona (#anfitrion, cuentas administradoras) ---------- */
let host = {data:null, err:"", busy:false, confirm:false, timer:null};
function hostOn(){ return location.hash === "#anfitrion"; }
async function hostLoad(){
  if(!LIVE || !me.session) return;
  try{ const r = await rpc("admin_panel"); if(r && r.ok){ host.data=r; host.err=""; } else { host.data=null; host.err = r && r.error==="no_admin" ? "no_admin" : "No se pudo cargar."; } }
  catch(e){ host.err="Sin conexión. Reintentando…"; }
  drawHost();
}
async function hostSet(open){
  host.busy=true; drawHost();
  try{ const r = await rpc("admin_abrir",{abrir:open}); if(r && r.ok){ host.data=r; host.err=""; } else host.err="No se pudo cambiar."; }
  catch(e){ host.err="Sin conexión. Probá de nuevo."; }
  host.busy=false; host.confirm=false; drawHost(); loadRank(); refreshMe();
}
function drawHost(){
  const sec = $("#host"); if(!sec) return;
  clearInterval(host.timer);
  if(!hostOn()){ sec.hidden=true; return; }
  sec.hidden=false; sec.innerHTML="";
  const wrap = el("div",{class:"host-in"}); sec.appendChild(wrap);
  wrap.append(el("span",{class:"mono",text:"Panel de anfitriona · Trivia"}));
  if(!LIVE){
    wrap.append(el("h2",{text:"Disponible en la versión publicada"}), el("p",{text:"Este panel funciona cuando la página está publicada y conectada a Supabase. Acá la trivia está en modo práctica."}));
    return;
  }
  if(me.loading){ wrap.append(el("h2",{text:"Cargando…"})); return; }
  if(!me.session){
    wrap.append(el("h2",{text:"Ingresá con tu cuenta"}));
    const prev = auth.mode; if(auth.mode==="signup") auth.mode="login";
    const b = authBox("host"); b.classList.add("acct-dark"); wrap.append(b);
    auth.mode = prev==="signup" ? "login" : prev;
    return;
  }
  if(host.err==="no_admin"){
    wrap.append(el("h2",{text:"Tu cuenta no es administradora"}), el("p",{text:"Ingresaste como "+(myName()||me.session.user.email)+". Para ver el panel, la cuenta tiene que estar marcada como administradora en Supabase (lo explica la guía)."}));
    const out = el("button",{type:"button",class:"hbtn alt",text:"Salir"});
    out.addEventListener("click",async()=>{ await SB.auth.signOut(); host.err=""; refreshMe(); }); wrap.append(out);
    return;
  }
  const d = host.data;
  if(!d){ wrap.append(el("h2",{text:"Cargando…"})); if(host.err) wrap.append(el("p",{class:"err",text:host.err})); return; }
  wrap.append(el("h2",{text: d.open ? "Trivia abierta" : "Trivia cerrada"}));
  wrap.append(el("div",{class:"hcount"},[
    el("div",{},[el("b",{text:String(d.started)}),el("small",{text:"empezaron"})]),
    el("div",{},[el("b",{text:String(d.started-d.finished)}),el("small",{text:"jugando ahora"})]),
    el("div",{},[el("b",{text:String(d.finished)}),el("small",{text:"terminaron"})])
  ]));
  wrap.append(el("p",{style:"font-size:15px",text:"Cuentas creadas: "+d.registrados+" · Encuestas respondidas: "+d.encuestas}));
  if(d.rows.length){
    const top = d.rows[0];
    const pod = el("div",{class:"podium"},[
      el("span",{class:"mono",text: d.open ? "Va ganando" : "Ganó"}),
      el("span",{class:"w",text:top.nombre}),
      el("span",{class:"s",text:top.score+"/"+TRIVIA.length+" correctas en "+fmtTime(top.seconds)})
    ]);
    if(d.rows.length>1){ const ol=el("ol"); d.rows.slice(1,3).forEach((r,i)=>ol.appendChild(el("li",{text:(i+2)+"° "+r.nombre+" · "+r.score+"/"+TRIVIA.length+" · "+fmtTime(r.seconds)}))); pod.appendChild(ol); }
    wrap.append(pod);
  } else wrap.append(el("p",{text:"Todavía nadie terminó."}));
  const btns = el("div",{class:"hbtns"});
  if(d.open){
    const b = el("button",{type:"button",class:"hbtn"+(host.confirm?" confirm":""),id:"host-close",text: host.busy ? "Cerrando…" : host.confirm ? "Tocá de nuevo para confirmar" : "Cerrar trivia y anunciar ganador"});
    if(host.busy) b.disabled=true;
    b.addEventListener("click",()=>{ if(!host.confirm){ host.confirm=true; drawHost(); setTimeout(()=>{ if(host.confirm){host.confirm=false; drawHost();} },5000); } else hostSet(false); });
    btns.append(b);
  } else {
    const b = el("button",{type:"button",class:"hbtn alt",id:"host-open",text: host.busy ? "Abriendo…" : "Reabrir trivia"});
    if(host.busy) b.disabled=true;
    b.addEventListener("click",()=>hostSet(true)); btns.append(b);
  }
  const rf = el("button",{type:"button",class:"hbtn alt",id:"host-refresh",text:"Actualizar"});
  rf.addEventListener("click",hostLoad); btns.append(rf);
  wrap.append(btns);
  if(host.err) wrap.append(el("p",{class:"err",text:host.err}));
  if(d.rows.length>3){
    wrap.append(el("span",{class:"mono",text:"Ranking completo"}));
    const ol = el("ol",{class:"hlist"});
    d.rows.forEach((r,i)=>ol.appendChild(el("li",{},[el("span",{class:"pos",text:(i+1)+"°"}),el("span",{text:r.nombre}),el("span",{text:r.score+"/"+TRIVIA.length}),el("span",{class:"tm",text:fmtTime(r.seconds)})])));
    wrap.append(ol);
  }
  wrap.append(el("p",{style:"font-size:13px",text:"Se actualiza solo cada 10 segundos. Para salir del panel, sacá #anfitrion del link."}));
  host.timer = setInterval(()=>{ if(!document.hidden && !host.busy && !host.confirm) hostLoad(); },10000);
}
window.addEventListener("hashchange",()=>{ drawGate(); drawHost(); if(hostOn()){ hostLoad(); window.scrollTo(0,0); } });

/* ---------- Encuesta ---------- */
const SV_KEY = "viaviva-encuesta-esquiu-v3";
let sv = Object.assign({draft:{}}, store(SV_KEY)||{});
function svSave(){ store(SV_KEY, sv); }
let svBusy=false, svErr="", svBad=[], svSentNow=false;
function svRead(){
  const out={};
  ENCUESTA.forEach(q=>{
    if(q.type==="single"){ const c=document.querySelector(`input[name="sv-${q.id}"]:checked`); out[q.id]=c?c.value:""; }
    else if(q.type==="multi"){ out[q.id]=[...document.querySelectorAll(`input[name="sv-${q.id}"]:checked`)].map(x=>x.value);
      if(q.other){ const o=$("#sv-"+q.id+"-otro"); out[q.id+"_otro"]=o?o.value.trim().slice(0,200):""; } }
    else { const t=$("#sv-"+q.id); out[q.id]=t?t.value.trim().slice(0,q.type==="long"?1000:300):""; }
  });
  return out;
}
function drawSurvey(){
  const box = $("#survey"); if(!box) return; box.innerHTML="";
  if(!LIVE){
    if(FORM_URL) box.appendChild(el("a",{class:"cta",href:FORM_URL,target:"_blank",rel:"noopener",text:"Responder las preguntas →"}));
    return;
  }
  if(me.loading){ box.append(el("p",{text:"Cargando…"})); return; }
  if(!me.session){ box.append(authBox("survey")); return; }
  if(svSentNow || (me.estado && me.estado.encuesta_respondida)){
    box.appendChild(el("div",{class:"sv-done"},[
      el("h3",{text:"¡Gracias por responder!"}),
      el("p",{text:"Tus respuestas nos ayudan a pensar VIAVIVA para la gente de tu edad. Seguinos en @viaviva.ar para enterarte de todo lo que pasa."}),
      el("a",{class:"cta",href:"https://www.instagram.com/viaviva.ar/",target:"_blank",rel:"noopener",text:"Seguir a @viaviva.ar"})
    ]));
    return;
  }
  box.append(whoBar());
  const d = sv.draft||{};
  const form = el("form",{class:"sv",id:"sv-form",novalidate:""});
  ENCUESTA.forEach((q,qi)=>{
    const fs = el("fieldset",{id:"sv-f-"+q.id,class:svBad.includes(q.id)?"bad":""});
    const lg = el("legend",{},[el("span",{class:"n",text:"Pregunta "+(qi+1)+" de "+ENCUESTA.length})]);
    lg.appendChild(document.createTextNode(q.q+" "));
    if(!q.req) lg.appendChild(el("span",{class:"opt",text:"(opcional)"}));
    fs.appendChild(lg);
    if(q.type==="multi") fs.appendChild(el("p",{class:"hint",text:"Podés elegir más de una."}));
    if(q.type==="single"||q.type==="multi"){
      const chs = el("div",{class:"chs"});
      q.o.forEach((o,oi)=>{
        const id=`sv-${q.id}-${oi}`;
        const inp = el("input",{type:q.type==="single"?"radio":"checkbox",name:"sv-"+q.id,id,value:o});
        if(q.type==="single" ? d[q.id]===o : (d[q.id]||[]).includes(o)) inp.checked=true;
        chs.appendChild(el("label",{class:"ch",for:id},[inp,el("span",{text:o})]));
      });
      fs.appendChild(chs);
      if(q.other){ const ot = el("input",{type:"text",id:"sv-"+q.id+"-otro",class:"other",maxlength:"200",placeholder:"Otro (opcional)","aria-label":q.q+": otro"}); ot.value=d[q.id+"_otro"]||""; fs.appendChild(ot); }
    } else if(q.type==="short"){
      const t = el("input",{type:"text",id:"sv-"+q.id,maxlength:"300","aria-label":q.q}); t.value=d[q.id]||""; fs.appendChild(t);
    } else {
      const t = el("textarea",{id:"sv-"+q.id,maxlength:"1000","aria-label":q.q}); t.value=d[q.id]||""; fs.appendChild(t);
    }
    form.appendChild(fs);
  });
  const btn = el("button",{type:"submit",class:"btn",id:"sv-send",text: svBusy ? "Enviando…" : "Enviar respuestas"});
  if(svBusy) btn.disabled=true;
  form.appendChild(el("div",{class:"send"},[btn, el("p",{class:"err",id:"sv-err",text:svErr})]));
  form.addEventListener("input",()=>{ sv.draft=svRead(); svSave(); });
  form.addEventListener("change",()=>{ sv.draft=svRead(); svSave(); });
  form.addEventListener("submit",async e=>{
    e.preventDefault();
    const data = svRead(); sv.draft=data; svSave();
    svBad = ENCUESTA.filter(q=>q.req && (Array.isArray(data[q.id]) ? !data[q.id].length && !(q.other && data[q.id+"_otro"]) : !data[q.id])).map(q=>q.id);
    if(svBad.length){ svErr = svBad.length===1 ? "Falta responder 1 pregunta (marcada en rojo)." : "Faltan responder "+svBad.length+" preguntas (marcadas en rojo)."; drawSurvey(); const f=$("#sv-f-"+svBad[0]); if(f) f.scrollIntoView({behavior:"smooth",block:"center"}); return; }
    svErr=""; svBusy=true; drawSurvey();
    try{
      const r = await rpc("encuesta_enviar",{respuestas:data});
      svBusy=false;
      if(!r || !r.ok){ svErr="No pudimos guardar tus respuestas. Probá de nuevo."; drawSurvey(); return; }
      svSentNow=true; sv.draft={}; svSave(); drawSurvey();
      const s2=$("#survey"); if(s2) s2.scrollIntoView({behavior:"smooth",block:"start"});
    }catch(err){ svBusy=false; svErr="No hay conexión. Tus respuestas quedaron guardadas: probá de nuevo en un rato."; drawSurvey(); }
  });
  box.appendChild(form);
}

/* ---------- Arranque ---------- */
drawMap(); select("chino"); drawBA(); drawSteps(); drawInt(); drawGroups();
if(!LIVE && tv.phase==="sending") tv.phase="playing";
drawAll(); loadRank();
if(LIVE){
  SB.auth.onAuthStateChange((event)=>{
    if(event==="PASSWORD_RECOVERY"){ me.recovery=true; auth.err=""; drawAll(); const t=$("#trivia"); if(t) t.scrollIntoView(); }
    if(event==="SIGNED_IN" || event==="SIGNED_OUT" || event==="USER_UPDATED"){ setTimeout(()=>{ refreshMe().then(()=>{ if(hostOn()) hostLoad(); if(tv.phase==="sending") finish(); }); },0); }
  });
  refreshMe().then(()=>{ if(hostOn()) hostLoad(); if(tv.phase==="sending") finish(); });
}
