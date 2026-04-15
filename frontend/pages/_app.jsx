import '../styles/globals.css';
import Head from 'next/head';
import { Web3Provider } from '../utils/Web3Context';

export default function App({ Component, pageProps }) {
  return (
    <Web3Provider>
      <Head>
        <link rel="icon" href="/chainpass-logo.png" type="image/png" />
      </Head>
      <Component {...pageProps} />
    </Web3Provider>
  );
}
