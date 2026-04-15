import { useState, useRef } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import jsQR from 'jsqr';
import { ethers } from 'ethers';

function decodeQRFromImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, canvas.width, canvas.height, { inversionAttempts: 'attemptBoth' });
      if (code) {
        resolve(code.data);
      } else {
        reject(new Error('No QR code found in image'));
      }
    };
    img.onerror = () => reject(new Error('Could not load image'));
    img.src = URL.createObjectURL(file);
  });
}

export default function Scanner() {
  const [scanStatus, setScanStatus] = useState('IDLE');
  const [statusMsg, setStatusMsg] = useState('');
  const [qrPayload, setQrPayload] = useState(null);
  const [cnicInput, setCnicInput] = useState('');
  const [scanFeedback, setScanFeedback] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileRef = useRef(null);

  const processFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;

    setPreviewUrl(URL.createObjectURL(file));
    setScanFeedback('SCANNING IMAGE...');

    try {
      const result = await decodeQRFromImage(file);

      try {
        const parsed = JSON.parse(result);
        if (!parsed.p || !parsed.qS || !parsed.sP || !parsed.dS) {
          setScanFeedback('⚠ QR DETECTED BUT NOT A CHAINPASS TICKET');
          setTimeout(() => setScanFeedback(''), 4000);
          return;
        }
        setScanFeedback('');
        setPreviewUrl(null);
        setQrPayload(result);
        setScanStatus('CNIC_PROMPT');
      } catch (e) {
        setScanFeedback('⚠ QR DECODED BUT DATA IS NOT VALID JSON');
        setTimeout(() => setScanFeedback(''), 4000);
      }
    } catch (err) {
      console.error('Scan failed:', err);
      setScanFeedback('⚠ COULD NOT DETECT QR — CROP TO JUST THE QR CODE AREA');
      setTimeout(() => setScanFeedback(''), 5000);
    }

    if (fileRef.current) fileRef.current.value = '';
  };

  const handleFileUpload = (e) => processFile(e.target.files[0]);

  const handleCnicSubmit = async (e) => {
    e.preventDefault();
    if (!cnicInput) return;

    setScanStatus('PROCESSING');
    setStatusMsg('');

    try {
      const computedHash = ethers.id(cnicInput);
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrData: qrPayload, cnicHash: computedHash })
      });
      const data = await res.json();

      if (data.valid) {
        setScanStatus('VALID');
        setStatusMsg(data.message);
      } else {
        setScanStatus('INVALID');
        setStatusMsg('ACCESS DENIED: ' + data.message);
      }
    } catch (err) {
      setScanStatus('INVALID');
      setStatusMsg('ACCESS DENIED: NETWORK_ERROR');
    }

    setTimeout(() => resetScanner(), 5000);
  };

  const resetScanner = () => {
    setScanStatus('IDLE');
    setStatusMsg('');
    setCnicInput('');
    setQrPayload(null);
    setScanFeedback('');
    setPreviewUrl(null);
  };

  return (
    <>
      <Head>
        <title>Gate Scanner | ChainPass</title>
      </Head>

      <div style={styles.container}>
        <Navbar />

        <main style={styles.main}>
          <header style={styles.header}>
            <div style={styles.secTag}>// STADIUM_GATEWAY</div>
            <h1 style={styles.title}>IDENTITY_SCANNER</h1>
            <p style={styles.tip}>Upload a ticket QR screenshot to verify. Use Win+Shift+S to crop just the QR area for best results.</p>
          </header>

          <div style={styles.statusBar}>
            <div style={{
              ...styles.statusDot,
              background: scanStatus === 'VALID' ? '#00FF6A' : scanStatus === 'INVALID' ? '#FF003C' : scanStatus === 'PROCESSING' ? '#FFD600' : '#00FF6A',
              animation: scanStatus === 'PROCESSING' ? 'pulse 1s infinite' : 'none',
            }} />
            <span style={styles.statusText}>
              {scanStatus === 'IDLE' && 'READY — UPLOAD QR IMAGE TO SCAN'}
              {scanStatus === 'CNIC_PROMPT' && 'QR ACQUIRED ✓ — ENTER CNIC TO VERIFY'}
              {scanStatus === 'PROCESSING' && 'VERIFYING ON-CHAIN...'}
              {scanStatus === 'VALID' && 'ACCESS GRANTED ✓'}
              {scanStatus === 'INVALID' && 'ACCESS DENIED ✗'}
            </span>
          </div>

          {scanFeedback && (
            <div style={{
              ...styles.feedbackBanner,
              ...(scanFeedback === 'SCANNING IMAGE...' ? { color: 'var(--g)', borderColor: 'rgba(0,255,106,0.3)', background: 'rgba(0,255,106,0.05)' } : {})
            }}>
              {scanFeedback}
            </div>
          )}

          <div style={styles.scannerWrapper}>
            {scanStatus === 'IDLE' && (
              <div style={styles.uploadZone}>
                {previewUrl && (
                  <div style={styles.preview}>
                    <img src={previewUrl} alt="Uploaded" style={styles.previewImg} />
                  </div>
                )}

                <div style={styles.uploadIcon}>📷</div>
                <h2 style={styles.uploadTitle}>UPLOAD TICKET QR</h2>
                <p style={styles.uploadDesc}>Take a screenshot of the QR code from your ticket and upload it here</p>

                <label style={styles.uploadBtn}>
                  SELECT QR IMAGE
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>

                <div style={styles.orDivider}>
                  <span style={styles.orLine}></span>
                  <span style={styles.orText}>OR DRAG & DROP</span>
                  <span style={styles.orLine}></span>
                </div>

                <div
                  style={styles.dropZone}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#00FF6A'; }}
                  onDragLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border2)'; }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = 'var(--border2)';
                    processFile(e.dataTransfer.files[0]);
                  }}
                >
                  Drop QR screenshot here
                </div>
              </div>
            )}

            {scanStatus === 'CNIC_PROMPT' && (
              <form onSubmit={handleCnicSubmit} style={styles.cnicForm}>
                <div style={styles.acquiredBadge}>✓ QR PAYLOAD DECODED SUCCESSFULLY</div>
                <h2 style={{ fontFamily: 'var(--display)', fontSize: '32px', marginBottom: '10px' }}>IDENTITY VERIFICATION</h2>
                <p style={{ fontFamily: 'var(--mono)', fontSize: '14px', color: 'var(--g)', marginBottom: '30px' }}>
                  ENTER FAN'S PHYSICAL CNIC TO VERIFY AGAINST ON-CHAIN HASH
                </p>
                <input autoFocus required value={cnicInput} onChange={(e) => setCnicInput(e.target.value)}
                  placeholder="XXXXX-XXXXXXX-X" style={styles.input} />
                <button type="submit" style={styles.btn}>VERIFY IDENTITY HASH →</button>
                <button type="button" onClick={resetScanner} style={styles.cancelBtn}>CANCEL & RESCAN</button>
              </form>
            )}

            {scanStatus === 'PROCESSING' && (
              <div style={styles.processingBox}>
                <div style={styles.spinner} />
                <h2 style={{ marginTop: '20px', fontFamily: 'var(--display)' }}>VERIFYING ON-CHAIN...</h2>
                <p style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--muted)', marginTop: '8px' }}>
                  Checking ownership · TTL · CNIC hash · Ticket validity
                </p>
              </div>
            )}

            {scanStatus === 'VALID' && (
              <div style={{ ...styles.resultCard, ...styles.valid }}>
                <h1 style={{ fontSize: '36px' }}>✓ VALID TICKET</h1>
                <p style={{ fontFamily: 'var(--mono)', fontSize: '14px', marginTop: '16px', lineHeight: 1.8 }}>
                  {statusMsg.split('|').map((line, i) => <span key={i}>{line}<br /></span>)}
                </p>
                <p style={{ fontFamily: 'var(--mono)', fontSize: '11px', marginTop: '20px', opacity: 0.6 }}>AUTO-RESET IN 5s</p>
              </div>
            )}

            {scanStatus === 'INVALID' && (
              <div style={{ ...styles.resultCard, ...styles.invalid }}>
                <h1 style={{ fontSize: '36px' }}>✗ REJECTED</h1>
                <p style={{ fontFamily: 'var(--mono)', fontSize: '14px', marginTop: '10px' }}>{statusMsg}</p>
                <p style={{ fontFamily: 'var(--mono)', fontSize: '11px', marginTop: '20px', opacity: 0.6 }}>AUTO-RESET IN 5s</p>
              </div>
            )}
          </div>
        </main>
      </div>

      <style>{`
        input:focus { outline: none; border-color: var(--g) !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </>
  );
}

const styles = {
  container: { background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' },
  main: { padding: '60px 48px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' },
  header: { marginBottom: '24px' },
  secTag: { fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--g)', letterSpacing: '3px', marginBottom: '12px' },
  title: { fontFamily: 'var(--display)', fontSize: '48px', letterSpacing: '2px' },
  tip: { fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)', marginTop: '12px', lineHeight: 1.5 },
  statusBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
    padding: '14px', marginBottom: '24px', background: 'var(--surface)', border: '1px solid var(--border)',
  },
  statusDot: { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },
  statusText: { fontFamily: 'var(--mono)', fontSize: '12px', letterSpacing: '1px' },
  feedbackBanner: {
    fontFamily: 'var(--mono)', fontSize: '12px', color: '#FFD600', background: 'rgba(255,214,0,0.08)',
    border: '1px solid rgba(255,214,0,0.3)', padding: '12px 16px', marginBottom: '16px', letterSpacing: '1px',
  },
  scannerWrapper: { minHeight: '400px' },
  uploadZone: { padding: '30px 0' },
  uploadIcon: { fontSize: '48px', marginBottom: '16px' },
  uploadTitle: { fontFamily: 'var(--display)', fontSize: '28px', marginBottom: '8px' },
  uploadDesc: { fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--muted)', marginBottom: '24px' },
  uploadBtn: {
    display: 'inline-block', background: 'var(--g)', color: 'var(--bg)', padding: '16px 32px',
    fontFamily: 'var(--mono)', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', letterSpacing: '1px',
  },
  orDivider: { display: 'flex', alignItems: 'center', gap: '12px', margin: '24px auto', maxWidth: '400px' },
  orLine: { flex: 1, height: '1px', background: 'var(--border2)' },
  orText: { fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--dim)' },
  dropZone: {
    border: '2px dashed var(--border2)', padding: '40px', fontFamily: 'var(--mono)', fontSize: '12px',
    color: 'var(--muted)', maxWidth: '400px', margin: '0 auto', transition: 'border-color 0.2s',
  },
  preview: { marginBottom: '20px' },
  previewImg: { maxWidth: '300px', maxHeight: '300px', border: '1px solid var(--border)' },
  acquiredBadge: {
    fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '2px', color: 'var(--g)',
    background: 'rgba(0,255,106,0.08)', border: '1px solid rgba(0,255,106,0.3)',
    padding: '8px 16px', display: 'inline-block', marginBottom: '20px',
  },
  cnicForm: { textAlign: 'center', padding: '40px 0' },
  input: {
    background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border2)',
    color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '18px', padding: '16px',
    width: '100%', maxWidth: '400px', textAlign: 'center', boxSizing: 'border-box',
    display: 'block', margin: '0 auto 16px',
  },
  btn: {
    display: 'block', width: '100%', maxWidth: '400px', margin: '0 auto',
    background: 'var(--g)', color: 'var(--bg)', border: 'none', padding: '18px',
    fontFamily: 'var(--mono)', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', letterSpacing: '1px',
  },
  cancelBtn: {
    display: 'block', width: '100%', maxWidth: '400px', margin: '12px auto 0',
    background: 'transparent', color: 'var(--muted)', border: '1px solid var(--border2)', padding: '14px',
    fontFamily: 'var(--mono)', fontSize: '12px', cursor: 'pointer', letterSpacing: '1px',
  },
  processingBox: { fontFamily: 'var(--mono)', color: 'var(--muted)', padding: '80px 0' },
  spinner: { width: '40px', height: '40px', border: '3px solid var(--border)', borderTop: '3px solid var(--g)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' },
  resultCard: { padding: '80px 20px', border: '2px solid', color: '#000', fontFamily: 'var(--display)' },
  valid: { background: '#00FF6A', borderColor: '#00FF6A' },
  invalid: { background: '#FF003C', borderColor: '#FF003C' },
};
