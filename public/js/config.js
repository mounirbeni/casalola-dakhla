/* ==========================================================================
   Casa Lola · Kite House Dakhla — THE content file.
   Every name, price, text, policy and photo used by the public site, the
   guest portal and the admin comes from here. Change a value, reload, done.

   - Texts that change with the language are objects { fr, en, es }.
   - Values we could not verify with the owner are listed in TODO_CONFIRM
     (dotted paths). They show normally on the public site; in the admin
     "preview mode" they get a dotted underline + "Exemple à confirmer".
   - Photos: drop the file in public/img/<path> and add <path> to
     PHOTOS below. Until then a named placeholder box is shown.
   ========================================================================== */

export const TODO_CONFIRM = [
  'rooms.*.price', 'rooms.*.single', 'rooms.porto-rico.extra',
  'rooms.la-pointe-dor.size', 'rooms.la-pointe-dor.bed', 'rooms.rio-de-oro.size',
  'pricing.childPerNight', 'pricing.extraAdultPerNight', 'pricing.touristTax', 'pricing.eurToMad',
  'seasons', 'policies.checkIn', 'policies.checkOut', 'policies.cancellationDays',
  'policies.depositPct', 'policies.payOnArrival', 'policies.houseRules',
  'offers.longStay', 'offers.promoCodes', 'extras.transfer', 'extras.lateCheckout',
  'reviews.selected', 'partners',
];

/** Files that exist in img/. Add a path here once the photo is uploaded. */
export const PHOTOS = [
  'brand/logo.png',
  'home/hero-sunrise.jpg',
  'home/lola-portrait.jpg',
  'house/breakfast-table.jpg',
  'house/terrace.jpg',
  'house/rooftop.jpg',
  'house/garden.jpg',
  'house/kitchen.jpg',
  'house/lounge.jpg',
  'rooms/dune-blanche-1.jpg',
  'rooms/imlili-1.jpg',
  'rooms/la-pointe-dor-1.jpg',
  'rooms/la-sarga-1.jpg',
  'experiences/kitesurf.jpg',
  'experiences/4x4.jpg',
  'experiences/catamaran.jpg',
  'experiences/camel.jpg',
  'experiences/quad.jpg',
  'rooms/ile-du-dragon-1.jpg',
  'experiences/fishing.jpg',
  'rooms/dune-blanche-2.jpg',
  'rooms/dune-blanche-3.jpg',
  'rooms/porto-rico-1.jpg',
  'experiences/diving.jpg',
  'rooms/dune-blanche-4.jpg',
  'rooms/imlili-2.jpg',
  'experiences/yoga-terrace.jpg',
  'rooms/imlili-3.jpg',
  'experiences/dakhla-city.jpg',
  'rooms/imlili-4.jpg',
  'rooms/imlili-5.jpg',
  'rooms/dune-blanche-5.jpg',
  'rooms/la-pointe-dor-2.jpg',
  'dakhla/white-dune.jpg',
  'dakhla/lagoon.jpg',
  'rooms/la-pointe-dor-3.jpg',
  'rooms/la-pointe-dor-4.jpg',
  'rooms/la-pointe-dor-5.jpg',
  'gallery/06.jpg',
  'rooms/ile-du-dragon-2.jpg',
  'gallery/01.jpg',
  'rooms/ile-du-dragon-3.jpg',
  'rooms/rio-de-oro-2.jpg',
  'rooms/rio-de-oro-3.jpg',
  'rooms/rio-de-oro-4.jpg',
  'rooms/rio-de-oro-1.jpg',
  'rooms/la-sarga-2.jpg',
  'dakhla/surf-spot.jpg',
  'rooms/la-sarga-3.jpg',
  'gallery/02.jpg',
  'gallery/03.jpg',
  'gallery/05.jpg',
  'gallery/07.jpg',
  'gallery/16.jpg',
  'gallery/10.jpg',
  'gallery/08.jpg',
  'gallery/04.jpg',
  'gallery/13.jpg',
  'gallery/09.jpg',
  'gallery/11.jpg',
  'gallery/15.jpg',
  'gallery/20.jpg',
  'gallery/12.jpg',
  'gallery/21.jpg',
  'gallery/17.jpg',
  'gallery/18.jpg',
  'gallery/22.jpg',
  'instagram/01.jpg',
  'instagram/02.jpg',
  'instagram/03.jpg',
  'instagram/04.jpg',
  'instagram/05.jpg',
  'instagram/06.jpg',
  'gallery/14.jpg',
  'gallery/19.jpg',
  'gallery/23.jpg',
  'gallery/24.jpg',
  'rooms/porto-rico-2.jpg',
  'rooms/porto-rico-3.jpg',
  'rooms/porto-rico-4.jpg',
  'rooms/porto-rico-5.jpg',
  'rooms/ile-du-dragon-4.jpg',
  'rooms/ile-du-dragon-5.jpg',
  'rooms/la-sarga-5.jpg',
  'rooms/la-sarga-4.jpg',
  'rooms/rio-de-oro-5.jpg',
  'experiences/horse.jpg',
  'dakhla/dragon-island.jpg',
];

export const BRAND = {
  name: 'Casa Lola · Kite House Dakhla',
  short: 'Casa Lola',
  secondary: 'Kite House by Lola',
  aliases: ['Kite House Dakhla', 'Kite House by Lola', 'Casa Lola – Kite House Dakhla'],
  logo: 'brand/logo.png',
};

