/**
 * Stückgewichte für mitgelieferte Grundnahrungsmittel: „Ei 3 Stk." statt „Ei 180 g".
 *
 * Quelle aller Werte: USDA FoodData Central, SR Legacy (April 2018), Tabelle `food_portion`,
 * gemeinfrei (CC0). Genommen wird jeweils die mittlere Grösse („medium"), sonst die Angabe für
 * ein ganzes Stück. In Klammern die FDC-ID und die Portion, aus der der Wert stammt.
 * Essbarer Anteil, wie USDA ihn angibt (z. B. Banane ohne Schale).
 *
 * Schlüssel = `ref_key` aus der BLS- bzw. Schweizer Tabelle. Nur rohe oder als Ganzes gegessene
 * Formen: Bei „Kartoffel gekocht" ändert sich das Gewicht, und bei Kompott gibt es kein Stück.
 * Brot fehlt bewusst: Eine Scheibe ist kein Stück, dafür braucht es eine eigene Einheit.
 */
export const PIECE_WEIGHTS: Record<string, number> = {
  // Ei – 1 medium = 44 g, 1 large = 50 g (171287 Egg, whole, raw). In der Schweiz und in
  // Deutschland ist „M" (53–63 g mit Schale) die Regel; USDA „large" passt dazu.
  E111100: 50, // Hühnerei roh
  E111132: 50, // Hühnerei gekocht
  E107122: 50, // Hühnerei pochiert
  E111182: 50, // Hühnerei gebraten ohne Fett
  Y710142: 50, // Spiegelei gebraten
  Y710162: 50, // Spiegelei gebraten in Butter
  E113100: 33, // Eiklar roh – 1 large = 33 g (172183)
  E112100: 17, // Eigelb roh – 1 large = 17 g (172184)

  // Obst
  F503100: 118, // Banane roh – 1 medium = 118 g (173944)
  F110100: 182, // Apfel roh – 1 medium = 182 g (171688)
  F120100: 182, // Apfel geschält, roh
  F130100: 178, // Birne roh – 1 medium = 178 g (169118)
  F514100: 69, // Kiwi roh – 1 fruit = 69 g (168153)
  F603100: 131, // Orange roh – 1 fruit = 131 g (169097)
  F606100: 88, // Mandarine roh – 1 medium = 88 g (169105)
  F607100: 88, // Clementine roh – wie Mandarine (169105)
  F502100: 201, // Avocado roh – 1 avocado = 201 g (171705)
  F203100: 150, // Pfirsich roh – 1 medium = 150 g (169928)
  F202100: 142, // Nektarine roh – 1 medium = 142 g (169914)
  F201100: 35, // Aprikose roh – 1 apricot = 35 g (171697)
  F220100: 66, // Pflaume roh – 1 fruit = 66 g (169949)
  F223100: 66, // Zwetschge roh – wie Pflaume (169949)
  F516100: 336, // Mango roh – 1 fruit without refuse = 336 g (169910)
  F601100: 58, // Zitrone roh – 1 fruit = 58 g (167746)
  F505100: 50, // Feige roh – 1 medium = 50 g (173021)
  F504100: 24, // Dattel roh – 1 date, pitted = 24 g (168191)
  F301100: 12, // Erdbeere roh – 1 medium = 12 g (167762)

  // Gemüse
  G561100: 123, // Tomate roh – 1 medium = 123 g (170457)
  G620100: 61, // Karotte/Möhre roh – 1 medium = 61 g (170393)
  G520100: 301, // Gurke roh – 1 cucumber = 301 g (168409)
  G541100: 119, // Gemüsepaprika grün, roh – 1 medium = 119 g (170108)
  G542100: 119, // Gemüsepaprika gelb, roh
  G543100: 119, // Gemüsepaprika rot, roh
  G480100: 110, // Speisezwiebel roh – 1 medium = 110 g (170000)
  'ch-368': 110, // Zwiebel, roh (Schweiz)
  G490100: 3, // Knoblauch roh – 1 clove = 3 g (169230)
  G582100: 196, // Zucchini roh – 1 medium = 196 g (169291)
  K120100: 213, // Kartoffel ungeschält, roh – 1 medium = 213 g (170026)
  K110100: 213, // Kartoffel geschält, roh
  'ch-13406': 130, // Süsskartoffel, roh – 1 sweetpotato 5" = 130 g (168482)
  K701100: 18, // Champignon roh – 1 medium = 18 g (169251)

  // Getreide
  C532700: 9, // Reiswaffeln ungesalzen – 1 cake = 9 g (170250)
  C532800: 9, // Reiswaffeln gesalzen
  D771600: 57, // Croissant – 1 medium = 57 g (174987)
  'ch-10406': 57, // Gipfeli (Schweiz)
  B511000: 43, // Weizenbrötchen – 1 roll = 43 g (172793)
  B783012: 49, // Weizentortilla – 1 tortilla 7–8" = 49 g (175037)
};
