import '../styles/globals.css';
import Head from 'next/head';
import { Web3Provider } from '../utils/Web3Context';
import { ToastProvider } from '../utils/ToastContext';

export default function App({ Component, pageProps }) {
  return (
    <Web3Provider>
      <ToastProvider>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/chainpass-logo.png" type="image/png" />
        </Head>
        <Component {...pageProps} />
      </ToastProvider>
    </Web3Provider>
  );
}
