// Palabras para los ejercicios de acentuación (Català, 6è). Cada una, separada
// en sílabas con "-" (como se separa en catalán: car-re-te-ra, síl-la-ba,
// ca-nya). La sílaba tónica: la del acento gráfico o, si no lleva, la marcada
// con "*". accents.test.js comprueba que cada palabra cumple las normas de
// acentuación del IEC (agudes, planes, esdrúixoles), así que una errata en
// esta lista hace fallar el test. Si la e o la o es abierta o cerrada (è/é,
// ò/ó) no se puede comprobar con reglas: sigue la Ortografia catalana (IEC
// 2016) y el catalán central.
//
// Muchas palabras salen del dossier de clase (docs/catala/temari-accents-6e.md).

export const PARAULES = [
  // ---- Agudes amb accent ----
  'so-fà', 'de-mà', 'a-llà', 'gim-nàs', 'ca-ta-là', 'com-pàs', 'ger-mà',
  'ca-fè', 'pa-gès', 'an-glès', 'in-te-rès', 'fran-cès', 'ac-cés', 'be-bè', 'mer-cè', 'per-què', 'vos-tè', 'se-tè', 'cin-què',
  'tam-bé', 'des-prés', 'no-més', 'pu-ré', 'en-tén', 'man-té', 'com-prèn',
  'a-quí', 'ca-mí', 'ma-tí', 've-í', 'pa-ís', 'vi-o-lí', 'ra-to-lí', 'pa-drí', 'a-nís', 'do-fí', 'co-ixí', 'pin-güí', 'es-quí',
  'pe-rò', 'ai-xò', 'a-llò', 'ar-ròs',
  'can-çó', 'ca-mi-ó', 'ra-ó', 'pe-tó', 'to-va-lló', 'bo-tó', 'a-vi-ó', 'cin-tu-ró', 'me-ló', 'lle-ó', 'gra-ó', 'ra-có', 'fa-mós', 'ge-lós', 'ner-vi-ós', 'qües-ti-ó', 're-u-ni-ó', 'ma-ra-tó',
  'nin-gú', 'co-mú', 'al-gú',
  // ---- Agudes sense accent ----
  'car-*rer', 'pa-*rent', 'car-*tell', 'con-*tent', 'cui-*ner', 'in-fan-*til', 'fe-*liç', 'bo-*let', 'per-ru-*quer', 're-*fresc', 'fer-ro-car-*ril', 'per-*nil',
  'ca-ra-*gol', 'mal-*son', 'pin-*tor', 'es-*port', 'ca-*mell', 'co-*lom', 'a-ni-*mal', 'pa-*per', 'fa-*nal', 'res-tau-*rant', 'ga-ni-*vet', 'ca-*vall',
  'hi-*vern', 'or-di-na-*dor', 'ca-*mins', 'en-ci-*am', 'co-*et', 'ra-*ïm', 'ta-*üt', 'a-gra-*ir', 'con-du-*ir', 'ju-li-*ol', 'xo-co-*lat', 'es-*tiu',
  'a-*vui', 'per-pen-di-cu-*lar', 're-*mei', 'es-*criu', 'di-*jous', 'tre-*ball', 'pas-*sat', 'ta-*ron-ja',
  // ---- Planes sense accent ----
  '*ca-sa', '*tau-la', '*llen-gua', '*ai-gua', 'pa-*rau-les', '*cur-sa', '*plu-ja', 'vai-*xe-lla', 'cas-*ta-nya', 'mar-ga-*ri-da', 'e-*xa-men', '*jo-ves',
  'mun-*ta-nya', 'fi-*nes-tra', 'pis-*sar-ra', '*bo-ca', 'car-re-*te-ra', '*ter-ra', '*mas-sa', 'pi-*ja-ma', 'pa-*e-lla', 'te-*a-tre', 'po-*e-ma', 'pi-*a-no',
  '*di-a', '*ma-re', '*pa-re', '*can-ten', '*lla-pis', '*ai-gües', '*llen-gües', 'pa-*ï-sos', 've-*ï-na', 'con-du-*ï-a', '*boi-na', '*qua-dre', '*quo-ta',
  'pai-*sat-ge', 'es-*ca-la', 'ca-*mi-sa', '*ar-bre', 'ca-*de-ra',
  // ---- Planes amb accent ----
  'fà-cil', 'ú-til', 'lò-gic', 'àl-bum', 'ca-ràc-ter', 'òr-gan', 'mò-bil', 'pòs-ter', 'tò-rax', 'dè-bil', 'àn-gel', 'pèn-dol', 'es-tò-mac',
  'cér-vol', 'créi-xer', 'néi-xer', 'té-mer', 'mà-nec', 'bà-sic', 'ú-nic', 'te-lè-fon', 'plà-tan', 'àn-ec', 'cà-non', 'cò-mic', 'cór-rer',
  // ---- Esdrúixoles ----
  'mú-si-ca', 'fan-tàs-ti-ca', 'llàs-ti-ma', 'tò-ni-ca', 'à-to-na', 'pès-si-ma', 'dè-ci-ma', 'cà-me-ra', 'càr-re-ga', 'mè-to-de', 'pà-gi-na', 'nú-me-ro',
  'pel-lí-cu-la', 'síl-la-ba', 'ma-te-mà-ti-ques', 'ce-rà-mi-ca', 'ò-pe-ra', 'fa-mí-li-a', 'grà-ci-a', 'his-tò-ri-a', 'ci-èn-ci-a', 'quí-mi-ca', 'làm-pa-da',
  'fór-mu-la', 'pól-vo-ra', 'es-glé-si-a', 'ma-tè-ri-a', 'rà-pi-da', 'ú-ni-ca', 'es-tà-tu-a', 'grà-fi-ca', 'cò-mo-da', 'te-lè-fons',
]

// Dièresi: [ben escrita, mal escrita]. Lleva dièresi para marcar un hiato
// (veïna) o que la u suena (pingüí, qüestió); no la llevan los infinitivos,
// gerundios, futuros y condicionales en -ir, ni -isme/-ista, ni detrás de un
// prefijo, ni -um/-us.
export const DIERESI = [
  ['veïna', 'veina'],
  ['raïm', 'raim'],
  ['països', 'paisos'],
  ['taüt', 'taut'],
  ['pingüí', 'pinguí'],
  ['aigües', 'aigues'],
  ['qüestió', 'questió'],
  ['llengües', 'llengues'],
  ['conduïa', 'conduia'],
  ['ruïna', 'ruina'],
  ['oïda', 'oida'],
  ['beneït', 'beneit'],
  ['Raül', 'Raul'],
  ['agrair', 'agraïr'],
  ['conduir', 'conduïr'],
  ['traduint', 'traduïnt'],
  ['traduiré', 'traduïré'],
  ['egoisme', 'egoïsme'],
  ['egoista', 'egoïsta'],
  ['reunió', 'reünió'],
  ['coincidir', 'coïncidir'],
  ['aquàrium', 'aquàrïum'],
  ['aigua', 'aigüa'],
  ['quota', 'qüota'],
  ['paraigua', 'paraigüa'],
]
