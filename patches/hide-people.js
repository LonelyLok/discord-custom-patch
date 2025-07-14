window.addEventListener('DOMContentLoaded', () => {
  // core hide/show functions
  const hidePanels = () => {
    document.querySelector('[data-list-id="people"]')?.style.setProperty('display','none','important');
    document.querySelector('.nowPlayingColumn__133bf')?.style.setProperty('display','none','important');
  };
  const showPanels = () => {
    document.querySelector('[data-list-id="people"]')?.style.removeProperty('display');
    document.querySelector('.nowPlayingColumn__133bf')?.style.removeProperty('display');
  };

  // persisted state
  let isHidden = localStorage.getItem('discordPanelsHidden') !== 'false';

  // function to insert the toggle button (or update its text)
  const ensureButton = () => {
    // find the search-bar inner container
    const searchInner = Array.from(document.querySelectorAll('div'))
      .find(el =>
        el.className.split(' ').some(c => c.startsWith('searchBar')) &&
        el.querySelector('.inner_a45028')
      )?.querySelector('.inner_a45028');

    if (!searchInner) return;

    let btn = searchInner._toggleBtn;
    if (!btn) {
      // create it once
      btn = document.createElement('button');
      btn.title = 'Toggle people & Active Now panels';
      Object.assign(btn.style, {
        marginRight: '6px',
        padding: '2px 6px',
        fontSize: '12px',
        cursor: 'pointer',
        border: 'none',
        borderRadius: '4px',
        background: 'var(--interactive-normal)',
        color: 'var(--text-normal)'
      });
      btn.onmouseenter = () => btn.style.background = 'var(--interactive-hover)';
      btn.onmouseleave = () => btn.style.background = 'var(--interactive-normal)';
      btn.onclick = () => {
        isHidden = !isHidden;
        localStorage.setItem('discordPanelsHidden', isHidden);
        updateButtonText();
        isHidden ? hidePanels() : showPanels();
      };
      // remember for future
      searchInner._toggleBtn = btn;
      // insert before the search-input
      const input = searchInner.querySelector('input');
      searchInner.insertBefore(btn, input);
    }

    // always make sure its text matches the current state
    const updateButtonText = () => {
      btn.textContent = isHidden ? 'Show' : 'Hide';
    };
    updateButtonText();
  };

  // one observer to both hide panels and inject the button on any DOM change
  const observer = new MutationObserver(() => {
    if (isHidden) hidePanels(); 
    ensureButton();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // initial apply
  ensureButton();
  isHidden ? hidePanels() : showPanels();
});