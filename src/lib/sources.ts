/**
 * Quellen für alle Gesundheitsangaben in der App (Guideline 1.4.1: Apple lehnte 1.3 am 20.10.2026
 * ab, weil Berechnungen und Empfehlungen ohne Quellen standen). Die Seite „Quellen“ unter „Mehr“
 * zeigt alle Themen; Rechner, Phasen-Auswertung und Wasserziel verlinken direkt ihr Thema.
 *
 * Alle DOIs am 20.10.2026 über doi.org geprüft. Zahlen im Text müssen zu den Konstanten passen:
 * `src/lib/onboarding.ts` (Rechner, Protein, Fett, Wasser) und `docs/COACHING-RULES.md` (Raten).
 */
import type { Language } from '../i18n';

export type SourceTopic = 'needs' | 'macros' | 'rate' | 'water' | 'activity';

export interface SourceRef {
  label: string;
  url: string;
}

interface Topic {
  title: Record<Language, string>;
  text: Record<Language, string>;
  refs: SourceRef[];
}

const doi = (id: string) => `https://doi.org/${id}`;

const REF = {
  mifflin: {
    label: 'Mifflin MD, St Jeor ST et al. (1990). A new predictive equation for resting energy expenditure in healthy individuals. Am J Clin Nutr 51(2):241–247.',
    url: doi('10.1093/ajcn/51.2.241'),
  },
  dgeEnergy: { label: 'Deutsche Gesellschaft für Ernährung (DGE): Referenzwerte Energie.', url: 'https://www.dge.de/wissenschaft/referenzwerte/energie/' },
  dgeFat: { label: 'Deutsche Gesellschaft für Ernährung (DGE): Referenzwerte Fett.', url: 'https://www.dge.de/wissenschaft/referenzwerte/fett/' },
  dgeWater: { label: 'Deutsche Gesellschaft für Ernährung (DGE): Referenzwerte Wasser.', url: 'https://www.dge.de/wissenschaft/referenzwerte/wasser/' },
  jaeger: {
    label: 'Jäger R et al. (2017). International Society of Sports Nutrition position stand: protein and exercise. J Int Soc Sports Nutr 14:20.',
    url: doi('10.1186/s12970-017-0177-8'),
  },
  morton: {
    label: 'Morton RW et al. (2018). A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength in healthy adults. Br J Sports Med 52(6):376–384.',
    url: doi('10.1136/bjsports-2017-097608'),
  },
  helmsProtein: {
    label: 'Helms ER et al. (2014). A systematic review of dietary protein during caloric restriction in resistance trained lean athletes: a case for higher intakes. Int J Sport Nutr Exerc Metab 24(2):127–138.',
    url: doi('10.1123/ijsnem.2013-0054'),
  },
  helmsPrep: {
    label: 'Helms ER, Aragon AA, Fitschen PJ (2014). Evidence-based recommendations for natural bodybuilding contest preparation: nutrition and supplementation. J Int Soc Sports Nutr 11:20.',
    url: doi('10.1186/1550-2783-11-20'),
  },
  garthe: {
    label: 'Garthe I et al. (2011). Effect of two different weight-loss rates on body composition and strength and power-related performance in elite athletes. Int J Sport Nutr Exerc Metab 21(2):97–104.',
    url: doi('10.1123/ijsnem.21.2.97'),
  },
  iraki: {
    label: 'Iraki J et al. (2019). Nutrition recommendations for bodybuilders in the off-season: a narrative review. Sports 7(7):154.',
    url: doi('10.3390/sports7070154'),
  },
  who: { label: 'World Health Organization (WHO): Obesity and overweight – fact sheet (BMI classification).', url: 'https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight' },
  efsa: {
    label: 'EFSA Panel on Dietetic Products, Nutrition and Allergies (2010). Scientific Opinion on Dietary Reference Values for water. EFSA Journal 8(3):1459.',
    url: doi('10.2903/j.efsa.2010.1459'),
  },
  levine: {
    label: 'Levine JA (2002). Non-exercise activity thermogenesis (NEAT). Best Pract Res Clin Endocrinol Metab 16(4):679–702.',
    url: doi('10.1053/beem.2002.0227'),
  },
} satisfies Record<string, SourceRef>;