export const CONTACT = {
  phone: '+212 662-086484',
  whatsapp: '212662086484',
  emails: ['info@kitehousedakhla.com', 'kitehouseloladakhla@gmail.com'],
  address: 'Quartier Kassam, Dakhla 73000, Morocco',
  addressNote: {
    fr: 'Quartier résidentiel à l’entrée de la ville, au bord de la baie, à moins de 3 km du centre.',
    en: 'Residential neighbourhood at the city entrance, by the bay, less than 3 km from the centre.',
    es: 'Barrio residencial a la entrada de la ciudad, junto a la bahía, a menos de 3 km del centro.',
  },
  instagram: { handle: '@kitehouse.dakhla', url: 'https://www.instagram.com/kitehouse.dakhla/' },
  tripadvisor: { name: 'Kite House Lola Dakhla', url: 'https://www.tripadvisor.com/Search?q=Kite%20House%20Lola%20Dakhla' },
  website: 'kitehousedakhla.com',
  maps: 'https://www.google.com/maps/search/?api=1&query=Kite+House+Dakhla+Quartier+Kassam',
  reception: '24/7',
  airport: { code: 'VIL', minutes: 5 },
  congressKm: 2,
  centreKm: 3,
  timezone: 'Africa/Casablanca',
};

export const REVIEWS = {
  google: { rating: 4.8, count: 101, url: 'https://www.google.com/maps/search/?api=1&query=Kite+House+Dakhla', asOf: '2026' },
  // Owner to supply real texts. Never invent testimonials.
  selected: [
    { text: 'Review text to be provided by the owner', author: 'Guest name', country: '' },
    { text: 'Review text to be provided by the owner', author: 'Guest name', country: '' },
    { text: 'Review text to be provided by the owner', author: 'Guest name', country: '' },
  ],
};

/* ---------- Money ---------- */
export const PRICING = {
  currency: 'EUR',
  eurToMad: 10.8,            // TODO_CONFIRM
  childPerNight: 15,         // TODO_CONFIRM — child sharing Porto Rico
  extraAdultPerNight: 25,    // TODO_CONFIRM — 3rd adult in Porto Rico
  touristTax: 2,             // TODO_CONFIRM — € per adult per night, children exempt
};

/** Recurring seasons (MM-DD ranges, inclusive). The first matching season wins; 'low' is the fallback. */
export const SEASONS = [
  { id: 'high', name: { fr: 'Haute saison', en: 'High season', es: 'Temporada alta' }, ranges: [['10-01', '04-30'], ['07-15', '08-31']], mult: 1.2, minStay: 3 },
  { id: 'low', name: { fr: 'Basse saison', en: 'Low season', es: 'Temporada baja' }, ranges: [], mult: 1, minStay: 2 },
];

export const POLICIES = {
  checkIn: '14:00',
  checkOut: '11:00',
  cancellationDays: 7,       // free cancellation until N days before arrival
  depositPct: 30,
  payOnArrival: true,
  houseRules: {
    fr: ['Calme après 23:00 pour le repos de tous.', 'Maison non-fumeur à l’intérieur.', 'Animaux sur demande.', 'Le petit-déjeuner est servi à la table commune.'],
    en: ['Quiet hours after 11 pm so everyone can rest.', 'No smoking indoors.', 'Pets on request.', 'Breakfast is served at the communal table.'],
    es: ['Silencio después de las 23:00 para el descanso de todos.', 'No se fuma en el interior.', 'Mascotas bajo petición.', 'El desayuno se sirve en la mesa común.'],
  },
};

export const OFFERS = {
  longStay: { nights: 14, pct: 15 },  // remote-worker offer — demo
  promoCodes: [
    { code: 'BIENVENIDA10', pct: 10, from: null, to: null, maxUses: 50, uses: 0 },
    { code: 'KITE5', pct: 5, from: null, to: null, maxUses: 100, uses: 0 },
  ],
};

export const EXTRAS = {
  transfer: { price: 15, per: 'trip' },     // airport VIL ↔ house, per trip — TODO_CONFIRM
  lateCheckout: { price: 20, until: '14:00' }, // TODO_CONFIRM
};

