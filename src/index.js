// main.js

const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  globalShortcut,
  nativeImage,
} = require("electron");
const path = require("path");

let showHideKey;

let mainWindow;
let tray;

// Attempt to acquire the single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // If another instance is running, quit this one
  app.quit();
} else {
  app.disableHardwareAcceleration();

  // This is the primary instance
  app.on("second-instance", (event, argv, workingDirectory) => {
    // Someone tried to run a second instance, focus the window if necessary
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      if (!mainWindow.isVisible()) mainWindow.show();
      mainWindow.focus();
    }
  });

  function createWindow() {
    // Create the browser window but don't show it immediately
    mainWindow = new BrowserWindow({
      width: 600,
      height: 500,
      show: false,
      frame: false,
      skipTaskbar: true,
      resizable: false,
      alwaysOnTop: true,
      fullscreenable: false,
      webPreferences: {
        backgroundThrottling: true,
      },
    });

    showHideKey = "Command+Shift+D";

    mainWindow.loadFile("src/index.html");
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    mainWindow.setAlwaysOnTop(true, "floating", 1);
    mainWindow.webContents.setFrameRate(30);

    mainWindow.on("blur", () => {
      hideWindow();
    });
  }

  function toggleWindow() {
    if (mainWindow.isVisible()) {
      hideWindow();
    } else {
      showWindow();
    }
  }

  function hideWindow() {
    mainWindow.hide();
  }

  function showWindow() {
    // Position the window near the tray icon
    const trayBounds = tray.getBounds();
    const windowBounds = mainWindow.getBounds();

    // Calculate the position (for simplicity, we'll center it horizontally)
    const x = Math.round(
      trayBounds.x + trayBounds.width / 2 - windowBounds.width / 2
    );
    const y = trayBounds.y + trayBounds.height + 4;

    mainWindow.setPosition(x, y, false);
    mainWindow.show();
    mainWindow.focus();
  }

  function createTray() {
    icon = nativeImage.createFromPath(
      path.join(__dirname, "desmos", "iconTemplate@4x.png")
    );
    tray = new Tray(icon);

    const contextMenu = Menu.buildFromTemplate([
      {
        label: "Show/Hide",
        accelerator: showHideKey,
        click: () => {
          toggleWindow();
        },
      },
      {
        label: "Start at Login",
        type: "checkbox",
        checked: app.getLoginItemSettings().openAtLogin,
        click: (menuItem) => {
          app.setLoginItemSettings({
            openAtLogin: menuItem.checked,
            path: app.getPath("exe"),
            args: [],
          });
        },
      },
      {
        label: "Quit",
        click: () => {
          app.quit();
        },
      },
    ]);

    tray.setContextMenu(contextMenu);
  }

  app.whenReady().then(() => {
    if (app.dock && app.dock.hide) {
      app.dock.hide();
    }

    createWindow();
    createTray();

    globalShortcut.register(showHideKey, () => {
      toggleWindow();
    });

    globalShortcut.register("Escape", () => {
      hideWindow();
    });
  });

  app.on("will-quit", () => {
    globalShortcut.unregisterAll();
  });

  app.on("window-all-closed", (e) => {
    e.preventDefault();
  });
}
