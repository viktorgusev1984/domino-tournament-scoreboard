import { useEffect, useMemo, useState, type FC } from 'react'
import { DOMINO_TILES, type DominoTile } from '../data/dominoTiles'
import { DominoTileGraphic } from './DominoTileGraphic'

interface TilePickerProps {
  open: boolean
  onClose: () => void
  onSelect: (tile: DominoTile) => void
  selectedTileId?: string
  playerName?: string
}

export const TilePicker: FC<TilePickerProps> = ({
  open,
  onClose,
  onSelect,
  selectedTileId,
  playerName,
}) => {
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (open) {
      setQuery('')
    }
  }, [open])

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

    if (!normalized) {
      return DOMINO_TILES
    }

    return DOMINO_TILES.filter((tile) =>
      tile.keywords.some((keyword) => keyword.includes(normalized)),
    )
  }, [query])

  if (!open) {
    return null
  }

  return (
    <div className="tile-picker-backdrop" role="dialog" aria-modal="true">
      <div className="tile-picker">
        <div className="tile-picker-header">
          <h2>
            Выбор фишки {playerName ? <span className="tile-picker-player">для {playerName}</span> : null}
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
              const isActive = tile.id === selectedTileId

              return (
                <button
                  key={tile.id}
                  type="button"
                  role="listitem"
                  className={`tile-picker-item ${isActive ? 'tile-picker-item-active' : ''}`}
                  onClick={() => {
                    onSelect(tile)
                    onClose()
                  }}
                >
                  <DominoTileGraphic left={tile.left} right={tile.right} size={64} />
                  <span className="tile-picker-label">{tile.label}</span>
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default TilePicker
