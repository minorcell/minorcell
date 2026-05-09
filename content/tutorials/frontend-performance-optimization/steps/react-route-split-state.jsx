import dynamic from 'next/dynamic';

const HeavyDashboard = dynamic(() => import('./HeavyDashboard'), {
  loading: () => <DashboardSkeleton />,
  ssr: false,
});

function Page_Bad() {
  const [searchQuery, setSearchQuery] = useState('');
  return (
    <div>
      <Header />
      <SearchBar query={searchQuery} onChange={setSearchQuery} />
      <Content />
      <Sidebar />
    </div>
  );
}

function Page_Good() {
  return (
    <div>
      <Header />
      <SearchBarSection />
      <Content />
      <Sidebar />
    </div>
  );
}

function SearchBarSection() {
  const [searchQuery, setSearchQuery] = useState('');
  return <SearchBar query={searchQuery} onChange={setSearchQuery} />;
}

function SearchPage() {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  return (
    <>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      <Suspense fallback={<div>Loading...</div>}>
        <SearchResults query={deferredQuery} />
      </Suspense>
    </>
  );
}
