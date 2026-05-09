new PerformanceObserver((list) => {
  const entries = list.getEntries();
  const lastEntry = entries[entries.length - 1];
  console.log('LCP:', lastEntry.startTime.toFixed(0) + 'ms', lastEntry.element);
}).observe({ type: 'largest-contentful-paint', buffered: true });

new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log('Interaction:', entry.name, entry.duration.toFixed(0) + 'ms');
  }
}).observe({ type: 'event', buffered: true, durationThreshold: 16 });

let clsScore = 0;
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (!entry.hadRecentInput) {
      clsScore += entry.value;
    }
  }
  console.log('CLS:', clsScore.toFixed(3));
}).observe({ type: 'layout-shift', buffered: true });

const [entry] = performance.getEntriesByType('navigation');
if (entry) {
  console.log({
    'DNS lookup':  entry.domainLookupEnd - entry.domainLookupStart,
    'TCP connect': entry.connectEnd - entry.connectStart,
    'TTFB':        entry.responseStart - entry.requestStart,
    'DOM parse':   entry.domContentLoadedEventEnd - entry.responseEnd,
    'Interactive': entry.domInteractive - entry.fetchStart,
    'Load':        entry.loadEventEnd - entry.fetchStart,
  });
}

const paintEntries = performance.getEntriesByType('paint');
paintEntries.forEach(e => {
  console.log(e.name.toUpperCase(), e.startTime.toFixed(1) + 'ms');
});

const nav = performance.getEntriesByType('navigation')[0];
console.log('TTFB:', nav.responseStart.toFixed(0) + 'ms');
