const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Settings
  getDbPath: () => ipcRenderer.invoke('get-db-path'),
  setDbPath: () => ipcRenderer.invoke('set-db-path'),

  // Patients
  getPatients: () => ipcRenderer.invoke('patients:getAll'),
  addPatient: (data) => ipcRenderer.invoke('patients:add', data),
  updatePatient: (id, data) => ipcRenderer.invoke('patients:update', id, data),
  deletePatient: (id) => ipcRenderer.invoke('patients:delete', id),

  // Appointments
  getAppointments: () => ipcRenderer.invoke('appts:getAll'),
  addAppointment: (data) => ipcRenderer.invoke('appts:add', data),
  updateAppointment: (id, data) => ipcRenderer.invoke('appts:update', id, data),
  deleteAppointment: (id) => ipcRenderer.invoke('appts:delete', id),

  // Invoices
  getInvoices: () => ipcRenderer.invoke('invoices:getAll'),
  addInvoice: (data) => ipcRenderer.invoke('invoices:add', data),
  updateInvoice: (id, data) => ipcRenderer.invoke('invoices:update', id, data),

  // Prescriptions
  getPrescriptions: () => ipcRenderer.invoke('rx:getAll'),
  addPrescription: (data) => ipcRenderer.invoke('rx:add', data),

  // Devis
  getDevis: () => ipcRenderer.invoke('devis:getAll'),
  addDevis: (data) => ipcRenderer.invoke('devis:add', data),

  // Dental Chart
  getChart: (patientId) => ipcRenderer.invoke('chart:get', patientId),
  updateChart: (patientId, toothNum, condition) => ipcRenderer.invoke('chart:update', patientId, toothNum, condition),

  // Treatments
  getTreatments: () => ipcRenderer.invoke('treats:getAll'),
  addTreatment: (data) => ipcRenderer.invoke('treats:add', data),

  // Users
  getUsers: () => ipcRenderer.invoke('users:getAll'),
  updateUserPwd: (role, password) => ipcRenderer.invoke('users:updatePwd', role, password),
  updateUserActive: (role, active) => ipcRenderer.invoke('users:updateActive', role, active),

  // Print
  print: () => ipcRenderer.invoke('print')
});
