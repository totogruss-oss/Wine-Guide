export const PREDEFINED_REBSORTEN = [
  "Albariño", "Bacchus", "Barbera", "Blaufränkisch", "Cabernet Franc", "Cabernet Sauvignon", 
  "Carmenère", "Chardonnay", "Chenin Blanc", "Corvina", "Dornfelder", "Garganega", 
  "Garnacha (Grenache)", "Gewürztraminer", "Glera", "Grauburgunder (Pinot Gris)", 
  "Grüner Veltliner", "Gutedel", "Kerner", "Lemberger (Blaufränkisch)", "Macabeo", 
  "Malbec", "Merlot", "Montepulciano", "Morio-Muskat", "Müller-Thurgau (Rivaner)", 
  "Muscat", "Muskateller", "Nebbiolo", "Nero d'Avola", "Pinot Blanc", "Pinot Grigio", 
  "Pinot Noir", "Portugieser", "Primitivo (Zinfandel)", "Regent", "Riesling", 
  "Sangiovese", "Sauvignon Blanc", "Scheurebe", "Schwarzriesling", "Silvaner", 
  "Spätburgunder", "Syrah (Shiraz)", "Tempranillo", "Trebbiano", "Trollinger", 
  "Verdejo", "Viognier", "Weißburgunder", "Welschriesling", "Zweigelt"
];

export const PREDEFINED_ANBAUGEBIETE = [
  // Deutschland
  "Ahr", "Baden", "Franken", "Hessische Bergstraße", "Mittelrhein", "Mosel", 
  "Nahe", "Pfalz", "Rheingau", "Rheinhessen", "Saale-Unstrut", "Sachsen", "Württemberg",
  // Frankreich
  "Bordeaux", "Burgund", "Champagne", "Elsass", "Languedoc-Roussillon", "Loire", 
  "Provence", "Rhône", "Südwesten",
  // Italien
  "Abruzzen", "Apulien", "Emilia-Romagna", "Friaul-Julisch Venetien", "Kampanien", 
  "Lombardei", "Piemont", "Sardinien", "Sizilien", "Toskana", "Trentino-Südtirol", "Venetien",
  // Spanien
  "Andalusien", "Katalonien", "La Mancha", "Navarra", "Priorat", "Ribera del Duero", 
  "Rías Baixas", "Rioja", "Rueda", "Valencia",
  // Österreich
  "Burgenland", "Niederösterreich", "Steiermark", "Wien",
  // Portugal
  "Alentejo", "Bairrada", "Dão", "Douro", "Vinho Verde",
  // Übersee
  "Barossa Valley (Australien)", "Casablanca Valley (Chile)", "Central Otago (Neuseeland)", 
  "Colchagua Valley (Chile)", "Coonawarra (Australien)", "Franschhoek (Südafrika)", 
  "Hawke's Bay (Neuseeland)", "Hunter Valley (Australien)", "Maipo Valley (Chile)", 
  "Marlborough (Neuseeland)", "Martinborough (Neuseeland)", "McLaren Vale (Australien)", 
  "Mendoza (Argentinien)", "Napa Valley (USA)", "Paarl (Südafrika)", "Patagonia (Argentinien)", 
  "Salta (Argentinien)", "Sonoma County (USA)", "Stellenbosch (Südafrika)", 
  "Swartland (Südafrika)", "Walker Bay (Südafrika)", "Yarra Valley (Australien)"
];

export const PREDEFINED_LAENDER = [
  "Deutschland", "Frankreich", "Italien", "Spanien", "Österreich", "Portugal", 
  "Schweiz", "USA", "Südafrika", "Australien", "Neuseeland", "Chile", "Argentinien"
];

export const PREDEFINED_GESCHMACK = [
  { term: 'Trocken', description: 'Enthält kaum Restzucker, wirkt nicht süß.' },
  { term: 'Halbtrocken', description: 'Leichte, kaum merkliche Süße.' },
  { term: 'Feinherb', description: 'Etwas süßer als halbtrocken, harmonisches Spiel zwischen Süße und Säure.' },
  { term: 'Lieblich', description: 'Deutlich schmeckbare Süße.' },
  { term: 'Süß', description: 'Sehr hoher Zuckergehalt, oft Dessertweine.' },
  { term: 'Süffig', description: 'Lässt sich leicht und angenehm trinken, unkompliziert.' },
  { term: 'Vollmundig', description: 'Fühlt sich schwer, dicht und füllig im Mund an.' },
  { term: 'Adstringierend/Tanninreich', description: 'Hinterlässt ein pelziges, trockenes Gefühl am Gaumen (Gerbstoffe).' },
  { term: 'Fruchtig', description: 'Schmeckt deutlich nach Früchten (z.B. Beeren, Kirsche, Apfel).' },
  { term: 'Säurebetont', description: 'Wirkt frisch, spritzig, manchmal auch leicht sauer.' },
  { term: 'Mineralisch', description: 'Schmeckt nach nassem Stein, Kreide oder Salz (oft bei Weißweinen).' },
  { term: 'Samtig', description: 'Sehr angenehmes, weiches Mundgefühl, wenig aggressive Säure oder Tannine.' },
  { term: 'Kräftig', description: 'Hoher Alkoholgehalt und intensiver Geschmack.' },
  { term: 'Leicht', description: 'Wenig Alkohol, unbeschwertes Mundgefühl.' },
  { term: 'Cremig', description: 'Weiches, fast sahniges Mundgefühl, oft durch Holzfassausbau.' }
];

export const PREDEFINED_GERUCH = [
  { term: 'Fruchtig', description: 'Erinnert an frisches Obst (Beeren, Zitrusfrüchte, Steinobst).' },
  { term: 'Blumig', description: 'Duftet nach Blüten (z.B. Rose, Veilchen, Holunder).' },
  { term: 'Würzig', description: 'Erinnert an Gewürze (z.B. Pfeffer, Nelke, Zimt).' },
  { term: 'Kräuterig', description: 'Duftet nach Gras, Paprika oder Kräutern.' },
  { term: 'Holzig', description: 'Noten von Vanille, Toast, Rauch oder Zedernholz (durch Fasslagerung).' },
  { term: 'Erdig', description: 'Erinnert an Waldboden, Pilze oder nasses Laub.' },
  { term: 'Nussig', description: 'Duftet nach Mandeln, Haselnüssen oder Walnüssen.' },
  { term: 'Ledrig', description: 'Erinnert an Leder, oft bei gereiften Rotweinen.' },
  { term: 'Mineralisch', description: 'Erinnert an nassen Stein oder Feuerstein.' },
  { term: 'Geruchsarm', description: 'Kaum wahrnehmbarer Geruch.' }
];
