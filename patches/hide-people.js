window.addEventListener('DOMContentLoaded', () => {
  let isHidden = localStorage.getItem('discordPanelsHidden') !== 'false';
  function waitFor(selector, callback) {
    const tryFind = () => {
      const el = document.querySelector(selector);
      if (el) {
        callback(el);
        return true;
      }
      return false;
    };

    if (tryFind()) return;

    const root = document.body || document.documentElement;
    if (!root) {
      console.warn('[waitFor] No root node to observe');
      return;
    }

    const observer = new MutationObserver(() => {
      if (tryFind()) {
        observer.disconnect();
      }
    });

    observer.observe(root, { childList: true, subtree: true });
  }

  const peopleListSelector = '.peopleList__5ec2f';
  const nowPlayingSelector = '.nowPlayingColumn__133bf';
  const searchBarSelector = '#online-tab > div.searchBar__5ec2f';

  const hidePanels = () => {
    const peopleList = document.querySelector(peopleListSelector);
    const nowPlaying = document.querySelector(nowPlayingSelector);
    if (peopleList) {
      peopleList.style.setProperty('display', 'none', 'important');
    }
    if (nowPlaying) {
      nowPlaying.style.setProperty('display', 'none', 'important');
    }
  };

  const showPanels = () => {
    const peopleList = document.querySelector(peopleListSelector);
    const nowPlaying = document.querySelector(nowPlayingSelector);
    if (peopleList) {
      peopleList.style.removeProperty('display');
    }
    if (nowPlaying) {
      nowPlaying.style.removeProperty('display');
    }
  };

  const insertToggleButton = () => {
    const searchBar = document.querySelector(searchBarSelector);
    if (!searchBar) {
      console.warn('Search bar not found for toggle button');
      return;
    }
    let btn = searchBar._toggleBtn;
    if (!btn) {
      btn = document.createElement('button');
      btn.title = 'Toggle people & Active Now panels';
      Object.assign(btn.style, {
        marginRight: '6px',
        padding: '2px 6px',
        fontSize: '12px',
        cursor: 'pointer',
        border: 'none',
        borderRadius: '4px',
        background: 'var(--interactive-normal)'
      });
      btn.onmouseenter = () => btn.style.background = 'var(--interactive-hover)';
      btn.onmouseleave = () => btn.style.background = 'var(--interactive-normal)';
      btn.onclick = () => {
        console.log('Toggle button clicked, toggling panels');
        isHidden = !isHidden;
        localStorage.setItem('discordPanelsHidden', isHidden);
        isHidden ? hidePanels() : showPanels();
      };
    }
    searchBar._toggleBtn = btn;
    const input = document.querySelector('input[aria-label="Search"]');
    if (input && !btn.isConnected) {
      input.before(btn);
    }
    const updateButtonText = () => {
      btn.textContent = isHidden ? 'Show' : 'Hide';
    };
    updateButtonText();
  }

  // First load
  waitFor(peopleListSelector, () => {
    console.log('People list found (first load)');
    hidePanels();
  });
  waitFor(nowPlayingSelector, () => {
    console.log('Now playing column found (first load)');
    hidePanels();
  });

  waitFor(searchBarSelector, () => {
    console.log('Search bar found, inserting toggle button');
    insertToggleButton();
  })


  const root = document.body || document.documentElement;
  if (root) {
    let isScheduled = false;

    const observer = new MutationObserver(() => {
      if (isScheduled) return;

      const onMainPage = !!document.querySelector('#online-tab');
      if (!onMainPage) return;

      isScheduled = true;
      requestAnimationFrame(() => {
        isScheduled = false;
        insertToggleButton();
        if (isHidden) {
          hidePanels();
        } else {
          showPanels();
        }
      });
    });

    observer.observe(root, { childList: true, subtree: true });
  }
});