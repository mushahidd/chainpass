import { useState } from 'react';

const CATEGORY_COLORS = {
  'General': { fill: '#8eb79b', glow: 'rgba(142,183,155,0.3)' },
  'First-Class': { fill: '#5ec4e8', glow: 'rgba(94,196,232,0.3)' },
  'Premium': { fill: '#e8b84b', glow: 'rgba(232,184,75,0.3)' },
  'VIP': { fill: '#ff6b6b', glow: 'rgba(255,107,107,0.3)' },
  'VIP Ground Floor': { fill: '#ff4ecf', glow: 'rgba(255,78,207,0.3)' },
  'VVIP': { fill: '#c084fc', glow: 'rgba(192,132,252,0.3)' },
};

const CX = 200;
const CY = 160;
const OUTER_RX = 175;
const OUTER_RY = 135;
const INNER_RX = 108;
const INNER_RY = 82;

function ellipsePoint(cx, cy, rx, ry, angleDeg) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return [cx + rx * Math.cos(rad), cy + ry * Math.sin(rad)];
}

function arcPath(cx, cy, rx, ry, startDeg, endDeg, innerRx, innerRy) {
  const p1 = ellipsePoint(cx, cy, innerRx, innerRy, startDeg);
  const p2 = ellipsePoint(cx, cy, innerRx, innerRy, endDeg);
  const p3 = ellipsePoint(cx, cy, rx, ry, endDeg);
  const p4 = ellipsePoint(cx, cy, rx, ry, startDeg);
  const largeArc = (endDeg - startDeg) > 180 ? 1 : 0;
  return [
    `M ${p1[0]} ${p1[1]}`,
    `A ${innerRx} ${innerRy} 0 ${largeArc} 1 ${p2[0]} ${p2[1]}`,
    `L ${p3[0]} ${p3[1]}`,
    `A ${rx} ${ry} 0 ${largeArc} 0 ${p4[0]} ${p4[1]}`,
    `Z`,
  ].join(' ');
}

