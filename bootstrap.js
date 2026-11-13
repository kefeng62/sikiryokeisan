// Temporary compatibility bootstrap: repair a malformed score expression in the
// cached script.js before executing it, then load the page add-ons in order.
(async () => {
  const errorBox = document.createElement('p');
  errorBox.style.cssText = 'padding:16px;color:#8b1e1e;font-weight:bold';

  try {
    const response = await fetch(`script.js?v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`script.js could not be loaded (${response.status})`);

    let source = await response.text();
    const broken = 'const raw=720*(x*x+x)-200(*x*x*y)-30(*x*x*z);';
    const fixed = 'const raw=720*(x*x+x)-200*x*y-30*x*z;';

    if (source.includes(broken)) {
      source = source.replace(broken, fixed);
    }

    const appScript = document.createElement('script');
    appScript.textContent = source;
    document.body.appendChild(appScript);

    for (const path of ['particles.js', 'sound-effects.js', 'home-progress.js']) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `${path}?v=${Date.now()}`;
        script.onload = resolve;
        script.onerror = () => reject(new Error(`${path} could not be loaded`));
        document.body.appendChild(script);
      });
    }
  } catch (error) {
    console.error('Game startup failed:', error);
    errorBox.textContent = 'ゲームの読み込みに失敗しました。ページを再読み込みしてください。';
    document.querySelector('.app-shell')?.prepend(errorBox);
  }
})();
