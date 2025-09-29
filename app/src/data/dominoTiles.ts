export interface DominoTile {
  id: string
  left: number
  right: number
  label: string
  keywords: string[]
}

const DOUBLE_NAMES: Record<number, string[]> = {
  0: ['пусто-пусто', 'нулевой дубль'],
  1: ['единица-единица', 'дубль единиц'],
  2: ['двойка-двойка', 'дубль двоек'],
  3: ['тройка-тройка', 'дубль троек'],
  4: ['четвёрка-четвёрка', 'дубль четвёрок'],
  5: ['пятёрка-пятёрка', 'дубль пятёрок'],
  6: ['шестёрка-шестёрка', 'дубль шестёрок'],
}

const NUMBER_WORDS = ['ноль', 'один', 'два', 'три', 'четыре', 'пять', 'шесть']

const buildTileKeywords = (left: number, right: number): string[] => {
  const base = [
    `${left}-${right}`,
    `${right}-${left}`,
    `${left}${right}`,
    `${right}${left}`,
    `${NUMBER_WORDS[left]} ${NUMBER_WORDS[right]}`,
    `${NUMBER_WORDS[right]} ${NUMBER_WORDS[left]}`,
  ]

  if (left === right) {
    base.push('дубль', `${NUMBER_WORDS[left]} дубль`)
    base.push(...(DOUBLE_NAMES[left] ?? []))
  }

  return base
}

const createDominoTiles = (maxPip: number): DominoTile[] => {
  const tiles: DominoTile[] = []

  for (let left = 0; left <= maxPip; left += 1) {
    for (let right = left; right <= maxPip; right += 1) {
      tiles.push({
        id: `${left}-${right}`,
        left,
        right,
        label: `${left} | ${right}`,
        keywords: buildTileKeywords(left, right),
      })
    }
  }

  return tiles
}

export const DOMINO_TILES = createDominoTiles(6)

export const DOMINO_TILE_MAP = new Map(DOMINO_TILES.map((tile) => [tile.id, tile]))
