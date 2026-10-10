// Instagram: 3 Storys (1080×1920) und 3 Karussells (1080×1350) im Look der Store-Bilder.
// Voraussetzung: marketing/instagram/shots/*.png (shots.mjs). Aufruf: node marketing/instagram/build.mjs
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('./', import.meta.url));
const ROOT = path.join(HERE, '..', '..');
const img = (p) => `data:image/png;base64,${fs.readFileSync(p).toString('base64')}`;
const shot = (n) => img(path.join(HERE, 'shots', `${n}.png`));
const pngWidth = (f) => fs.readFileSync(f).readUInt32BE(16);

/** Ausschnitt [oben, Höhe] eines Screenshots als Karte, `width` px breit. */
function crop(s, [top, h], width, css = '') {
  const file = path.join(HERE, 'shots', `${s}.png`);
  const scale = width / pngWidth(file);
  return `<div style="position:absolute;width:${width}px;height:${Math.round(h * scale)}px;overflow:hidden;border-radius:36px;
    box-shadow:0 30px 90px rgba(0,0,0,.55),0 0 0 2px #2a2f3d;${css}">
    <img src="${img(file)}" style="display:block;width:${width}px;margin-top:${-Math.round(top * scale)}px"></div>`;
}
const ICON = img(path.join(ROOT, 'public', 'icon-512.png'));
const LOGO = img(path.join(ROOT, 'public', 'splash-logo.png'));

const GOLD = '#e6c46a';
const CSS = `
  *{box-sizing:border-box;margin:0;padding:0}
  body{width:var(--w);height:var(--h);overflow:hidden;font-family:-apple-system,'SF Pro Display','Helvetica Neue',Arial,sans-serif;color:#fff;
    background:radial-gradient(ellipse 90% 45% at 50% 0%,rgba(230,196,106,.20),transparent 70%),radial-gradient(ellipse 70% 40% at 50% 100%,rgba(59,130,246,.10),transparent 70%),#0b0d12;position:relative}
  .gold{color:${GOLD}}
  .label{font-size:30px;font-weight:700;letter-spacing:.14em;color:${GOLD};text-transform:uppercase}
  h1{font-weight:800;letter-spacing:-.02em;line-height:1.05;white-space:pre-line}
  .sub{color:#aeb4c0;font-weight:500;line-height:1.35}
  .phone{position:absolute;left:50%;transform:translateX(-50%);border-radius:64px;padding:14px;background:#1a1d27;
    box-shadow:0 40px 120px rgba(0,0,0,.6),0 0 0 2px #2a2f3d inset}
  .phone img{display:block;width:100%;border-radius:52px}
  .brand{position:absolute;display:flex;align-items:center;gap:16px;font-size:30px;font-weight:700}
  .brand img{width:56px;height:56px;border-radius:14px}
  .count{position:absolute;top:56px;right:60px;font-size:26px;font-weight:600;color:#6b7280}
  .chips{display:flex;gap:16px;justify-content:center;flex-wrap:wrap}
  .chip{padding:14px 26px;border-radius:999px;background:rgba(255,255,255,.07);border:2px solid rgba(255,255,255,.12);font-size:34px;font-weight:700}
  .card{background:rgba(255,255,255,.05);border:2px solid rgba(255,255,255,.09);border-radius:36px;padding:44px 48px}
  .row{display:flex;justify-content:space-between;align-items:baseline;gap:30px;font-size:40px;font-weight:600;padding:14px 0;border-bottom:2px solid rgba(255,255,255,.07)}
  .row:last-child{border-bottom:0}
  .muted{color:#7c8494}
  ul.list{list-style:none;display:flex;flex-direction:column;gap:30px}
  ul.list li{font-size:48px;font-weight:700;line-height:1.2;display:flex;gap:26px;align-items:flex-start}
  ul.list li span.n{flex:none;width:68px;height:68px;border-radius:50%;background:${GOLD};color:#0b0d12;display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:800;margin-top:-4px}
`;

const page = (w, h, body) => `<html><head><style>:root{--w:${w}px;--h:${h}px}${CSS}</style></head><body>${body}</body></html>`;