/* ---------- Rooms (facts from the owner — keep exactly) ---------- */
// view: sea | garden | city · outdoor: balcony | terrace | garden-terrace | windows | none
export const ROOMS = [
  {
    slug: 'dune-blanche', name: 'Dune Blanche', size: 25, beds: 'king', capacity: 2, maxAdults: 2, view: 'sea', outdoor: 'balcony',
    price: 95, single: 80, active: true,
    floor: { fr: '1er étage, balcon vue mer', en: '1st floor, sea-view balcony', es: '1.ª planta, balcón con vistas al mar' },
    decor: { fr: 'Tons beiges, apaisants', en: 'Beige, soothing tones', es: 'Tonos beige, relajantes' },
    highlights: { fr: ['Vue sur la baie d’Oued Eddahab', 'Douche privative', 'Bureau'], en: ['View of Oued Eddahab Bay', 'En-suite shower', 'Writing desk'], es: ['Vistas a la bahía de Oued Eddahab', 'Ducha privada', 'Escritorio'] },
    amenities: ['bay', 'balcony', 'shower', 'desk', 'wifi', 'breakfast'],
  },
  {
    slug: 'imlili', name: 'Imlili', size: 22, beds: 'king', capacity: 2, maxAdults: 2, view: 'sea', outdoor: 'balcony',
    price: 85, single: 72, active: true,
    floor: { fr: '1er étage, balcon sur la baie', en: '1st floor, balcony over the bay', es: '1.ª planta, balcón sobre la bahía' },
    decor: { fr: 'Tons verts', en: 'Green tones', es: 'Tonos verdes' },
    highlights: { fr: ['Balcon sur la baie', 'Douche privative', 'Wi-Fi'], en: ['Balcony over the bay', 'En-suite shower', 'Wi-Fi'], es: ['Balcón sobre la bahía', 'Ducha privada', 'Wi-Fi'] },
    amenities: ['bay', 'balcony', 'shower', 'wifi', 'breakfast'],
  },
  {
    slug: 'la-pointe-dor', name: 'La Pointe d’Or', size: null, beds: null, capacity: 2, maxAdults: 2, view: 'sea', outdoor: 'terrace', suite: true,
    price: 120, single: 105, active: true,
    floor: { fr: 'Suite junior, grande terrasse avec accès direct à la mer', en: 'Junior suite, large terrace with direct access to the sea', es: 'Suite junior, gran terraza con acceso directo al mar' },
    decor: { fr: 'Tons chauds et bleus océan', en: 'Warm tones and ocean blues', es: 'Tonos cálidos y azules océano' },
    highlights: { fr: ['Accès direct à la mer', 'Coin salon avec canapé et table basse', 'Smart TV'], en: ['Direct access to the sea', 'Sitting area with sofa and low coffee table', 'Smart TV'], es: ['Acceso directo al mar', 'Zona de estar con sofá y mesa baja', 'Smart TV'] },
    amenities: ['sea-access', 'terrace', 'sofa', 'tv', 'bathroom', 'wifi', 'breakfast'],
  },
  {
    slug: 'la-sarga', name: 'La Sarga', size: 22, beds: 'king', capacity: 2, maxAdults: 2, view: 'sea', outdoor: 'garden-terrace',
    price: 90, single: 76, active: true,
    floor: { fr: 'Rez-de-chaussée, terrasse-jardin privée, vue sur la baie', en: 'Ground floor, own garden terrace, bay views', es: 'Planta baja, terraza-jardín propia, vistas a la bahía' },
    decor: { fr: 'Bleu, inspiré des barques de pêche traditionnelles', en: 'Blue, inspired by traditional fishing boats', es: 'Azul, inspirado en las barcas de pesca tradicionales' },
    highlights: { fr: ['Douche à l’italienne', 'Bureau', 'Wi-Fi'], en: ['En-suite walk-in shower', 'Desk', 'Wi-Fi'], es: ['Ducha a ras de suelo', 'Escritorio', 'Wi-Fi'] },
    amenities: ['bay', 'garden-terrace', 'walkin', 'desk', 'wifi', 'breakfast'],
  },
  {
    slug: 'ile-du-dragon', name: 'Île du Dragon', size: 22, beds: 'king', capacity: 2, maxAdults: 2, view: 'sea', outdoor: 'garden-terrace',
    price: 90, single: 76, active: true,
    floor: { fr: 'Rez-de-chaussée, terrasse-jardin, vue sur la baie', en: 'Ground floor, garden terrace, bay views', es: 'Planta baja, terraza-jardín, vistas a la bahía' },
    decor: { fr: 'Bordeaux chaleureux', en: 'Warm burgundy', es: 'Burdeos cálido' },
    highlights: { fr: ['Douche à l’italienne', 'Petit espace de travail', 'Wi-Fi'], en: ['Walk-in shower', 'Compact workspace', 'Wi-Fi'], es: ['Ducha a ras de suelo', 'Pequeña zona de trabajo', 'Wi-Fi'] },
    amenities: ['bay', 'garden-terrace', 'walkin', 'desk', 'wifi', 'breakfast'],
  },
  {
    slug: 'porto-rico', name: 'Porto Rico', size: 27, beds: 'king+single', capacity: 3, maxAdults: 3, view: 'city', outdoor: 'windows', family: true,
    price: 110, single: 90, extra: 25, active: true,
    floor: { fr: 'Deux grandes fenêtres, vues ville et baie', en: 'Two large windows, city and bay views', es: 'Dos grandes ventanales, vistas a la ciudad y a la bahía' },
    decor: { fr: 'Pastels doux', en: 'Soft pastels', es: 'Pasteles suaves' },
    highlights: { fr: ['Idéale pour une famille de trois', 'Salle de bain privative', 'Vues ville et baie'], en: ['Ideal for a family of three', 'Private bathroom', 'City and bay views'], es: ['Ideal para una familia de tres', 'Baño privado', 'Vistas a la ciudad y a la bahía'] },
    amenities: ['city-bay', 'bathroom', 'family', 'wifi', 'breakfast'],
  },
  {
    slug: 'rio-de-oro', name: 'Río de Oro', size: null, beds: 'twin', capacity: 2, maxAdults: 2, view: 'garden', outdoor: 'none',
    price: 80, single: 68, active: true,
    floor: { fr: 'Vue sur le jardin', en: 'Garden views', es: 'Vistas al jardín' },
    decor: { fr: 'Vert apaisant', en: 'Soothing green', es: 'Verde relajante' },
    highlights: { fr: ['Deux lits jumeaux', 'Bureau et canapé douillet', 'Salle de bain privative'], en: ['Two twin beds', 'Desk and cozy sofa', 'Private bathroom'], es: ['Dos camas individuales', 'Escritorio y sofá acogedor', 'Baño privado'] },
    amenities: ['garden', 'bathroom', 'desk', 'sofa', 'wifi', 'breakfast'],
  },
];

export const BED_LABEL = {
  king: { fr: 'Lit king size', en: 'King bed', es: 'Cama king size' },
  twin: { fr: '2 lits jumeaux', en: '2 twin beds', es: '2 camas individuales' },
  'king+single': { fr: 'Lit king + lit simple', en: 'King + single bed', es: 'Cama king + individual' },
};

