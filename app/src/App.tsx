import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { DOMINO_TILE_MAP, type DominoTile } from './data/dominoTiles'
import { DominoTileGraphic } from './components/DominoTileGraphic'
import { TilePicker } from './components/TilePicker'

interface Player {
  id: string
  name: string
}

interface RoundEntry {
  points: number
  tileIds?: string[]
}

interface Round {
  id: string
  index: number
  entries: Record<string, RoundEntry>
}

type RoundDraft = Record<string, { points: string; tileIds: string[] }>

const LOSS_VIDEOS = [
  'https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0',
  'https://www.youtube.com/embed/ZZ5LpwO-An4?rel=0',
  'https://www.youtube.com/embed/lXMskKTw3Bc?rel=0',
]

const MIN_PLAYERS = 2
const MAX_PLAYERS = 8
const DEFAULT_PLAYERS = 4
const DEFAULT_TARGET = 100

const createPlayer = (index: number): Player => ({
  id: `player-${index}`,
  name: `Игрок ${index}`,
})

const createPlayers = (count: number): Player[] =>
  Array.from({ length: count }, (_, index) => createPlayer(index + 1))

const buildRoundDraft = (players: Player[], previous?: RoundDraft): RoundDraft =>
  players.reduce<RoundDraft>((accumulator, player) => {
    const prevEntry = previous?.[player.id]
    accumulator[player.id] = {
      points: prevEntry?.points ?? '',
      tileIds: prevEntry?.tileIds ?? [],
    }
    return accumulator
  }, {})

const calculateTilePoints = (tileIds: string[]): number =>
  tileIds.reduce((sum, tileId) => {
    const tile = DOMINO_TILE_MAP.get(tileId)

    if (!tile) {
      return sum
    }

    return sum + tile.left + tile.right
  }, 0)

const adjustPlayers = (current: Player[], desiredCount: number): Player[] => {
  if (desiredCount === current.length) {
    return current
  }

  if (desiredCount > current.length) {
    const additions = Array.from({ length: desiredCount - current.length }, (_, index) =>
      createPlayer(current.length + index + 1),
    )
    return [...current, ...additions]
  }

  return current.slice(0, desiredCount)
}

const pickRandomVideo = (exclude?: string | null): string => {
  if (LOSS_VIDEOS.length === 1) {
    return LOSS_VIDEOS[0]
  }

  let candidate = LOSS_VIDEOS[Math.floor(Math.random() * LOSS_VIDEOS.length)]

  while (candidate === exclude) {
    candidate = LOSS_VIDEOS[Math.floor(Math.random() * LOSS_VIDEOS.length)]
  }

  return candidate
}

