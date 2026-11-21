/* ================== LOGIC · client visit edition ==================
   No accounts, no Supabase: everything runs on the phone. Menu bar, schematic map, before/after,
   construction steps and the Libertador highlights. The live route bar is in recorrida.js. */
const $ = s => document.querySelector(s);
const NS = "http://www.w3.org/2000/svg";
function el(tag, attrs={}, kids=[]){
  const isSvg = ["svg","g","line","circle","text","rect","image"].includes(tag);
  const e = isSvg ? document.createElementNS(NS,tag) : document.createElement(tag);
  for(const [k,v] of Object.entries(attrs)){ if(k==="text") e.textContent=v; else e.setAttribute(k,v); }
  kids.forEach(k=>k && e.appendChild(k)); return e;
}
const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Top bar (#mebar): sections menu + title ---------- */
let menuOpen = false;
function drawMeBar(){
  const bar = $("#mebar"); if(!bar) return;
  bar.innerHTML = "";
  const mb = el("button",{type:"button",class:"menu-btn",id:"menu-btn","aria-label":"Sections of this page","aria-expanded":menuOpen?"true":"false","aria-controls":"menu"},[el("i"),el("i"),el("i")]);
  mb.addEventListener("click",(e)=>{ e.stopPropagation(); menuOpen=!menuOpen; drawMeBar(); });
  bar.append(mb, el("span",{class:"nm",text:"VIAVIVA · "+(typeof CLIENTE!=="undefined" && CLIENTE.nombre ? CLIENTE.nombre+" visit" : "visit")}));
  const a = el("a",{class:"sc",href:"#libertador",text:"Libertador"}); bar.append(a);
  drawMenu();
}
function drawMenu(){
  const m = $("#menu"); if(!m) return;
  m.hidden = !menuOpen; m.innerHTML = "";
  if(!menuOpen) return;
  const ol = el("ol");
  (typeof SECCIONES !== "undefined" ? SECCIONES : []).forEach(sec=>{
    if(!document.getElementById(sec.id)) return;
    const a = el("a",{href:"#"+sec.id},[el("span",{class:"mono",text:sec.n}), el("span",{text:sec.t})]);
    a.addEventListener("click",()=>{ menuOpen=false; drawMeBar(); });
    ol.append(el("li",{},[a]));
  });
  m.append(ol);
}
document.addEventListener("click",(e)=>{ if(menuOpen && !e.target.closest("#menu") && !e.target.closest("#menu-btn")){ menuOpen=false; drawMeBar(); } });
document.addEventListener("keydown",(e)=>{ if(e.key==="Escape" && menuOpen){ menuOpen=false; drawMeBar(); $("#menu-btn")?.focus(); } });

/* ---------- Schematic map ---------- */
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
  // District names (in English, TRAMOS[t].corto) along the left edge, centred on each segment.
  SEG.forEach(s=>{
    const y = (s.y1+s.y2)/2, n = TRAMOS[s.t].corto || TRAMOS[s.t].nombre;
    const tx = el("text",{x:22,y:y,"text-anchor":"middle",transform:`rotate(-90 22 ${y})`,text:n.toUpperCase()});
    tx.style.fill=`var(${TRAMOS[s.t].color})`; tx.style.fontWeight="500"; tx.style.letterSpacing=".12em"; tx.style.fontSize="12px";
    svg.appendChild(tx);
  });
  PUNTOS.forEach(p=>{
    const g = el("g",{class:"pin"+(p.id==="tesla"?" pin-cliente":""),tabindex:0,role:"button","aria-label":p.label,"data-id":p.id});
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
    el("p",{class:"note",text:tr.nombre+": from "+tr.calles+"."})
  );
  const back = el("button",{type:"button",class:"tolink",id:"map-back",text:"Back to the map ↑"});
  back.addEventListener("click",()=>{ $("#map").scrollIntoView({behavior: reduce()?"auto":"smooth", block:"start"}); });
  panel.appendChild(back);
  if(go){
    panel.classList.remove("flash"); void panel.offsetWidth; panel.classList.add("flash");
    const top = panel.getBoundingClientRect().top;
    if(top < 0 || top > window.innerHeight*0.45) panel.scrollIntoView({behavior:reduce()?"auto":"smooth",block:"start"});
    panel.focus({preventScroll:true});
  }
}

/* ---------- Before / after and construction steps ---------- */
function drawBA(){
  const box = $("#ba"); box.innerHTML="";
  const frame = el("div",{class:"ba-frame"});
  const r = el("input",{type:"range",min:0,max:100,value:50,class:"ba-range",id:"ba-0","aria-label":"Compare the ground before and today"});
  r.addEventListener("input",()=>frame.style.setProperty("--pos",r.value+"%"));
  frame.append(
    el("img",{src:PAR.antes,alt:"The ground under the viaduct before the works, with weeds"}),
    el("img",{src:PAR.despues,alt:"The promenade today, at night, with lights and lots of people",class:"ba-after"}),
    el("div",{class:"ba-handle"}),el("span",{class:"ba-tag l",text:PAR.tagA}),el("span",{class:"ba-tag r",text:PAR.tagD}),r);
  box.appendChild(frame);
}
function drawSteps(){
  const box = $("#steps"); box.innerHTML="";
  STEPS.forEach((st,i)=>{
    const b = el("div",{class:"step-b"},[el("span",{class:"mono",text:"Step "+(i+1)+" of "+STEPS.length}),el("b",{text:st.t}),el("p",{text:st.p})]);
    box.appendChild(el("article",{class:"step"+(st.last?" last":"")},[el("img",{src:st.img,alt:st.t,loading:"lazy"}),b]));
  });
}

/* ---------- Libertador & the client: brand row and highlights ---------- */
function drawLibertador(){
  const m = $("#marcas"); if(m){
    m.innerHTML="";
    CONCESIONARIAS.forEach(n=>{
      const esCliente = typeof CLIENTE!=="undefined" && n===CLIENTE.nombre;
      m.appendChild(el("span",{class:"marca"+(esCliente?" cliente":""),text:n}));
    });
  }
  const f = $("#lib-facts"); if(f){
    f.innerHTML="";
    LIBERTADOR.forEach(x=>f.appendChild(el("div",{class:"fact"},[el("b",{text:x.n}),el("span",{class:"t",text:x.t}),el("p",{text:x.p})])));
  }
}

/* ---------- Start ---------- */
drawMeBar(); drawMap(); select(PUNTOS[0].id); drawBA(); drawSteps(); drawLibertador();
