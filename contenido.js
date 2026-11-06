/* ================== CONTENIDO EDITABLE ================== */
// Link al Google Form de la encuesta. null = muestra el aviso de link pendiente.
const FORM_URL = "https://forms.gle/2uebhuV4jw96VXx39";

const TRAMOS = {
  chino:{nombre:"VIAVIVA Barrio Chino",color:"--t-chino",logo:"lg-chino",calles:"Monroe a Sucre"},
  libertador:{nombre:"VIAVIVA Libertador",color:"--t-lib",logo:"lg-lib",calles:"La Pampa a Olleros"},
  hipodromo:{nombre:"VIAVIVA Hipódromo",color:"--t-hip",logo:"lg-hip",calles:"Olleros a Dorrego"}
};
const CALLES = [
  {n:"Monroe",y:40},{n:"Mendoza",y:120},{n:"Juramento",y:175},{n:"Echeverría",y:225},
  {n:"Sucre",y:280},{n:"La Pampa",y:340},{n:"Olleros",y:470},{n:"Dorrego",y:585}
];
const SEG = [{t:"chino",y1:40,y2:280},{t:"libertador",y1:340,y2:470},{t:"hipodromo",y1:470,y2:585}];
const PUNTOS = [
  {id:"chino",t:"chino",y:120,label:"Barrio Chino",
   titulo:"La puerta de entrada",
   texto:"Es el tramo más conocido y el primero que abrió, en 2023. Tiene cocina china, coreana y japonesa, bubble tea, cafés, heladerías y tiendas. Es sede del Año Nuevo Chino.",
   items:["Centro de Información Turística en cuatro idiomas","Parada del bus turístico"]},
  {id:"belgranoc",t:"chino",y:175,label:"Belgrano C",sub:"(estación)",
   titulo:"La estación que subió",
   texto:"Con el viaducto, la estación Belgrano C quedó elevada: toda techada, con un andén de 220 metros, ascensores y escaleras mecánicas.",
   items:["La barrera de Juramento ya no existe","Desde el andén se ve el paseo desde arriba"]},
  {id:"pampa",t:"libertador",y:340,label:"La Pampa y la vía",
   titulo:"La barrera más famosa",
   texto:"De este cruce viene el dicho “estar en Pampa y la vía”: la historia está acá abajo. En mayo de 2019 la calle La Pampa se reabrió por debajo del tren.",
   items:["Acá empieza el tramo Libertador"]},
  {id:"lisandro",t:"libertador",y:378,label:"Lisandro de la Torre",sub:"(estación)",
   titulo:"La otra estación que subió",
   texto:"Como Belgrano C, la estación Lisandro de la Torre quedó en altura con el viaducto: está elevada a 9,5 metros y tiene un techo abovedado.",
   items:["Es la estación del tramo Libertador"]},
  {id:"libertador",t:"libertador",y:432,label:"Libertador",
   titulo:"La experiencia premium",
   texto:"Ocho cuadras para comer, vestirte, salir de noche, jugar en la Plaza Bolivia renovada y conocer los autos de Audi, Volvo y Land Rover. Y vienen nuevas aperturas.",
   items:["Plaza Bolivia con juegos y calesita","Audi, Volvo, Land Rover y Michelin"]},
  {id:"hipodromo",t:"hipodromo",y:528,label:"Hipódromo",sub:"(próximamente)",
   titulo:"La noche al aire libre",
   texto:"Entre Olleros y Dorrego, junto a los Bosques de Palermo: entretenimiento, gastronomía y planes al aire libre.",
   items:["Próximamente"]}
];

const PAR = {antes:"assets/obra-01-baldio.jpg", despues:"assets/obra-06-hoy-noche.jpg", tagA:"Antes", tagD:"Hoy", titulo:"Del terreno vacío al punto de encuentro"};
const STEPS = [
  {img:"assets/obra-01-baldio.jpg", t:"El terreno", p:"Con el tren ya arriba, abajo quedaron tierra, pastizal y paredones.", of:null},
  {img:"assets/obra-03-estructura.jpg", t:"La estructura", p:"Columnas y techos: aparece la forma de los locales y del pasaje.", of:"Ingeniería y obra"},
  {img:"assets/obra-02-instalaciones.jpg", t:"Lo que va bajo el piso", p:"Se abre el piso para lo que después no se ve: desagües, cloacas, agua y electricidad.", of:"Instalaciones"},
  {img:"assets/obra-05-terminaciones.jpg", t:"Las terminaciones", p:"Piso, vidrios, plantas y luz. Falta poco para abrir.", of:"Arquitectura y diseño"},
  {img:"assets/obra-06-hoy-noche.jpg", t:"Hoy", p:"Más vida en tu ciudad y un lugar para encontrarse y descubrir.", of:"Marca y comunicación", last:true}
];

