import React, { useEffect, useMemo, useRef, useState } from 'react';

function loadGalleryItems(globMap) {
  return Object.entries(globMap)
    .map(([path, src]) => {
      const fileName = path.split('/').pop() || '';
      const label = fileName.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
      return { src, fileName, label };
    })
    .sort((a, b) => a.fileName.localeCompare(b.fileName, undefined, { numeric: true }));
}

const aplusGalleryItems = loadGalleryItems({
  ...import.meta.glob('./gallery/APLUS/*.png', { eager: true, import: 'default' }),
  ...import.meta.glob('./gallery/APLUS/*.jpg', { eager: true, import: 'default' }),
  ...import.meta.glob('./gallery/APLUS/*.jpeg', { eager: true, import: 'default' }),
  ...import.meta.glob('./gallery/APLUS/*.webp', { eager: true, import: 'default' }),
  ...import.meta.glob('./gallery/APLUS/*.PNG', { eager: true, import: 'default' }),
  ...import.meta.glob('./gallery/APLUS/*.JPG', { eager: true, import: 'default' }),
  ...import.meta.glob('./gallery/APLUS/*.JPEG', { eager: true, import: 'default' }),
  ...import.meta.glob('./gallery/APLUS/*.WEBP', { eager: true, import: 'default' }),
});

const noGoGalleryItems = loadGalleryItems({
  ...import.meta.glob('./gallery/NG/*.png', { eager: true, import: 'default' }),
  ...import.meta.glob('./gallery/NG/*.jpg', { eager: true, import: 'default' }),
  ...import.meta.glob('./gallery/NG/*.jpeg', { eager: true, import: 'default' }),
  ...import.meta.glob('./gallery/NG/*.webp', { eager: true, import: 'default' }),
  ...import.meta.glob('./gallery/NG/*.PNG', { eager: true, import: 'default' }),
  ...import.meta.glob('./gallery/NG/*.JPG', { eager: true, import: 'default' }),
  ...import.meta.glob('./gallery/NG/*.JPEG', { eager: true, import: 'default' }),
  ...import.meta.glob('./gallery/NG/*.WEBP', { eager: true, import: 'default' }),
});

const STORAGE_KEY = 'trade-checklist-board-state-v3';
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
    label: 'Pretty Trend (Clear Direction, steep VWAP)',
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
    label: 'Trade still fighting Major Level / 2B + Div against me',
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
    label: 'PA Structuring Against Trade (HHs on Short, LLs on Long)',
    group: 'nogo',
    state: 'neutral',
    image: '/NGStructure.png',
  },
  {
    id: 11,
    label: 'Trend NOT Pretty (Choppy/Range/Overlapping/Flat VWAP)',
    group: 'nogo',
    state: 'neutral',
    image: '/NGchop.png',
  },
  {
    id: 12,
    label: 'Fading LTF break-out from cluster',
    group: 'nogo',
    state: 'neutral',
    image: '/NGfade.png',
  },
];

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

