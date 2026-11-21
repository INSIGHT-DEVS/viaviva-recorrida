/* ================== EDITABLE CONTENT · client visit edition (English) ================== */
// Everything a client visit needs to change lives here: the client block, the Libertador highlights,
// the districts, the schematic map, the story, the live route bar and the sections menu.

// The client of this visit. logo: path to the brand's isotype (PNG with transparent background, or SVG) placed in
// assets/; the live route bar shows only that image at the client's stop, with no text. null = text label instead.
const CLIENTE = {
  nombre:"Tesla",
  logo:"assets/tesla.png",         // official Tesla isotype (supplied by the client)
  donde:"VIAVIVA Libertador · Federico Lacroze",
  lat:-34.56252, lng:-58.43751,    // Federico Lacroze and the tracks
  visita:"Site visit · VIAVIVA Libertador"
};

const TRAMOS = {
  chino:{nombre:"VIAVIVA Barrio Chino",color:"--t-chino",logo:"lg-chino",calles:"Monroe to Sucre"},
  libertador:{nombre:"VIAVIVA Libertador",color:"--t-lib",logo:"lg-lib",calles:"La Pampa to Olleros"},
  hipodromo:{nombre:"VIAVIVA Hipódromo",color:"--t-hip",logo:"lg-hip",calles:"Olleros to Dorrego"}
};

// Schematic map (section "The three districts"): streets, colored segments and the points you can tap.
const CALLES = [
  {n:"Monroe",y:40},{n:"Mendoza",y:120},{n:"Juramento",y:175},{n:"Echeverría",y:225},
  {n:"Sucre",y:280},{n:"La Pampa",y:340},{n:"F. Lacroze",y:452},{n:"Olleros",y:470},{n:"Dorrego",y:585}
];
const SEG = [{t:"chino",y1:40,y2:280},{t:"libertador",y1:340,y2:470},{t:"hipodromo",y1:470,y2:585}];
const PUNTOS = [
  {id:"tesla",t:"libertador",y:452,label:"Tesla",sub:"(Federico Lacroze)",
   titulo:"Tesla, the anchor of the automotive row",
   texto:"At Federico Lacroze, at the head of the dealership row of VIAVIVA Libertador: Audi, Volvo, Jaguar, Land Rover, Ducati and Kia, with Tesla anchoring the whole lineup.",
   items:["Underground parking for 140 cars","Valet parking at night with 100 extra spots at the Racket Club","Daytime and nighttime dining steps away"]},
  {id:"libertador",t:"libertador",y:405,label:"Libertador",
   titulo:"The premium experience",
   texto:"Eight blocks to eat, shop, go out at night, play at the renewed Plaza Bolivia and see the cars of seven brands. And new openings are on the way.",
   items:["Plaza Bolivia with playground and carousel","Pedestrian access to the Racket Club through VIAVIVA"]},
  {id:"pampa",t:"libertador",y:340,label:"La Pampa & the tracks",
   titulo:"The most famous crossing gate",
   texto:"The Buenos Aires saying “estar en Pampa y la vía” (to be flat broke) was born at this crossing: the story is right here. In May 2019 La Pampa street reopened under the train.",
   items:["The Libertador district starts here"]},
  {id:"belgranoc",t:"chino",y:175,label:"Belgrano C",sub:"(station)",
   titulo:"The station that went up",
   texto:"With the viaduct, Belgrano C station was raised: fully covered, with a 220-metre platform, elevators and escalators.",
   items:["The Juramento crossing gate is gone","From the platform you see the whole promenade"]},
  {id:"chino",t:"chino",y:120,label:"Barrio Chino",
   titulo:"The gateway",
   texto:"The best-known district and the first to open, in 2023: Chinese, Korean and Japanese food, bubble tea, cafés, ice cream and shops. Home of the Chinese New Year celebrations.",
   items:["Tourist information centre in four languages","Stop of the hop-on hop-off tourist bus"]},
  {id:"hipodromo",t:"hipodromo",y:528,label:"Hipódromo",sub:"(coming soon)",
   titulo:"Nights in the open air",
   texto:"Between Olleros and Dorrego, next to the Palermo woods: entertainment, dining and open-air plans.",
   items:["Coming soon"]}
];

// Before / after and the construction steps (section "The story").
const PAR = {antes:"assets/obra-01-baldio.jpg", despues:"assets/obra-06-hoy-noche.jpg", tagA:"Before", tagD:"Today", titulo:"From empty ground to meeting point"};
const STEPS = [
  {img:"assets/obra-01-baldio.jpg", t:"The ground", p:"With the train already overhead, what was left below was dirt, weeds and blind walls."},
  {img:"assets/obra-03-estructura.jpg", t:"The structure", p:"Columns and roofs: the shape of the shops and the walkway appears."},
  {img:"assets/obra-02-instalaciones.jpg", t:"What goes under the floor", p:"The floor is opened for everything you never see afterwards: drains, sewers, water and power."},
  {img:"assets/obra-05-terminaciones.jpg", t:"The finishes", p:"Flooring, glass, plants and light. Almost ready to open."},
  {img:"assets/obra-06-hoy-noche.jpg", t:"Today", p:"More life in your city, and a place to meet and discover.", last:true}
];

