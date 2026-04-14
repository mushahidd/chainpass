import { useEffect, useRef } from 'react';

const TERM_LINES = [
  [{ cls: 'dim', t: '$ ' }, { cls: 'g', t: 'init ' }, { cls: 'w', t: 'chainpass_psl.sol' }],
  [{ cls: 'dim', t: '> ' }, { cls: 'w', t: 'Compiling contract...' }],
  [{ cls: 'dim', t: '> ' }, { cls: 'g', t: 'Compilation successful ✓' }],
  [{ cls: 'sep', t: '————————————————————————' }],
  [{ cls: 'dim', t: '> ' }, { cls: 'w', t: 'resale_cap ' }, { cls: 'sep', t: '= ' }, { cls: 'gold', t: 'original_price * 1.10' }],
  [{ cls: 'dim', t: '> ' }, { cls: 'w', t: 'royalty_pcb ' }, { cls: 'sep', t: '= ' }, { cls: 'gold', t: '0.03' }],
  [{ cls: 'dim', t: '> ' }, { cls: 'w', t: 'qr_interval ' }, { cls: 'sep', t: '= ' }, { cls: 'gold', t: '30000ms' }],
  [{ cls: 'sep', t: '————————————————————————' }],
  [{ cls: 'dim', t: '$ ' }, { cls: 'g', t: 'deploy ' }, { cls: 'w', t: '--network polygon' }],
  [{ cls: 'dim', t: '> ' }, { cls: 'g', t: 'Contract deployed ✓' }],
  [{ cls: 'dim', t: '> ' }, { cls: 'w', t: 'Address: ' }, { cls: 'g', t: '0x4f2a...b81c' }],
  [{ cls: 'sep', t: '————————————————————————' }],
  [{ cls: 'dim', t: '$ ' }, { cls: 'g', t: 'mint ' }, { cls: 'w', t: '--match KK_vs_LQ --seat A12' }],
  [{ cls: 'dim', t: '> ' }, { cls: 'g', t: 'NFT #10241 minted ✓' }],
  [{ cls: 'dim', t: '> ' }, { cls: 'w', t: 'Owner: ' }, { cls: 'gold', t: '0x9a3f...d44e' }],
  [{ cls: 'dim', t: '$ ' }, { cls: 'cursor', t: '' }],
];

const colorMap = {
  dim: 'var(--dim)',
  g: 'var(--g)',
  w: 'var(--text)',
  gold: 'var(--gold)',
  sep: 'var(--border2)',
};

export default function Terminal() {
  const bodyRef = useRef(null);
  const lineIdx = useRef(0);

  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    lineIdx.current = 0;

    function addLine() {
      if (lineIdx.current >= TERM_LINES.length) return;
      const lineData = TERM_LINES[lineIdx.current++];
      const row = document.createElement('div');
      row.style.cssText = 'animation:fadeSlide 0.3s ease forwards;display:flex;flex-wrap:wrap;';

      lineData.forEach(({ cls, t }) => {
        if (cls === 'cursor') {
          const c = document.createElement('span');
          c.style.cssText = 'display:inline-block;width:7px;height:13px;background:var(--g);vertical-align:middle;animation:blink 1s step-end infinite;';
          row.appendChild(c);
        } else {
          const s = document.createElement('span');
          s.style.color = colorMap[cls] || 'var(--text)';
          s.textContent = t;
          row.appendChild(s);
        }
      });

      if (body.children.length > 15) body.removeChild(body.firstChild);
      body.appendChild(row);

      if (lineIdx.current < TERM_LINES.length) {
        setTimeout(addLine, 260 + Math.random() * 180);
      }
    }

    const timer = setTimeout(addLine, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={styles.terminal}>
      <div style={styles.header}>
        <div style={styles.dots}>
          <div style={{ ...styles.dot, background: '#ff5f57' }} />
          <div style={{ ...styles.dot, background: '#febc2e' }} />
          <div style={{ ...styles.dot, background: '#28c840' }} />
        </div>
        <span style={styles.label}>CONTRACT_TERMINAL — LIVE</span>
      </div>

      <div
        ref={bodyRef}
        style={styles.body}
      />

      <div style={styles.contractBadge}>
        <div style={styles.badgeLabel}>DEPLOYED_CONTRACT_ADDRESS</div>
        <div style={styles.address}>0x4f2a8b3c9d1e7f0a2b5c8d3e6f1a4b7c9d2e5f08</div>
        <span style={styles.network}>POLYGON · MAINNET</span>
      </div>

      <style>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  terminal: {
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--surface)',
    height: '100%',
  },
  header: {
    padding: '14px 20px',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  dots: { display: 'flex', gap: '6px' },
  dot: { width: '10px', height: '10px', borderRadius: '50%' },
  label: {
    fontFamily: 'var(--mono)',
    fontSize: '9px',
    color: 'var(--dim)',
    letterSpacing: '1.5px',
  },
  body: {
    flex: 1,
    padding: '24px 20px',
    fontFamily: 'var(--mono)',
    fontSize: '11.5px',
    lineHeight: 2,
    overflow: 'hidden',
    minHeight: '280px',
  },
  contractBadge: {
    margin: '16px 20px',
    padding: '14px 16px',
    border: '1px solid var(--border2)',
    background: 'rgba(0,255,106,0.03)',
  },
  badgeLabel: {
    fontFamily: 'var(--mono)',
    fontSize: '9px',
    color: 'var(--dim)',
    letterSpacing: '1.5px',
    marginBottom: '8px',
  },
  address: {
    fontFamily: 'var(--mono)',
    fontSize: '11px',
    color: 'var(--g)',
    wordBreak: 'break-all',
    lineHeight: 1.6,
  },
  network: {
    display: 'inline-block',
    fontFamily: 'var(--mono)',
    fontSize: '8px',
    color: 'var(--g)',
    border: '1px solid var(--border2)',
    padding: '3px 10px',
    marginTop: '8px',
    letterSpacing: '1.5px',
  },
};
