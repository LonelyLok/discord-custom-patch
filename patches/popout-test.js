window.addEventListener('DOMContentLoaded', () => {
  const buttonAttribute = 'data-custom-popout-test';
  const { ipcRenderer } = require('electron');

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

  const isChannelRoute = () => /^\/channels\/[^/]+\/[^/]+/.test(window.location.pathname);

  const openCurrentChannelPopout = () => {
    const match = window.location.pathname.match(/^\/channels\/([^/]+)\/([^/]+)/);
    if (!match) {
      console.warn('Current route is not a channel route:', window.location.pathname);
      return;
    }

    const [, guildId, channelId] = match;
    const route = `${window.location.pathname}${window.location.search}`;
    ipcRenderer.send('CUSTOM_OPEN_CHANNEL_WINDOW', {
      guildId,
      channelId,
      route
    });
    console.log('Requested channel window for route:', route);
  };

  const maybeBootstrapChannelRoute = () => {
    const params = new URLSearchParams(window.location.search);
    const targetRoute = params.get('customPopoutRoute');
    if (!targetRoute || window.location.pathname !== '/app') {
      return;
    }

    const decodedRoute = decodeURIComponent(targetRoute);
    if (!/^\/channels\/[^/]+\/[^/]+/.test(decodedRoute)) {
      console.warn('Invalid custom popout route:', decodedRoute);
      return;
    }

    const navigate = () => {
      if (window.location.pathname === decodedRoute) {
        return true;
      }

      history.replaceState(history.state, '', decodedRoute);
      window.dispatchEvent(new PopStateEvent('popstate'));
      window.dispatchEvent(new Event('hashchange'));
      return window.location.pathname === decodedRoute;
    };

    if (navigate()) {
      return;
    }

    let attempts = 0;
    const intervalId = window.setInterval(() => {
      attempts += 1;
      if (navigate() || attempts >= 20) {
        window.clearInterval(intervalId);
      }
    }, 500);
  };

  maybeBootstrapChannelRoute();

  const getToolbar = () => {
    return document.querySelector('.toolbar__9293f');
  };

  const insertChannelPopoutButton = () => {
    if (!isChannelRoute()) {
      return;
    }

    if (document.querySelector(`[${buttonAttribute}]`)) {
      return;
    }

    const toolbar = getToolbar();
    if (!toolbar) {
      return;
    }

    const btn = document.createElement('button');
    btn.setAttribute(buttonAttribute, 'true');
    btn.textContent = 'Popout';
    btn.title = 'Open the current channel in a separate window';
    btn.setAttribute('type', 'button');
    btn.setAttribute('aria-label', 'Open current channel in separate window');
    Object.assign(btn.style, {
      marginRight: '8px',
      padding: '4px 8px',
      fontSize: '12px',
      lineHeight: '16px',
      cursor: 'pointer',
      border: 'none',
      borderRadius: '4px',
      color: 'var(--interactive-active)',
      background: 'var(--background-modifier-accent)'
    });
    btn.onmouseenter = () => btn.style.background = 'var(--background-modifier-hover)';
    btn.onmouseleave = () => btn.style.background = 'var(--background-modifier-accent)';
    btn.onclick = openCurrentChannelPopout;

    const searchContainer = toolbar.querySelector('.search__49676');
    if (searchContainer) {
      toolbar.insertBefore(btn, searchContainer);
      return;
    }

    toolbar.appendChild(btn);
  };

  waitFor('.toolbar__9293f', insertChannelPopoutButton);

  const root = document.body || document.documentElement;
  if (root) {
    let isScheduled = false;

    const observer = new MutationObserver(() => {
      if (isScheduled) return;

      isScheduled = true;
      requestAnimationFrame(() => {
        isScheduled = false;
        insertChannelPopoutButton();
      });
    });

    observer.observe(root, { childList: true, subtree: true });
  }
});
