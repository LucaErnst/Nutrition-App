/**
 * Baut die Grundnahrungsmittel-Tabelle aus USDA FoodData Central (SR Legacy).
 *
 * Die Daten stehen unter CC0 (gemeinfrei) – laut FoodData-Central-API-Guide ist keine
 * Erlaubnis nötig, die Quellenangabe ist erwünscht. Genau das macht sie brauchbar: Open Food
 * Facts kennt jedes verpackte Produkt, aber „Pouletbrust roh" findet man dort schlecht.
 *
 * Aufruf:
 *   curl -sL -o /tmp/sr.zip https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip
 *   unzip -q /tmp/sr.zip -d /tmp/sr
 *   node tools/build-reference-foods.mjs /tmp/sr/FoodData_Central_sr_legacy_food_csv_2018-04
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const dir = process.argv[2];
if (!dir) {
  console.error('Pfad zum entpackten Datensatz fehlt.');
  process.exit(1);
}

/** Nährstoff-Nummern in FoodData Central. */
const KCAL = '1008';
const PROTEIN = '1003';
const FAT = '1004';
const CARBS = '1005';

/**
 * Auswahl: Was ein Athlet wirklich einträgt. Gesucht wird über Stichwörter, die alle vorkommen
 * müssen; von mehreren Treffern gewinnt der kürzeste – kurze Bezeichnungen sind in diesem
 * Datensatz die allgemeinen, lange die Markenprodukte.
 */
