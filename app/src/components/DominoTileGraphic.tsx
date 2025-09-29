import type { FC } from 'react'

const PIP_PATTERNS: Record<number, number[]> = {
  0: [],
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
}

interface DominoTileGraphicProps {
  left: number
  right: number
  size?: number
  className?: string
  emphasize?: boolean
}

const renderHalf = (value: number) => {
  const pattern = new Set(PIP_PATTERNS[value] ?? [])

  return (
    <div className="pip-grid" aria-hidden>
      {Array.from({ length: 9 }).map((_, index) => (
        <span
          key={index}
          className={`pip ${pattern.has(index) ? 'pip-visible' : ''}`}
        />
      ))}
    </div>
  )
}

export const DominoTileGraphic: FC<DominoTileGraphicProps> = ({
  left,
  right,
  size = 72,
  className = '',
  emphasize = false,
}) => {
  const width = size
  const height = size * 1.8

  return (
    <div
      className={`domino-tile ${className} ${emphasize ? 'domino-tile-emphasize' : ''}`.trim()}
      style={{ width, height }}
    >
      <div className="domino-half">{renderHalf(left)}</div>
      <div className="domino-divider" />
      <div className="domino-half">{renderHalf(right)}</div>
    </div>
  )
}

export default DominoTileGraphic