// ---------- Storys (1080×1920). Oben 250 px und unten ~340 px gehören der Instagram-Oberfläche.
const story = (body) => page(1080, 1920, body);
const STORIES = {
  's1-launch': story(`
    <div style="position:absolute;top:250px;left:80px;right:80px;text-align:center">
      <div class="label">New on the App Store</div>
      <h1 style="font-size:150px;margin-top:22px">It’s <span class="gold">out.</span></h1>
      <p class="sub" style="font-size:40px;margin-top:22px">Calories &amp; macros, built by a calisthenics coach.</p>
      <div class="chips" style="margin-top:40px"><span class="chip">Free</span><span class="chip">No account</span><span class="chip">No ads</span></div>
    </div>
    <div class="phone" style="top:800px;width:560px;height:640px;overflow:hidden;border-radius:64px 64px 0 0;padding-bottom:0"><img src="${shot('diary')}" style="border-radius:52px 52px 0 0"></div>
    <div style="position:absolute;left:0;right:0;top:1330px;height:600px;background:linear-gradient(transparent,#0b0d12 30%)"></div>
    <div style="position:absolute;top:1450px;left:80px;right:80px;text-align:center">
      <div style="font-size:38px;font-weight:700">Pro is a one-time purchase: <span class="gold">CHF 15</span></div>
      <div class="sub" style="font-size:30px;margin-top:10px">Launch price until 31 January, then CHF 25. Never a subscription.</div>
    </div>`),
  's2-subscription': story(`
    <div style="position:absolute;top:270px;left:80px;right:80px">
      <div class="label">Quick question</div>
      <h1 style="font-size:104px;margin-top:24px">Your tracker bills you <span class="gold">every year.</span></h1>
      <div class="card" style="margin-top:60px">
        <div class="row"><span>Popular trackers</span><span class="muted" style="white-space:nowrap">up to CHF 80 / year</span></div>
        <div class="row"><span>… after 3 years</span><span class="muted" style="white-space:nowrap">up to CHF 240</span></div>
        <div class="row"><span class="gold">Serious Nutrition</span><span class="gold" style="white-space:nowrap">free · Pro once</span></div>
      </div>
      <p class="sub" style="font-size:38px;margin-top:44px">No account. No ads. Your data stays on your phone.</p>
    </div>
    <div style="position:absolute;bottom:250px;left:0;right:0;text-align:center" class="brand-c">
      <div class="brand" style="position:static;justify-content:center"><img src="${ICON}">Serious Nutrition</div>
    </div>`),
  's3-swiss': story(`
    <div style="position:absolute;top:250px;left:80px;right:80px;text-align:center">
      <div class="label">Swiss food is in</div>
      <h1 style="font-size:96px;margin-top:22px">Cervelat. <span class="gold">Sbrinz.</span>\nÄlplermagronen.</h1>
      <p class="sub" style="font-size:38px;margin-top:26px">495 Swiss foods with official values from the Swiss Food Composition Database.</p>
    </div>
    <div class="phone" style="top:720px;width:560px;height:720px;overflow:hidden;border-radius:64px 64px 0 0;padding-bottom:0"><img src="${shot('search-cervelat')}" style="border-radius:52px 52px 0 0"></div>
    <div style="position:absolute;left:0;right:0;top:1330px;height:600px;background:linear-gradient(transparent,#0b0d12 30%)"></div>
    <div style="position:absolute;top:1470px;left:80px;right:80px;text-align:center;font-size:36px;font-weight:700">Works offline. <span class="gold">Free on the App Store.</span></div>`),
  // ---------- Woche 2
  's4-offline': story(`
    <div style="position:absolute;top:250px;left:80px;right:80px;text-align:center">
      <div class="label">New in 1.1</div>
      <h1 style="font-size:100px;margin-top:22px">Your tracker needs wifi.\n<span class="gold">Mine doesn’t.</span></h1>
      <p class="sub" style="font-size:38px;margin-top:24px">Airplane mode on – search still works. Nearly 7,000 basic foods live inside the app.</p>
    </div>
    ${crop('offline', [0, 1000], 680, 'top:800px;left:200px')}
    <div style="position:absolute;top:1620px;left:80px;right:80px;text-align:center;font-size:36px;font-weight:700">Plane. Basement gym. Mountains. <span class="gold">Still works.</span></div>`),
  's5-protein-ask': story(`
    <div style="position:absolute;top:270px;left:80px;right:80px">
      <div class="label">Ask the coach</div>
      <h1 style="font-size:112px;margin-top:24px">How much protein do you <span class="gold">really</span> need?</h1>
      <p class="sub" style="font-size:40px;margin-top:36px">Drop your nutrition question below. I’ll answer the best ones in a video this week.</p>
      <div style="font-size:120px;margin-top:40px;text-align:center">↓</div>
    </div>
    <div style="position:absolute;bottom:250px;left:0;right:0">
      <div class="brand" style="position:static;justify-content:center"><img src="${ICON}">Serious Nutrition</div>
    </div>`),
  's6-template': story(`
    <div style="position:absolute;top:250px;left:80px;right:80px;text-align:center">
      <div class="label">Same breakfast every day?</div>
      <h1 style="font-size:104px;margin-top:22px">Don’t type it <span class="gold">100 times.</span></h1>
      <p class="sub" style="font-size:38px;margin-top:24px">Save it once as a template. Tomorrow it’s one tap.</p>
    </div>
    ${crop('templates-tab', [0, 760], 920, 'top:780px;left:80px')}
    <div style="position:absolute;top:1460px;left:80px;right:80px;text-align:center;font-size:36px;font-weight:700">Tracking should take seconds, <span class="gold">not willpower.</span></div>`),
};

