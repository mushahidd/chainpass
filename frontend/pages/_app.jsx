import '../styles/globals.css';
import Head from 'next/head';
import { Web3Provider } from '../utils/Web3Context';
import { NotificationProvider } from '../utils/NotificationContext';
import NotificationContainer from '../components/NotificationContainer';

export default function App({ Component, pageProps }) {
  return (
    <Web3Provider>
      <NotificationProvider>
        <Head>
          <link rel="icon" type="image/png" href="/favicon.png" />
        </Head>
        <Component {...pageProps} />
        <NotificationContainer />
      </NotificationProvider>
    </Web3Provider>
  );
}