export const AMENITIES = {
  bay: { icon: 'wave', fr: 'Vue sur la baie', en: 'Bay view', es: 'Vistas a la bahía' },
  'city-bay': { icon: 'window', fr: 'Vues ville et baie', en: 'City and bay views', es: 'Vistas ciudad y bahía' },
  garden: { icon: 'leaf', fr: 'Vue jardin', en: 'Garden view', es: 'Vistas al jardín' },
  balcony: { icon: 'balcony', fr: 'Balcon', en: 'Balcony', es: 'Balcón' },
  terrace: { icon: 'sun', fr: 'Grande terrasse', en: 'Large terrace', es: 'Gran terraza' },
  'garden-terrace': { icon: 'leaf', fr: 'Terrasse-jardin', en: 'Garden terrace', es: 'Terraza-jardín' },
  'sea-access': { icon: 'wave', fr: 'Accès direct à la mer', en: 'Direct sea access', es: 'Acceso directo al mar' },
  shower: { icon: 'drop', fr: 'Douche privative', en: 'En-suite shower', es: 'Ducha privada' },
  walkin: { icon: 'drop', fr: 'Douche à l’italienne', en: 'Walk-in shower', es: 'Ducha a ras de suelo' },
  bathroom: { icon: 'drop', fr: 'Salle de bain privative', en: 'Private bathroom', es: 'Baño privado' },
  desk: { icon: 'desk', fr: 'Bureau', en: 'Desk', es: 'Escritorio' },
  sofa: { icon: 'sofa', fr: 'Canapé', en: 'Sofa', es: 'Sofá' },
  tv: { icon: 'tv', fr: 'Smart TV', en: 'Smart TV', es: 'Smart TV' },
  family: { icon: 'family', fr: 'Familles (2 adultes + 1 enfant)', en: 'Families (2 adults + 1 child)', es: 'Familias (2 adultos + 1 niño)' },
  wifi: { icon: 'wifi', fr: 'Wi-Fi gratuit', en: 'Free Wi-Fi', es: 'Wi-Fi gratis' },
  breakfast: { icon: 'cup', fr: 'Petit-déjeuner inclus', en: 'Breakfast included', es: 'Desayuno incluido' },
};

/* ---------- The house ---------- */
export const HOUSE = {
  areas: [
    { id: 'breakfast', img: 'house/breakfast-table.jpg', fr: ['Petit-déjeuner à la table commune', 'Inclus dans chaque séjour, servi à une grande table où les voyageurs se rencontrent.'], en: ['Breakfast at the communal table', 'Included in every stay, served at one big table where travellers meet.'], es: ['Desayuno en la mesa común', 'Incluido en cada estancia, servido en una gran mesa donde los viajeros se conocen.'] },
    { id: 'terrace', img: 'house/terrace.jpg', fr: ['Grande terrasse sur la baie', 'Une terrasse ensoleillée face à la baie d’Oued Eddahab.'], en: ['Large terrace over the bay', 'A sunny terrace facing Oued Eddahab Bay.'], es: ['Gran terraza sobre la bahía', 'Una terraza soleada frente a la bahía de Oued Eddahab.'] },
    { id: 'rooftop', img: 'house/rooftop.jpg', fr: ['Rooftop avec vue', 'Pour le lever du soleil, un livre ou la fin de journée après le kite.'], en: ['Rooftop with a view', 'For sunrise, a book, or the end of a day on the water.'], es: ['Azotea con vistas', 'Para el amanecer, un libro o el final del día en el agua.'] },
    { id: 'garden', img: 'house/garden.jpg', fr: ['Petit jardin', 'Un coin vert et calme au rez-de-chaussée.'], en: ['Small garden', 'A quiet green corner on the ground floor.'], es: ['Pequeño jardín', 'Un rincón verde y tranquilo en la planta baja.'] },
    { id: 'kitchen', img: 'house/kitchen.jpg', fr: ['Cuisine partagée équipée', 'Entièrement équipée, pour cuisiner comme à la maison.'], en: ['Fully equipped shared kitchen', 'Everything you need to cook like at home.'], es: ['Cocina compartida equipada', 'Todo lo necesario para cocinar como en casa.'] },
    { id: 'lounge', img: 'house/lounge.jpg', fr: ['Salon et jeux de société', 'Jeux de société et Wi-Fi gratuit dans la plupart des espaces communs.'], en: ['Lounge and board games', 'Board games and free Wi-Fi in most common areas.'], es: ['Salón y juegos de mesa', 'Juegos de mesa y Wi-Fi gratis en la mayoría de zonas comunes.'] },
  ],
  services: [
    { icon: 'clock', fr: 'Réception et sécurité 24 h/24', en: '24-hour reception and security', es: 'Recepción y seguridad 24 h' },
    { icon: 'camera', fr: 'Caméras extérieures pour les véhicules', en: 'Exterior cameras watching vehicles', es: 'Cámaras exteriores para los vehículos' },
    { icon: 'moto', fr: 'Local sécurisé pour les motos', en: 'Secure storage for motorcycles', es: 'Garaje seguro para motos' },
    { icon: 'car', fr: 'Parking privé', en: 'Private parking', es: 'Aparcamiento privado' },
    { icon: 'wifi', fr: 'Wi-Fi gratuit dans toutes les chambres', en: 'Free Wi-Fi in all rooms', es: 'Wi-Fi gratis en todas las habitaciones' },
    { icon: 'drop', fr: 'Salle de bain privative dans chaque chambre', en: 'Private bathroom in every room', es: 'Baño privado en cada habitación' },
  ],
};

