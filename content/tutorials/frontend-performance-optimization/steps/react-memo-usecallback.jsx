const ExpensiveList = React.memo(function ExpensiveList({ items, onSelect }) {
  return items.map(item => (
    <div key={item.id} onClick={() => onSelect(item.id)}>{item.name}</div>
  ));
});

function Parent_Bad() {
  const [count, setCount] = useState(0);
  return (
    <ExpensiveList
      items={data.filter(d => d.active)}
      onSelect={(id) => console.log(id)}
    />
  );
}

function Parent_Good() {
  const [count, setCount] = useState(0);
  const items = useMemo(() => data.filter(d => d.active), [data]);
  const onSelect = useCallback((id) => console.log(id), []);
  return <ExpensiveList items={items} onSelect={onSelect} />;
}

const sorted = useMemo(() => {
  return hugeList.filter(x => x.score > 90).sort((a, b) => b.score - a.score);
}, [hugeList]);

const fullName = firstName + ' ' + lastName;

const handleSubmit = useCallback((data) => {
  api.post('/submit', data);
}, []);
