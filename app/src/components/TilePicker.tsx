import { useEffect, useMemo, useState, type FC } from 'react'
import { DOMINO_TILES, type DominoTile } from '../data/dominoTiles'
import { DominoTileGraphic } from './DominoTileGraphic'

interface TilePickerProps {
  open: boolean
  onClose: () => void
  onSelect: (tiles: DominoTile[]) => void
  selectedTileIds?: string[]
  playerName?: string
  excludedTileIds?: string[]
}

export const TilePicker: FC<TilePickerProps> = ({
  open,
  onClose,
  onSelect,
  selectedTileIds,
  playerName,
  excludedTileIds,
}) => {
  const [query, setQuery] = useState('')
  const [selection, setSelection] = useState<Set<string>>(new Set())
  const preservedSelection = useMemo(
    () => new Set(selectedTileIds ?? []),
    [selectedTileIds],
  )
  const excludedTilesSet = useMemo(() => {
    if (!excludedTileIds || excludedTileIds.length === 0) {
      return new Set<string>()
    }

    return new Set(excludedTileIds.filter((tileId) => !preservedSelection.has(tileId)))
  }, [excludedTileIds, preservedSelection])

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelection(new Set(selectedTileIds ?? []))
    }
  }, [open, selectedTileIds])

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  const filteredTiles = useMemo(() => {
    const normalized = query.trim().toLowerCase()

    const bySearch = !normalized
      ? DOMINO_TILES
      : DOMINO_TILES.filter((tile) =>
          tile.keywords.some((keyword) => keyword.includes(normalized)),
        )

    if (excludedTilesSet.size === 0) {
      return bySearch
    }

    return bySearch.filter((tile) => !excludedTilesSet.has(tile.id))
  }, [excludedTilesSet, query])

  if (!open) {
    return null
  }

  const toggleTile = (tileId: string) => {
    if (excludedTilesSet.has(tileId) && !selection.has(tileId)) {
      return
    }

    setSelection((prev) => {
      const next = new Set(prev)
      if (next.has(tileId)) {
        next.delete(tileId)
      } else {
        next.add(tileId)
      }
      return next
    })
  }

  const handleConfirm = () => {
    const tiles = Array.from(selection)
      .map((tileId) => DOMINO_TILES.find((tile) => tile.id === tileId))
      .filter((tile): tile is DominoTile => Boolean(tile))
    onSelect(tiles)
    onClose()
  }

  const handleClearSelection = () => {
    setSelection(new Set())
  }

  const selectedCount = selection.size

  return (
    <div className="tile-picker-backdrop" role="dialog" aria-modal="true">
      <div className="tile-picker">
        <div className="tile-picker-header">
          <h2>
            Выбор фишек {playerName ? <span className="tile-picker-player">для {playerName}</span> : null}
          </h2>
          <button
            type="button"
            className="tile-picker-close"
            onClick={onClose}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>
        <input
          type="search"
          className="tile-picker-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Поиск по значениям, например 6-6 или дубль"
        />
        <div className="tile-picker-grid" role="list">
          {filteredTiles.length === 0 ? (
            <p className="tile-picker-empty">Фишки не найдены</p>
          ) : (
            filteredTiles.map((tile) => {
              const isActive = selection.has(tile.id)

              return (
                <button
                  key={tile.id}
                  type="button"
                  role="listitem"
                  className={`tile-picker-item ${isActive ? 'tile-picker-item-active' : ''}`}
                  onClick={() => {
                    toggleTile(tile.id)
                  }}
                >
                  <DominoTileGraphic left={tile.left} right={tile.right} size={64} />
                  <span className="tile-picker-label">{tile.label}</span>
                </button>
              )
            })
          )}
        </div>
        <div className="tile-picker-actions">
          <span className="tile-picker-count">Выбрано: {selectedCount}</span>
          <div className="tile-picker-buttons">
            <button
              type="button"
              className="tile-picker-action-clear"
              onClick={handleClearSelection}
              disabled={selectedCount === 0}
            >
              Очистить
            </button>
            <button
              type="button"
              className="tile-picker-action-confirm"
              onClick={handleConfirm}
            >
              Готово
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TilePicker