// ---------- Karussells (1080×1350)
const W = 1080, H = 1350;
// VIDEO=1: dieselben Folien für TikTok – 9:16, ohne Zähler und „Swipe“, auf 85 % verkleinert, damit
// weder die Knöpfe rechts noch die Beschreibung unten etwas verdecken.
const VIDEO = process.env.VIDEO === '1';
const slide = (n, total, body) => {
  const inner = `${body}
  <div class="brand" style="top:44px;left:60px"><img src="${ICON}">Serious Nutrition</div>
  ${VIDEO ? '' : `<div class="count">${n} / ${total}</div>`}`;
  if (!VIDEO) return page(W, H, inner);
  // Im Video alles mittig: Text, Listen als Block, Marke oben; die Folie selbst mittig im Bild,
  // aber über der TikTok-Beschreibung unten (ab ~1550 px).
  const center = `<style>h1,.sub,.label{text-align:center} ul.list{align-self:center} .vbox{align-items:center}
    .brand{left:0!important;right:0;justify-content:center}</style>`;
  return page(1080, 1920, `${center}<div style="position:absolute;left:81px;top:330px;width:${W}px;height:${H}px;transform:scale(.85);transform-origin:0 0">${inner}</div>`);
};
const hook = (title, sub, extra = '') => (n, t) => slide(n, t, `
  <div class="vbox" style="position:absolute;left:80px;right:80px;${VIDEO ? 'top:0;bottom:0;display:flex;flex-direction:column;justify-content:center' : 'top:300px'}">
    <h1 style="font-size:112px">${title}</h1>
    <p class="sub" style="font-size:44px;margin-top:40px">${sub}</p>${extra}
  </div>
  ${VIDEO ? '' : `<div style="position:absolute;bottom:70px;right:80px;font-size:36px;font-weight:700;color:${GOLD}">Swipe →</div>`}`);
const text = (title, sub) => (n, t) => slide(n, t, `
  <div class="vbox-src" style="position:absolute;top:0;bottom:0;left:80px;right:80px;display:flex;flex-direction:column;justify-content:center">
    <h1 style="font-size:104px">${title}</h1>
    <p class="sub" style="font-size:44px;margin-top:36px">${sub}</p>
  </div>`);
// Ausschnitt eines Screenshots gross als Karte – das ganze Handy wäre im Feed unlesbar.
// crop: [oben, Höhe] in Pixeln des Screenshots.
const phone = (title, sub, s, box) => (n, t) => slide(n, t, `
  <div style="position:absolute;top:150px;left:80px;right:80px">
    <h1 style="font-size:76px">${title}</h1>
    <p class="sub" style="font-size:36px;margin-top:18px">${sub}</p>
  </div>${crop(s, box, 920, 'top:440px;left:80px')}`);
const custom = (html) => (n, t) => slide(n, t, html);
const cta = (line) => (n, t) => slide(n, t, `
  <div style="position:absolute;top:0;bottom:0;left:80px;right:80px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center">
    <img src="${LOGO}" style="width:300px">
    <h1 style="font-size:84px;margin-top:20px">Serious Nutrition</h1>
    <div style="font-size:46px;font-weight:700;margin-top:18px" class="gold">Free on the App Store</div>
    <p class="sub" style="font-size:36px;margin-top:34px">${line}</p>
    <div class="chips" style="margin-top:46px"><span class="chip">Save this post</span><span class="chip">Send it to your training partner</span></div>
  </div>`);

