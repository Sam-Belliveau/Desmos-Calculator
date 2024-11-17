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
const settings = require("electron-settings");

app.disableHardwareAcceleration();
if (!app.requestSingleInstanceLock()) {
  app.quit();
}

let showHideKey = "CommandOrControl+Shift+D";

function getSetting(key, defaultValue) {
  if (!settings.hasSync(key)) {
    settings.setSync(key, defaultValue);
    return defaultValue;
  }

  return settings.getSync(key);
}

function setSetting(key, value) {
  settings.setSync(key, value);
}

class MainApp {
  constructor() {
    this._mainWindow = null;
    this.tray = null;

    app.on("second-instance", () => this.focusWindow());

    app.on("will-quit", () => globalShortcut.unregisterAll());
    app.on("window-all-closed", (e) => e.preventDefault());

    app.on("close", () => (this._mainWindow = null));

    app.whenReady().then(() => {
      if (app.dock && app.dock.hide) {
        app.dock.hide();
      }

      this.mainWindow;
      this.createTray();
      this.registerShortcuts();
    });
  }

  get mainWindow() {
    // Check for situations where the window is destroyed but not null
    if (this._mainWindow) {
      if (this._mainWindow.isDestroyed()) {
        this._mainWindow = null;
      }
    }

    // If the window is null, create a new one
    if (!this._mainWindow) {
      let graphing = getSetting("useGraphingCalculator", false);

      this._mainWindow = new BrowserWindow({
        width: graphing ? 800 : 600,
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

      if (graphing) {
        this._mainWindow.loadFile("src/graphing-calculator.html");
      } else {
        this._mainWindow.loadFile("src/scientific-calculator.html");
      }

      this._mainWindow.setVisibleOnAllWorkspaces(true, {
        visibleOnFullScreen: true,
      });
      this._mainWindow.setAlwaysOnTop(true, "floating", 1);
      this._mainWindow.webContents.setFrameRate(20);

      this._mainWindow.on("blur", () => {
        if (getSetting("hideOnFocusLoss", false)) {
          this.hideWindow();
        }
      });
    }

    return this._mainWindow;
  }

  createTray() {
    this.tray = new Tray(
      nativeImage.createFromPath(
        path.join(__dirname, "desmos", "iconTemplate@4x.png")
      )
    );

    const contextMenu = Menu.buildFromTemplate([
      {
        label: "Show/Hide",
        accelerator: showHideKey,
        click: () => this.toggleWindow(),
      },
      {
        label: "Settings",
        submenu: [
          {
            label: "Use Graphing Calculator",
            type: "checkbox",
            checked: getSetting("useGraphingCalculator", false),
            click: (menuItem) => {
              setSetting("useGraphingCalculator", menuItem.checked);
              this.reloadWindow();
            },
          },
          {
            label: "Hide on Focus Loss",
            type: "checkbox",
            checked: getSetting("hideOnFocusLoss", false),
            click: (menuItem) =>
              setSetting("hideOnFocusLoss", menuItem.checked),
          },
          {
            label: "Start at Login",
            type: "checkbox",
            checked: app.getLoginItemSettings().openAtLogin,
            click: (menuItem) =>
              app.setLoginItemSettings({
                openAtLogin: menuItem.checked,
                path: app.getPath("exe"),
                args: [],
              }),
          }
        ]
      },
      {
        label: "Quit",
        click: () => app.quit(),
      },
    ]);

    this.tray.setContextMenu(contextMenu);
  }

  registerShortcuts() {
    globalShortcut.register(showHideKey, () => this.toggleWindow());
    globalShortcut.register("Escape", () => this.hideWindow());
  }

  toggleWindow() {
    if (this.mainWindow.isVisible()) {
      this.hideWindow();
    } else {
      this.showWindow();
    }
  }

  hideWindow() {
    this.mainWindow.hide();
  }

  showWindow() {
    const trayBounds = this.tray.getBounds();
    const windowBounds = this.mainWindow.getBounds();

    const x = Math.round(
      trayBounds.x + trayBounds.width / 2 - windowBounds.width / 2
    );
    const y = trayBounds.y + trayBounds.height + 4;

    this.mainWindow.setPosition(x, y, false);
    this.mainWindow.show();
    this.mainWindow.focus();
  }

  focusWindow() {
    if (this.mainWindow.isMinimized()) this.mainWindow.restore();
    if (!this.mainWindow.isVisible()) this.mainWindow.show();
    this.mainWindow.focus();
  }

  reloadWindow() {
    this.hideWindow();
    this.mainWindow.destroy();
    this._mainWindow = null;
    this.mainWindow;
  }
}

new MainApp();
