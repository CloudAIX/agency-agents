import type { AppProps } from 'next/app';
import '../styles/globals.css';
import { AuthProvider } from '../hooks/useAuth';
import { AlertsProvider } from '../hooks/useAlerts';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <AlertsProvider>
        <Component {...pageProps} />
      </AlertsProvider>
    </AuthProvider>
  );
}
