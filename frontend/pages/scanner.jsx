import { useEffect, useState } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { ethers } from 'ethers';

export default function Scanner() {
  const [scanStatus, setScanStatus] = useState('IDLE'); // IDLE, CNIC_PROMPT, PROCESSING, VALID, INVALID
  const [statusMsg, setStatusMsg] = useState('');
  const [qrPayload, setQrPayload] = useState(null);
  const [cnicInput, setCnicInput] = useState('');
  const [html5Scanner, setHtml5Scanner] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 8,
          qrbox: { width: 320, height: 320 },
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
        },
        false
      );
      setHtml5Scanner(scanner);

      const onScanSuccess = async (decodedText) => {
        if (scanner.getState() !== 2) return;
        scanner.pause(true);
        setQrPayload(decodedText);
        setScanStatus('CNIC_PROMPT');
      };

      const onScanFailure = (errorMessage) => {
        if (errorMessage && !errorMessage.includes('NotFoundException')) {
          console.debug('QR decode issue:', errorMessage);
        }
      };

      scanner.render(onScanSuccess, onScanFailure);

      return () => {
        scanner.clear().catch(console.error);
      };
    }
  }, []);

  const handleCnicSubmit = async (e) => {
    e.preventDefault();
    if (!cnicInput) return;

    setScanStatus('PROCESSING');
    
    try {
      // Local privacy-preserving hash of physical ID
      const computedHash = ethers.id(cnicInput);

      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
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

      setTimeout(() => {
        setScanStatus('IDLE');
        setStatusMsg('');
        setCnicInput('');
        setQrPayload(null);
        if (html5Scanner && html5Scanner.getState() === 3) {
           html5Scanner.resume();
        }
      }, 5000);

    } catch (err) {
       setScanStatus('INVALID');
       setStatusMsg('ACCESS DENIED: NETWORK_ERROR');
       setTimeout(() => {
        setScanStatus('IDLE');
        setStatusMsg('');
        setCnicInput('');
        setQrPayload(null);
        if (html5Scanner && html5Scanner.getState() === 3) {
           html5Scanner.resume();
        }
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

          <div style={styles.scannerWrapper}>
            <div style={{ display: scanStatus === 'IDLE' ? 'block' : 'none' }}>
              <div id="qr-reader" style={styles.reader}></div>
            </div>

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
              </form>
            )}

            {scanStatus === 'PROCESSING' && (
              <div style={styles.processing}>
                <h2>EVALUATING MATCH CONDITIONS...</h2>
              </div>
            )}
            
            {scanStatus === 'VALID' && (
              <div style={{...styles.resultCard, ...styles.valid}}>
                <h1>MATCH: VALID TICKET</h1>
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
  scannerWrapper: { minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  reader: { width: '100%', maxWidth: '640px', margin: '0 auto' },
  processing: { fontFamily: 'var(--mono)', color: 'var(--muted)', animation: 'pulse 1s infinite' },
  resultCard: { padding: '80px 20px', border: '2px solid', color: '#000', fontFamily: 'var(--display)' },
  valid: { background: '#00FF6A', borderColor: '#00FF6A' },
  invalid: { background: '#FF003C', borderColor: '#FF003C' }
};
