/* ================== RECORRIDA DEL DÍA (#ruta) ==================
   Barra fija arriba (debajo de #mebar): todo VIAVIVA de Monroe a Dorrego con sus calles y tramos,
   las paradas de la visita y, con permiso de ubicación, el punto "Vos": se proyecta la posición del
   GPS sobre la línea que une los cruces de cada calle con las vías y se dice en qué tramo y entre
   qué calles está.
   Los datos (calles, tramos, paradas y coordenadas) viven en contenido.js (RECORRIDA). Si RECORRIDA
   es null, la barra no aparece. La ubicación nunca sale del celular: no se guarda ni se envía. */
(function(){
  const R = (typeof RECORRIDA !== "undefined") ? RECORRIDA : null;
  const box = document.getElementById("ruta");
  if(!R || !box || !Array.isArray(R.calles) || R.calles.length < 2 || !Array.isArray(R.paradas)){ if(box) box.hidden = true; return; }

  const C = R.calles, P = R.paradas, nC = C.length;
  const EN_PARADA = R.radioParada || 45;    // metros: a esta distancia se considera "en la parada"
  const EN_CALLE = R.radioCalle || 18;      // metros: a esta distancia del cruce, "en <calle>"
  const FUERA = R.radioFuera || 250;        // metros: más lejos que esto, "fuera del recorrido"
  const GPS_KEY = "viaviva-ruta-gps-esquiu"; // recuerda que la persona ya activó la ubicación
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let st = {open:false, gps:"off", acc:null, err:"", loc:null}; // gps: off | buscando | on | denegado | nodisp
  let watchId = null, reached = -1;

  function mk(tag, cls, text){ const e=document.createElement(tag); if(cls) e.className=cls; if(text!=null) e.textContent=text; return e; }
  const color = t => "var("+((TRAMOS[t]||{}).color || "--green")+")";
  const nombreTramo = t => (TRAMOS[t]||{}).nombre || "";

  /* ---- geometría: metros en un plano local (alcanza para unos km) ---- */
  const lat0 = C[0].lat * Math.PI/180;
  function xy(lat,lng){ return {x: lng*111320*Math.cos(lat0), y: lat*110540}; }
  function dist(a,b){ return Math.hypot(a.x-b.x, a.y-b.y); }
  const pts = C.map(c=>xy(c.lat,c.lng));
  const cum = [0]; for(let i=1;i<nC;i++) cum.push(cum[i-1] + dist(pts[i-1],pts[i]));   // metros desde la primera calle

  // Tramo de cada cuadra (entre la calle i y la i+1), según R.tramos {t, de, a} con nombres de calles.
  const idx = n => C.findIndex(c=>c.n===n);
  const tramoSeg = new Array(nC-1).fill(null);
  (R.tramos||[]).forEach(tr=>{ const a=idx(tr.de), b=idx(tr.a); for(let i=Math.min(a,b); i<Math.max(a,b); i++) if(i>=0) tramoSeg[i]=tr.t; });

  // Posición en pantalla de cada calle: cuadras iguales, salvo las que tienen "ancho" (Olleros–Dorrego es largo).
  const w = C.map((c,i)=> i===0 ? 0 : (c.ancho || 1));
  const wTot = w.reduce((a,b)=>a+b,0);
  const xC = []; w.reduce((acc,v,i)=>{ xC[i]=(acc+v)/wTot*100; return acc+v; }, 0);

  // Proyecta un punto sobre la línea: cuadra (i), fracción (f), metros desde la primera calle (s) y distancia a la línea (d).
  function proyectar(q){
    let best = {d:Infinity, i:0, f:0};
    for(let i=0;i<nC-1;i++){
      const a=pts[i], b=pts[i+1], L2=(b.x-a.x)**2+(b.y-a.y)**2;
      let f = L2 ? ((q.x-a.x)*(b.x-a.x)+(q.y-a.y)*(b.y-a.y))/L2 : 0;
      f = Math.max(0, Math.min(1, f));
      const d = dist(q, {x:a.x+f*(b.x-a.x), y:a.y+f*(b.y-a.y)});
      if(d < best.d) best = {d, i, f};
    }
    best.s = cum[best.i] + best.f*(cum[best.i+1]-cum[best.i]);
    best.x = xC[best.i] + best.f*(xC[best.i+1]-xC[best.i]);
    return best;
  }

  // Paradas: posición sobre la línea y "avance" en el sentido en que se camina (de la primera a la última parada).
  const stops = P.map(p=>{ const q=xy(p.lat,p.lng), pr=proyectar(q); return Object.assign({}, p, {q, i:pr.i, s:pr.s, x:pr.x}); });
  const dir = stops.length>1 && stops[stops.length-1].s < stops[0].s ? -1 : 1;
  const av = s => (s - (stops[0] ? stops[0].s : 0)) * dir;

  function locate(lat,lng){
    const q = xy(lat,lng), pr = proyectar(q), a = av(pr.s);
    // Parada en la que está (la más cercana dentro del radio, sin volver a una anterior a la última alcanzada).
    let at = null, dAt = Infinity;
    stops.forEach((p,k)=>{ const d=dist(q,p.q); if(d<=EN_PARADA && k>=reached && d<dAt){ at=k; dAt=d; } });
    if(pr.d <= FUERA){
      if(at!=null) reached = Math.max(reached, at);
      stops.forEach((p,k)=>{ if(a > av(p.s) + 30) reached = Math.max(reached, k); }); // paradas que ya quedaron atrás
    }
    // Calle en la que está (cerca del cruce) o las dos entre las que está.
    const dA = dist(q, pts[pr.i]), dB = dist(q, pts[pr.i+1]);
    const enCalle = dA<=EN_CALLE ? pr.i : dB<=EN_CALLE ? pr.i+1 : null;
    const next = Math.min(reached+1, stops.length-1);
    const falta = stops[next] ? Math.max(0, av(stops[next].s) - a) : 0;
    return Object.assign(pr, {at, enCalle, next, falta, tramo: tramoSeg[pr.i]});
  }

  function metros(m){ return m < 1000 ? Math.round(m/10)*10+" m" : (m/1000).toFixed(1).replace(".",",")+" km"; }

  // Dos líneas de estado: la principal (dónde estás) y una secundaria (tramo y próxima parada).
  function status(){
    if(st.gps==="off") return [R.inicio || ("De "+P[0].n+" a "+P[P.length-1].n), "Tocá «Ubicarme» para ver dónde estás."];
    if(st.gps==="buscando") return ["Buscando tu ubicación…", "Puede tardar unos segundos."];
    if(st.gps==="denegado") return ["Sin permiso de ubicación", "Activalo en los ajustes del navegador."];
    if(st.gps==="nodisp") return [st.err || "No pudimos obtener tu ubicación.", "Probá de nuevo."];
    const L = st.loc; if(!L) return ["Buscando tu ubicación…",""];
    if(L.d > FUERA) return ["Estás fuera del recorrido", "A "+metros(L.d)+" de VIAVIVA."];
    const tr = nombreTramo(L.tramo);
    let main;
    if(L.at!=null) main = (L.at===stops.length-1 ? "Llegaste: " : "Estás en ")+stops[L.at].n;
    else if(L.enCalle!=null) main = "En "+C[L.enCalle].n;
    else main = "Entre "+C[L.i].n+" y "+C[L.i+1].n;
    let sub = tr;
    if(L.at===stops.length-1 || (reached===stops.length-1)) sub += (sub?" · ":"")+"Fin del recorrido";
    else if(stops[L.next] && L.at!==L.next) sub += (sub?" · ":"")+metros(L.falta)+" hasta "+stops[L.next].n;
    return [main, sub];
  }

  /* ---- dibujo ---- */
  function draw(){
    box.hidden = false; box.innerHTML = "";
    const L = st.gps==="on" ? st.loc : null;
    const onRoute = L && L.d <= FUERA;
    const [main, sub] = status();

    const head = mk("div","ruta-head");
    const tg = mk("button","ruta-tg"); tg.type="button"; tg.id="ruta-tg";
    tg.setAttribute("aria-expanded", st.open?"true":"false"); tg.setAttribute("aria-controls","ruta-list");
    tg.setAttribute("aria-label", (R.titulo || "Recorrida")+": "+main+". "+sub+" "+(st.open?"Ocultar":"Ver")+" las paradas.");
    const txt = mk("span","ruta-txt");
    const l1 = mk("span","ruta-st"); if(onRoute) l1.append(mk("i","ruta-dot")); l1.append(document.createTextNode(main));
    txt.append(l1);
    if(sub){ const l2 = mk("span","ruta-sub",sub); if(onRoute && L.tramo) l2.style.color = color(L.tramo); txt.append(l2); }
    tg.append(txt, mk("span","ruta-chev",st.open ? "▴" : "▾"));
    tg.addEventListener("click",()=>{ st.open=!st.open; draw(); });
    head.append(tg);
    if(st.gps==="off" || st.gps==="nodisp"){
      const b = mk("button","ruta-gps", st.gps==="nodisp" ? "Reintentar" : "Ubicarme"); b.type="button"; b.id="ruta-gps";
      b.addEventListener("click", startGps); head.append(b);
    } else if(st.gps==="on" && st.acc!=null && st.acc>60){
      head.append(mk("span","ruta-acc","GPS ±"+metros(st.acc)));
    }
    box.append(head);

    // Mapa lineal: todas las calles (arriba), la línea por tramos, las paradas (abajo) y "Vos".
    const map = mk("div","ruta-map"); map.setAttribute("aria-hidden","true");
    for(let i=0;i<nC-1;i++){
      const s = mk("i","ruta-seg "+(tramoSeg[i]||""));
      s.style.left = xC[i]+"%"; s.style.width = (xC[i+1]-xC[i])+"%";
      s.style.setProperty("--sc", color(tramoSeg[i]));
      map.append(s);
    }
    C.forEach((c,i)=>{
      const near = onRoute && (L.enCalle===i || (L.enCalle==null && (i===L.i || i===L.i+1)));
      const lb = mk("span","ruta-calle"+(near?" near":""), c.corto || c.n); lb.style.left = xC[i]+"%";
      const tk = mk("i","ruta-tick"); tk.style.left = xC[i]+"%";
      map.append(lb, tk);
    });
    stops.forEach((p,k)=>{
      const d = mk("span","ruta-stop");
      d.style.left = p.x+"%"; d.style.setProperty("--c", color(p.t || tramoSeg[p.i]));
      if(onRoute && k<=reached) d.classList.add("done");
      if(onRoute && L.at===k) d.classList.add("here");
      if(onRoute && L.at!==k && k===L.next && reached<stops.length-1) d.classList.add("next");
      if(k===0) d.classList.add("first"); if(k===stops.length-1) d.classList.add("last");
      if(p.x < 6) d.classList.add("al-izq"); if(p.x > 94) d.classList.add("al-der");
      d.append(mk("b"), mk("small",null,p.corto || p.n));
      map.append(d);
    });
    if(onRoute){
      const you = mk("span","ruta-you"+(reduce?"":" pulse"));
      you.style.left = L.x+"%";
      map.append(you);
    }
    box.append(map);
    separarEtiquetas(map);

    // Detalle de cada parada (se abre tocando la barra).
    const list = mk("ol","ruta-list"); list.id="ruta-list"; list.hidden = !st.open;
    stops.forEach((p,k)=>{
      const li = mk("li", onRoute && k<=reached ? "done" : "");
      if(onRoute && L.at===k) li.classList.add("here");
      li.style.setProperty("--c", color(p.t || tramoSeg[p.i]));
      const tag = k===0 ? "Inicio" : k===stops.length-1 ? "Destino" : "Parada "+k;
      li.append(mk("span","mono",tag+(p.donde ? " · "+p.donde : "")), mk("b",null,p.n));
      list.append(li);
    });
    if(st.open) list.append(mk("p","ruta-note","Tu ubicación se usa solo en tu celular para marcar dónde estás: no se guarda ni se envía."));
    box.append(list);
    setStickH();
  }

  // Si los nombres de dos paradas vecinas se pisan, el de la derecha se corre hacia la derecha.
  function separarEtiquetas(map){
    const ls = [...map.querySelectorAll(".ruta-stop")].sort((a,b)=>parseFloat(a.style.left)-parseFloat(b.style.left));
    for(let k=1;k<ls.length;k++){
      const a = ls[k-1].querySelector("small").getBoundingClientRect(), b = ls[k].querySelector("small").getBoundingClientRect();
      if(a.right + 6 > b.left && !ls[k].classList.contains("al-der")) ls[k].classList.add("al-izq");
    }
  }

  /* ---- GPS ---- */
  function startGps(){
    if(!("geolocation" in navigator)){ st.gps="nodisp"; st.err="Este navegador no permite usar la ubicación."; draw(); return; }
    if(watchId!=null) navigator.geolocation.clearWatch(watchId);
    st.gps="buscando"; st.err=""; draw();
    watchId = navigator.geolocation.watchPosition(onPos, onErr, {enableHighAccuracy:true, maximumAge:10000, timeout:30000});
  }
  function onPos(p){
    try{ localStorage.setItem(GPS_KEY,"1"); }catch(e){}
    st.gps="on"; st.acc = p.coords.accuracy;
    st.loc = locate(p.coords.latitude, p.coords.longitude);
    draw();
  }
  function onErr(e){
    if(e && e.code===1){ st.gps="denegado"; try{ localStorage.removeItem(GPS_KEY); }catch(_){} }
    else if(st.gps!=="on"){ st.gps="nodisp"; st.err = e && e.code===3 ? "La ubicación tarda en llegar." : "No pudimos obtener tu ubicación."; }
    else return; // ya teníamos posición: un error suelto no borra lo que se ve
    draw();
  }

  /* Alto de lo que queda fijo arriba, para que los saltos a cada sección no queden tapados. */
  function setStickH(){
    const wr = document.getElementById("stick");
    if(wr) document.documentElement.style.setProperty("--stick-h", wr.offsetHeight+"px");
  }
  window.addEventListener("resize", setStickH);
  new MutationObserver(setStickH).observe(document.getElementById("mebar") || box, {attributes:true, childList:true});

  // Para probar sin estar en el lugar: ?ruta=lat,lng simula una posición.
  const sim = new URLSearchParams(location.search).get("ruta");
  if(sim && /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(sim)){
    const [la,ln] = sim.split(",").map(Number);
    st.gps="on"; st.acc=10; st.loc=locate(la,ln); draw(); return;
  }

  draw();
  // Si ya la activó antes (o el permiso está dado), vuelve a ubicarse solo al abrir la página.
  let antes = false; try{ antes = localStorage.getItem(GPS_KEY)==="1"; }catch(e){}
  if(navigator.permissions && navigator.permissions.query){
    navigator.permissions.query({name:"geolocation"}).then(r=>{ if(r.state==="granted" || (antes && r.state!=="denied")) startGps(); }).catch(()=>{ if(antes) startGps(); });
  } else if(antes) startGps();
})();