function App() {
  const initialPlayers = useMemo(() => createPlayers(DEFAULT_PLAYERS), [])

  const [players, setPlayers] = useState<Player[]>(initialPlayers)
  const [targetScore, setTargetScore] = useState<number>(DEFAULT_TARGET)
  const [rounds, setRounds] = useState<Round[]>([])
  const [roundDraft, setRoundDraft] = useState<RoundDraft>(() =>
    buildRoundDraft(initialPlayers),
  )
  const [roundError, setRoundError] = useState<string | null>(null)
  const [activePicker, setActivePicker] = useState<string | null>(null)
  const [lossVideoUrl, setLossVideoUrl] = useState<string | null>(null)

  useEffect(() => {
    setRoundDraft((prev) => buildRoundDraft(players, prev))
  }, [players])

  useEffect(() => {
    if (activePicker && !players.some((player) => player.id === activePicker)) {
      setActivePicker(null)
    }
  }, [activePicker, players])

  const totals = useMemo(() => {
    const result: Record<string, number> = {}

    players.forEach((player) => {
      result[player.id] = rounds.reduce((sum, round) => {
        const entry = round.entries[player.id]
        return sum + (entry?.points ?? 0)
      }, 0)
    })

    return result
  }, [players, rounds])

  const losingPlayers = useMemo(
    () =>
      targetScore > 0
        ? players.filter((player) => (totals[player.id] ?? 0) >= targetScore)
        : [],
    [players, targetScore, totals],
  )

  const loserKey = losingPlayers.map((player) => player.id).join('|')

  useEffect(() => {
    if (!loserKey) {
      setLossVideoUrl(null)
      return
    }

    setLossVideoUrl((current) => pickRandomVideo(current))
  }, [loserKey])

  const handlePlayerCountChange = (rawValue: number) => {
    if (Number.isNaN(rawValue)) {
      return
    }

    const clamped = Math.min(Math.max(rawValue, MIN_PLAYERS), MAX_PLAYERS)

    if (clamped === players.length) {
      return
    }

    const updatedPlayers = adjustPlayers(players, clamped)
    setPlayers(updatedPlayers)
    setRounds((prevRounds) =>
      prevRounds.map((round) => {
        const entries: Record<string, RoundEntry> = {}

        updatedPlayers.forEach((player) => {
          const existing = round.entries[player.id]
          entries[player.id] = existing
            ? { points: existing.points, tileIds: existing.tileIds ?? [] }
            : { points: 0, tileIds: [] }
        })

        return { ...round, entries }
      }),
    )
  }

  const handlePlayerNameChange = (id: string, name: string) => {
    setPlayers((prev) => prev.map((player) => (player.id === id ? { ...player, name } : player)))
  }

  const handleDraftPointsChange = (playerId: string, value: string) => {
    const sanitized = value.replace(/[^0-9]/g, '')
    setRoundDraft((prev) => {
      const previousEntry = prev[playerId] ?? { points: '', tileIds: [] }
      return {
        ...prev,
        [playerId]: {
          ...previousEntry,
          points: sanitized,
        },
      }
    })
    setRoundError(null)
  }

  const handleTilesSelect = (playerId: string, tiles: DominoTile[]) => {
    const uniqueIds = Array.from(new Set(tiles.map((tile) => tile.id)))

    setRoundDraft((prev) => {
      const previousEntry = prev[playerId] ?? { points: '', tileIds: [] }
      return {
        ...prev,
        [playerId]: {
          ...previousEntry,
          tileIds: uniqueIds,
        },
      }
    })
    setRoundError(null)
  }

  const handleClearTile = (playerId: string) => {
    setRoundDraft((prev) => {
      const previousEntry = prev[playerId] ?? { points: '', tileIds: [] }
      return {
        ...prev,
        [playerId]: {
          ...previousEntry,
          tileIds: [],
        },
      }
    })
  }

  const handleAddRound = () => {
    if (players.length === 0) {
      return
    }

    const entries: Record<string, RoundEntry> = {}
    let hasData = false

    players.forEach((player) => {
      const draftEntry = roundDraft[player.id]
      const tileIds = draftEntry?.tileIds ?? []
      const rawPoints = draftEntry?.points ?? ''
      const parsed = Number.parseInt(rawPoints, 10)
      const hasManualPoints = rawPoints.length > 0 && !Number.isNaN(parsed)
      const manualPoints = Number.isNaN(parsed) ? 0 : Math.max(parsed, 0)
      const tilePoints = calculateTilePoints(tileIds)
      const points = hasManualPoints ? manualPoints : tilePoints

      if (points > 0 || tileIds.length > 0) {
        hasData = true
      }

      entries[player.id] = {
        points,
        tileIds: [...tileIds],
      }
    })

    if (!hasData) {
      setRoundError('Добавьте очки или выберите фишки хотя бы для одного игрока.')
      return
    }

    const newRound: Round = {
      id: `round-${rounds.length + 1}-${Date.now()}`,
      index: rounds.length + 1,
      entries,
    }

    setRounds((prev) => [...prev, newRound])
    setRoundDraft(buildRoundDraft(players))
    setRoundError(null)
  }

  const handleReset = () => {
    setRounds([])
    setRoundDraft(buildRoundDraft(players))
    setLossVideoUrl(null)
    setRoundError(null)
  }

  const activePickerPlayer = activePicker
    ? players.find((player) => player.id === activePicker)
    : undefined

  return (
    <div className="app">
      <header className="app-header">
        <h1>Турнирное табло по домино</h1>
        <p>
          Управляйте раундами, очками и сыгранными фишками. Как только игрок достигает порога
          проигрыша, появится случайное видео с поражением.
        </p>
      </header>

      <section className="control-panel">
        <div className="control">
          <label htmlFor="player-count">Количество игроков</label>
          <input
            id="player-count"
            type="number"
            min={MIN_PLAYERS}
            max={MAX_PLAYERS}
            value={players.length}
            onChange={(event) => handlePlayerCountChange(Number.parseInt(event.target.value, 10))}
          />
          <span className="control-hint">
            от {MIN_PLAYERS} до {MAX_PLAYERS}
          </span>
        </div>
        <div className="control">
          <label htmlFor="target-score">Порог проигрыша (очки)</label>
          <input
            id="target-score"
            type="number"
            min={1}
            value={targetScore}
            onChange={(event) => setTargetScore(Math.max(1, Number.parseInt(event.target.value, 10) || 0))}
          />
        </div>
        <button type="button" className="secondary" onClick={handleReset}>
          Сбросить результаты
        </button>
      </section>

      <section className="players">
        <div className="section-header">
          <h2>Игроки</h2>
          <span className="section-subtitle">Нажмите на имя, чтобы переименовать участника</span>
        </div>
        <div className="player-grid">
          {players.map((player, index) => {
            const total = totals[player.id] ?? 0
            const isLoser = losingPlayers.some((loser) => loser.id === player.id)

            return (
              <div
                key={player.id}
                className={`player-card ${isLoser ? 'player-card-loser' : ''}`}
              >
                <span className="player-index">#{index + 1}</span>
                <input
                  type="text"
                  className="player-name"
                  value={player.name}
                  onChange={(event) => handlePlayerNameChange(player.id, event.target.value)}
                  maxLength={24}
                />
                <span className="player-total">Итого: {total}</span>
              </div>
            )
          })}
        </div>
      </section>

      <section className="round-form">
        <div className="section-header">
          <h2>Добавить раунд #{rounds.length + 1}</h2>
          <span className="section-subtitle">Введите очки и выберите сыгранные фишки</span>
        </div>
        <div className="round-input-grid">
          {players.map((player) => {
            const draftEntry = roundDraft[player.id]
            const selectedTiles = (draftEntry?.tileIds ?? [])
              .map((tileId) => DOMINO_TILE_MAP.get(tileId))
              .filter((tile): tile is DominoTile => Boolean(tile))

            return (
              <div key={player.id} className="round-input">
                <h3>{player.name}</h3>
                <div className="round-input-controls">
                  <label className="round-label">
                    Очки
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={draftEntry?.points ?? ''}
                      onChange={(event) => handleDraftPointsChange(player.id, event.target.value)}
                    />
                  </label>
                  <div className="tile-selector">
                    <button
                      type="button"
                      className="tile-selector-trigger"
                      onClick={() => {
                        setActivePicker(player.id)
                        setRoundError(null)
                      }}
                    >
                      {selectedTiles.length > 0 ? (
                        <>
                          <div className="tile-selector-preview">
                            {selectedTiles.slice(0, 3).map((tile) => (
                              <DominoTileGraphic
                                key={tile.id}
                                left={tile.left}
                                right={tile.right}
                                size={48}
                              />
                            ))}
                          </div>
                          <span>
                            {selectedTiles.length === 1
                              ? selectedTiles[0].label
                              : `Выбрано: ${selectedTiles.length}`}
                          </span>
                        </>
                      ) : (
                        <span>Выбрать фишки</span>
                      )}
                    </button>
                    {selectedTiles.length > 0 ? (
                      <button
                        type="button"
                        className="tile-clear"
                        onClick={() => handleClearTile(player.id)}
                        aria-label={`Очистить фишки игрока ${player.name}`}
                      >
                        ×
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        {roundError ? <p className="round-error">{roundError}</p> : null}
        <button type="button" className="primary" onClick={handleAddRound}>
          Сохранить раунд
        </button>
      </section>

      <section className="rounds">
        <div className="section-header">
          <h2>История раундов</h2>
          <span className="section-subtitle">
            Отслеживайте очки и сыгранные фишки по каждому раунду
          </span>
        </div>
        {rounds.length === 0 ? (
          <p className="empty-state">Раунды ещё не добавлены. Заполните форму выше и сохраните.</p>
        ) : (
          <div className="round-table-wrapper">
            <table className="round-table">
              <thead>
                <tr>
                  <th scope="col">Раунд</th>
                  {players.map((player) => (
                    <th key={player.id} scope="col">
                      {player.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rounds.map((round) => (
                  <tr key={round.id}>
                    <th scope="row">#{round.index}</th>
                    {players.map((player) => {
                      const entry = round.entries[player.id]
                      const tiles = (entry?.tileIds ?? [])
                        .map((tileId) => DOMINO_TILE_MAP.get(tileId))
                        .filter((tile): tile is DominoTile => Boolean(tile))

                      return (
                        <td key={player.id}>
                          <div className="round-cell">
                            <span className="round-points">+{entry?.points ?? 0}</span>
                            {tiles.length > 0 ? (
                              <div className="round-cell-tiles">
                                {tiles.map((tile) => (
                                  <div key={tile.id} className="round-cell-tile">
                                    <DominoTileGraphic
                                      left={tile.left}
                                      right={tile.right}
                                      size={48}
                                    />
                                    <span>{tile.label}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="round-cell-placeholder">—</span>
                            )}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">Итого</th>
                  {players.map((player) => {
                    const total = totals[player.id] ?? 0
                    const isLoser = losingPlayers.some((loser) => loser.id === player.id)

                    return (
                      <td
                        key={player.id}
                        className={`round-total ${isLoser ? 'round-total-loser' : ''}`}
                      >
                        {total}
                      </td>
                    )
                  })}
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      {losingPlayers.length > 0 && lossVideoUrl ? (
        <section className="loser-video">
          <div className="section-header">
            <h2>Проигравший: {losingPlayers[0].name}</h2>
            <span className="section-subtitle">
              Порог проигрыша: {targetScore} очков. Видео можно поменять, добавив новый раунд.
            </span>
          </div>
          <div className="video-wrapper">
            <iframe
              title="Видео поражения"
              src={lossVideoUrl}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </section>
      ) : null}

      <TilePicker
        open={Boolean(activePicker)}
        onClose={() => setActivePicker(null)}
        onSelect={(tiles) => {
          if (activePicker) {
            handleTilesSelect(activePicker, tiles)
          }
        }}
        selectedTileIds={activePicker ? roundDraft[activePicker]?.tileIds ?? [] : []}
        playerName={activePickerPlayer?.name}
      />
    </div>
  )
}

export default App
