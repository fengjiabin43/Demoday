if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      await navigator.serviceWorker.register(new URL('./sw.js', document.baseURI), {updateViaCache:'none'});
      const registration = await navigator.serviceWorker.ready;
      const urls = performance.getEntriesByType('resource').map(entry => entry.name).filter(url => url.startsWith(registration.scope) && !url.includes('/sw.js'));
      registration.active?.postMessage({type:'CACHE_URLS',urls});
    } catch { /* A missing cache never blocks online learning. */ }
  });
}
