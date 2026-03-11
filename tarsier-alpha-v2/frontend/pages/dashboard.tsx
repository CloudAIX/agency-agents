import Head from 'next/head';
import Layout from '../components/Layout/Layout';
import PnLDashboard from '../components/PnLDashboard/PnLDashboard';

export default function Dashboard() {
  return (
    <>
      <Head>
        <title>My Paper Portfolio — TarsierAlpha</title>
      </Head>
      <Layout>
        <PnLDashboard />
      </Layout>
    </>
  );
}
