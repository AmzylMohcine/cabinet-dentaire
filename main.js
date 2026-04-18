const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const Database = require('./database');

let mainWindow;
let db;

// Default DB path = local. Can be changed to network share.
const getDbPath = () => {
  const Store = require('electron-store');
  const store = new Store();
  return store.get('dbPath', path.join(app.getPath('userData'), 'dentacare.db'));
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: 'DentaCare - Dr. EL KTAM MAROINE',
    icon: path.join(__dirname, 'public', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // In production, load built React app; in dev, load Vite dev server
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');

  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist-react', 'index.html'));
  }

  mainWindow.setMenuBarVisibility(false);

  // Allow window.open for printing
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url === '' || url === 'about:blank') {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 800,
          height: 1000,
          autoHideMenuBar: true,
          webPreferences: {
            contextIsolation: true,
            nodeIntegration: false
          }
        }
      };
    }
    return { action: 'deny' };
  });
}

app.whenReady().then(async () => {
  // Initialize database (async for sql.js)
  const dbPath = getDbPath();
  db = new Database(dbPath);
  await db.open();
  db.initialize();

  createWindow();

  // ===== IPC HANDLERS =====

  // -- Settings --
  ipcMain.handle('get-db-path', () => getDbPath());

  ipcMain.handle('set-db-path', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Choisir le dossier de la base de données (réseau ou local)',
      properties: ['openDirectory']
    });
    if (!result.canceled && result.filePaths[0]) {
      const newPath = path.join(result.filePaths[0], 'dentacare.db');
      const Store = require('electron-store');
      const store = new Store();
      store.set('dbPath', newPath);
      // Restart with new DB
      db.close();
      db = new Database(newPath);
      await db.open();
      db.initialize();
      return newPath;
    }
    return null;
  });

  // -- Patients --
  ipcMain.handle('patients:getAll', () => db.getPatients());
  ipcMain.handle('patients:add', (_, data) => db.addPatient(data));
  ipcMain.handle('patients:update', (_, id, data) => db.updatePatient(id, data));
  ipcMain.handle('patients:delete', (_, id) => db.deletePatient(id));

  // -- Appointments --
  ipcMain.handle('appts:getAll', () => db.getAppointments());
  ipcMain.handle('appts:add', (_, data) => db.addAppointment(data));
  ipcMain.handle('appts:update', (_, id, data) => db.updateAppointment(id, data));
  ipcMain.handle('appts:delete', (_, id) => db.deleteAppointment(id));

  // -- Invoices --
  ipcMain.handle('invoices:getAll', () => db.getInvoices());
  ipcMain.handle('invoices:add', (_, data) => db.addInvoice(data));
  ipcMain.handle('invoices:update', (_, id, data) => db.updateInvoice(id, data));

  // -- Prescriptions --
  ipcMain.handle('rx:getAll', () => db.getPrescriptions());
  ipcMain.handle('rx:add', (_, data) => db.addPrescription(data));

  // -- Devis --
  ipcMain.handle('devis:getAll', () => db.getDevis());
  ipcMain.handle('devis:add', (_, data) => db.addDevis(data));

  // -- Dental Chart --
  ipcMain.handle('chart:get', (_, patientId) => db.getChart(patientId));
  ipcMain.handle('chart:update', (_, patientId, toothNum, condition) => db.updateChart(patientId, toothNum, condition));

  // -- Treatments --
  ipcMain.handle('treats:getAll', () => db.getTreatments());
  ipcMain.handle('treats:add', (_, data) => db.addTreatment(data));

  // -- Users --
  ipcMain.handle('users:getAll', () => db.getUsers());
  ipcMain.handle('users:updatePwd', (_, role, password) => db.updateUserPassword(role, password));
  ipcMain.handle('users:updateActive', (_, role, active) => db.updateUserActive(role, active));

  // -- Print --
  ipcMain.handle('print', () => {
    mainWindow.webContents.print({ silent: false, printBackground: true });
  });
});

app.on('window-all-closed', () => {
  if (db) db.close();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  // Mac: re-create window when dock icon clicked and no windows open
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Mac: don't quit when all windows closed (standard Mac behavior)
app.on('before-quit', () => {
  if (db) db.close();
});
