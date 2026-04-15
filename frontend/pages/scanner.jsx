import { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import { Html5Qrcode, Html5QrcodeScanner, Html5QrcodeSupportedFormats, Html5QrcodeScanType } from 'html5-qrcode';
import { ethers } from 'ethers';

const SCANNER_VERSION = 2;

export default function Scanner() {
  const [scanStatus, setScanStatus] = useState('IDLE');
  const [statusMsg, setStatusMsg] = useState('');
  const [qrPayload, setQrPayload] = useState(null);
  const [cnicInput, setCnicInput] = useState('');
  const [html5Scanner, setHtml5Scanner] = useState(null);
  const [verifiedCnicHash, setVerifiedCnicHash] = useState('');
  const didHandleScanRef = useRef(false);
  const scannerRef = useRef(null);
  const onScanSuccessRef = useRef(null);
  const onScanFailureRef = useRef(null);
  const fileDecoderRef = useRef(null);

  const acceptDecodedPayload = async (decodedText) => {
    if (didHandleScanRef.current) return;
    try {
      const parsed = JSON.parse(decodedText);
      if (!parsed?.p || !parsed?.qS || !parsed?.sP || !parsed?.dS) throw new Error('INVALID_QR_PAYLOAD');
      didHandleScanRef.current = true;
      try { scannerRef.current?.pause?.(true); } catch { }
      setQrPayload(decodedText);
      setStatusMsg('');
      setScanStatus('CNIC_PROMPT');
    } catch {
      setStatusMsg('ACCESS DENIED: INVALID_QR_PAYLOAD');
      setScanStatus('INVALID');
      didHandleScanRef.current = false;
      setTimeout(() => {
        try { scannerRef.current?.resume?.(); } catch { }
        setScanStatus('IDLE');
        setStatusMsg('');
      }, 2500);
    }
  };

  const resetScanner = () => {
    setScanStatus('IDLE');
    setStatusMsg('');
    setCnicInput('');
    setQrPayload(null);
    setVerifiedCnicHash('');
    didHandleScanRef.current = false;
    if (html5Scanner) {
      try { html5Scanner.resume(); } catch { }
    }
  };

  onScanSuccessRef.current = (decodedText) => acceptDecodedPayload(decodedText);
  onScanFailureRef.current = (errorMessage) => {
    const msg = typeof errorMessage === 'string' ? errorMessage : String(errorMessage?.message || errorMessage || '');
    if (msg && !msg.includes('NotFoundException')) console.debug('QR decode issue:', errorMessage);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      didHandleScanRef.current = false;
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 15,
          qrbox: { width: 320, height: 320 },
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
          experimentalFeatures: { useBarCodeDetectorIfSupported: true },
        },
        false
      );
      setHtml5Scanner(scanner);
      scannerRef.current = scanner;
      const onScanSuccess = (decodedText, decodedResult) => onScanSuccessRef.current?.(decodedText, decodedResult);
      const onScanFailure = (errorMessage) => onScanFailureRef.current?.(errorMessage);
      scanner.render(onScanSuccess, onScanFailure);
      return () => { scanner.clear().catch(console.error); };
    }
  }, [SCANNER_VERSION]);

  useEffect(() => {
    return () => {
      try { fileDecoderRef.current?.clear?.(); } catch { }
      fileDecoderRef.current = null;
    };
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (typeof window !== 'undefined' && typeof window.BarcodeDetector === 'function') {
        const bitmap = await createImageBitmap(file);
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        const barcodes = await detector.detect(bitmap);
        const rawValue = barcodes?.[0]?.rawValue;
        if (!rawValue) {
          setScanStatus('INVALID');
          setStatusMsg('ACCESS DENIED: QR_NOT_DETECTED');
          setTimeout(() => resetScanner(), 2500);
          return;
        }
        await acceptDecodedPayload(rawValue);
        return;
      }
      if (!fileDecoderRef.current) fileDecoderRef.current = new Html5Qrcode('qr-file-reader');
      const decodedText = await fileDecoderRef.current.scanFile(file, true);
      await acceptDecodedPayload(decodedText);
    } catch (err) {
      console.error('Image scan failed', err);
      setScanStatus('INVALID');
      setStatusMsg('ACCESS DENIED: IMAGE_SCAN_FAILED');
      setTimeout(() => resetScanner(), 3500);
    } finally {
      e.target.value = '';
    }
  };

  const handleCnicSubmit = async (e) => {
    e.preventDefault();
    if (!cnicInput) return;
    setScanStatus('VERIFYING');
    try {
      const computedHash = ethers.id(cnicInput);
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrData: qrPayload, cnicHash: computedHash, mode: 'verify' })
      });
      const data = await res.json();
      if (data.valid) {
        setScanStatus('VERIFIED');
        setVerifiedCnicHash(computedHash);
        setStatusMsg(data.message);
      } else {
        setScanStatus('INVALID');
        setStatusMsg('ACCESS DENIED: ' + data.message);
        setTimeout(() => resetScanner(), 3500);
      }
    } catch (err) {
      setScanStatus('INVALID');
      setStatusMsg('ACCESS DENIED: NETWORK_ERROR');
      setTimeout(() => resetScanner(), 3500);
    }
  };

  const handleUseTicket = async () => {
    if (!qrPayload || !verifiedCnicHash) return;
    setScanStatus('USING');
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrData: qrPayload, cnicHash: verifiedCnicHash, mode: 'use' })
      });
      const data = await res.json();
      if (data.valid) {
        setScanStatus('USED');
        setStatusMsg(data.message + (data.txHash ? `|TX: ${data.txHash}` : ''));
      } else {
        setScanStatus('INVALID');
        setStatusMsg('ACCESS DENIED: ' + data.message);
      }
      setTimeout(() => resetScanner(), 5000);
    } catch (err) {
      setScanStatus('INVALID');
      setStatusMsg('ACCESS DENIED: NETWORK_ERROR');
      setTimeout(() => resetScanner(), 3500);
    }
  };

  const statusColor = scanStatus === 'INVALID'
    ? '#FF003C'
    : (scanStatus === 'USING' || scanStatus === 'VERIFYING')
    ? '#FFD600'
    : '#00FF6A';

  return (
    <>
      <Head>
        <title>Gate Scanner | ChainPass</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={styles.container}>
        <Navbar />

        <main style={styles.main}>
          <header style={styles.header}>
            <div style={styles.secTag}>// STADIUM_GATEWAY</div>
            <h1 style={styles.title}>IDENTITY_SCANNER</h1>
            <p style={styles.tip}>Hold steady and keep the full QR inside frame. Increase source screen brightness for faster detection.</p>
          </header>

          {/* Status Bar */}
          <div style={styles.statusBar}>
            <div style={{ ...styles.statusDot, background: statusColor, boxShadow: `0 0 10px ${statusColor}` }} />
            <span style={styles.statusText}>
              {scanStatus === 'IDLE' && 'STEP 1/2: SCAN TICKET QR'}
              {scanStatus === 'CNIC_PROMPT' && 'STEP 1/2: ENTER CNIC FOR VERIFICATION'}
              {scanStatus === 'VERIFYING' && 'VERIFYING TICKET...'}
              {scanStatus === 'VERIFIED' && 'STEP 2/2: VERIFIED — READY TO MARK USED'}
              {scanStatus === 'USING' && 'MARKING TICKET AS USED...'}
              {scanStatus === 'USED' && 'ENTRY RECORDED'}
              {scanStatus === 'INVALID' && 'ACCESS DENIED'}
            </span>
          </div>

          {/* Scanner area */}
          <div style={styles.scannerWrapper}>
            {/* Camera QR reader — always rendered, hidden when not idle */}
            <div style={{ display: scanStatus === 'IDLE' ? 'block' : 'none' }}>
              <div id="qr-reader" style={styles.reader} />

              <div className="upload-area">
                <input type="file" accept="image/*" onChange={handleImageUpload} />
                <div className="upload-area-bg">
                  <div style={{ fontSize: '20px', marginBottom: '8px', opacity: 0.7 }}>⇪</div>
                  <div className="upload-title">OR UPLOAD QR IMAGE</div>
                  <div className="upload-subtitle">Drag & drop or click to select image file</div>
                </div>
              </div>
            </div>

            {/* Offscreen fallback - must NOT be display:none */}
            <div
              id="qr-file-reader"
              style={{
                position: 'absolute',
                left: '-9999px',
                top: '-9999px',
                width: '600px',
                height: '600px',
                overflow: 'hidden',
                background: '#fff',
              }}
            />

            {/* CNIC Form */}
            {scanStatus === 'CNIC_PROMPT' && (
              <form onSubmit={handleCnicSubmit} style={styles.stateCard}>
                <div style={styles.stateIcon}>📋</div>
                <h2 style={styles.stateTitle}>QR ACQUIRED</h2>
                <p style={styles.stateSubtitle}>AWAITING PHYSICAL IDENTITY VERIFICATION</p>
                <label style={styles.inputLabel}>ENTER FAN'S PHYSICAL CNIC NO.</label>
                <input
                  autoFocus
                  required
                  value={cnicInput}
                  onChange={(e) => setCnicInput(e.target.value)}
                  placeholder="XXXXX-XXXXXXX-X"
                  style={styles.input}
                />
                <button type="submit" style={styles.btn}>VERIFY IDENTITY HASH →</button>
                <button type="button" style={styles.cancelBtn} onClick={resetScanner}>CANCEL AND RESCAN</button>
              </form>
            )}

            {/* Verifying */}
            {scanStatus === 'VERIFYING' && (
              <div style={styles.stateCard}>
                <div style={styles.spinner} />
                <p style={styles.processingText}>VERIFYING TICKET AND CNIC HASH...</p>
              </div>
            )}

            {/* Verified */}
            {scanStatus === 'VERIFIED' && (
              <div style={{ ...styles.stateCard, ...styles.verifiedCard }}>
                <div style={styles.bigIcon}>✓</div>
                <h1 style={styles.resultTitle}>TICKET VERIFIED</h1>
                <p style={styles.resultMsg}>
                  {statusMsg.split('|').map((line, i) => <span key={i}>{line}<br /></span>)}
                </p>
                <p style={styles.resultHint}>Ready to admit entry.</p>
                <div style={styles.actionRow}>
                  <button type="button" style={styles.btn} onClick={handleUseTicket}>MARK TICKET AS USED</button>
                  <button type="button" style={styles.cancelBtn} onClick={resetScanner}>CANCEL AND RESCAN</button>
                </div>
              </div>
            )}

            {/* Using */}
            {scanStatus === 'USING' && (
              <div style={styles.stateCard}>
                <div style={styles.spinner} />
                <p style={styles.processingText}>WRITING ENTRY STATUS ON-CHAIN...</p>
              </div>
            )}

            {/* Used / Approved */}
            {scanStatus === 'USED' && (
              <div style={{ ...styles.stateCard, ...styles.approvedCard }}>
                <div style={styles.bigIcon}>✓</div>
                <h1 style={styles.resultTitle}>ENTRY APPROVED</h1>
                <p style={styles.resultMsg}>
                  {statusMsg.split('|').map((line, i) => <span key={i}>{line}<br /></span>)}
                </p>
              </div>
            )}

            {/* Invalid */}
            {scanStatus === 'INVALID' && (
              <div style={{ ...styles.stateCard, ...styles.invalidCard }}>
                <div style={styles.bigIcon}>✕</div>
                <h1 style={styles.resultTitle}>IMPOSTOR MISMATCH</h1>
                <p style={styles.resultMsg}>{statusMsg}</p>
              </div>
            )}
          </div>
        </main>
      </div>

      <style>{`
        #qr-reader { border: 1px solid var(--border) !important; background: rgba(0,255,106,0.01) !important; border-radius: 4px; box-shadow: inset 0 0 20px rgba(0,255,106,0.02); }
        #qr-reader__scan_region { min-height: 280px; }
        #qr-reader__dashboard_section_csr span { color: var(--text) !important; font-family: var(--mono); font-size: 11px; }
        #html5-qrcode-button-camera-permission,
        #html5-qrcode-button-camera-stop {
          background: linear-gradient(180deg, #14ff78 0%, #00d95a 100%); color: var(--bg); border: none; padding: 12px 24px;
          font-family: var(--mono); cursor: pointer; font-size: 11px; border-radius: 2px; font-weight: bold; letter-spacing: 1px;
          margin-top: 10px; box-shadow: 0 4px 15px rgba(0,255,106,0.2); transition: opacity 0.2s;
        }
        #html5-qrcode-button-camera-permission:hover,
        #html5-qrcode-button-camera-stop:hover { opacity: 0.85; }
        #html5-qrcode-anchor-scan-type-change { color: var(--g) !important; font-family: var(--mono) !important; font-size: 11px !important; text-decoration: none; }
        #qr-reader__dashboard_section_swaplink { text-decoration: none; margin-top: 15px; display: inline-block; }
        input:focus { outline: none; border-color: var(--g) !important; }
        
        .upload-area { position: relative; overflow: hidden; border: 1px dashed var(--border2); padding: 32px 16px; margin: 20px auto 0; max-width: 560px; border-radius: 4px; background: rgba(255,255,255,0.01); transition: all 0.2s; cursor: pointer; }
        .upload-area:hover { border-color: var(--g); background: rgba(0,255,106,0.03); }
        .upload-area input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }
        .upload-area-bg { pointer-events: none; text-align: center; display: flex; flex-direction: column; align-items: center; }
        .upload-title { font-family: var(--mono); font-size: 11px; color: var(--g); letter-spacing: 1.5px; margin-bottom: 6px; }
        .upload-subtitle { font-family: var(--mono); font-size: 10px; color: var(--muted); }
        
        @keyframes fadeSlide { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes rotateSpinner { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}

const styles = {
  container: { background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' },
  main: {
    padding: 'clamp(32px, 6vw, 60px) clamp(16px, 5vw, 48px)',
    maxWidth: '760px',
    margin: '0 auto',
    textAlign: 'center',
  },
  header: { marginBottom: '32px' },
  secTag: { fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--g)', letterSpacing: '3px', marginBottom: '12px' },
  title: { fontFamily: 'var(--display)', fontSize: 'clamp(32px, 6vw, 52px)', letterSpacing: '2px', marginBottom: '10px' },
  tip: { fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)', lineHeight: 1.6, maxWidth: '520px', margin: '0 auto' },
  statusBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
    padding: '14px 20px', marginBottom: '24px', background: 'var(--surface)',
    border: '1px solid var(--border)', borderRadius: '4px',
    flexWrap: 'wrap',
  },
  statusDot: { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, transition: 'background 0.3s' },
  statusText: { fontFamily: 'var(--mono)', fontSize: 'clamp(10px, 2vw, 12px)', letterSpacing: '1px', textAlign: 'center' },
  scannerWrapper: {
    minHeight: '380px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  reader: { width: '100%', maxWidth: '560px', margin: '0 auto' },

  stateCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 'clamp(32px, 6vw, 60px) clamp(16px, 4vw, 32px)',
    gap: '16px',
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    borderRadius: '4px',
    animation: 'fadeSlide 0.3s ease',
  },
  verifiedCard: {
    borderColor: '#FFD600',
    background: 'rgba(255, 214, 0, 0.05)',
  },
  approvedCard: {
    borderColor: '#00FF6A',
    background: 'rgba(0, 255, 106, 0.05)',
  },
  invalidCard: {
    borderColor: '#FF003C',
    background: 'rgba(255, 0, 60, 0.05)',
  },
  stateIcon: { fontSize: '32px', marginBottom: '4px' },
  stateTitle: { fontFamily: 'var(--display)', fontSize: 'clamp(24px, 4vw, 32px)', letterSpacing: '1px' },
  stateSubtitle: { fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--g)', letterSpacing: '1px' },
  inputLabel: { fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--dim)', letterSpacing: '0.5px', textAlign: 'left', width: '100%', maxWidth: '420px' },
  input: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border2)',
    color: 'var(--text)',
    fontFamily: 'var(--mono)',
    fontSize: 'clamp(14px, 3vw, 18px)',
    padding: '14px 16px',
    width: '100%',
    maxWidth: '420px',
    textAlign: 'center',
    boxSizing: 'border-box',
    borderRadius: '2px',
    letterSpacing: '2px',
  },
  btn: {
    width: '100%',
    maxWidth: '420px',
    background: 'var(--g)',
    color: 'var(--bg)',
    border: 'none',
    padding: '16px',
    fontFamily: 'var(--mono)',
    fontSize: 'clamp(11px, 2vw, 14px)',
    fontWeight: 'bold',
    cursor: 'pointer',
    letterSpacing: '1px',
    borderRadius: '2px',
    transition: 'opacity 0.2s',
  },
  cancelBtn: {
    width: '100%',
    maxWidth: '420px',
    background: 'transparent',
    color: 'var(--muted)',
    border: '1px solid var(--border2)',
    padding: '13px',
    fontFamily: 'var(--mono)',
    fontSize: '12px',
    cursor: 'pointer',
    letterSpacing: '1px',
    borderRadius: '2px',
    transition: 'opacity 0.2s',
  },
  bigIcon: {
    fontFamily: 'var(--display)',
    fontSize: '56px',
    lineHeight: 1,
  },
  resultTitle: { fontFamily: 'var(--display)', fontSize: 'clamp(28px, 5vw, 40px)', letterSpacing: '2px' },
  resultMsg: { fontFamily: 'var(--mono)', fontSize: 'clamp(11px, 2vw, 14px)', lineHeight: 1.6, maxWidth: '480px', wordBreak: 'break-all' },
  resultHint: { fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--muted)' },
  actionRow: {
    width: '100%',
    maxWidth: '420px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  processingText: {
    fontFamily: 'var(--mono)',
    fontSize: '13px',
    color: 'var(--muted)',
    letterSpacing: '1px',
    animation: 'pulse 1.2s infinite',
  },
  spinner: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: '3px solid var(--border2)',
    borderTopColor: 'var(--g)',
    animation: 'rotateSpinner 0.8s linear infinite',
  },
};