/* ---------- Experiences (with trusted local partners, on request) ---------- */
export const EXPERIENCES = [
  { id: 'watersports', img: 'experiences/kitesurf.jpg', icon: 'kite', fr: ['Sports nautiques', 'Surf, kitesurf et wing foil, débutants comme confirmés.'], en: ['Watersports', 'Surf, kitesurf and wing foil, beginners to experts.'], es: ['Deportes náuticos', 'Surf, kitesurf y wing foil, de principiante a experto.'] },
  { id: '4x4', img: 'experiences/4x4.jpg', icon: 'car', fr: ['Excursions 4×4 dans le désert', 'Là où le désert rencontre l’océan.'], en: ['4×4 desert excursions', 'Where the desert meets the ocean.'], es: ['Excursiones 4×4 por el desierto', 'Donde el desierto se encuentra con el océano.'] },
  { id: 'catamaran', img: 'experiences/catamaran.jpg', icon: 'boat', fr: ['Catamaran et bateaux de pêche', 'Croisières sur la baie de Dakhla.'], en: ['Catamaran and fishing boats', 'Cruises on Dakhla Bay.'], es: ['Catamarán y barcos de pesca', 'Cruceros por la bahía de Dakhla.'] },
  { id: 'quad', img: 'experiences/quad.jpg', icon: 'quad', fr: ['Quad ou buggy', 'Balades sur les pistes autour de Dakhla.'], en: ['Quad or buggy tours', 'Rides on the tracks around Dakhla.'], es: ['Quad o buggy', 'Rutas por las pistas alrededor de Dakhla.'] },
  { id: 'camel', img: 'experiences/camel.jpg', icon: 'camel', fr: ['Balade à dos de dromadaire', 'Un moment calme dans les dunes.'], en: ['Camel rides', 'A quiet moment in the dunes.'], es: ['Paseo en dromedario', 'Un momento tranquilo entre las dunas.'] },
  { id: 'fishing', img: 'experiences/fishing.jpg', icon: 'fish', fr: ['Journées de pêche', 'En mer ou depuis la côte.'], en: ['Fishing days', 'At sea or from the shore.'], es: ['Jornadas de pesca', 'En el mar o desde la costa.'] },
  { id: 'diving', img: 'experiences/diving.jpg', icon: 'mask', fr: ['Plongée', 'Découvrir les fonds de l’Atlantique.'], en: ['Diving', 'Discover the Atlantic underwater.'], es: ['Buceo', 'Descubre el fondo del Atlántico.'] },
  { id: 'yoga', img: 'experiences/yoga-terrace.jpg', icon: 'lotus', fr: ['Yoga sur la terrasse', 'Sur la terrasse de la maison, face à la baie.'], en: ['Yoga on the terrace', 'On the house terrace overlooking the bay.'], es: ['Yoga en la terraza', 'En la terraza de la casa, frente a la bahía.'] },
  { id: 'horse', img: 'experiences/horse.jpg', icon: 'horse', fr: ['Cheval ou poney', 'Débutants et enfants bienvenus.'], en: ['Horse or pony rides', 'Beginners and children welcome.'], es: ['Caballo o poni', 'Principiantes y niños bienvenidos.'] },
  { id: 'city', img: 'experiences/dakhla-city.jpg', icon: 'city', fr: ['Visite de Dakhla', 'Maison de l’Artisan, souk, marché local, jus et souvenirs.'], en: ['Visit Dakhla city', 'Artisan House, souk, local market, juices and souvenirs.'], es: ['Visita de Dakhla', 'Casa del Artesano, zoco, mercado local, zumos y recuerdos.'] },
];

export const PARTNERS = [
  { id: 'p1', name: 'Partner name (TBC)', activity: 'watersports', phone: '+212 6XX-XXXXXX', commission: 10 },
  { id: 'p2', name: 'Partner name (TBC)', activity: '4x4', phone: '+212 6XX-XXXXXX', commission: 10 },
  { id: 'p3', name: 'Partner name (TBC)', activity: 'catamaran', phone: '+212 6XX-XXXXXX', commission: 10 },
  { id: 'p4', name: 'Airport transfer (TBC)', activity: 'transfer', phone: '+212 6XX-XXXXXX', commission: 0 },
];

