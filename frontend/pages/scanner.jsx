import { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import { Html5Qrcode, Html5QrcodeScanner, Html5QrcodeSupportedFormats, Html5QrcodeScanType } from 'html5-qrcode';
import { ethers } from 'ethers';
import jsQR from 'jsqr';

const SCANNER_VERSION = 2;

export default function Scanner() {
  const [scanStatus, setScanStatus] = useState('IDLE'); // IDLE, CNIC_PROMPT, VERIFYING, VERIFIED, USING, USED, INVALID
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

  const loadImageElementFromFile = async (file) => {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = (err) => reject(err);
        el.src = url;
      });
      return img;
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const drawFileToCanvas = async (file, { maxDim = 1400 } = {}) => {
    let source;
    try {
      if (typeof createImageBitmap === 'function') {
        source = await createImageBitmap(file);
      }
    } catch {
      source = null;
    }

    if (!source) {
      source = await loadImageElementFromFile(file);
    }

    const width = source.width || source.naturalWidth;
    const height = source.height || source.naturalHeight;
    const scale = Math.min(1, maxDim / Math.max(width, height));
    const w = Math.max(1, Math.floor(width * scale));
    const h = Math.max(1, Math.floor(height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('CANVAS_CONTEXT_UNAVAILABLE');

    ctx.drawImage(source, 0, 0, w, h);
    return { canvas, ctx, w, h, source };
  };

  const acceptDecodedPayload = async (decodedText) => {
    if (didHandleScanRef.current) return;

    try {
      const parsed = JSON.parse(decodedText);
      if (!parsed?.p || !parsed?.qS || !parsed?.sP || !parsed?.dS) {
        throw new Error('INVALID_QR_PAYLOAD');
      }

      didHandleScanRef.current = true;
      try {
        scannerRef.current?.pause?.(true);
      } catch {
        // no-op
      }
      setQrPayload(decodedText);
      setStatusMsg('');
      setScanStatus('CNIC_PROMPT');
    } catch {
      setStatusMsg('ACCESS DENIED: INVALID_QR_PAYLOAD');
      setScanStatus('INVALID');
      didHandleScanRef.current = false;

      setTimeout(() => {
        try {
          scannerRef.current?.resume?.();
        } catch {
          // no-op
        }
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
      try {
        html5Scanner.resume();
      } catch {
        // no-op; depends on internal scanner state
      }
    }
  };

  onScanSuccessRef.current = (decodedText) => acceptDecodedPayload(decodedText);
  onScanFailureRef.current = (errorMessage) => {
    const msg = typeof errorMessage === 'string'
      ? errorMessage
      : String(errorMessage?.message || errorMessage || '');

    if (msg && !msg.includes('NotFoundException')) {
      console.debug('QR decode issue:', errorMessage);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Re-init guard for dev Fast Refresh.
      didHandleScanRef.current = false;

      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 15,
          qrbox: { width: 420, height: 420 },
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
          // Helps a lot for scanning from screens / still images in Chromium browsers.
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true,
          },
        },
        false
      );
      setHtml5Scanner(scanner);
      scannerRef.current = scanner;

      const onScanSuccess = (decodedText, decodedResult) => {
        return onScanSuccessRef.current?.(decodedText, decodedResult);
      };

      const onScanFailure = (errorMessage) => {
        return onScanFailureRef.current?.(errorMessage);
      };

      scanner.render(onScanSuccess, onScanFailure);

      return () => {
        scanner.clear().catch(console.error);
      };
    }
  }, [SCANNER_VERSION]);

  useEffect(() => {
    return () => {
      try {
        fileDecoderRef.current?.clear?.();
      } catch {
        // no-op
      }
      fileDecoderRef.current = null;
    };
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // 1) Best path (Chromium): native BarcodeDetector.
      if (typeof window !== 'undefined' && typeof window.BarcodeDetector === 'function') {
        try {
          let source;
          try {
            if (typeof createImageBitmap === 'function') {
              source = await createImageBitmap(file);
            }
          } catch {
            source = null;
          }

          if (!source) {
            source = await loadImageElementFromFile(file);
          }

          const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
          const barcodes = await detector.detect(source);
          const rawValue = barcodes?.[0]?.rawValue;
          if (rawValue) {
            await acceptDecodedPayload(rawValue);
            return;
          }
        } catch (err) {
          console.debug('BarcodeDetector failed, falling back...', err);
        }
      }

      // 2) Fallback: html5-qrcode's JS decoder.
      try {
        if (!fileDecoderRef.current) {
          fileDecoderRef.current = new Html5Qrcode('qr-file-reader');
        }

        // showImage=true improves reliability because html5-qrcode renders the image
        // into the target element before decoding (some browsers need this path).
        const decodedText = await fileDecoderRef.current.scanFile(file, /* showImage= */ true);
        if (decodedText) {
          await acceptDecodedPayload(decodedText);
          return;
        }
      } catch (err) {
        console.debug('html5-qrcode scanFile failed, falling back...', err);
      }

      // 3) Final fallback: jsQR (pure JS QR decoder).
      try {
        const { ctx, w, h } = await drawFileToCanvas(file, { maxDim: 1400 });
        const imgData = ctx.getImageData(0, 0, w, h);
        const code = jsQR(imgData.data, w, h, { inversionAttempts: 'attemptBoth' });
        if (code?.data) {
          await acceptDecodedPayload(code.data);
          return;
        }
      } catch (err) {
        console.debug('jsQR failed', err);
      }

      setScanStatus('INVALID');
      setStatusMsg('ACCESS DENIED: QR_NOT_DETECTED');
      setTimeout(() => resetScanner(), 2500);
    } catch (err) {
      console.error('Image scan failed', err);
      setScanStatus('INVALID');
      setStatusMsg('ACCESS DENIED: IMAGE_SCAN_FAILED');
      setTimeout(() => resetScanner(), 3500);
    } finally {
      // Allow uploading the same file again.
      e.target.value = '';
    }
  };

  const handleCnicSubmit = async (e) => {
    e.preventDefault();
    if (!cnicInput) return;

    setScanStatus('VERIFYING');
    
    try {
      // Local privacy-preserving hash of physical ID
      const computedHash = ethers.id(cnicInput);

      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
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

        setTimeout(() => {
          resetScanner();
        }, 3500);
      }

    } catch (err) {
       setScanStatus('INVALID');
       setStatusMsg('ACCESS DENIED: NETWORK_ERROR');
       setTimeout(() => {
        resetScanner();
      }, 3500);
    }
  };

  const handleUseTicket = async () => {
    if (!qrPayload || !verifiedCnicHash) return;

    setScanStatus('USING');

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
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

      setTimeout(() => {
        resetScanner();
      }, 5000);

    } catch (err) {
      setScanStatus('INVALID');
      setStatusMsg('ACCESS DENIED: NETWORK_ERROR');
      setTimeout(() => {
        resetScanner();
      }, 3500);
    }
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
            <p style={styles.tip}>Hold steady and keep the full QR inside frame. Increase source screen brightness for faster detection.</p>
          </header>

          <div style={styles.statusBar}>
            <div style={{
              ...styles.statusDot,
              background: scanStatus === 'INVALID' ? '#FF003C' : scanStatus === 'USING' || scanStatus === 'VERIFYING' ? '#FFD600' : '#00FF6A',
            }} />
            <span style={styles.statusText}>
              {scanStatus === 'IDLE' && 'STEP 1/2: SCAN TICKET QR'}
              {scanStatus === 'CNIC_PROMPT' && 'STEP 1/2: ENTER CNIC FOR VERIFICATION'}
              {scanStatus === 'VERIFYING' && 'VERIFYING TICKET...'}
              {scanStatus === 'VERIFIED' && 'STEP 2/2: VERIFIED, READY TO MARK USED'}
              {scanStatus === 'USING' && 'MARKING TICKET AS USED...'}
              {scanStatus === 'USED' && 'ENTRY RECORDED'}
              {scanStatus === 'INVALID' && 'ACCESS DENIED'}
            </span>
          </div>

          <div style={styles.scannerWrapper}>
            <div style={{ display: scanStatus === 'IDLE' ? 'block' : 'none' }}>
              <div id="qr-reader" style={styles.reader}></div>

              <div style={{ marginTop: '14px' }}>
                <label style={{
                  display: 'inline-block',
                  fontFamily: 'var(--mono)',
                  fontSize: '10px',
                  letterSpacing: '1px',
                  color: 'var(--muted)',
                  marginBottom: '8px'
                }}>
                  OR_UPLOAD_QR_IMAGE
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{
                    display: 'block',
                    margin: '0 auto',
                    fontFamily: 'var(--mono)',
                    fontSize: '12px',
                    color: 'var(--text)'
                  }}
                />
              </div>
            </div>

            {/* Offscreen render target used by html5-qrcode's scanFile() fallback.
                Must NOT be display:none for reliable decoding in some browsers. */}
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

            {scanStatus === 'CNIC_PROMPT' && (
              <form onSubmit={handleCnicSubmit} style={styles.cnicForm}>
                <h2 style={{fontFamily: 'var(--display)', fontSize: '32px', marginBottom: '10px'}}>QR ACQUIRED</h2>
                <p style={{fontFamily: 'var(--mono)', fontSize: '14px', color: 'var(--g)', marginBottom: '30px'}}>
                  AWAITING PHYSICAL IDENTITY VERIFICATION
                </p>
                
                <label style={{fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--dim)', display: 'block', textAlign: 'left', marginBottom: '8px'}}>
                  ENTER FAN'S PHYSICAL CNIC NO.
                </label>
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

            {scanStatus === 'VERIFYING' && (
              <div style={styles.processing}>
                <h2>VERIFYING TICKET AND CNIC HASH...</h2>
              </div>
            )}

            {scanStatus === 'VERIFIED' && (
              <div style={{...styles.resultCard, ...styles.verified}}>
                <h1>TICKET VERIFIED</h1>
                <p style={{fontFamily: 'var(--mono)', fontSize: '14px', marginTop: '16px', lineHeight: 1.5}}>
                  {statusMsg.split('|').map((line, i) => <span key={i}>{line}<br/></span>)}
                </p>
                <p style={{fontFamily: 'var(--mono)', fontSize: '12px', marginTop: '10px'}}>Ready to admit entry.</p>

                <div style={styles.actionRow}>
                  <button type="button" style={styles.btn} onClick={handleUseTicket}>MARK TICKET AS USED</button>
                  <button type="button" style={styles.cancelBtn} onClick={resetScanner}>CANCEL AND RESCAN</button>
                </div>
              </div>
            )}

            {scanStatus === 'USING' && (
              <div style={styles.processing}>
                <h2>WRITING ENTRY STATUS ON-CHAIN...</h2>
              </div>
            )}
            
            {scanStatus === 'USED' && (
              <div style={{...styles.resultCard, ...styles.valid}}>
                <h1>ENTRY APPROVED</h1>
                <p style={{fontFamily: 'var(--mono)', fontSize: '14px', marginTop: '16px', lineHeight: 1.5}}>
                  {statusMsg.split('|').map((line, i) => <span key={i}>{line}<br/></span>)}
                </p>
              </div>
            )}
            
            {scanStatus === 'INVALID' && (
              <div style={{...styles.resultCard, ...styles.invalid}}>
                <h1>IMPOSTER MISMATCH</h1>
                <p>{statusMsg}</p>
              </div>
            )}
          </div>
        </main>
      </div>
      
      <style>{`
        #qr-reader { border: 1px solid var(--border) !important; background: var(--surface) !important; }
        #qr-reader__scan_region { min-height: 360px; }
        #qr-reader__dashboard_section_csr span { color: var(--text) !important; }
        #html5-qrcode-button-camera-permission, #html5-qrcode-button-camera-stop {
          background: var(--g); color: var(--bg); border: none; padding: 10px; font-family: var(--mono); cursor: pointer;
        }
        input:focus { outline: none; border-color: var(--g); }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
      `}</style>
    </>
  );
}

const styles = {
  container: { background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' },
  main: { padding: '60px 48px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' },
  header: { marginBottom: '40px' },
  secTag: { fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--g)', letterSpacing: '3px', marginBottom: '12px' },
  title: { fontFamily: 'var(--display)', fontSize: '48px', letterSpacing: '2px' },
  tip: { fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)', marginTop: '12px' },
  statusBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
    padding: '14px', marginBottom: '24px', background: 'var(--surface)', border: '1px solid var(--border)',
  },
  statusDot: { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },
  statusText: { fontFamily: 'var(--mono)', fontSize: '12px', letterSpacing: '1px' },
  scannerWrapper: { minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  reader: { width: '100%', maxWidth: '640px', margin: '0 auto' },
  processing: { fontFamily: 'var(--mono)', color: 'var(--muted)', animation: 'pulse 1s infinite' },
  resultCard: { padding: '80px 20px', border: '2px solid', color: '#000', fontFamily: 'var(--display)' },
  actionRow: {
    width: '100%', maxWidth: '420px', margin: '20px auto 0', display: 'flex', flexDirection: 'column', gap: '10px'
  },
  verified: { background: '#FFD600', borderColor: '#FFD600' },
  valid: { background: '#00FF6A', borderColor: '#00FF6A' },
  invalid: { background: '#FF003C', borderColor: '#FF003C' },
  cnicForm: { textAlign: 'center', padding: '40px 0' },
  input: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid var(--border2)',
    color: 'var(--text)',
    fontFamily: 'var(--mono)',
    fontSize: '18px',
    padding: '16px',
    width: '100%',
    maxWidth: '420px',
    textAlign: 'center',
    boxSizing: 'border-box',
    display: 'block',
    margin: '0 auto 16px',
  },
  btn: {
    display: 'block',
    width: '100%',
    maxWidth: '420px',
    margin: '0 auto',
    background: 'var(--g)',
    color: 'var(--bg)',
    border: 'none',
    padding: '16px',
    fontFamily: 'var(--mono)',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    letterSpacing: '1px',
  },
  cancelBtn: {
    display: 'block',
    width: '100%',
    maxWidth: '420px',
    margin: '0 auto',
    background: 'transparent',
    color: 'var(--muted)',
    border: '1px solid var(--border2)',
    padding: '14px',
    fontFamily: 'var(--mono)',
    fontSize: '12px',
    cursor: 'pointer',
    letterSpacing: '1px',
  }
};
