document.getElementById('export-btn').addEventListener('click', async () => {
  const XLSX = await import('xlsx');
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, data, 'Sheet1');
  XLSX.writeFile(workbook, 'export.xlsx');
});

if (window.innerWidth >= 1024) {
  const { Editor } = await import('./DesktopEditor');
  render(Editor);
} else {
  const { MobileView } = await import('./MobileView');
  render(MobileView);
}

const Chart = await import(
  /* webpackChunkName: "dashboard-chart" */
  './DashboardChart'
);

let preloadPromise;
document.getElementById('settings-link').addEventListener('mouseenter', () => {
  preloadPromise = import('./SettingsPage');
});

document.getElementById('settings-link').addEventListener('click', async () => {
  const { SettingsPage } = await (preloadPromise || import('./SettingsPage'));
  render(SettingsPage);
});

async function safeImport(importFn, fallback) {
  try {
    return await importFn();
  } catch (err) {
    console.error('Chunk load failed', err);
    return fallback;
  }
}