/* ---------- Dakhla guide ---------- */
export const DAKHLA = [
  { id: 'lagoon', img: 'dakhla/lagoon.jpg', fr: ['Vent et lagune', 'Un vent régulier toute l’année et une lagune calme et peu profonde, idéale pour débuter. Spots de vitesse et downwinds jusqu’à la Dune Blanche.'], en: ['Wind and lagoon', 'Steady wind all year round and a calm, shallow lagoon ideal for beginners. Speed spots and downwinds to the White Dune.'], es: ['Viento y laguna', 'Viento constante todo el año y una laguna tranquila y poco profunda, ideal para empezar. Spots de velocidad y downwinds hasta la Duna Blanca.'] },
  { id: 'surf', img: 'dakhla/surf-spot.jpg', fr: ['Surf sur l’Atlantique', 'Des vagues océaniques pour surfer, avec les spots d’Oum Lbouer et de La Sarga.'], en: ['Atlantic surf', 'Ocean waves for surfing, with the Oum Lbouer and La Sarga spots.'], es: ['Surf en el Atlántico', 'Olas oceánicas para surfear, con los spots de Oum Lbouer y La Sarga.'] },
  { id: 'dune', img: 'dakhla/white-dune.jpg', fr: ['La Dune Blanche', 'Une dune de sable blanc au milieu de la lagune, au bout des downwinds.'], en: ['The White Dune', 'A white sand dune in the middle of the lagoon, at the end of the downwinds.'], es: ['La Duna Blanca', 'Una duna de arena blanca en medio de la laguna, al final de los downwinds.'] },
  { id: 'dragon', img: 'dakhla/dragon-island.jpg', fr: ['Île du Dragon, Imlili et sources chaudes', 'L’île du Dragon, Imlili, les sources chaudes sulfureuses et le catamaran sur la baie.'], en: ['Dragon Island, Imlili and hot springs', 'Dragon Island, Imlili, the sulfur hot springs and catamaran trips on the bay.'], es: ['Isla del Dragón, Imlili y aguas termales', 'La isla del Dragón, Imlili, las aguas termales sulfurosas y el catamarán por la bahía.'] },
];
export const CLIMATE = {
  fr: 'Du soleil presque tous les jours et des températures douces : ici, le désert rencontre l’océan.',
  en: 'Sunshine almost every day and mild temperatures: this is where the desert meets the ocean.',
  es: 'Sol casi todos los días y temperaturas suaves: aquí el desierto se encuentra con el océano.',
};
export const GETTING_HERE = [
  { icon: 'plane', fr: ['En avion', 'Royal Air Maroc et Air Arabia depuis Casablanca et d’autres villes ; Transavia en direct depuis Paris. Aéroport de Dakhla (VIL) à environ 5 minutes.'], en: ['By plane', 'Royal Air Maroc and Air Arabia from Casablanca and other cities; Transavia direct from Paris. Dakhla airport (VIL) is about 5 minutes away.'], es: ['En avión', 'Royal Air Maroc y Air Arabia desde Casablanca y otras ciudades; Transavia directo desde París. El aeropuerto de Dakhla (VIL) está a unos 5 minutos.'] },
  { icon: 'bus', fr: ['En car', 'CTM et Supratours.'], en: ['By coach', 'CTM and Supratours.'], es: ['En autobús', 'CTM y Supratours.'] },
  { icon: 'car', fr: ['En voiture', 'Descendez vers le sud ; dans les 40 derniers kilomètres, prenez la route de Dakhla au panneau de la gendarmerie.'], en: ['By car', 'Drive south; in the last 40 km take the Dakhla road at the gendarmerie sign.'], es: ['En coche', 'Conduzca hacia el sur; en los últimos 40 km tome la carretera de Dakhla en el cartel de la gendarmería.'] },
];

/* ---------- FAQ ---------- */
export const FAQ = [
  { fr: ['Comment venir à Dakhla ?', 'En avion (Royal Air Maroc, Air Arabia depuis Casablanca et d’autres villes ; Transavia en direct depuis Paris), en car (CTM, Supratours) ou en voiture : dans les 40 derniers kilomètres, prenez la route de Dakhla au panneau de la gendarmerie.'], en: ['How do I get to Dakhla?', 'By plane (Royal Air Maroc, Air Arabia from Casablanca and other cities; Transavia direct from Paris), by coach (CTM, Supratours) or by car: in the last 40 km take the Dakhla road at the gendarmerie sign.'], es: ['¿Cómo llegar a Dakhla?', 'En avión (Royal Air Maroc, Air Arabia desde Casablanca y otras ciudades; Transavia directo desde París), en autobús (CTM, Supratours) o en coche: en los últimos 40 km tome la carretera de Dakhla en el cartel de la gendarmería.'] },
  { fr: ['Quel est l’aéroport le plus proche ?', 'L’aéroport de Dakhla (VIL), à environ 5 minutes de la maison.'], en: ['What is the nearest airport?', 'Dakhla airport (VIL), about 5 minutes from the house.'], es: ['¿Cuál es el aeropuerto más cercano?', 'El aeropuerto de Dakhla (VIL), a unos 5 minutos de la casa.'] },
  { fr: ['Y a-t-il du Wi-Fi ?', 'Oui, gratuit dans toutes les chambres et la plupart des espaces communs.'], en: ['Is there Wi-Fi?', 'Yes, free in all rooms and most common areas.'], es: ['¿Hay Wi-Fi?', 'Sí, gratis en todas las habitaciones y la mayoría de zonas comunes.'] },
  { fr: ['Quel voltage ?', '220 V. La plupart des appareils européens en 230 V fonctionnent ; prenez un adaptateur en cas de doute.'], en: ['What voltage?', '220 V. Most 230 V European devices work; bring an adaptor if unsure.'], es: ['¿Qué voltaje?', '220 V. La mayoría de aparatos europeos de 230 V funcionan; traiga un adaptador si tiene dudas.'] },
  { fr: ['Faut-il un visa ?', 'Cela dépend de votre nationalité. e-Visa via le portail « Accès Maroc » ; séjour touristique de 90 jours maximum.'], en: ['Do I need a visa?', 'It depends on your nationality. e-Visa via the “Accès Maroc” portal; maximum tourist stay 90 days.'], es: ['¿Necesito visado?', 'Depende de su nacionalidad. e-Visa a través del portal «Accès Maroc»; estancia turística máxima de 90 días.'] },
  { fr: ['Comment payer sur place ?', 'Visa et MasterCard sont largement acceptées, il y a des distributeurs partout, et des bureaux de change aux aéroports et dans les banques (passeport requis).'], en: ['How do I pay locally?', 'Visa and MasterCard are widely accepted, there are ATMs everywhere, and exchange offices at airports and banks (passport required).'], es: ['¿Cómo pagar allí?', 'Visa y MasterCard se aceptan ampliamente, hay cajeros por todas partes y casas de cambio en aeropuertos y bancos (pasaporte necesario).'] },
  { fr: ['Santé', 'Aucune vaccination particulière n’est exigée. Urgences médicales : 141.'], en: ['Health', 'No special vaccination is required. Medical emergency number: 141.'], es: ['Salud', 'No se exige ninguna vacuna especial. Urgencias médicas: 141.'] },
];
/** Booking FAQ — built from POLICIES so the numbers always match. {in} {out} {days} {deposit} */
export const BOOKING_FAQ = [
  { key: 'times', fr: ['Horaires d’arrivée et de départ', 'Arrivée à partir de {in}, départ avant {out}. La réception est ouverte 24 h/24.'], en: ['Check-in and check-out times', 'Check-in from {in}, check-out by {out}. Reception is open 24 hours.'], es: ['Horarios de entrada y salida', 'Entrada a partir de las {in}, salida antes de las {out}. Recepción abierta 24 h.'] },
  { key: 'cancel', fr: ['Puis-je annuler ?', 'Annulation gratuite jusqu’à {days} jours avant l’arrivée. Ensuite, l’acompte n’est pas remboursé.'], en: ['Can I cancel?', 'Free cancellation until {days} days before arrival. After that the deposit is not refunded.'], es: ['¿Puedo cancelar?', 'Cancelación gratuita hasta {days} días antes de la llegada. Después, el depósito no se reembolsa.'] },
  { key: 'pay', fr: ['Comment se passe le paiement ?', 'Acompte de {deposit} % en ligne pour confirmer, ou paiement à l’arrivée selon les dates. Le solde se règle sur place.'], en: ['How does payment work?', 'A {deposit}% deposit online to confirm, or pay on arrival depending on dates. The balance is paid at the house.'], es: ['¿Cómo funciona el pago?', 'Depósito del {deposit} % online para confirmar, o pago a la llegada según fechas. El resto se paga en la casa.'] },
];

