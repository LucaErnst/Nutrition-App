import { describe, expect, it } from 'vitest';
import { matchScore, normalize, rankFoods, type RankableFood } from '../foodRank';

const food = (name: string, over: Partial<RankableFood> = {}): RankableFood => ({ id: Math.random(), name, ...over });

describe('Treffer bewerten', () => {
  it('Wortanfang schlägt Wortmitte', () => {
    expect(matchScore('hafer flocken', 'hafer')).toBe(0);
    expect(matchScore('bio hafer', 'hafer')!).toBeLessThan(matchScore('schweinshaxe', 'hax')!);
  });

  it('kein Treffer bleibt ohne Wert', () => {
    expect(matchScore('hafer', 'reis')).toBeUndefined();
  });
});

describe('Deutsche Wortbildung', () => {
  it('„Ei" findet das Ei, nicht Eiswein oder Eiskaffee', () => {
    const list = [food('Eiswein'), food('Eierlikör'), food('Eiskaffee'), food('Hühnerei roh'), food('Ei (ganz)')];
    expect(rankFoods(list, 'ei').map((f) => f.name).slice(0, 2)).toEqual(['Ei (ganz)', 'Hühnerei roh']);
  });

  it('Wortende schlägt Wortanfang: Basmatireis vor Reiswaffeln', () => {
    const list = [food('Reiswaffeln ungesalzen'), food('Basmatireis gekocht')];
    expect(rankFoods(list, 'reis')[0].name).toBe('Basmatireis gekocht');
  });

  it('ganzes Wort schlägt alles', () => {
    expect(matchScore('ei (ganz)', 'ei')).toBe(0);
    expect(matchScore('huhnerei roh', 'ei')!).toBeLessThan(matchScore('eiswein', 'ei')!);
    expect(matchScore('eiswein', 'ei')!).toBeLessThan(matchScore('weizen', 'ei')!);
  });
});

describe('Reihenfolge der Treffer', () => {
  it('genauer Name zuerst', () => {
    const list = [food('Haferflocken mit Milch'), food('Hafer'), food('Haferkleie')];
    expect(rankFoods(list, 'hafer')[0].name).toBe('Hafer');
  });

  it('Wortanfang vor Wortmitte', () => {
    const list = [food('Schweinefleisch mit Haferbeilage'), food('Hafer Flocken')];
    expect(rankFoods(list, 'hafer')[0].name).toBe('Hafer Flocken');
  });

  it('Favoriten und Benutzung schlagen die Trefferqualität', () => {
    const fav = food('Bio Haferdrink', { favorite: 1, id: 1 });
    const list = [food('Hafer Flocken', { id: 2 }), fav];
    expect(rankFoods(list, 'hafer')[0]).toBe(fav);

    const used = food('Haferriegel', { id: 3 });
    const usage = new Map([[3, { count: 9 }]]);
    expect(rankFoods([food('Hafer Flocken', { id: 4 }), used], 'hafer', usage)[0]).toBe(used);
  });

  it('alle Begriffe müssen vorkommen', () => {
    const list = [food('Hafer Flocken'), food('Haferdrink')];
    expect(rankFoods(list, 'hafer flocken')).toHaveLength(1);
  });

  it('Marke zählt mit', () => {
    const list = [food('Joghurt nature', { brand: 'Emmi' }), food('Joghurt Frucht')];
    expect(rankFoods(list, 'emmi')).toHaveLength(1);
  });

  it('ohne Suchbegriff: Favoriten, dann Benutzung, dann alphabetisch', () => {
    const list = [food('Zwiebel', { id: 1 }), food('Apfel', { id: 2 }), food('Banane', { id: 3, favorite: 1 })];
    const usage = new Map([[1, { count: 5 }]]);
    expect(rankFoods(list, '', usage).map((f) => f.name)).toEqual(['Banane', 'Zwiebel', 'Apfel']);
  });

  it('Umlaute und Akzente stören nicht', () => {
    expect(normalize('Süsskartoffel')).toBe('susskartoffel');
    expect(rankFoods([food('Süsskartoffel')], 'suss')).toHaveLength(1);
  });
});

describe('Amerikanisch und britisch', () => {
  const table = [
    { id: 1, name: 'Courgette raw' },
    { id: 2, name: 'Aubergine raw' },
    { id: 3, name: 'Beef mince, raw' },
    { id: 4, name: 'Oat flakes' },
    { id: 5, name: 'Ground coffee' },
    { id: 6, name: 'Cornflakes' },
    { id: 7, name: 'Maize starch' },
  ];

  it('findet die britische Bezeichnung über das amerikanische Wort', () => {
    expect(rankFoods(table, 'zucchini')[0].name).toBe('Courgette raw');
    expect(rankFoods(table, 'eggplant')[0].name).toBe('Aubergine raw');
    expect(rankFoods(table, 'ground beef')[0].name).toBe('Beef mince, raw');
    expect(rankFoods(table, 'oatmeal')[0].name).toBe('Oat flakes');
    expect(rankFoods(table, 'cornstarch')[0].name).toBe('Maize starch');
  });

  it('verdrängt die wörtliche Eingabe nicht', () => {
    // „ground" wird zwar als „mince" mitgesucht, „ground coffee" bleibt aber der beste Treffer.
    expect(rankFoods(table, 'ground coffee')[0].name).toBe('Ground coffee');
  });

  it('ersetzt nur ganze Wörter', () => {
    // Ohne Wortgrenze würde aus „cornflakes" ein „maizeflakes" und der Treffer verschwände.
    expect(rankFoods(table, 'cornflakes')[0].name).toBe('Cornflakes');
  });

  it('geht auch andersherum, für eigene Lebensmittel', () => {
    const own = [{ id: 9, name: 'Zucchini vom Markt' }];
    expect(rankFoods(own, 'courgette')).toHaveLength(1);
  });
});