// Libertador highlights (section "Libertador & Tesla").
const CONCESIONARIAS = ["Audi","Volvo","Jaguar","Land Rover","Ducati","Kia","Tesla"];
const LIBERTADOR = [
  {n:"7", t:"car brands in a row", p:"Audi, Volvo, Jaguar, Land Rover, Ducati and Kia, with Tesla now anchoring the whole automotive row at Federico Lacroze."},
  {n:"140", t:"underground parking spots", p:"The district has its own underground car park for 140 cars, right below the promenade."},
  {n:"+100", t:"valet spots at night", p:"Under the agreement with the Racket Club, one of the main tennis clubs in Buenos Aires, 100 of its spots are available at night for VIAVIVA's valet parking service."},
  {n:"Day & night", t:"dining mix", p:"A curated mix of daytime and nighttime food and drink proposals, from coffee to late dinners and bars."},
  {n:"8", t:"blocks from La Pampa to Olleros", p:"Open since November 2025: fashion, kids, nightlife, the renewed Plaza Bolivia and a pedestrian entrance to the Racket Club through VIAVIVA."}
];

// Live route bar (top of the page, recorrida.js): every street from Monroe to Dorrego, the three districts,
// the stops of the visit and the "You" dot from GPS. null = no bar.
// lat/lng: in Google Maps, long-press the spot and copy the coordinates.
const RECORRIDA = {
  titulo:"Today's route",
  inicio:"Route: from Tesla to Monroe",
  calles: [
    {n:"Monroe", lat:-34.55431, lng:-58.45329},
    {n:"Blanco Encalada", corto:"B. Encalada", lat:-34.55526, lng:-58.45247},
    {n:"Olazábal", lat:-34.55624, lng:-58.45167},
    {n:"Mendoza", lat:-34.55713, lng:-58.45089},
    {n:"Juramento", lat:-34.55805, lng:-58.45001},
    {n:"Echeverría", lat:-34.55893, lng:-58.44922},
    {n:"Sucre", lat:-34.55982, lng:-58.44830},
    {n:"La Pampa", lat:-34.56070, lng:-58.44700},
    {n:"José Hernández", corto:"J. Hernández", lat:-34.56102, lng:-58.44534},
    {n:"Virrey del Pino", corto:"V. del Pino", lat:-34.56134, lng:-58.44368},
    {n:"Virrey Loreto", corto:"V. Loreto", lat:-34.56166, lng:-58.44203},
    {n:"Zabala", lat:-34.56193, lng:-58.44058},
    {n:"Teodoro García", corto:"T. García", lat:-34.56230, lng:-58.43867},
    {n:"Federico Lacroze", corto:"Lacroze", lat:-34.56252, lng:-58.43751},
    {n:"Olleros", lat:-34.56280, lng:-58.43609},
    {n:"Dorrego", ancho:4, lat:-34.56950, lng:-58.42300}
  ],
  tramos: [
    {t:"chino", de:"Monroe", a:"La Pampa"},
    {t:"libertador", de:"La Pampa", a:"Olleros"},
    {t:"hipodromo", de:"Olleros", a:"Dorrego"}
  ],
  // Stops in walking order. "logo" draws the brand's isologo on the map instead of the dot.
  paradas: [
    {id:"tesla", n:"Tesla", corto:"Tesla", t:"libertador", donde:"Federico Lacroze", logo:CLIENTE.logo, marca:CLIENTE.nombre,
     lat:CLIENTE.lat, lng:CLIENTE.lng},
    {id:"pampa", n:"La Pampa & the tracks", corto:"La Pampa", t:"libertador", donde:"Start of Libertador",
     lat:-34.56070, lng:-58.44700},
    {id:"belgranoc", n:"Belgrano C · Barrio Chino", corto:"Barrio Chino", t:"chino", donde:"Juramento",
     lat:-34.55805, lng:-58.45001},
    {id:"monroe", n:"Monroe", corto:"Monroe", t:"chino", donde:"End of the route",
     lat:-34.55431, lng:-58.45329}
  ]
};

// Sections menu (☰ button in the top bar): number, name and the section id in index.html.
const SECCIONES = [
  {n:"01", t:"Welcome", id:"inicio"},
  {n:"02", t:"Manifesto", id:"manifiesto"},
  {n:"03", t:"The route", id:"recorrido-mapa"},
  {n:"04", t:"The story: before and after", id:"antes-despues"},
  {n:"05", t:"VIAVIVA today", id:"hoy"},
  {n:"06", t:"The three districts", id:"mapa"},
  {n:"07", t:"Libertador & Tesla", id:"libertador"},
  {n:"08", t:"Follow us", id:"seguinos"}
];