/* ---------- Page texts ---------- */
export const TEXT = {
  heroTitle: { fr: 'Votre maison au bord de l’océan', en: 'Your home by the ocean', es: 'Tu casa junto al océano' },
  heroSub: {
    fr: 'Plus qu’un séjour. Maison familiale & authentique. Pour voyageurs, familles, télétravailleurs & passionnés de kite.',
    en: 'More than a stay. A family-run, authentic house. For travellers, families, remote workers & kite lovers.',
    es: 'Más que una estancia. Casa familiar y auténtica. Para viajeros, familias, teletrabajadores y amantes del kite.',
  },
  welcomeTitle: { fr: 'Bienvenue chez Lola', en: 'Welcome to Lola’s', es: 'Bienvenidos a casa de Lola' },
  welcomeBody: {
    fr: 'Lola est espagnole et vit à Dakhla depuis plusieurs années. Sa maison est petite, familiale et pensée pour qu’on s’y sente bien : petit-déjeuner partagé, conseils de quelqu’un d’ici, et une baie qui s’allume chaque matin sous vos fenêtres.',
    en: 'Lola is Spanish and has lived in Dakhla for several years. Her house is small, family-run and made for feeling good: a shared breakfast, tips from someone who lives here, and a bay that lights up every morning outside your window.',
    es: 'Lola es española y vive en Dakhla desde hace varios años. Su casa es pequeña, familiar y pensada para sentirse bien: desayuno compartido, consejos de alguien de aquí y una bahía que se ilumina cada mañana bajo tu ventana.',
  },
  welcomeQuote: { fr: '« Nous voulons que vous vous sentiez comme chez vous. »', en: '“We aim for you to feel right at home.”', es: '«Queremos que te sientas como en casa.»' },
  sunrise: {
    fr: 'Le moment signature : le lever du soleil sur la baie d’Oued Eddahab, depuis votre chambre.',
    en: 'The signature moment: sunrise over Oued Eddahab Bay, seen from your room.',
    es: 'El momento estrella: el amanecer sobre la bahía de Oued Eddahab, desde tu habitación.',
  },
  insiders: {
    fr: 'Nous sommes vos initiés locaux : restaurants, coins cachés et bonnes adresses, demandez-nous.',
    en: 'We’re your local insiders: restaurants, hidden gems and good addresses, just ask.',
    es: 'Somos tus expertos locales: restaurantes, rincones secretos y buenas direcciones, pregúntanos.',
  },
  notSchool: {
    fr: 'Kite House n’est pas une école de kite : les activités sont organisées avec nos partenaires locaux de confiance.',
    en: 'Kite House is not a kite school: activities are arranged with our trusted local partners.',
    es: 'Kite House no es una escuela de kite: las actividades se organizan con nuestros socios locales de confianza.',
  },
  whatsappHello: {
    fr: 'Bonjour Lola, je souhaite des informations pour un séjour à Casa Lola.',
    en: 'Hello Lola, I would like information about a stay at Casa Lola.',
    es: 'Hola Lola, quisiera información para una estancia en Casa Lola.',
  },
};

export const AUDIENCES = [
  { id: 'families', icon: 'family', fr: ['Familles', 'Porto Rico accueille une famille de trois, jardin et jeux de société pour tous.'], en: ['Families', 'Porto Rico sleeps a family of three, with a garden and board games for everyone.'], es: ['Familias', 'Porto Rico acoge a una familia de tres, con jardín y juegos de mesa para todos.'] },
  { id: 'remote', icon: 'desk', fr: ['Télétravailleurs', 'Wi-Fi gratuit, bureaux en chambre et une offre long séjour.'], en: ['Remote workers', 'Free Wi-Fi, desks in the rooms and a long-stay offer.'], es: ['Teletrabajadores', 'Wi-Fi gratis, escritorios en las habitaciones y oferta de larga estancia.'] },
  { id: 'kite', icon: 'kite', fr: ['Kite & sports nautiques', 'Local sécurisé, vent toute l’année et partenaires de confiance.'], en: ['Kite & watersports', 'Secure storage, wind all year and trusted partners.'], es: ['Kite y deportes náuticos', 'Almacén seguro, viento todo el año y socios de confianza.'] },
  { id: 'business', icon: 'brief', fr: ['Voyages d’affaires', 'À environ 2 km du Palais des Congrès de Dakhla, Wi-Fi et bureau.'], en: ['Business travel', 'About 2 km from Dakhla’s Congress Palace, Wi-Fi and a desk.'], es: ['Viajes de negocios', 'A unos 2 km del Palacio de Congresos de Dakhla, Wi-Fi y escritorio.'] },
];

