import React, { useMemo, useState } from 'react';

function TileImage({ src }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) return null;

  return (
    <div className="tile-image-wrap" aria-hidden="true">
      <img
        src={src}
        alt=""
        className="tile-image"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

const regimeOptions = ['Trend Day', 'Reversal Day', '2-Sided CHOP', 'Neutral'];

const defaultTiles = [
  {
    id: 1,
    label: 'Previous Market Structure on 1min, 3min, 15min agrees',
    group: 'entry',
    state: 'neutral',
    image: '/MSagree.png',
  },
  {
    id: 2,
    label: 'Volume Confirming my trade',
    group: 'entry',
    state: 'neutral',
    image: '/stoproom.png',
  },
  {
    id: 3,
    label: 'Pretty Trend',
    group: 'entry',
    state: 'neutral',
    image: '/analogous.png',
  },
  {
    id: 4,
    label: 'Price Reclaimed AOI Twice',
    group: 'entry',
    state: 'neutral',
    image: '/samesideclose.png',
  },

  {
    id: 5,
    label: 'Increasing Volume on 1 or 3 min against my trade',
    group: 'nogo',
    state: 'neutral',
    image: '/imbalance.png',
  },
  {
    id: 6,
    label: '1min close on wrong side (Either NQ or SPX)',
    group: 'nogo',
    state: 'neutral',
    image: '/2ndpoke.png',
  },
  {
    id: 7,
    label: 'TP1 < 1.5 R/R of room',
    group: 'nogo',
    state: 'neutral',
    image: '/tp1room.png',
  },
  {
    id: 8,
    label: 'Trade still fighting Major Level',
    group: 'nogo',
    state: 'neutral',
    image: '/2b.png',
  },
  {
    id: 9,
    label: 'SPX and NQ Not on same side of OPEN',
    group: 'nogo',
    state: 'neutral',
    image: '/NGsameside.png',
  },
  {
    id: 10,
    label:
      'PA Structuring Against Trade (HHs on Short, LLs on Long, Shorting or Longing into CLUSTER)',
    group: 'nogo',
    state: 'neutral',
    image: '/NGStructure.png',
  },
  {
    id: 11,
    label: 'Choppy/Overlapping PA',
    group: 'nogo',
    state: 'neutral',
    image: '/NGchop.png',
  },
  {
    id: 12,
    label: 'Fading Direction of a 2B + Div at Major AOI',
    group: 'nogo',
    state: 'neutral',
    image: '/NGfade.png',
  },
];

function getNextState(tile) {
  return tile.state === 'neutral' ? 'active' : 'neutral';
}

function getTpPlan(regime) {
  if (regime === 'Neutral') return "Don't Trade";
  return regime === '2-Sided CHOP' ? 'Conservative' : 'Ride the Trend';
}

function getOverallStatus(greenCount, redCount, regime, tpPlan) {
  if (redCount > 0) {
    return {
      title: 'NO GO',
      subtitle: 'At least one no-go condition is active.',
      className: 'status-card status-red',
    };
  }

  if (regime === 'Neutral') {
    return {
      title: 'DO NOT ENTER',
      subtitle: (
        <>
          Regime: {regime}
          <br />
          TP Plan: {tpPlan}
          <br />
          No trade in neutral conditions.
        </>
      ),
      className: 'status-card status-yellow',
    };
  }

  if (greenCount === 4) {
    return {
      title: 'A+',
      subtitle: (
        <>
          Regime: {regime}
          <br />
          TP Plan: {tpPlan}
          <br />
          4/4 Entry Conditions are on.
        </>
      ),
      className: 'status-card status-emerald',
    };
  }

  if (greenCount === 3) {
    return {
      title: 'A',
      subtitle: (
        <>
          Regime: {regime}
          <br />
          TP Plan: {tpPlan}
          <br />
          3/4 Entry Conditions are on.
        </>
      ),
      className: 'status-card status-emerald',
    };
  }

  return {
    title: 'DO NOT ENTER',
    subtitle: 'You need at least 3/4 green and 0 active no-go conditions.',
    className: 'status-card status-neutral',
  };
}

function getRegimeCardClass(regime) {
  if (regime === 'Trend Day') return 'pill-card pill-button regime-trend';
  if (regime === 'Reversal Day') return 'pill-card pill-button regime-reversal';
  if (regime === 'Neutral') return 'pill-card pill-button regime-neutral';
  return 'pill-card pill-button regime-chop';
}

export default function App() {
  const [tiles, setTiles] = useState(defaultTiles);
  const [regimeIndex, setRegimeIndex] = useState(0);

  const regime = regimeOptions[regimeIndex];
  const tpPlan = getTpPlan(regime);

  const greenCount = useMemo(
    () =>
      tiles.filter(
        (tile) => tile.group === 'entry' && tile.state === 'active'
      ).length,
    [tiles]
  );

  const redCount = useMemo(
    () =>
      tiles.filter(
        (tile) => tile.group === 'nogo' && tile.state === 'active'
      ).length,
    [tiles]
  );

  const status = useMemo(
    () => getOverallStatus(greenCount, redCount, regime, tpPlan),
    [greenCount, redCount, regime, tpPlan]
  );

  const toggleTile = (id) => {
    setTiles((prev) =>
      prev.map((tile) =>
        tile.id === id ? { ...tile, state: getNextState(tile) } : tile
      )
    );
  };

  const cycleRegime = () => {
    setRegimeIndex((prev) => (prev + 1) % regimeOptions.length);
  };

  const resetTiles = () => {
    setTiles(defaultTiles);
    setRegimeIndex(0);
  };

  return (
    <div className="app-shell">
      <div className="app-container">
        <header className="topbar">
          <div>
            <h1>Trade Conviction Board</h1>
            <p>Bottom 2 rows are no-go. Any red means no trade.</p>
          </div>

          <div className="topbar-right">
            <div className="pill-card pill-card-wide pill-static">
              <span className="pill-label">TP Plan</span>
              <strong>{tpPlan}</strong>
            </div>

            <button
              type="button"
              className={getRegimeCardClass(regime)}
              onClick={cycleRegime}
            >
              <span className="pill-label">Regime</span>
              <strong>{regime}</strong>
            </button>

            <div className="pill-card pill-card-wide pill-static">
              <span className="pill-label">Green Conditions</span>
              <strong>{greenCount}/4</strong>
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
            const cardClass =
              tile.state === 'active' ? activeClass : neutralClass;
            const hasImage = Boolean(tile.image);

            return (
              <button
                key={tile.id}
                className={`tile-card ${cardClass}`}
                onClick={() => toggleTile(tile.id)}
              >
                {hasImage && <TileImage src={tile.image} />}

                <div
                  className={`tile-content ${
                    hasImage ? 'tile-content-with-image' : ''
                  }`}
                >
                  <div>
                    <div className="tile-tag">
                      {isEntry ? 'Entry Condition' : 'No Go'}
                    </div>
                    <div className="tile-label">{tile.label}</div>
                  </div>

                  <div className="tile-state">
                    {isEntry
                      ? tile.state === 'active'
                        ? 'Confirmed'
                        : 'Required'
                      : tile.state === 'active'
                      ? 'Active blocker'
                      : 'Not present'}
                  </div>
                </div>
              </button>
            );
          })}
        </main>
      </div>
    </div>
  );
}