function getSavedState() {
  if (typeof window === 'undefined') {
    return { tiles: defaultTiles, regimeIndex: 0 };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { tiles: defaultTiles, regimeIndex: 0 };
    }

    const parsed = JSON.parse(raw);
    const savedStates = new Map((parsed.tiles || []).map((tile) => [tile.id, tile.state]));
    const tiles = defaultTiles.map((tile) => ({
      ...tile,
      state: savedStates.get(tile.id) === 'active' ? 'active' : 'neutral',
    }));
    const regimeIndex = Number.isInteger(parsed.regimeIndex)
      ? Math.min(Math.max(parsed.regimeIndex, 0), regimeOptions.length - 1)
      : 0;

    return { tiles, regimeIndex };
  } catch (error) {
    return { tiles: defaultTiles, regimeIndex: 0 };
  }
}

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
  const initialState = useMemo(() => getSavedState(), []);
  const [tiles, setTiles] = useState(initialState.tiles);
  const [regimeIndex, setRegimeIndex] = useState(initialState.regimeIndex);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryKind, setGalleryKind] = useState('APLUS');
  const [galleryIndex, setGalleryIndex] = useState(0);
  const touchStartX = useRef(null);

  const regime = regimeOptions[regimeIndex];
  const tpPlan = getTpPlan(regime);

  const greenCount = useMemo(
    () => tiles.filter((tile) => tile.group === 'entry' && tile.state === 'active').length,
    [tiles]
  );

  const redCount = useMemo(
    () => tiles.filter((tile) => tile.group === 'nogo' && tile.state === 'active').length,
    [tiles]
  );

  const status = useMemo(
    () => getOverallStatus(greenCount, redCount, regime, tpPlan),
    [greenCount, redCount, regime, tpPlan]
  );

  const galleryItems = galleryKind === 'APLUS' ? aplusGalleryItems : noGoGalleryItems;
  const currentGalleryItem = galleryItems[galleryIndex] || null;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        regimeIndex,
        tiles: tiles.map((tile) => ({ id: tile.id, state: tile.state })),
      })
    );
  }, [tiles, regimeIndex]);

  useEffect(() => {
    if (galleryIndex > 0 && galleryIndex > galleryItems.length - 1) {
      setGalleryIndex(0);
    }
  }, [galleryIndex, galleryItems.length]);

  const toggleTile = (id) => {
    setTiles((prev) =>
      prev.map((tile) => (tile.id === id ? { ...tile, state: getNextState(tile) } : tile))
    );
  };

  const cycleRegime = () => {
    setRegimeIndex((prev) => (prev + 1) % regimeOptions.length);
  };

  const resetTiles = () => {
    setTiles(defaultTiles.map((tile) => ({ ...tile, state: 'neutral' })));
  };

  const openGallery = (kind) => {
    setGalleryKind(kind);
    setGalleryIndex(0);
    setIsGalleryOpen(true);
  };

  const closeGallery = () => {
    setIsGalleryOpen(false);
  };

  const showPreviousImage = () => {
    if (galleryItems.length === 0) return;
    setGalleryIndex((prev) => (prev - 1 + galleryItems.length) % galleryItems.length);
  };

  const showNextImage = () => {
    if (galleryItems.length === 0) return;
    setGalleryIndex((prev) => (prev + 1) % galleryItems.length);
  };

  const onGalleryTouchStart = (event) => {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  };

  const onGalleryTouchEnd = (event) => {
    const endX = event.changedTouches[0]?.clientX ?? null;
    if (touchStartX.current === null || endX === null) return;

    const deltaX = endX - touchStartX.current;
    if (Math.abs(deltaX) < 45) return;

    if (deltaX < 0) {
      showNextImage();
    } else {
      showPreviousImage();
    }
  };

  return (
    <div className="app-shell">
      <div className="app-container">
        <header className="topbar">
          <div className="topbar-left">
            <div className="topbar-title-block">
              <h1>Trade Conviction Board</h1>
              <p>Bottom 2 rows are no-go. Any red means no trade.</p>
            </div>

            <div className="review-strip">
              <button
                type="button"
                className="pill-card gallery-button gallery-button-aplus"
                onClick={() => openGallery('APLUS')}
              >
                <span className="pill-label">Review</span>
                <strong>A+ Gallery</strong>
              </button>

              <button
                type="button"
                className="pill-card gallery-button gallery-button-ng"
                onClick={() => openGallery('NG')}
              >
                <span className="pill-label">Review</span>
                <strong>NO GO Gallery</strong>
              </button>
            </div>
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
              Reset Tiles
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
            const hasImage = Boolean(tile.image);

            return (
              <button
                key={tile.id}
                className={`tile-card ${cardClass}`}
                onClick={() => toggleTile(tile.id)}
              >
                {hasImage && <TileImage src={tile.image} />}

                <div className={`tile-content ${hasImage ? 'tile-content-with-image' : ''}`}>
                  <div>
                    <div className="tile-tag">{isEntry ? 'Entry Condition' : 'No Go'}</div>
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

      {isGalleryOpen && (
        <div className="gallery-overlay">
          <div className="gallery-panel">
            <div className="gallery-topbar">
              <div className="gallery-tabs">
                <button
                  type="button"
                  className={`gallery-tab ${galleryKind === 'APLUS' ? 'gallery-tab-active gallery-tab-aplus' : ''}`}
                  onClick={() => {
                    setGalleryKind('APLUS');
                    setGalleryIndex(0);
                  }}
                >
                  A+ Gallery
                </button>
                <button
                  type="button"
                  className={`gallery-tab ${galleryKind === 'NG' ? 'gallery-tab-active gallery-tab-ng' : ''}`}
                  onClick={() => {
                    setGalleryKind('NG');
                    setGalleryIndex(0);
                  }}
                >
                  NO GO Gallery
                </button>
              </div>

              <div className="gallery-topbar-right">
                <div className="gallery-count">
                  {galleryItems.length > 0 ? `${galleryIndex + 1} / ${galleryItems.length}` : '0 / 0'}
                </div>
                <button type="button" className="gallery-close" onClick={closeGallery}>
                  Back to Board
                </button>
              </div>
            </div>

            <div
              className="gallery-stage"
              onTouchStart={onGalleryTouchStart}
              onTouchEnd={onGalleryTouchEnd}
            >
              {currentGalleryItem ? (
                <img
                  src={currentGalleryItem.src}
                  alt={currentGalleryItem.label}
                  className="gallery-image"
                />
              ) : (
                <div className="gallery-empty">
                  <h3>No screenshots yet</h3>
                  <p>
                    Add .png, .jpg, .jpeg, or .webp files to
                    <br />
                    <strong>{galleryKind === 'APLUS' ? 'src/gallery/APLUS' : 'src/gallery/NG'}</strong>
                  </p>
                </div>
              )}
            </div>

            <div className="gallery-footer">
              <div className="gallery-caption">
                {currentGalleryItem ? currentGalleryItem.label : 'Swipe left/right or use the buttons below.'}
              </div>

              <div className="gallery-controls">
                <button type="button" className="gallery-nav" onClick={showPreviousImage} disabled={galleryItems.length === 0}>
                  Previous
                </button>
                <button type="button" className="gallery-nav" onClick={showNextImage} disabled={galleryItems.length === 0}>
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