export const GALLERY = Array.from({ length: 24 }, (_, i) => {
  const n = String(i + 1).padStart(2, '0');
  const cats = ['rooms', 'terrace', 'breakfast', 'dakhla', 'kite'];
  const ratios = ['3/2', '4/5', '1/1', '3/2', '4/5', '3/2'];
  return { file: `gallery/${n}.jpg`, cat: cats[i % 5], ratio: ratios[i % 6], alt: { fr: `Photo ${n}`, en: `Photo ${n}`, es: `Foto ${n}` } };
});
export const GALLERY_CATS = {
  rooms: { fr: 'Chambres', en: 'Rooms', es: 'Habitaciones' },
  terrace: { fr: 'Terrasse & rooftop', en: 'Terrace & rooftop', es: 'Terraza y azotea' },
  breakfast: { fr: 'Petit-déjeuner', en: 'Breakfast', es: 'Desayuno' },
  dakhla: { fr: 'Dakhla', en: 'Dakhla', es: 'Dakhla' },
  kite: { fr: 'Kite', en: 'Kite', es: 'Kite' },
};

/* ---------- Legal (placeholders to be replaced by the owner's texts) ---------- */
export const LEGAL = {
  mentions: { title: { fr: 'Mentions légales', en: 'Legal notice', es: 'Aviso legal' }, body: { fr: 'Texte à fournir : raison sociale, adresse, numéro d’enregistrement, responsable de publication, hébergeur.', en: 'Text to be provided: company name, address, registration number, publisher, host.', es: 'Texto a facilitar: razón social, dirección, número de registro, responsable de la publicación, alojamiento web.' } },
  privacy: { title: { fr: 'Confidentialité', en: 'Privacy', es: 'Privacidad' }, body: { fr: 'Texte à fournir : données collectées (réservation, fiche de police), finalités, durée de conservation, droits d’accès et de suppression, contact.', en: 'Text to be provided: data collected (booking, police register), purposes, retention, access and deletion rights, contact.', es: 'Texto a facilitar: datos recogidos (reserva, ficha de policía), finalidades, conservación, derechos de acceso y supresión, contacto.' } },
  terms: { title: { fr: 'Conditions de réservation', en: 'Booking terms', es: 'Condiciones de reserva' }, body: { fr: 'Texte à fournir : acompte, annulation, arrivée et départ, taxe de séjour, règlement intérieur.', en: 'Text to be provided: deposit, cancellation, check-in and check-out, tourist tax, house rules.', es: 'Texto a facilitar: depósito, cancelación, entrada y salida, tasa turística, normas de la casa.' } },
};

/* ---------- WhatsApp / email templates. {name} {ref} {from} {to} {room} {review} ---------- */
export const TEMPLATES = {
  confirmation: { fr: 'Bonjour {name}, votre séjour à Casa Lola est confirmé ✔ Réf. {ref}, chambre {room}, du {from} au {to}. À très vite à Dakhla ! Lola', en: 'Hello {name}, your stay at Casa Lola is confirmed ✔ Ref. {ref}, room {room}, from {from} to {to}. See you soon in Dakhla! Lola', es: 'Hola {name}, tu estancia en Casa Lola está confirmada ✔ Ref. {ref}, habitación {room}, del {from} al {to}. ¡Hasta pronto en Dakhla! Lola' },
  directions: { fr: 'Bonjour {name}, voici comment nous trouver : Quartier Kassam, à l’entrée de Dakhla, au bord de la baie. Carte : {maps}', en: 'Hello {name}, here is how to find us: Quartier Kassam, at the entrance of Dakhla, by the bay. Map: {maps}', es: 'Hola {name}, así nos encuentras: Quartier Kassam, a la entrada de Dakhla, junto a la bahía. Mapa: {maps}' },
  prearrival: { fr: 'Bonjour {name}, votre arrivée approche ({from}). Pouvez-vous remplir le formulaire avant arrivée (heure, vol, pièce d’identité) dans votre espace client ? Merci !', en: 'Hello {name}, your arrival is coming up ({from}). Could you fill in the pre-arrival form (time, flight, ID) in your guest area? Thank you!', es: 'Hola {name}, tu llegada se acerca ({from}). ¿Puedes rellenar el formulario previo (hora, vuelo, documento) en tu área de cliente? ¡Gracias!' },
  thanks: { fr: 'Merci {name} pour votre séjour à Casa Lola ! Si vous avez aimé, un avis nous aide beaucoup : {review}', en: 'Thank you {name} for staying at Casa Lola! If you enjoyed it, a review helps us a lot: {review}', es: '¡Gracias {name} por tu estancia en Casa Lola! Si te gustó, una reseña nos ayuda mucho: {review}' },
};

/* ---------- Demo accounts ---------- */
export const USERS = [
  { email: 'lola@demo', pin: '2468', name: 'Lola', role: 'owner' },
  { email: 'reception@demo', pin: '1357', name: 'Réception', role: 'reception' },
];
export const DEMO_GUEST = { ref: 'CL-2026-0042', email: 'guest@demo.com' };

export const CONTACT_QUESTION = {
  q: { fr: 'Dans quelle ville marocaine se trouve Kite House Dakhla ?', en: 'In which Moroccan city is Kite House Dakhla located?', es: '¿En qué ciudad marroquí se encuentra Kite House Dakhla?' },
  answer: 'dakhla',
};

export const LANGS = { fr: 'Français', en: 'English', es: 'Español' };
