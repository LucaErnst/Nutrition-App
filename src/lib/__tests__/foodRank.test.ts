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
