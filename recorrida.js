/* ================== RECORRIDA DEL DÍA (#ruta) ==================
   Barra fija arriba (debajo de #mebar) con el inicio, las paradas y el destino de la visita.
   Con permiso de ubicación, marca "Vos" sobre la línea: se proyecta la posición del GPS sobre
   el trazado que une las paradas (en orden) y se ubica entre dos de ellas.
   Los datos (paradas, coordenadas y textos) viven en contenido.js (RECORRIDA). Si RECORRIDA es
   null, la barra no aparece. La ubicación nunca sale del celular: no se guarda ni se envía. */
(function(){
  const R = (typeof RECORRIDA !== "undefined") ? RECORRIDA : null;
  const box = document.getElementById("ruta");
  if(!R || !box || !Array.isArray(R.paradas) || R.paradas.length < 2){ if(box) box.hidden = true; return; }

  const P = R.paradas;
  const EN_PARADA = R.radioParada || 45;    // metros: a esta distancia se considera "en la parada"
  const FUERA = R.radioFuera || 300;        // metros: más lejos que esto, "fuera del recorrido"
  const GPS_KEY = "viaviva-ruta-gps-esquiu"; // recuerda que la persona ya activó la ubicación
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let st = {open:false, gps:"off", pos:null, acc:null, err:""}; // gps: off | buscando | on | denegado | nodisp
  let watchId = null, reached = -1;

  function mk(tag, cls, text){ const e=document.createElement(tag); if(cls) e.className=cls; if(text!=null) e.textContent=text; return e; }

  /* ---- geometría: metros en un plano local (alcanza para 2 km) ---- */
  const lat0 = P[0].lat * Math.PI/180;
  function xy(lat,lng){ return {x: lng*111320*Math.cos(lat0), y: lat*110540}; }
  const pts = P.map(p=>xy(p.lat,p.lng));
  const segLen = pts.slice(1).map((b,i)=>Math.hypot(b.x-pts[i].x, b.y-pts[i].y));
  function dist(a,b){ return Math.hypot(a.x-b.x, a.y-b.y); }

  // Ubica la posición sobre el recorrido: progreso continuo (0 = primera parada, n-1 = última).
  function locate(lat,lng){
    const q = xy(lat,lng);
    let best = {d:Infinity, prog:0, i:0, t:0};
    for(let i=0;i<pts.length-1;i++){
      const a=pts[i], b=pts[i+1], L2=(b.x-a.x)**2+(b.y-a.y)**2;
      let t = L2 ? ((q.x-a.x)*(b.x-a.x)+(q.y-a.y)*(b.y-a.y))/L2 : 0;
      t = Math.max(0, Math.min(1, t));
      const d = dist(q, {x:a.x+t*(b.x-a.x), y:a.y+t*(b.y-a.y)});
      if(d < best.d - 0.5) best = {d, prog:i+t, i, t};
    }
    // ¿Está en una parada? Las paradas se recorren en orden: nunca se vuelve a una anterior a la
    // última alcanzada. Si dos paradas vecinas están muy cerca (Juramento y Nana Worlds), sigue en la
    // actual hasta alejarse de ella y quedar más cerca de la siguiente.
    // Tampoco se saltea una parada pegada a la anterior: hay que pasar primero por la anterior.
    const pegada = k => k>0 && dist(pts[k-1],pts[k]) <= 2*EN_PARADA;
    const near = P.map((p,k)=>({k, d:dist(q,pts[k])}))
      .filter(o=>o.d<=EN_PARADA && o.k>=reached && (reached<0 || o.k<=reached+1 || !pegada(o.k)));
    let at = null;
    if(near.length){
      const cur = near.find(o=>o.k===reached);
      const next = near.filter(o=>o.k>reached).sort((a,b)=>a.k-b.k);
      if(reached < 0) at = near.slice().sort((a,b)=>a.d-b.d)[0].k;  // sin historia: la más cercana
      else if(cur && !(next.length && cur.d > 25 && next[0].d < cur.d)) at = cur.k;
      else at = (next[0] || cur).k;
      reached = Math.max(reached, at);
    } else if(best.d <= FUERA) reached = Math.max(reached, Math.floor(best.prog));
    let prog = at!=null ? at : Math.max(best.prog, reached), falta = null;
    // Si la proyección cae más allá de la próxima parada pero todavía está cerca de ella, sigue "antes" de esa parada.
    if(at==null && reached>=0 && reached+1 < pts.length && prog > reached+1){
      const dn = dist(q, pts[reached+1]);
      if(dn < 2.5*EN_PARADA){ prog = reached + 0.97; falta = dn; }
    }
    prog = Math.min(prog, pts.length-1);
    const i = Math.min(Math.floor(prog), pts.length-2), t = prog-i;
    if(falta==null) falta = segLen[i]*(1-t);
    return {off: best.d, prog, at, i, t, falta};
  }

  function metros(m){ return m < 1000 ? Math.round(m/10)*10+" m" : (m/1000).toFixed(1).replace(".",",")+" km"; }

  function statusText(){
    if(st.gps==="off") return R.inicio || ("De "+P[0].n+" a "+P[P.length-1].n);
    if(st.gps==="buscando") return "Buscando tu ubicación…";
    if(st.gps==="denegado") return "Sin permiso de ubicación. Activalo en los ajustes del navegador.";
    if(st.gps==="nodisp") return st.err || "No pudimos obtener tu ubicación.";
    const L = st.loc; if(!L) return "Buscando tu ubicación…";
    if(L.off > FUERA) return "Estás fuera del recorrido, a "+metros(L.off)+".";
    if(L.at!=null) return (L.at===P.length-1 ? "Llegaste: " : "Estás en ")+P[L.at].n+".";
    const a=P[L.i], b=P[L.i+1];
    return "Entre "+a.n+" y "+b.n+" · faltan "+metros(L.falta);
  }

  /* ---- dibujo ---- */
  function draw(){
    box.hidden = false; box.innerHTML = "";
    const L = st.gps==="on" ? st.loc : null;
    const onRoute = L && L.off <= FUERA;
    const prog = onRoute ? L.prog : null;
    const n = P.length;

    const head = mk("div","ruta-head");
    const tg = mk("button","ruta-tg"); tg.type="button"; tg.id="ruta-tg";
    tg.setAttribute("aria-expanded", st.open?"true":"false"); tg.setAttribute("aria-controls","ruta-list");
    tg.setAttribute("aria-label", (R.titulo || "Recorrida")+": "+statusText()+". "+(st.open?"Ocultar":"Ver")+" las paradas.");
    tg.append(mk("span","ruta-st",statusText()), mk("span","ruta-chev",st.open ? "▴" : "▾"));
    tg.addEventListener("click",()=>{ st.open=!st.open; draw(); });
    head.append(tg);
    if(st.gps==="off" || st.gps==="nodisp"){
      const b = mk("button","ruta-gps", st.gps==="nodisp" ? "Reintentar" : "Ubicarme"); b.type="button"; b.id="ruta-gps";
      b.addEventListener("click", startGps); head.append(b);
    } else if(st.gps==="on" && st.acc!=null && st.acc>60){
      head.append(mk("span","ruta-acc","GPS ±"+metros(st.acc)));
    }
    box.append(head);

    // Línea con las paradas, repartidas en partes iguales (las distancias reales no entran en pantalla).
    const trk = mk("div","ruta-trk"); trk.setAttribute("aria-hidden","true");
    const line = mk("div","ruta-line");
    for(let i=0;i<n-1;i++){
      const s = mk("i","ruta-seg");
      s.style.left = (i/(n-1)*100)+"%"; s.style.width = (100/(n-1))+"%";
      s.style.setProperty("--sc", "var("+((TRAMOS[P[i+1].t]||{}).color || "--green")+")");
      if(prog!=null) s.style.setProperty("--f", Math.max(0,Math.min(1,prog-i)));
      line.append(s);
    }
    trk.append(line);
    P.forEach((p,i)=>{
      const d = mk("span","ruta-stop");
      d.style.left = (i/(n-1)*100)+"%";
      d.style.setProperty("--c","var("+((TRAMOS[p.t]||{}).color || "--green")+")");
      if(prog!=null && i <= prog + 1e-6) d.classList.add("done");
      if(L && L.at===i) d.classList.add("here");
      if(i===0) d.classList.add("first"); if(i===n-1) d.classList.add("last");
      d.append(mk("b",null,""), mk("small",null,p.corto || p.n));
      trk.append(d);
    });
    if(prog!=null){
      const you = mk("span","ruta-you"+(reduce?"":" pulse"));
      you.style.left = (prog/(n-1)*100)+"%";
      you.append(mk("small",null,"Vos"));
      trk.append(you);
    }
    box.append(trk);

    // Detalle de cada parada (se abre tocando la barra).
    const list = mk("ol","ruta-list"); list.id="ruta-list"; list.hidden = !st.open;
    P.forEach((p,i)=>{
      const li = mk("li", prog!=null && i<=prog+1e-6 ? "done" : "");
      if(L && L.at===i) li.classList.add("here");
      li.style.setProperty("--c","var("+((TRAMOS[p.t]||{}).color || "--green")+")");
      const tag = i===0 ? "Inicio" : i===n-1 ? "Destino" : "Parada "+i;
      li.append(mk("span","mono",tag+(p.donde ? " · "+p.donde : "")), mk("b",null,p.n));
      if(p.txt) li.append(mk("p",null,p.txt));
      list.append(li);
    });
    if(st.open) list.append(mk("p","ruta-note","Tu ubicación se usa solo en tu celular para marcar dónde estás: no se guarda ni se envía."));
    box.append(list);
    setStickH();
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
    else if(st.gps!=="on"){ st.gps="nodisp"; st.err = e && e.code===3 ? "La ubicación tarda en llegar. Probá al aire libre." : "No pudimos obtener tu ubicación."; }
    else return; // ya teníamos posición: un error suelto no borra lo que se ve
    draw();
  }

  /* Alto de lo que queda fijo arriba, para que los saltos a cada sección no queden tapados. */
  function setStickH(){
    const w = document.getElementById("stick");
    if(w) document.documentElement.style.setProperty("--stick-h", w.offsetHeight+"px");
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