export default function StadiumMap({ allEnclosures, activeEnclosures, stadiumName }) {
  const [hovered, setHovered] = useState(null);

  if (!allEnclosures || allEnclosures.length === 0) return null;

  const total = allEnclosures.length;
  const gap = 1.5;
  const segAngle = (360 - total * gap) / total;
  const activeNames = new Set(activeEnclosures.map((e) => e.name));

  const hoveredEnc = hovered ? allEnclosures.find((e) => e.name === hovered) : null;

  return (
    <div style={mapStyles.wrapper}>
      {/* Header */}
      <div style={mapStyles.header}>
        <div style={mapStyles.headerDot} />
        <span style={mapStyles.headerText}>STADIUM_MAP</span>
      </div>

      {/* Stadium name */}
      {stadiumName && (
        <div style={mapStyles.stadiumName}>
          {stadiumName.split(',')[0].toUpperCase()}
        </div>
      )}

      {/* SVG */}
      <div style={mapStyles.svgWrap}>
        <svg viewBox="0 0 400 320" style={{ width: '100%', display: 'block' }}>
          <defs>
            <radialGradient id="fieldGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(0,255,106,0.06)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
            <filter id="segGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Ambient glow */}
          <ellipse cx={CX} cy={CY} rx={OUTER_RX + 20} ry={OUTER_RY + 20}
            fill="url(#fieldGlow)" />

          {/* Ground surface */}
          <ellipse cx={CX} cy={CY} rx={INNER_RX - 6} ry={INNER_RY - 6}
            fill="rgba(0,255,106,0.03)" stroke="rgba(0,255,106,0.12)" strokeWidth="0.8"
            strokeDasharray="4 3" />

          {/* Pitch rectangle */}
          <rect x={CX - 14} y={CY - 36} width="28" height="72" rx="2"
            fill="rgba(0,255,106,0.06)" stroke="rgba(0,255,106,0.2)" strokeWidth="0.6" />
          {/* Crease lines */}
          <line x1={CX - 10} y1={CY - 28} x2={CX + 10} y2={CY - 28}
            stroke="rgba(0,255,106,0.15)" strokeWidth="0.5" />
          <line x1={CX - 10} y1={CY + 28} x2={CX + 10} y2={CY + 28}
            stroke="rgba(0,255,106,0.15)" strokeWidth="0.5" />

          {/* Center label */}
          <text x={CX} y={CY + 2} textAnchor="middle" dominantBaseline="central"
            fill="rgba(0,255,106,0.25)" fontFamily="Space Mono, monospace" fontSize="7"
            letterSpacing="2">PITCH</text>

          {/* Segments */}
          {allEnclosures.map((enc, i) => {
            const startAngle = i * (segAngle + gap);
            const endAngle = startAngle + segAngle;
            const d = arcPath(CX, CY, OUTER_RX, OUTER_RY, startAngle, endAngle, INNER_RX, INNER_RY);
            const isActive = activeNames.has(enc.name);
            const isHovered = hovered === enc.name;
            const catColor = CATEGORY_COLORS[enc.category] || CATEGORY_COLORS['General'];
            const color = catColor.fill;

            const midAngle = (startAngle + endAngle) / 2;
            const labelPt = ellipsePoint(CX, CY, (OUTER_RX + INNER_RX) / 2, (OUTER_RY + INNER_RY) / 2, midAngle);

            let fillColor;
            if (!isActive) fillColor = 'rgba(255,255,255,0.02)';
            else if (isHovered) fillColor = color;
            else fillColor = `${color}BB`;

            return (
              <g key={enc.name}
                onMouseEnter={() => setHovered(enc.name)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: 'pointer' }}
              >
                <path
                  d={d}
                  fill={fillColor}
                  stroke={isActive ? (isHovered ? '#ffffff' : color) : 'rgba(255,255,255,0.06)'}
                  strokeWidth={isHovered ? 1.8 : 0.6}
                  filter={isHovered && isActive ? 'url(#segGlow)' : undefined}
                  style={{ transition: 'all 0.25s ease' }}
                />
                {segAngle > 16 && isActive && (
                  <text
                    x={labelPt[0]} y={labelPt[1]}
                    textAnchor="middle" dominantBaseline="central"
                    fill={isHovered ? '#fff' : `${color}99`}
                    fontFamily="Space Mono, monospace"
                    fontSize={segAngle > 28 ? '6.5' : '5'}
                    letterSpacing="0.3"
                    style={{ pointerEvents: 'none', transition: 'fill 0.2s' }}
                  >
                    {enc.name.length > 12 ? enc.name.slice(0, 10) + '..' : enc.name}
                  </text>
                )}
                {/* CLOSED overlay for removed enclosures */}
                {!isActive && (() => {
                  const innerPt1 = ellipsePoint(CX, CY, INNER_RX + 4, INNER_RY + 4, startAngle + segAngle * 0.2);
                  const outerPt1 = ellipsePoint(CX, CY, OUTER_RX - 4, OUTER_RY - 4, endAngle - segAngle * 0.2);
                  const innerPt2 = ellipsePoint(CX, CY, INNER_RX + 4, INNER_RY + 4, endAngle - segAngle * 0.2);
                  const outerPt2 = ellipsePoint(CX, CY, OUTER_RX - 4, OUTER_RY - 4, startAngle + segAngle * 0.2);
                  return (
                    <g style={{ pointerEvents: 'none' }}>
                      <line x1={innerPt1[0]} y1={innerPt1[1]} x2={outerPt1[0]} y2={outerPt1[1]}
                        stroke="rgba(255,59,59,0.35)" strokeWidth="0.8" />
                      <line x1={innerPt2[0]} y1={innerPt2[1]} x2={outerPt2[0]} y2={outerPt2[1]}
                        stroke="rgba(255,59,59,0.35)" strokeWidth="0.8" />
                      {segAngle > 20 && (
                        <text
                          x={labelPt[0]} y={labelPt[1]}
                          textAnchor="middle" dominantBaseline="central"
                          fill="rgba(255,59,59,0.5)"
                          fontFamily="Space Mono, monospace" fontSize="5"
                          letterSpacing="1"
                        >CLOSED</text>
                      )}
                    </g>
                  );
                })()}
              </g>
            );
          })}

          {/* Outer ring */}
          <ellipse cx={CX} cy={CY} rx={OUTER_RX + 3} ry={OUTER_RY + 3}
            fill="none" stroke="rgba(0,255,106,0.08)" strokeWidth="0.4" />
        </svg>
      </div>

      {/* Hover info */}
      {hoveredEnc && (() => {
        const catColor = CATEGORY_COLORS[hoveredEnc.category] || CATEGORY_COLORS['General'];
        const isActive = activeNames.has(hoveredEnc.name);
        return (
          <div style={{
            ...mapStyles.hoverCard,
            borderColor: catColor.fill,
            boxShadow: `0 6px 24px ${catColor.glow}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: catColor.fill, flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: '#fff', fontWeight: 700 }}>
                {hoveredEnc.name}
              </span>
            </div>
            <div style={{
              fontFamily: 'var(--mono)', fontSize: '9px', color: catColor.fill,
              letterSpacing: '1.2px', marginBottom: '4px',
            }}>
              {hoveredEnc.category} ENCLOSURE
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)' }}>
              {hoveredEnc.price} WIRE · {Number(hoveredEnc.capacity).toLocaleString()} SEATS
            </div>
            {!isActive && (
              <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: '#ff3b3b', marginTop: '4px', letterSpacing: '1px' }}>
                ✕ REMOVED FROM MATCH
              </div>
            )}
          </div>
        );
      })()}

      {/* Legend */}
      <div style={mapStyles.legend}>
        {Object.entries(CATEGORY_COLORS).map(([cat, colors]) => {
          if (!allEnclosures.some((e) => e.category === cat)) return null;
          return (
            <div key={cat} style={mapStyles.legendItem}>
              <div style={{ ...mapStyles.legendDot, background: colors.fill }} />
              <span>{cat}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const mapStyles = {
  wrapper: {
    position: 'relative',
  },
  header: {
    display: 'flex', alignItems: 'center', gap: '8px',
    marginBottom: '8px',
  },
  headerDot: {
    width: '6px', height: '6px', borderRadius: '50%',
    background: 'var(--g)', animation: 'pulse 2s ease-in-out infinite',
  },
  headerText: {
    fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--g)',
    letterSpacing: '2px',
  },
  stadiumName: {
    fontFamily: 'var(--display)', fontSize: '18px', color: 'var(--text)',
    letterSpacing: '1.5px', marginBottom: '14px',
  },
  svgWrap: {
    background: 'rgba(0,0,0,0.3)', borderRadius: '6px',
    border: '1px solid var(--border)', padding: '16px 8px 8px',
  },
  hoverCard: {
    marginTop: '10px', padding: '10px 14px',
    background: 'rgba(8,15,11,0.95)', border: '1px solid',
    borderRadius: '4px',
    transition: 'all 0.2s',
  },
  legend: {
    display: 'flex', flexWrap: 'wrap', gap: '10px',
    justifyContent: 'center', marginTop: '14px',
    padding: '10px 0', borderTop: '1px solid var(--border)',
  },
  legendItem: {
    display: 'flex', alignItems: 'center', gap: '5px',
    fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--muted)',
    letterSpacing: '0.8px',
  },
  legendDot: {
    width: '8px', height: '8px', borderRadius: '2px', flexShrink: 0,
  },
};
