new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.warn(
      `Long Task: ${entry.duration.toFixed(0)}ms`,
      `Source: ${entry.name}`,
      `Start: ${entry.startTime.toFixed(0)}ms`,
      entry.attribution?.[0]
    );
  }
}).observe({ type: 'longtask', buffered: true });

let tbt = 0;
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    const blockingTime = entry.duration - 50;
    if (blockingTime > 0) {
      tbt += blockingTime;
      console.log(`TBT: ${tbt.toFixed(0)}ms (+${blockingTime.toFixed(0)}ms)`);
    }
  }
}).observe({ type: 'longtask', buffered: true });

function createLongTask(ms = 120) {
  const start = performance.now();
  while (performance.now() - start < ms) {}
  console.log('Long task finished');
}