// Intereses para "¿Dónde encajarías vos?"
const INTERESES = [
  {id:"construir", t:"Construir y resolver problemas"},
  {id:"disenar", t:"Dibujar y diseñar espacios"},
  {id:"tecno", t:"La tecnología y la energía"},
  {id:"organizar", t:"Organizar y que todo funcione"},
  {id:"numeros", t:"Los números y los negocios"},
  {id:"atender", t:"Cocinar y atender gente"},
  {id:"contar", t:"Contar historias, redes y eventos"}
];
const GRUPOS = [
  {n:"1", titulo:"Construirlo desde cero", oficios:[
    {titulo:"Arquitectura y diseño", int:["disenar"],
     texto:"Imaginan cómo va a ser el paseo debajo del viaducto: dónde van los locales, las plazas, la luz, la sombra y los lugares para sentarse.",
     carreras:["Arquitectura","Urbanismo","Diseño de interiores","Paisajismo"]},
    {titulo:"Ingeniería y obra", int:["construir"],
     texto:"Hacen que lo diseñado se pueda construir y sea seguro: estructuras, columnas y techos, en plena ciudad y con el tren pasando arriba.",
     carreras:["Ingeniería civil","Maestro mayor de obras","Seguridad e higiene"]},
    {titulo:"Instalaciones", int:["tecno","construir"],
     texto:"Todo lo que va por debajo y por dentro: electricidad, agua, desagües, iluminación y conexión a internet.",
     carreras:["Ingeniería eléctrica","Técnico electricista","Instalaciones sanitarias","Diseño de iluminación"]}
  ]},
  {n:"2", titulo:"Hacerlo funcionar todos los días", oficios:[
    {titulo:"Operaciones", int:["organizar","tecno"],
     texto:"Limpieza, seguridad, mantenimiento y gestión de residuos. Es el trabajo que hace que el paseo esté listo a la mañana y siga cuidado a la noche.",
     carreras:["Logística","Seguridad","Mantenimiento","Gestión ambiental"]}
  ]},
  {n:"3", titulo:"Darle vida", oficios:[
    {titulo:"Negocio y gestión", int:["numeros","organizar"],
     texto:"Deciden qué locales hay, alquilan los espacios, coordinan a los socios y sostienen la relación con el Estado y con los vecinos.",
     carreras:["Administración","Economía","Derecho","Relaciones institucionales"]},
    {titulo:"Gastronomía y comercio", int:["atender","numeros"],
     texto:"Los más de 100 locales: quienes cocinan, atienden y venden todos los días. Cada uno es un negocio propio, con su equipo.",
     carreras:["Gastronomía","Hotelería","Administración","Emprendimientos"]},
    {titulo:"Marca y comunicación", int:["contar"],
     texto:"Redes, eventos, festivales y acciones con marcas como Samsung, Netflix o Brahma. Cuentan qué pasa en VIAVIVA y le dan a la gente motivos para volver.",
     carreras:["Comunicación","Publicidad","Marketing","Diseño gráfico","Producción audiovisual"]}
  ]}
];

// Preguntas de la trivia. La clave (TRIVIA_KEY) se usa solo en modo práctica:
// con Supabase corrige el servidor y la versión publicada no la incluye.
const TRIVIA = [
  {q:"¿Cuánto mide VIAVIVA de punta a punta?",o:["4,5 km","1,5 km","12 km"],fb:"4,5 km bajo las vías del Mitre."},
  {q:"¿Cuántas barreras eliminó el Viaducto Mitre?",o:["3","15","8"],fb:"8: Monroe, Blanco Encalada, Mendoza, Juramento, Olazábal, Sucre, La Pampa y Olleros."},
  {q:"¿Cuántas personas visitan VIAVIVA por día?",o:["Entre 2.500 y 3.500","Entre 25.000 y 35.000","Más de 300.000"],fb:"Entre 25.000 y 35.000 por día: cerca de 1.000.000 por mes."},
  {q:"¿Entre qué calles está VIAVIVA?",o:["Monroe y Dorrego","Cabildo y Libertador","Juramento y Sucre"],fb:"De Monroe, en Belgrano, a Dorrego, en Palermo."},
  {q:"¿Qué tramo de VIAVIVA tiene nuevas aperturas próximamente?",o:["Barrio Chino","Hipódromo","Libertador"],fb:"Libertador, donde además están Audi, Volvo, Land Rover y Michelin."},
  {q:"Si alguien “está en Pampa y la vía”, ¿qué le pasa?",o:["Está perdido","Llega tarde","Está sin un peso"],fb:"Está sin un peso. Viene de los apostadores que volvían del hipódromo y bajaban del tranvía en ese cruce."},
  {q:"¿En qué año el tren empezó a pasar por arriba, por el viaducto?",o:["2009","2019","2023"],fb:"En 2019. Ahí desaparecieron las barreras."},
  {q:"¿Cuál fue el primer tramo de VIAVIVA en abrir?",o:["Libertador","Barrio Chino","Hipódromo"],fb:"Barrio Chino, en 2023."},
  {q:"¿A cuántas personas beneficia el Viaducto Mitre?",o:["65.000","6.500.000","650.000"],fb:"Unas 650.000: pasajeros, conductores, gente que viaja en colectivo y vecinos."},
  {q:"¿Qué estación de tren está en el tramo Barrio Chino?",o:["Belgrano C","Lisandro de la Torre","Retiro"],fb:"Belgrano C. Lisandro de la Torre está en el tramo Libertador."}
];
const TRIVIA_KEY = null; // la corrige Supabase

