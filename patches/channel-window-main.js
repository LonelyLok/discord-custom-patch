const { BrowserWindow, ipcMain } = require('electron');
const path = require('path');

if (!global.__customChannelWindowPatchApplied) {
  global.__customChannelWindowPatchApplied = true;
  global.__customChannelWindows = new Map();

  const getChannelWindowKey = ({ guildId, channelId, route }) => {
    if (guildId && channelId) {
      return `${guildId}:${channelId}`;
    }
    return route;
  };

  const buildChannelWindowUrl = route => {
    return `${WEBAPP_ENDPOINT}/app?customPopoutRoute=${encodeURIComponent(route)}&_=${Date.now()}`;
  };

  const createChannelWindow = route => {
    if (mainWindow == null || mainWindow.isDestroyed()) {
      console.warn('Cannot open channel window: mainWindow unavailable');
      return null;
    }

    const channelWindow = new BrowserWindow({
      title: 'Discord Channel',
      backgroundColor: getBackgroundColor(),
      width: 960,
      height: 720,
      minWidth: 480,
      minHeight: 320,
      frame: true,
      resizable: true,
      show: false,
      autoHideMenuBar: true,
      webPreferences: {
        enableBlinkFeatures: 'EnumerateDevices,AudioOutputDevices',
        nodeIntegration: false,
        sandbox: false,
        preload: path.join(__dirname, 'mainScreenPreload.js'),
        spellcheck: true,
        contextIsolation: true,
        devTools: ENABLE_DEVTOOLS,
        session: mainWindow.webContents.session
      }
    });

    channelWindow.webContents.setWindowOpenHandler(({ url }) => {
      if ((0, _securityUtils.shouldOpenExternalUrl)(url)) {
        void (0, _securityUtils.saferShellOpenExternal)(url);
      }
      return { action: 'deny' };
    });

    channelWindow.once('ready-to-show', () => {
      channelWindow.show();
    });

    channelWindow.loadURL(buildChannelWindowUrl(route));
    return channelWindow;
  };

  ipcMain.on('CUSTOM_OPEN_CHANNEL_WINDOW', (_event, payload) => {
    if (!payload || typeof payload.route !== 'string') {
      return;
    }
    if (!/^\/channels\/[^/]+\/[^/]+/.test(payload.route)) {
      console.warn('Rejected invalid channel route:', payload.route);
      return;
    }

    const key = getChannelWindowKey(payload);
    const existingWindow = global.__customChannelWindows.get(key);
    if (existingWindow != null && !existingWindow.isDestroyed()) {
      existingWindow.focus();
      existingWindow.loadURL(buildChannelWindowUrl(payload.route));
      return;
    }

    const channelWindow = createChannelWindow(payload.route);
    if (channelWindow == null) {
      return;
    }

    global.__customChannelWindows.set(key, channelWindow);
    channelWindow.on('closed', () => {
      global.__customChannelWindows.delete(key);
    });
  });
}
