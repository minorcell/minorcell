const HeavyChart = React.lazy(() => import('./HeavyChart'));

function Dashboard() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <HeavyChart data={chartData} />
    </Suspense>
  );
}

function Dashboard_Good() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <HeavyChart />
      <DataTable />
      <AnalyticsPanel />
    </Suspense>
  );
}

function Dashboard_Bad() {
  return (
    <>
      <Suspense fallback={<Spinner />}><HeavyChart /></Suspense>
      <Suspense fallback={<Spinner />}><DataTable /></Suspense>
      <Suspense fallback={<Spinner />}><AnalyticsPanel /></Suspense>
    </>
  );
}

class ChunkErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return <FallbackUI />;
    return this.props.children;
  }
}
