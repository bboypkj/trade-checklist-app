import React, { useMemo, useState } from 'react';

const defaultTiles = [
  { id: 1, label: 'Waited Patiently for Confirmed Regime', group: 'entry', state: 'neutral' },
  { id: 2, label: 'AOI Sweep against and 1min close on my side (SPX AND NQ)', group: 'entry', state: 'neutral' },
  { id: 3, label: 'Subsequent Candle Goes Against me then fails', group: 'entry', state: 'neutral' },
  { id: 4, label: 'Imbalance on Left', group: 'entry', state: 'neutral' },
  { id: 5, label: 'Previous Market Structure Agrees', group: 'entry', state: 'neutral' },
  { id: 6, label: 'SPX/NQ at Analogous S or R', group: 'entry', state: 'neutral' },
  { id: 7, label: 'TP1 > 1.5 R/R of room', group: 'entry', state: 'neutral' },
  { id: 8, label: 'Stop allows room to breathe and 1-2pts beyond Invalidation', group: 'entry', state: 'neutral' },
  { id: 9, label: 'PA Structuring Against Trade (HHs on Short, LLs on Long, Shorting or Longing into CLUSTER)', group: 'nogo', state: 'neutral' },
  { id: 10, label: 'Choppy/Overlapping PA', group: 'nogo', state: 'neutral' },
  { id: 11, label: 'SPX and NQ Not on same side of OPEN', group: 'nogo', state: 'neutral' },
  { id: 12, label: 'Fading a 2B + Div at Major AOI', group: 'nogo', state: 'neutral' },
];

function getNextState(tile) {
  return tile.state === 'neutral' ? 'active' : 'neutral';
}

function getOverallStatus(greenCount, redCount) {
  if (redCount > 0) {
    return {
      title: 'NO GO',
      subtitle: 'At least one hard blocker is active.',
      className: 'status-card status-red',
    };
  }

  if (greenCount === 8) {
    return {
      title: 'A+',
      subtitle: 'All 8 entry conditions are confirmed.',
      className: 'status-card status-emerald',
    };
  }

  if (greenCount >= 6) {
    return {
      title: 'A',
      subtitle: '6 to 7 conditions are confirmed.',
      className: 'status-card status-green',
    };
  }

  return {
    title: 'DO NOT ENTER',
    subtitle: 'You only have 0 to 5 green conditions.',
    className: 'status-card status-neutral',
  };
}

export default function App() {
  const [tiles, setTiles] = useState(defaultTiles);

  const greenCount = useMemo(
    () => tiles.filter((tile) => tile.group === 'entry' && tile.state === 'active').length,
    [tiles]
  );

  const redCount = useMemo(
    () => tiles.filter((tile) => tile.group === 'nogo' && tile.state === 'active').length,
    [tiles]
  );

  const status = useMemo(() => getOverallStatus(greenCount, redCount), [greenCount, redCount]);

  const toggleTile = (id) => {
    setTiles((prev) =>
      prev.map((tile) => (tile.id === id ? { ...tile, state: getNextState(tile) } : tile))
    );
  };

  const resetTiles = () => setTiles(defaultTiles);

  return (
    <div className="app-shell">
      <div className="app-container">
        <header className="topbar">
          <div>
            <h1>Trade Conviction Board</h1>
            <p>Top 2 rows: grey to green. Bottom row: grey to red.</p>
          </div>
          <div className="topbar-right">
            <div className="pill-card">
              <span className="pill-label">Green Conditions</span>
              <strong>{greenCount}/8</strong>
            </div>
            <div className="pill-card">
              <span className="pill-label">Red Flags</span>
              <strong>{redCount}/4</strong>
            </div>
            <button className="reset-button" onClick={resetTiles}>
              Reset
            </button>
          </div>
        </header>

        <section className={status.className}>
          <div className="status-label">Current Read</div>
          <h2>{status.title}</h2>
          <p>{status.subtitle}</p>
        </section>

        <main className="tiles-grid">
          {tiles.map((tile) => {
            const isEntry = tile.group === 'entry';
            const activeClass = isEntry ? 'entry-active' : 'nogo-active';
            const neutralClass = isEntry ? 'tile-neutral' : 'nogo-neutral';
            const cardClass = tile.state === 'active' ? activeClass : neutralClass;

            return (
              <button
                key={tile.id}
                className={`tile-card ${cardClass}`}
                onClick={() => toggleTile(tile.id)}
              >
                <div>
                  <div className="tile-tag">{isEntry ? 'Entry Condition' : 'No Go'}</div>
                  <div className="tile-label">{tile.label}</div>
                </div>
                <div className="tile-state">
                  {isEntry
                    ? tile.state === 'active'
                      ? 'Confirmed'
                      : 'Unconfirmed'
                    : tile.state === 'active'
                      ? 'Active blocker'
                      : 'Not present'}
                </div>
              </button>
            );
          })}
        </main>
      </div>
    </div>
  );
}
