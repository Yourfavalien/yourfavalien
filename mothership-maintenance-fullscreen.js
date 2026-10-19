(function () {
  const addFullPreview = () => {
    const mobileButton = document.getElementById('ymMob');
    const frame = document.getElementById('ymLivePreview');
    if (!mobileButton || !frame || document.getElementById('ymFull')) return;
    const button = document.createElement('button');
    button.id = 'ymFull';
    button.type = 'button';
    button.className = 'btn secondary';
    button.textContent = 'Full preview';
    button.title = 'Open the exact live maintenance page at full size';
    button.addEventListener('click', () => frame.requestFullscreen?.());
    mobileButton.insertAdjacentElement('afterend', button);
  };
  addFullPreview();
})();