export const SOURCES: Record<SourceTopic, Topic> = {
  needs: {
    title: { en: 'Calorie needs', de: 'Kalorienbedarf' },
    text: {
      en: 'Basal metabolic rate uses the Mifflin-St Jeor equation. Everyday activity and training are added with the physical activity level (PAL) values of the German Nutrition Society (DGE). The target never goes below your basal metabolic rate. A deficit of 15 % or a surplus of 10 % of maintenance is a starting point – after 2–3 weeks your weight trend shows whether it fits.',
      de: 'Der Grundumsatz wird nach der Mifflin-St-Jeor-Formel berechnet. Alltag und Training kommen über die PAL-Werte (Physical Activity Level) der Deutschen Gesellschaft für Ernährung (DGE) dazu. Das Ziel liegt nie unter dem Grundumsatz. 15 % Defizit oder 10 % Überschuss vom Erhaltungsbedarf sind ein Startpunkt – nach 2–3 Wochen zeigt der Gewichtstrend, ob es passt.',
    },
    refs: [REF.mifflin, REF.dgeEnergy],
  },
  macros: {
    title: { en: 'Protein and fat', de: 'Protein und Fett' },
    text: {
      en: 'Protein: 1.8 g per kg body weight, 2.0 g/kg in a deficit, where higher intakes help preserve muscle. Fat: 0.8–1.0 g/kg. With a BMI above 30, both are calculated from the weight at BMI 25 instead of body weight.',
      de: 'Protein: 1,8 g pro kg Körpergewicht, im Defizit 2,0 g/kg, weil mehr Protein dort hilft, Muskeln zu erhalten. Fett: 0,8–1,0 g/kg. Ab einem BMI über 30 rechnet die App beides mit dem Gewicht bei BMI 25 statt mit dem Körpergewicht.',
    },
    refs: [REF.jaeger, REF.morton, REF.helmsProtein, REF.dgeFat, REF.who],
  },
  rate: {
    title: { en: 'Rate of weight change (phase review)', de: 'Tempo der Gewichtsänderung (Phasen-Auswertung)' },
    text: {
      en: 'Cut: aim for about 0.4–0.7 % of body weight per week; slower losses keep more muscle and strength, faster than 0.8 % is flagged. Bulk: 0.1–0.25 % per week – deliberately more conservative than the 0.25–0.5 % often recommended. Maintenance: within ±0.5 %. The app only suggests a change after two weeks of a consistent 7-day trend and complete data.',
      de: 'Defizit: etwa 0,4–0,7 % des Körpergewichts pro Woche; langsamer erhält mehr Muskeln und Kraft, schneller als 0,8 % wird markiert. Aufbau: 0,1–0,25 % pro Woche – bewusst vorsichtiger als die oft empfohlenen 0,25–0,5 %. Erhalt: innerhalb von ±0,5 %. Die App schlägt erst eine Änderung vor, wenn der 7-Tage-Trend zwei Wochen in dieselbe Richtung geht und die Daten vollständig sind.',
    },
    refs: [REF.helmsPrep, REF.garthe, REF.iraki],
  },
  water: {
    title: { en: 'Water', de: 'Wasser' },
    text: {
      en: 'Suggested goal: 35 ml per kg body weight, at least 2 litres a day. European reference values for total water intake of adults are 2.0 l (women) and 2.5 l (men) a day from drinks and food; needs rise with heat and exercise.',
      de: 'Vorgeschlagenes Ziel: 35 ml pro kg Körpergewicht, mindestens 2 Liter am Tag. Die europäischen Referenzwerte für die gesamte Wasserzufuhr Erwachsener liegen bei 2,0 l (Frauen) und 2,5 l (Männer) pro Tag aus Getränken und Essen; bei Hitze und Sport steigt der Bedarf.',
    },
    refs: [REF.efsa, REF.dgeWater],
  },
  activity: {
    title: { en: 'Everyday movement (steps)', de: 'Alltagsbewegung (Schritte)' },
    text: {
      en: 'Energy used by everyday movement (NEAT) differs a lot between people and often drops in a calorie deficit. The app shows steps only to explain your trend – they never change your targets.',
      de: 'Der Energieverbrauch durch Alltagsbewegung (NEAT) ist von Mensch zu Mensch sehr verschieden und sinkt im Defizit oft. Die App zeigt Schritte nur, um den Trend zu erklären – sie ändern deine Ziele nie.',
    },
    refs: [REF.levine],
  },
};

export const SOURCE_TOPICS = Object.keys(SOURCES) as SourceTopic[];
