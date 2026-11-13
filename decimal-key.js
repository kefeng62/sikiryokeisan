// Let desktop keyboards enter a decimal point with either the main period key
// or the numeric keypad's decimal key. Reuse the keypad button handler so input
// validation and display stay consistent across mouse, touch, and keyboard.
document.addEventListener('keydown', (event) => {
  const isDecimalKey = event.key === '.' ||
    event.key === ',' ||
    event.key === 'Decimal' ||
    event.code === 'NumpadDecimal';

  if (!isDecimalKey || document.getElementById('game-screen')?.classList.contains('hidden')) {
    return;
  }

  event.preventDefault();
  document.querySelector('.keypad [data-key="dot"]')?.click();
});
