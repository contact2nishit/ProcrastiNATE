import React, { useMemo } from 'react';

const TransitionBackground: React.FC = () => {
  const birds = useMemo(() => (
    [
      { scale: 1.6, top: 18, duration: 26, delay: 0 },
      { scale: 2.0, top: 26, duration: 32, delay: 4 },
      { scale: 1.4, top: 34, duration: 24, delay: 8 },
      { scale: 1.8, top: 46, duration: 34, delay: 12 },
      { scale: 1.5, top: 58, duration: 30, delay: 16 },
      // added a couple more birds for variety / visibility
      { scale: 1.2, top: 22, duration: 28, delay: 10 },
      { scale: 1.3, top: 52, duration: 36, delay: 6 },
    ]
  ), []);

  // Base body (no wing) 12w x 8h
  const body = [
    '....B.......',
    '...BBB......',
    '..BBBBB.O...',
    'BBBBBBBBBB..',
    'BBBBBBBBBB..',
    '..BBBBB.....',
    '...BBB......',
    '....B.......',
  ];

  // Wing frames (larger full wing silhouettes). Each frame is a distinct pose.
  const wingUp = [
    '...WWWW.....',
    '..WWWWWW....',
    '..WWWWWW.W..',
    '...WWWWWW...',
    '....WWWW....',
    '............',
    '............',
    '............',
  ];
  const wingDown = [
    '............',
    '............',
    '............',
    '....WWWW....',
    '...WWWWWW...',
    '..WWWWWWWW..',
    '..WWWWWWWW..',
    '...WWWWWW...',
  ];

  // Pixel sun (16 x 16) using A (bright), B (mid), C (outer)
  const sun = [
    '................',
    '......CCC.......',
    '.....CCCCC......',
    '....CCCCCCC.....',
    '...CCCCCCCCC....',
    '..CCCCCCCCCCC...',
    '..CCCCCCCCCCC...',
    '.CCCCCCCCCCCCC..',
    '.CCCCCCCCCCCCC..',
    '..CCCCCCCCCCC...',
    '..CCCCCCCCCCC...',
    '...CCCCCCCCC....',
    '....CCCCCCC.....',
    '.....CCCCC......',
    '......CCC.......',
    '................',
  ].map(row => row.replace(/CCC/g, (m) => m.replace(/C/g, 'C')));
  // Replace some inner rings with B and A for gradient
  // Simple pass to create inner rings
  const sunRows = sun.map((row, idx) => {
    // Convert to array for mutation
    const arr = row.split('');
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] === 'C') {
        // determine distance from horizontal & vertical center to create rings
        const dx = Math.abs(i - 8);
        const dy = Math.abs(idx - 8);
        const d = Math.max(dx, dy);
        if (d <= 5) arr[i] = 'B';
        if (d <= 3) arr[i] = 'A';
      }
    }
    return arr.join('');
  });

  const renderRow = (row: string, r: number, colorMap?: Record<string, string>) => (
    <div className="p-row" key={r}>
      {row.split('').map((c, cIdx) => {
        if (c === '.') return <span key={cIdx} className="p" />;
        let cls = 'p';
        if (colorMap) {
          const mapped = colorMap[c];
          if (mapped) cls += ' ' + mapped; else cls += ' px-body';
        } else {
          if (c === 'B') cls += ' px-body';
          else if (c === 'O') cls += ' px-beak';
        }
        return <span key={cIdx} className={cls} />;
      })}
    </div>
  );

  // Sunset clouds (expanded set + layered depth & slight parallax offsets)
  // o = opacity; d = depth layer (affects animation speed & z-index grouping)
  const sunsetClouds = [
    { top: '4rem', left: '8%',  w: 70, h: 42, o: 0.95, d: 2, poly: 'polygon(0 0, 14% 0, 14% 29%, 27% 29%, 27% 0, 73% 0, 73% 21%, 86% 21%, 86% 57%, 100% 57%, 100% 79%, 73% 79%, 73% 100%, 27% 100%, 27% 71%, 0 71%)' },
    { top: '6.5rem', left: '28%', w: 58, h: 34, o: 0.92, d: 1, poly: 'polygon(0 0, 17% 0, 17% 33%, 33% 33%, 33% 0, 67% 0, 67% 17%, 83% 17%, 83% 67%, 100% 67%, 100% 83%, 67% 83%, 67% 100%, 33% 100%, 33% 67%, 0 67%)' },
    { top: '3.2rem', left: '55%', w: 60, h: 40, o: 0.9,  d: 3, poly: 'polygon(0 0, 8% 0, 8% 22%, 23% 22%, 23% 0, 69% 0, 69% 17%, 85% 17%, 85% 44%, 92% 44%, 92% 67%, 77% 67%, 77% 83%, 46% 83%, 46% 100%, 15% 100%, 15% 78%, 0 78%)' },
    { top: '9rem',  left: '65%', w: 80, h: 50, o: 0.9,  d: 2, poly: 'polygon(0 0, 8% 0, 8% 22%, 23% 22%, 23% 0, 69% 0, 69% 17%, 85% 17%, 85% 44%, 92% 44%, 92% 67%, 77% 67%, 77% 83%, 46% 83%, 46% 100%, 15% 100%, 15% 78%, 0 78%)' },
    { top: '11rem', left: '15%', w: 54, h: 30, o: 0.88, d: 1, poly: 'polygon(0 0, 20% 0, 20% 40%, 40% 40%, 40% 0, 80% 0, 80% 20%, 100% 20%, 100% 80%, 60% 80%, 60% 100%, 20% 100%, 20% 60%, 0 60%)' },
    { top: '13rem', left: '45%', w: 46, h: 26, o: 0.86, d: 2, poly: 'polygon(0 0, 25% 0, 25% 50%, 50% 50%, 50% 0, 75% 0, 75% 25%, 100% 25%, 100% 75%, 75% 75%, 75% 100%, 25% 100%, 25% 75%, 0 75%)' },
    { top: '5.2rem', left: '72%', w: 52, h: 32, o: 0.9,  d: 2, poly: 'polygon(0 0, 18% 0, 18% 33%, 30% 33%, 30% 0, 70% 0, 70% 17%, 82% 17%, 82% 50%, 90% 50%, 90% 67%, 100% 67%, 100% 83%, 70% 83%, 70% 100%, 30% 100%, 30% 67%, 0 67%)' },
    { top: '7.8rem', left: '5%',  w: 64, h: 38, o: 0.92, d: 3, poly: 'polygon(0 0, 14% 0, 14% 29%, 27% 29%, 27% 0, 73% 0, 73% 21%, 86% 21%, 86% 57%, 100% 57%, 100% 79%, 73% 79%, 73% 100%, 27% 100%, 27% 71%, 0 71%)' },
    { top: '10.8rem', left: '70%', w: 58, h: 30, o: 0.88, d: 1, poly: 'polygon(0 0, 17% 0, 17% 33%, 33% 33%, 33% 0, 67% 0, 67% 17%, 83% 17%, 83% 67%, 100% 67%, 100% 83%, 67% 83%, 67% 100%, 33% 100%, 33% 67%, 0 67%)' },
  ];

  return (
    <div className="transition-layer" aria-hidden>
      <div className="w-full h-full relative overflow-hidden" style={{
        // Gradient: intense orange at sun -> mid ambers -> bright yellows -> pale border-line blue sky at top
        background: 'linear-gradient(to top, #FF7A1B 0%, #FF8C2A 12%, #FFB43D 28%, #FFD86B 46%, #FFEFAF 83%, #F2F8FF 100%)'
      }}>
        {/* Sunset pixel clouds */}
        <div className="sunset-cloud-layer">
          {sunsetClouds.map((c, i) => (
            <div
              key={i}
              className={`t-cloud depth-${c.d}`}
              style={{
                top: c.top,
                left: c.left,
                width: c.w + 'px',
                height: c.h + 'px',
                opacity: c.o,
                clipPath: c.poly,
                position: 'absolute',
                animation: `cloud-drift ${18 + c.d * 6}s linear ${i * 3}s infinite`,
                background: 'linear-gradient(to bottom, #FFFEE0 0%, #FFE978 55%, #FFC933 100%)'
              }}
            />
          ))}
        </div>
        {birds.map((b, i) => (
          <div
            key={i}
            className="pixel-bird-wrapper"
            style={{
              top: `${b.top}%`,
              animation: `bird-path ${b.duration}s linear ${b.delay}s infinite`,
              ['--bobAmp' as any]: (i % 2 ? 6 : -6) + 'px',
              ['--scale' as any]: b.scale,
              ['--flapDelay' as any]: `${(i * 0.18) % 1}s`
            }}
          >
            <div className="pixel-bird bird-bob-anim high-contrast" style={{ animationDelay: `${b.delay}s` }}>
              {/* Static body */}
              <div className="pixel-body">
                {body.map((row, r) => renderRow(row, r))}
              </div>
              {/* Wing frames overlay */}
              <div className="wing-frame wing-up" style={{ animationDelay: `var(--flapDelay)` }}>
                {wingUp.map((row, r) => renderRow(row, r, { 'W': 'px-wing' }))}
              </div>
              <div className="wing-frame wing-down" style={{ animationDelay: `var(--flapDelay)` }}>
                {wingDown.map((row, r) => renderRow(row, r, { 'W': 'px-wing' }))}
              </div>
            </div>
          </div>
        ))}
        {/* Pixelated setting sun */}
        <div className="pixel-sun" aria-hidden>
          {sunRows.map((row, r) => (
            <div className="sun-row" key={r}>
              {row.split('').map((c, ci) => {
                if (c === '.') return <span key={ci} className="sun-p" />;
                let cls = 'sun-p ';
                if (c === 'C') cls += 'sun-c'; else if (c === 'B') cls += 'sun-b'; else cls += 'sun-a';
                return <span key={ci} className={cls} />;
              })}
            </div>
          ))}
          <div className="sun-halo" />
        </div>
      </div>
      <style>{`
        .sunset-cloud-layer { position:absolute; inset:0; z-index:1; pointer-events:none; }
        .pixel-sun { position:absolute; left:50%; bottom:0; width:16px; height:16px; transform:translateX(-50%) scale(16); transform-origin:50% 100%; image-rendering:pixelated; pointer-events:none; animation: sun-glow 5s ease-in-out infinite; z-index:2; }
        .sun-halo { position:absolute; left:50%; bottom:0; width:16px; height:16px; transform:translate(-50%,0) scale(16); transform-origin:50% 100%; pointer-events:none; background:radial-gradient(circle at 50% 60%, rgba(255,200,80,0.55) 0%, rgba(255,140,36,0.32) 42%, rgba(255,140,36,0) 72%); filter:blur(3px); mix-blend-mode:screen; opacity:0.9; animation: sun-halo-pulse 6s ease-in-out infinite; z-index:1; }
        .t-cloud { box-shadow:0 0 0 1px rgba(210,130,10,0.35), 0 0 4px 2px rgba(255,230,140,0.35); image-rendering:pixelated; }
        .depth-1 { z-index:1; }
        .depth-2 { z-index:1; }
        .depth-3 { z-index:1; filter:brightness(0.95) saturate(1.05); }
        .pixel-bird-wrapper { position:absolute; left:-14%; pointer-events:none; z-index:3; }
        .pixel-bird { position:relative; width:12px; height:8px; image-rendering:pixelated; transform:scale(var(--scale)) translateZ(0); }
        .high-contrast { filter: drop-shadow(0 0 2px rgba(0,0,0,0.55)) drop-shadow(1px 1px 0 rgba(0,0,0,0.4)); }
        .pixel-body, .wing-frame { position:absolute; inset:0; }
        .p-row { line-height:0; height:1px; }
        .p { display:inline-block; width:1px; height:1px; background:transparent; }
        .px-body { background:#1e2b35; }
        .px-wing { background:#2f424f; }
        .px-beak { background:#f7a531; }
        .wing-frame { animation: wing-flap 0.6s steps(1,end) infinite; }
        .wing-down { animation-delay:0.3s; }
        .bird-bob-anim { animation: bird-bob 4.5s ease-in-out infinite; }
        .sun-row { line-height:0; height:1px; }
        .sun-p { display:inline-block; width:1px; height:1px; background:transparent; }
        .sun-a { background:#FFE59A; }
        .sun-b { background:#FFC04D; }
        .sun-c { background:#FF8C24; }
        @keyframes cloud-drift { 0% { transform: translateX(0); } 100% { transform: translateX(35vw); } }
        @keyframes sun-halo-pulse { 0%,100% { opacity:0.85; } 50% { opacity:0.6; } }
        @keyframes sun-glow { 0%,100% { filter: drop-shadow(0 0 3px #FFB347) drop-shadow(0 0 6px #FF9A32); } 50% { filter: drop-shadow(0 0 5px #FFC763) drop-shadow(0 0 9px #FFA94A); } }
        @keyframes wing-flap { 0% { opacity:1; } 49% { opacity:1; } 50% { opacity:0; } 100% { opacity:0; } }
        @keyframes bird-bob { 0% { transform: translateY(0) scale(var(--scale)); } 25% { transform: translateY(var(--bobAmp)) scale(var(--scale)); } 50% { transform: translateY(0) scale(var(--scale)); } 75% { transform: translateY(calc(var(--bobAmp) * -1)) scale(var(--scale)); } 100% { transform: translateY(0) scale(var(--scale)); } }
        @keyframes bird-path { 0% { transform: translateX(0) translateY(0); opacity:0; } 5% { opacity:0.95; } 90% { opacity:0.9; } 100% { transform: translateX(125vw) translateY(0); opacity:0; } }
      `}</style>
    </div>
  );
};
export default TransitionBackground;