const WANTED = [
  // Geflügel
  { de: 'Pouletbrust, roh', en: 'Chicken breast, raw', all: ['chicken', 'breast', 'meat only', 'raw'] },
  { de: 'Pouletbrust, gebraten', en: 'Chicken breast, roasted', all: ['chicken', 'breast', 'meat only', 'roasted'] },
  { de: 'Pouletschenkel, roh', en: 'Chicken thigh, raw', all: ['chicken', 'thigh', 'meat only', 'raw'] },
  { de: 'Truthahnbrust, roh', en: 'Turkey breast, raw', all: ['turkey', 'breast', 'meat only', 'raw'] },
  // Rind, Schwein, Lamm
  { de: 'Rindshackfleisch 5 % Fett, roh', en: 'Ground beef 5% fat, raw', all: ['beef, ground, 95%', 'raw'] },
  { de: 'Rindshackfleisch 20 % Fett, roh', en: 'Ground beef 20% fat, raw', all: ['beef, ground, 80%', 'raw'] },
  { de: 'Rindsentrecôte, roh', en: 'Beef ribeye, raw', all: ['beef', 'rib eye', 'raw'] },
  { de: 'Rindsfilet, roh', en: 'Beef tenderloin, raw', all: ['beef', 'tenderloin', 'lean only', 'raw'], not: ['new zealand', 'australian'] },
  { de: 'Schweinsfilet, roh', en: 'Pork tenderloin, raw', all: ['pork', 'tenderloin', 'lean only', 'raw'] },
  { de: 'Schweinskotelett, roh', en: 'Pork chop, raw', all: ['pork', 'loin', 'chops', 'lean only', 'raw'] },
  { de: 'Speck, gebraten', en: 'Bacon, cooked', all: ['pork, cured, bacon, cooked'], not: ['reduced'] },
  { de: 'Lammkotelett, roh', en: 'Lamb chop, raw', all: ['lamb', 'loin', 'lean only', 'raw'], not: ['new zealand', 'australian'] },
  // Fisch
  { de: 'Lachs, roh', en: 'Salmon, raw', all: ['salmon', 'atlantic', 'farmed', 'raw'] },
  { de: 'Thunfisch aus der Dose, abgetropft', en: 'Canned tuna in water, drained', all: ['tuna', 'light', 'canned in water', 'drained'] },
  { de: 'Kabeljau, roh', en: 'Cod, raw', all: ['cod', 'atlantic', 'raw'] },
  { de: 'Forelle, roh', en: 'Trout, raw', all: ['trout', 'rainbow', 'farmed', 'raw'] },
  { de: 'Crevetten, roh', en: 'Shrimp, raw', all: ['shrimp', 'raw'] },
  // Eier und Milchprodukte
  { de: 'Ei, ganz, roh', en: 'Egg, whole, raw', all: ['egg, whole, raw, fresh'] },
  { de: 'Eiweiss, roh', en: 'Egg white, raw', all: ['egg, white, raw, fresh'] },
  { de: 'Vollmilch', en: 'Whole milk', all: ['milk, whole, 3.25%'] },
  { de: 'Magermilch', en: 'Skim milk', all: ['milk, nonfat', 'fluid', 'protein fortified'] },
  { de: 'Griechischer Joghurt, mager', en: 'Greek yogurt, nonfat', all: ['yogurt, greek, plain, nonfat'] },
  { de: 'Joghurt nature', en: 'Plain yogurt', all: ['yogurt, plain, low fat'] },
  { de: 'Hüttenkäse mager (1 %)', en: 'Cottage cheese, 1% fat', all: ['cheese, cottage, lowfat, 1%'] },
  { de: 'Hüttenkäse (2 %)', en: 'Cottage cheese, 2% fat', all: ['cheese, cottage, lowfat, 2%'] },
  { de: 'Mozzarella', en: 'Mozzarella', all: ['cheese, mozzarella, part skim'] },
  { de: 'Gruyère', en: 'Gruyère', all: ['cheese, gruyere'] },
  { de: 'Butter', en: 'Butter', all: ['butter, salted'] },
  // Getreide, Brot, Teigwaren
  { de: 'Haferflocken, trocken', en: 'Oats, dry', all: ['oats'], not: ['cereals ready-to-eat', 'bar', 'bread', 'milk'] },
  { de: 'Reis weiss, gekocht', en: 'White rice, cooked', all: ['rice, white, long-grain, regular', 'cooked'] },
  { de: 'Reis braun, gekocht', en: 'Brown rice, cooked', all: ['rice, brown, long-grain, cooked'] },
  { de: 'Teigwaren, gekocht', en: 'Pasta, cooked', all: ['pasta, cooked, enriched'], not: ['spinach', 'whole'] },
  { de: 'Vollkornteigwaren, gekocht', en: 'Whole wheat pasta, cooked', all: ['pasta, whole-wheat', 'cooked'] },
  { de: 'Quinoa, gekocht', en: 'Quinoa, cooked', all: ['quinoa, cooked'] },
  { de: 'Couscous, gekocht', en: 'Couscous, cooked', all: ['couscous, cooked'] },
  { de: 'Vollkornbrot', en: 'Whole wheat bread', all: ['bread, whole-wheat', 'commercially prepared'] },
  { de: 'Weissbrot', en: 'White bread', all: ['bread, white', 'commercially prepared'] },
  { de: 'Knäckebrot', en: 'Crispbread', all: ['crackers, rye, wafers, plain'] },
  { de: 'Cornflakes', en: 'Corn flakes', all: ['corn flakes'], not: ['frosted', 'honey', 'sugar'] },
  // Kartoffeln und Hülsenfrüchte
  { de: 'Kartoffeln, gekocht', en: 'Potatoes, boiled', all: ['potatoes, boiled', 'without skin', 'without salt'] },
  { de: 'Süsskartoffel, gekocht', en: 'Sweet potato, baked', all: ['sweet potato, cooked, baked in skin', 'without salt'] },
  { de: 'Linsen, gekocht', en: 'Lentils, cooked', all: ['lentils, mature seeds, cooked'], not: ['sprouted'] },
  { de: 'Kichererbsen, gekocht', en: 'Chickpeas, cooked', all: ['chickpeas', 'mature seeds, cooked'] },
  { de: 'Kidneybohnen, gekocht', en: 'Kidney beans, cooked', all: ['beans, kidney, all types, mature seeds, cooked'] },
  { de: 'Tofu', en: 'Tofu', all: ['tofu, raw, firm'] },
  { de: 'Edamame, gekocht', en: 'Edamame, cooked', all: ['edamame', 'prepared'] },
  // Gemüse
  { de: 'Brokkoli, roh', en: 'Broccoli, raw', all: ['broccoli, raw'] },
  { de: 'Rüebli, roh', en: 'Carrots, raw', all: ['carrots, raw'] },
  { de: 'Tomaten, roh', en: 'Tomatoes, raw', all: ['tomatoes, red, ripe, raw, year round average'] },
  { de: 'Gurke, roh', en: 'Cucumber, raw', all: ['cucumber, with peel, raw'] },
  { de: 'Zwiebel, roh', en: 'Onions, raw', all: ['onions, raw'] },
  { de: 'Paprika, roh', en: 'Bell pepper, raw', all: ['peppers, sweet, red, raw'] },
  { de: 'Spinat, roh', en: 'Spinach, raw', all: ['spinach, raw'] },
  { de: 'Zucchini, roh', en: 'Zucchini, raw', all: ['squash, summer, zucchini', 'raw'] },
  { de: 'Blumenkohl, roh', en: 'Cauliflower, raw', all: ['cauliflower, raw'] },
  { de: 'Champignons, roh', en: 'Mushrooms, raw', all: ['mushrooms, white, raw'] },
  { de: 'Kopfsalat', en: 'Lettuce', all: ['lettuce, iceberg', 'raw'] },
  { de: 'Erbsen, gekocht', en: 'Peas, cooked', all: ['peas, green, cooked, boiled', 'without salt'] },
  { de: 'Mais aus der Dose', en: 'Canned corn', all: ['corn, sweet, yellow, canned', 'drained solids'] },
  // Früchte
  { de: 'Banane', en: 'Banana', all: ['bananas, raw'] },
  { de: 'Apfel', en: 'Apple', all: ['apples, raw, with skin'] },
  { de: 'Orange', en: 'Orange', all: ['oranges, raw, all commercial varieties'] },
  { de: 'Heidelbeeren', en: 'Blueberries', all: ['blueberries, raw'] },
  { de: 'Erdbeeren', en: 'Strawberries', all: ['strawberries, raw'] },
  { de: 'Himbeeren', en: 'Raspberries', all: ['raspberries, raw'] },
  { de: 'Trauben', en: 'Grapes', all: ['grapes, red or green', 'raw'] },
  { de: 'Ananas', en: 'Pineapple', all: ['pineapple, raw, all varieties'] },
  { de: 'Mango', en: 'Mango', all: ['mangos, raw'] },
  { de: 'Avocado', en: 'Avocado', all: ['avocados, raw, all commercial varieties'] },
  { de: 'Wassermelone', en: 'Watermelon', all: ['watermelon, raw'] },
  { de: 'Datteln', en: 'Dates', all: ['dates, medjool'] },
  { de: 'Rosinen', en: 'Raisins', all: ['raisins, dark, seedless'] },
  // Nüsse, Samen, Öle
  { de: 'Mandeln', en: 'Almonds', all: ['nuts, almonds'], not: ['oil roasted', 'blanched', 'butter', 'honey', 'salt'] },
  { de: 'Baumnüsse', en: 'Walnuts', all: ['nuts, walnuts, english'] },
  { de: 'Cashewnüsse', en: 'Cashews', all: ['nuts, cashew nuts, raw'] },
  { de: 'Erdnussbutter', en: 'Peanut butter', all: ['peanut butter, smooth style'], not: ['reduced'] },
  { de: 'Erdnüsse', en: 'Peanuts', all: ['peanuts, all types, raw'] },
  { de: 'Leinsamen', en: 'Flaxseed', all: ['seeds, flaxseed'] },
  { de: 'Chiasamen', en: 'Chia seeds', all: ['seeds, chia seeds, dried'] },
  { de: 'Olivenöl', en: 'Olive oil', all: ['oil, olive, salad or cooking'] },
  { de: 'Rapsöl', en: 'Rapeseed oil', all: ['oil, canola'] },
  { de: 'Kokosöl', en: 'Coconut oil', all: ['oil, coconut'] },
  // Süsses und Getränke
  { de: 'Honig', en: 'Honey', all: ['honey'], not: ['candy', 'cereal', 'mustard', 'roasted'] },
  { de: 'Zucker', en: 'Sugar', all: ['sugars, granulated'] },
  { de: 'Dunkle Schokolade 70 %', en: 'Dark chocolate 70%', all: ['chocolate, dark, 70-85%'] },
  { de: 'Milchschokolade', en: 'Milk chocolate', all: ['candies, milk chocolate'], not: ['coated', 'almonds', 'rice'] },
  { de: 'Orangensaft', en: 'Orange juice', all: ['orange juice, raw'] },
  { de: 'Apfelsaft', en: 'Apple juice', all: ['apple juice, canned or bottled, unsweetened'], not: ['vitamin'] },
  { de: 'Bier', en: 'Beer', all: ['alcoholic beverage, beer, regular, all'] },
  { de: 'Rotwein', en: 'Red wine', all: ['alcoholic beverage, wine, table, red'], not: ['barbera', 'burgundy', 'cabernet', 'merlot', 'pinot', 'syrah', 'zinfandel', 'sangiovese', 'gamay', 'petite', 'lemberger', 'carignane', 'mouvedre'] },
  // Weitere Käse und Aufschnitt
  { de: 'Feta', en: 'Feta', all: ['cheese, feta'] },
  { de: 'Parmesan', en: 'Parmesan', all: ['cheese, parmesan, grated'], not: ['refrigerated', 'reduced'] },
  { de: 'Frischkäse', en: 'Cream cheese', all: ['cheese, cream'], not: ['low fat', 'fat free'] },
  { de: 'Halbfettkäse', en: 'Reduced fat cheese', all: ['cheese, cheddar, reduced fat'] },
  { de: 'Cheddar', en: 'Cheddar', all: ['cheese, cheddar'], not: ['reduced', 'nonfat', 'low', 'sharp'] },
  { de: 'Kochschinken', en: 'Cooked ham', all: ['ham, sliced', '96%fat free'] },
  { de: 'Salami', en: 'Salami', all: ['salami, italian, pork'] },
  // Fisch und Meeresfrüchte
  { de: 'Thunfisch in Öl, abgetropft', en: 'Canned tuna in oil, drained', all: ['tuna, light, canned in oil', 'drained'] },
  { de: 'Hering, roh', en: 'Herring, raw', all: ['fish, herring, atlantic, raw'] },
  { de: 'Makrele, roh', en: 'Mackerel, raw', all: ['fish, mackerel, atlantic, raw'] },
  { de: 'Thunfisch frisch, roh', en: 'Fresh tuna, raw', all: ['fish, tuna, fresh, bluefin, raw'] },
  // Getreide und Beilagen
  { de: 'Dinkel, gekocht', en: 'Spelt, cooked', all: ['spelt, cooked'] },
  { de: 'Buchweizen, gekocht', en: 'Buckwheat, cooked', all: ['buckwheat groats, roasted, cooked'] },
  { de: 'Bulgur, gekocht', en: 'Bulgur, cooked', all: ['bulgur, cooked'] },
  { de: 'Haferkleie, trocken', en: 'Oat bran, dry', all: ['oat bran, raw'] },
  { de: 'Weissmehl', en: 'White flour', all: ['wheat flour, white, all-purpose, enriched, bleached'] },
  { de: 'Vollkornmehl', en: 'Whole wheat flour', all: ['wheat flour, whole-grain'], not: ['soft'] },
  { de: 'Polenta, trocken', en: 'Cornmeal, dry', all: ['cornmeal, whole-grain, yellow'] },
  { de: 'Popcorn', en: 'Popcorn', all: ['snacks, popcorn, air-popped'] },
  { de: 'Reiswaffeln', en: 'Rice cakes', all: ['snacks, rice cakes, brown rice, plain'] },
  // Milchalternativen und Saucen
  { de: 'Sojadrink', en: 'Soy milk', all: ['soymilk, original and vanilla, unfortified'] },
  { de: 'Mandeldrink', en: 'Almond milk', all: ['beverages, almond milk, unsweetened'] },
  { de: 'Ketchup', en: 'Ketchup', all: ['catsup'], not: ['low sodium'] },
  { de: 'Senf', en: 'Mustard', all: ['mustard, prepared, yellow'] },
  { de: 'Mayonnaise', en: 'Mayonnaise', all: ['salad dressing, mayonnaise, regular'] },
  { de: 'Sojasauce', en: 'Soy sauce', all: ['soy sauce made from soy and wheat'], not: ['low sodium'] },
  { de: 'Tomatensauce', en: 'Tomato sauce', all: ['tomato products, canned, sauce'], not: ['spanish', 'herbs', 'onions', 'mushrooms', 'tomato tidbits'] },
  // Hülsenfrüchte und Kerne
  { de: 'Weisse Bohnen, gekocht', en: 'White beans, cooked', all: ['beans, white, mature seeds, cooked'] },
  { de: 'Schwarze Bohnen, gekocht', en: 'Black beans, cooked', all: ['beans, black, mature seeds, cooked'] },
  { de: 'Sonnenblumenkerne', en: 'Sunflower seeds', all: ['seeds, sunflower seed kernels, dried'] },
  { de: 'Kürbiskerne', en: 'Pumpkin seeds', all: ['seeds, pumpkin and squash seed kernels, dried'] },
  { de: 'Pistazien', en: 'Pistachios', all: ['nuts, pistachio nuts, raw'] },
  { de: 'Haselnüsse', en: 'Hazelnuts', all: ['nuts, hazelnuts or filberts'], not: ['blanched'] },
  { de: 'Kokosraspel', en: 'Shredded coconut', all: ['nuts, coconut meat, dried', 'not sweetened'] },
  // Früchte und Gemüse
  { de: 'Kiwi', en: 'Kiwi', all: ['kiwifruit, green, raw'] },
  { de: 'Birne', en: 'Pear', all: ['pears, raw'] },
  { de: 'Pfirsich', en: 'Peach', all: ['peaches, yellow, raw'] },
  { de: 'Aprikose', en: 'Apricot', all: ['apricots, raw'] },
  { de: 'Pflaume', en: 'Plum', all: ['plums, raw'] },
  { de: 'Kirschen', en: 'Cherries', all: ['cherries, sweet, raw'] },
  { de: 'Brombeeren', en: 'Blackberries', all: ['blackberries, raw'] },
  { de: 'Grapefruit', en: 'Grapefruit', all: ['grapefruit, raw, pink and red and white'] },
  { de: 'Aubergine, roh', en: 'Eggplant, raw', all: ['eggplant, raw'] },
  { de: 'Rosenkohl, roh', en: 'Brussels sprouts, raw', all: ['brussels sprouts, raw'] },
  { de: 'Weisskohl, roh', en: 'Cabbage, raw', all: ['cabbage, raw'] },
  { de: 'Sellerie, roh', en: 'Celery, raw', all: ['celery, raw'] },
  { de: 'Lauch, roh', en: 'Leek, raw', all: ['leeks', 'raw'] },
  { de: 'Knoblauch, roh', en: 'Garlic, raw', all: ['garlic, raw'] },
  { de: 'Randen, gekocht', en: 'Beetroot, cooked', all: ['beets, cooked, boiled, drained'], not: ['with salt'] },
  { de: 'Kürbis, gekocht', en: 'Pumpkin, cooked', all: ['pumpkin, cooked, boiled', 'without salt'] },
  { de: 'Spargel, gekocht', en: 'Asparagus, cooked', all: ['asparagus, cooked, boiled, drained'], not: ['with salt'] },
  { de: 'Bohnen grün, gekocht', en: 'Green beans, cooked', all: ['beans, snap, green, cooked, boiled', 'without salt'] },
];

