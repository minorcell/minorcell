function App() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>+1 ({count})</button>
      <ExpensiveChild />
    </div>
  );
}

function ExpensiveChild() {
  console.log('ExpensiveChild rendered');
  return <div>I have nothing to do with count, but I re-render anyway.</div>;
}

// Triggers re-render:
// ✓ state change (setState)
// ✓ parent re-render (children follow by default)
// ✓ Context value change (all useContext consumers)
// ✓ hook state change

// Does NOT trigger re-render:
// ✗ ref change (useRef)
// ✗ plain variable change (React doesn't know)
