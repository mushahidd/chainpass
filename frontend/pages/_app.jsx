import '../styles/globals.css';
import { Web3Provider } from '../utils/Web3Context';

export default function App({ Component, pageProps }) {
  return (
    <Web3Provider>
      <Component {...pageProps} />
    </Web3Provider>
  );
}