const CAROUSELS = {
  'a-why': [
    hook('No account.\nNo ads.\n<span class="gold">No subscription.</span>', 'A nutrition tracker built by a calisthenics coach – for his own athletes.'),
    custom(`<div class="vbox-src" style="position:absolute;top:0;bottom:0;left:80px;right:80px;display:flex;flex-direction:column;justify-content:center">
      <h1 style="font-size:92px">Every tracker I gave my athletes had <span class="gold">the same problems.</span></h1>
      <ul class="list" style="margin-top:56px"><li><span class="n">1</span>A subscription that never ends</li><li><span class="n">2</span>Ads between every meal</li><li><span class="n">3</span>One calorie number for every single day</li></ul></div>`),
    phone('Training day <span class="gold">≠ rest day.</span>', 'Two targets. One tap switches the whole day.', 'diary-rest', [110, 560]),
    phone('Scan. Amount. <span class="gold">Done.</span>', 'Barcode, portion, logged – in seconds.', 'scan-result', [362, 836]),
    phone('Swiss food <span class="gold">included.</span>', 'Nearly 7,000 basic foods in the app – search works offline.', 'search-cervelat', [0, 600]),
    phone('Your data stays <span class="gold">on your phone.</span>', 'No account, no login. Your backup is one file.', 'backup', [880, 560]),
    cta('Pro is a one-time purchase – never a subscription.'),
  ],
  'b-week': [
    hook('Stop counting <span class="gold">daily calories.</span>', 'Why the week matters more than the day.'),
    text('One day over target <span class="gold">ruins nothing.</span>', 'Your body doesn’t reset at midnight. One big dinner is a blip, not a setback.'),
    text('A whole week over target <span class="gold">does.</span>', 'That’s what quietly stalls a cut – or turns a lean bulk into a sloppy one.'),
    phone('Count the week <span class="gold">as a budget.</span>', 'Over today? The app spreads it across the days that are left.', 'week-budget', [0, 1000]),
    custom(`<div class="vbox-src" style="position:absolute;top:0;bottom:0;left:80px;right:80px;display:flex;flex-direction:column;justify-content:center">
      <div class="label">Example · target 2,900 kcal/day</div>
      <div class="card" style="margin-top:30px">
        <div class="row"><span>Monday</span><span>2,900</span></div>
        <div class="row"><span>Tuesday – dinner out</span><span class="gold">3,400 (+500)</span></div>
        <div class="row"><span>Wednesday – Sunday</span><span>2,800 each</span></div>
        <div class="row"><span>Week</span><span class="gold">on target ✓</span></div>
      </div>
      <p class="sub" style="font-size:40px;margin-top:40px">100 kcal less for five days. Nobody notices. The week still adds up.</p></div>`),
    cta('Weekly budget instead of daily panic.'),
  ],
  'c-scale': [
    hook('Your scale lies. <span class="gold">Every morning.</span>', 'What a jump on the scale really means.'),
    text('+1 kg overnight?', 'That’s water, salt and last night’s carbs. <span class="gold">Not fat.</span>'),
    text('Daily weight <span class="gold">is noise.</span>', 'It can swing 1–2 kg from one morning to the next without anything real changing.'),
    phone('Watch the <span class="gold">7-day trend.</span>', 'Thin line: every weigh-in. Blue line: the trend that actually matters.', 'weight', [430, 980]),
    custom(`<div class="vbox-src" style="position:absolute;top:0;bottom:0;left:80px;right:80px;display:flex;flex-direction:column;justify-content:center">
      <h1 style="font-size:96px">How to <span class="gold">weigh in.</span></h1>
      <ul class="list" style="margin-top:56px"><li><span class="n">1</span>Same time, every morning</li><li><span class="n">2</span>After the bathroom, before eating</li><li><span class="n">3</span>Log daily – judge weekly</li></ul></div>`),
    cta('7-day trend instead of scale anxiety.'),
  ],
  'd-training': [
    hook('Training day <span class="gold">≠ rest day.</span>', 'Why your targets should change with your training.'),
    text('Two hours of training burns energy. <span class="gold">A rest day doesn’t.</span>', 'Eat the same on both and you’re short on one day – or over on the other.'),
    custom(`<div class="vbox-src" style="position:absolute;top:0;bottom:0;left:80px;right:80px;display:flex;flex-direction:column;justify-content:center">
      <div class="label">Example · lean bulk</div>
      <div class="card" style="margin-top:30px">
        <div class="row"><span></span><span class="muted">Training · Rest</span></div>
        <div class="row"><span>Calories</span><span>2,900 · <span class="gold">2,500</span></span></div>
        <div class="row"><span>Carbs</span><span>≈ 385 g · <span class="gold">≈ 285 g</span></span></div>
        <div class="row"><span>Protein</span><span>160 g · 160 g</span></div>
      </div>
      <p class="sub" style="font-size:40px;margin-top:40px">Protein stays. Mostly the carbs move.</p></div>`),
    phone('One tap switches <span class="gold">the whole day.</span>', 'Calories and macros follow the day type.', 'diary-rest', [110, 560]),
    phone('Set your training days <span class="gold">once.</span>', 'Swap a day? One tap in the diary.', 'backup', [0, 780]),
    cta('Two targets. One tap.'),
  ],
  'e-shortcuts': [
    hook('Tracking takes <span class="gold">too long?</span>', 'If it costs you five minutes a day, you’ll quit in a week. Four shortcuts:'),
    phone('1 · Scan <span class="gold">the barcode.</span>', 'Amount, done. Seconds, not minutes.', 'scan-result', [362, 836]),
    phone('2 · Your foods <span class="gold">come first.</span>', 'Favorites and what you eat most sit at the top.', 'favorites', [0, 900]),
    phone('3 · Save meals <span class="gold">as templates.</span>', 'Same breakfast every day? One tap.', 'templates-tab', [0, 760]),
    phone('4 · Copy <span class="gold">yesterday.</span>', 'Same lunch as yesterday? Copy it. Done.', 'tomorrow-filled', [1180, 900]),
    text('The two-week <span class="gold">trick.</span>', 'Scan everything for two weeks. After that your own foods are in – and a day is logged in a few taps.'),
    cta('Tracking should take seconds, not willpower.'),
  ],
  'f-protein': [
    hook('How much protein <span class="gold">do you really need?</span>', 'The number – and how to hit it without thinking.'),
    text('1.6–2.2 g <span class="gold">per kg body weight.</span>', 'That’s where most research on building muscle lands. Above that, the extra benefit is small.'),
    custom(`<div class="vbox-src" style="position:absolute;top:0;bottom:0;left:80px;right:80px;display:flex;flex-direction:column;justify-content:center">
      <div class="label">Protein per day</div>
      <div class="card" style="margin-top:30px">
        <div class="row"><span>60 kg</span><span class="gold">96 – 132 g</span></div>
        <div class="row"><span>70 kg</span><span class="gold">112 – 154 g</span></div>
        <div class="row"><span>80 kg</span><span class="gold">128 – 176 g</span></div>
        <div class="row"><span>90 kg</span><span class="gold">144 – 198 g</span></div>
      </div>
      <p class="sub" style="font-size:36px;margin-top:36px">General guidance for healthy adults who train – not medical advice.</p></div>`),
    custom(`<div class="vbox-src" style="position:absolute;top:0;bottom:0;left:80px;right:80px;display:flex;flex-direction:column;justify-content:center">
      <h1 style="font-size:84px">Easy <span class="gold">protein portions.</span></h1>
      <div class="card" style="margin-top:44px">
        <div class="row"><span>150 g chicken breast, cooked</span><span class="gold">≈ 46 g</span></div>
        <div class="row"><span>250 g skyr</span><span class="gold">≈ 28 g</span></div>
        <div class="row"><span>200 g cottage cheese</span><span class="gold">≈ 22 g</span></div>
        <div class="row"><span>3 eggs</span><span class="gold">≈ 21 g</span></div>
      </div>
      <p class="sub" style="font-size:38px;margin-top:36px">Spread it over 3–5 meals.</p></div>`),
    phone('The app does <span class="gold">the maths.</span>', 'Set your target once – it shows what’s left today.', 'diary', [120, 640]),
    cta('Protein left? One look.'),
  ],
};

const browser = await chromium.launch();
const out = path.join(HERE, VIDEO ? 'out-video' : 'out');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const p = await browser.newPage();
for (const [name, html] of VIDEO ? [] : Object.entries(STORIES)) {
  await p.setViewportSize({ width: 1080, height: 1920 });
  await p.setContent(html, { waitUntil: 'load' });
  await p.screenshot({ path: path.join(out, `story-${name}.png`) });
}
for (const [name, slides] of Object.entries(CAROUSELS)) {
  await p.setViewportSize(VIDEO ? { width: 1080, height: 1920 } : { width: W, height: H });
  for (const [i, s] of slides.entries()) {
    await p.setContent(s(i + 1, slides.length), { waitUntil: 'load' });
    await p.screenshot({ path: path.join(out, `carousel-${name}-${String(i + 1).padStart(2, '0')}.png`) });
  }
}
await browser.close();
console.log(fs.readdirSync(out).join('\n'));
