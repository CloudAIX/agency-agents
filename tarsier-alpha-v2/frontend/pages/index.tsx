import Head from 'next/head';
import Layout from '../components/Layout/Layout';
import ScannerTabs from '../components/Scanner/ScannerTabs';
import AlertBanner from '../components/Layout/AlertBanner';

export default function Home() {
  return (
    <>
      <Head>
        <title>TarsierAlpha — Options Scanner</title>
        <meta name="description" content="High-score options setups: longs, shorts, and portfolio hedge. Paper trades only." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0a0e1a" />
      </Head>
      <Layout>
        <AlertBanner />
        <ScannerTabs />
      </Layout>
    </>
  );
}