const CONOCIAS = [
  {id:"seguido", t:"Sí, vengo seguido", r:"Entonces ya sabés que siempre hay algo nuevo. Contanos qué te trae."},
  {id:"alguna", t:"Vine alguna vez", r:"Hay mucho más para descubrir. Contanos qué plan te haría volver."},
  {id:"primera", t:"Es la primera vez", r:"Te damos la bienvenida a VIAVIVA. Contanos qué te gustaría encontrar."}
];

// Encuesta dentro de la página (se guarda en la hoja "Encuesta" de la planilla).
const ENCUESTA = [
  {id:"conocias", q:"¿Ya conocías VIAVIVA?", type:"single", req:true, o:["Sí, vengo seguido","Vine alguna vez","Es la primera vez"]},
  {id:"tramo", q:"Si ya viniste, ¿a qué parte fuiste?", type:"multi", req:false, o:["VIAVIVA Barrio Chino","VIAVIVA Libertador","No me acuerdo"]},
  {id:"conquien", q:"¿Con quién vendrías?", type:"multi", req:true, o:["Con amigos","Con mi familia","En pareja","Solo/a"]},
  {id:"plan", q:"¿Qué plan te traería a VIAVIVA?", type:"multi", req:true, other:true, o:["Comer algo rico","Merendar (bubble tea, café, helado)","Compras","Festivales y eventos","K-pop, anime y cultura asiática","Sacar fotos o hacer contenido","Salir de noche","Estar al aire libre"]},
  {id:"cuando", q:"¿Cuándo vendrías?", type:"multi", req:true, o:["Después del colegio","Fin de semana, de día","Fin de semana, de noche","En vacaciones"]},
  {id:"donde", q:"¿Dónde te enterás de planes para salir?", type:"multi", req:true, other:true, o:["TikTok","Instagram","Por amigos","Grupos de WhatsApp","YouTube"]},
  {id:"sigue", q:"¿Seguís a VIAVIVA en redes?", type:"single", req:true, o:["Sí","No","Ahora sí"]},
  {id:"gusto", q:"¿Qué fue lo que más te gustó de la recorrida?", type:"short", req:false},
  {id:"falta", q:"¿Qué le falta a VIAVIVA, o a Buenos Aires, para la gente de tu edad?", type:"long", req:false},
  {id:"edad", q:"¿Cuántos años tenés?", type:"single", req:true, o:["13 o 14","15 o 16","17 o 18"]}
];

// Recorrida del día: barra fija arriba con todo VIAVIVA (calles y tramos), las paradas de la visita
// y el punto "Vos" por GPS (lógica en recorrida.js). null = sin barra.
// lat/lng: en Google Maps, mantener apretado el lugar → copiar las coordenadas.
const RECORRIDA = {
  titulo: "Recorrida de hoy",
  inicio: "Recorrida: de Lacroze a Monroe",
  // Calles en orden, de Monroe a Dorrego, con el cruce de cada una con las vías (aproximado).
  // ancho: cuántas cuadras ocupa en la barra el tramo que llega a esa calle (Olleros–Dorrego es largo).
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
  // Paradas en el orden en que se caminan.
  paradas: [
    {id:"obrador", n:"El obrador", corto:"Obrador", t:"libertador", donde:"Federico Lacroze",
     lat:-34.56252, lng:-58.43751},
    {id:"mcdonalds", n:"McDonald’s", corto:"McDonald’s", t:"libertador", donde:"VIAVIVA Libertador",
     lat:-34.56037, lng:-58.44622},
    {id:"nana", n:"Nana Worlds", corto:"Nana Worlds", t:"chino", donde:"VIAVIVA Barrio Chino",
     lat:-34.55836, lng:-58.44995},
    {id:"monroe", n:"Monroe", corto:"Monroe", t:"chino", donde:"Fin del recorrido",
     lat:-34.55431, lng:-58.45329}
  ]
};

// Menú de secciones (botón ☰ de la barra de arriba): número, nombre y el id de la sección en index.html.
const SECCIONES = [
  {n:"01", t:"Bienvenida", id:"inicio"},
  {n:"02", t:"Manifiesto", id:"manifiesto"},
  {n:"03", t:"Así es el recorrido", id:"recorrido-mapa"},
  {n:"04", t:"La historia: antes y después", id:"antes-despues"},
  {n:"05", t:"Backstage: ¿quién hace VIAVIVA?", id:"oficios"},
  {n:"06", t:"¿Qué es VIAVIVA hoy?", id:"hoy"},
  {n:"07", t:"Los tramos y el mapa", id:"mapa"},
  {n:"08", t:"Trivia", id:"trivia"},
  {n:"09", t:"Tu opinión", id:"opinion"},
  {n:"10", t:"Seguinos", id:"seguinos"}
];