function parseCsv(file) {
  const text = readFileSync(path.join(dir, file), 'utf8');
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const head = rows.shift();
  return { head, rows };
}

const foods = parseCsv('food.csv');
const iDesc = foods.head.indexOf('description');
const iId = foods.head.indexOf('fdc_id');
const all = foods.rows.filter((r) => r[iId]).map((r) => ({ id: r[iId], desc: r[iDesc] }));

const picked = [];
const missing = [];
for (const want of WANTED) {
  const hits = all.filter((f) => {
    const d = f.desc.toLowerCase();
    return want.all.every((k) => d.includes(k.toLowerCase())) && !(want.not ?? []).some((k) => d.includes(k.toLowerCase()));
  });
  if (hits.length === 0) { missing.push(want.de); continue; }
  hits.sort((a, b) => a.desc.length - b.desc.length);
  picked.push({ ...want, id: hits[0].id, desc: hits[0].desc, candidates: hits.length });
}

// Nährwerte nur für die ausgewählten Lebensmittel einsammeln
const ids = new Set(picked.map((p) => p.id));
const nutr = parseCsv('food_nutrient.csv');
const nId = nutr.head.indexOf('fdc_id');
const nNut = nutr.head.indexOf('nutrient_id');
const nAmt = nutr.head.indexOf('amount');
const values = new Map();
for (const r of nutr.rows) {
  if (!ids.has(r[nId])) continue;
  const key = r[nNut];
  if (key !== KCAL && key !== PROTEIN && key !== FAT && key !== CARBS) continue;
  const m = values.get(r[nId]) ?? {};
  m[key] = Number(r[nAmt]);
  values.set(r[nId], m);
}

const round = (n, d = 1) => Math.round(n * 10 ** d) / 10 ** d;
const out = [];
const noNutrients = [];
for (const p of picked) {
  const v = values.get(p.id);
  if (!v || v[KCAL] === undefined) { noNutrients.push(p.de); continue; }
  out.push({
    // Stabiler Schlüssel: Daran erkennt die App, was sie schon hat – unabhängig von der Sprache.
    key: p.en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    de: p.de,
    en: p.en,
    kcal: Math.round(v[KCAL]),
    p: round(v[PROTEIN] ?? 0),
    f: round(v[FAT] ?? 0),
    c: round(v[CARBS] ?? 0),
  });
}

writeFileSync('src/db/reference-foods.json', JSON.stringify(out, null, 0) + '\n');
console.log(`${out.length} Lebensmittel → src/db/reference-foods.json`);
if (missing.length) console.log('OHNE TREFFER:', missing.join(', '));
if (noNutrients.length) console.log('OHNE NÄHRWERTE:', noNutrients.join(', '));
console.log('\nZur Kontrolle:');
for (const p of picked.slice(0, 200)) console.log(`  ${p.de.padEnd(34)} ← ${p.desc}`);
