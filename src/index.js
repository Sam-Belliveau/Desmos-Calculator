// main.js

const { app, BrowserWindow, Tray, Menu, globalShortcut } = require("electron");
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
  // This is the primary instance
  app.on('second-instance', (event, argv, workingDirectory) => {
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
      transparent: true,
      alwaysOnTop: true,
      fullscreenable: false,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    // Set the global shortcut key
    showHideKey = "Command+Shift+D";

    // Load your index.html file
    mainWindow.loadFile("src/index.html");

    // Make the window appear over full-screen apps
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

    // Optional: Adjust window level to floating
    mainWindow.setAlwaysOnTop(true, "floating", 1);

    // Hide the window when it loses focus
    mainWindow.on("blur", () => {
      if (!mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.hide();
      }
    });
  }

  function createTray() {
    // Create a tray icon
    tray = new Tray(path.join(__dirname, "desmos", "iconTemplate@4x.png")); // Use a transparent PNG for macOS

    // Optional: Add a context menu to the tray icon
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

    // Show the window when the tray icon is clicked
    tray.on("click", () => {
      toggleWindow();
    });
  }

  function toggleWindow() {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      showWindow();
    }
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

  app.whenReady().then(() => {
    // Hide the dock icon
    if (app.dock && app.dock.hide) {
      app.dock.hide();
    }

    createWindow();
    createTray();

    // Register the global shortcut
    const toggle = globalShortcut.register(showHideKey, () => {
      toggleWindow();
    });

    const escape = globalShortcut.register("Escape", () => {
      mainWindow.hide();
    });

    if (toggle) {
      console.log("Toggle Register Succeeded!");
    } else {
      console.log("Toggle Register Failed!");
    }

    if (escape) {
      console.log("Escape Register Succeeded!");
    } else {
      console.log("Escape Register Failed!");
    }
  });

  // Clean up on exit
  app.on("will-quit", () => {
    globalShortcut.unregisterAll();
  });

  app.on("window-all-closed", (e) => {
    // Prevent the app from quitting when all windows are closed
    e.preventDefault();
  });
}
