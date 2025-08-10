import { app, BrowserWindow, Notification } from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";
import log from "electron-log";
import { autoUpdater } from "electron-updater";

let mainWindow: BrowserWindow;
const mainLogger = log.scope("main");
autoUpdater.logger = mainLogger;
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
    app.quit();
}

let currentNotification: Notification | null = null;
autoUpdater.on("checking-for-update", () => {
    console.log("Checking for updates..., currently on ", app.getVersion());

    if (process.env.NODE_ENV === "development") {
        if (currentNotification) currentNotification.close();

        currentNotification = new Notification({
            title: "Checking for update...",
        });
        currentNotification.show();
    }
});

autoUpdater.on("update-available", (info) => {
    console.log(
        "Update available, currently on:",
        app.getVersion(),
        "info:",
        info,
    );

    if (currentNotification) currentNotification.close();
    currentNotification = new Notification({
        title: "Update Available!",
        body: "Downloading update in background...",
    });
    currentNotification.show();
});

autoUpdater.on("update-not-available", (info) => {
    console.log(
        "Update not available, currently on:",
        app.getVersion(),
        "info:",
        info,
    );

    if (currentNotification) currentNotification.close();
    currentNotification = new Notification({
        title: "No updates unavaiable :(",
    });
    currentNotification.show();
});

autoUpdater.on("error", (err) => {
    console.error(
        "Error in auto-updater, currently on",
        app.getVersion(),
        "err:",
        err,
    );

    if (currentNotification) currentNotification.close();
    currentNotification = new Notification({
        title: "Update Error",
        body: "Failed to check for updates",
    });
    currentNotification.show();
});

let lastUpdateTime = 0;
let processNotif: Notification | null = null;
autoUpdater.on("download-progress", (progressObj) => {
    if (currentNotification) currentNotification.close();

    const totalMB = (progressObj.total / 1024 / 1024).toFixed(1);
    const transferredMB = (progressObj.transferred / 1024 / 1024).toFixed(1);
    const speedKB = Math.round(progressObj.bytesPerSecond / 1024);
    const percent = Math.round(progressObj.percent);

    let log_message = `📥 Download Progress: ${percent}% | `;
    log_message += `${transferredMB}MB / ${totalMB}MB | `;
    log_message += `Speed: ${speedKB} KB/s | `;
    log_message += `Bytes: ${progressObj.transferred}/${progressObj.total}`;

    if (progressObj.total < 50 * 1024 * 1024) {
        log_message += " 🔄 [DELTA UPDATE]";
    } else {
        log_message += " 📦 [FULL UPDATE]";
    }

    console.log(log_message);

    const now = Date.now();
    if (now - lastUpdateTime < 2000) return;
    lastUpdateTime = now;

    if (processNotif) {
        processNotif.close();
    }
    processNotif = new Notification({
        title: "Downloading Update...",
        body: `${percent}% • ${transferredMB}/${totalMB}MB • ${speedKB} KB/s`,
        silent: true,
        timeoutType: "never",
    });
    processNotif.show();
});

autoUpdater.on("update-downloaded", (info) => {
    console.log("Update downloaded, currently on:", app.getVersion(), info);

    if (currentNotification) currentNotification.close();
    if (processNotif) {
        processNotif.close();
        processNotif = null;
    }

    if (Notification.isSupported()) {
        currentNotification = new Notification({
            title: "Update Ready",
            body: "Update will be installed when you close the app",
            silent: false,
        });
        currentNotification.show();
    }
});

const createWindow = () => {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
        },
    });

    // and load the index.html of the app.
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
        mainWindow.loadFile(
            path.join(
                __dirname,
                `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`,
            ),
        );
    }

    mainWindow.maximize();
    // Open the DevTools.
    mainWindow.webContents.openDevTools();
    autoUpdater.checkForUpdates();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
    createWindow();

    // updater = new Updater();
    // updater.startChecker();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
    // if (process.platform !== "darwin") {
    app.quit();
    // }
});

app.on("activate", () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
