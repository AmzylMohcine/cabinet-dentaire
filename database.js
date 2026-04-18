const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

class Database {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = null;
    this.SQL = null;
  }

  async open() {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    this.SQL = await initSqlJs();

    if (fs.existsSync(this.dbPath)) {
      const buf = fs.readFileSync(this.dbPath);
      this.db = new this.SQL.Database(buf);
    } else {
      this.db = new this.SQL.Database();
    }
  }

  _save() {
    try {
      const data = this.db.export();
      fs.writeFileSync(this.dbPath, Buffer.from(data));
    } catch(e) { console.error('DB save error:', e); }
  }

  // Reload DB from disk (for multi-PC sync)
  reload() {
    try {
      if (fs.existsSync(this.dbPath) && this.SQL) {
        const buf = fs.readFileSync(this.dbPath);
        this.db.close();
        this.db = new this.SQL.Database(buf);
      }
    } catch(e) { /* silent */ }
  }

  _run(sql, params) {
    this.db.run(sql, params);
    this._save();
  }

  _all(sql, params) {
    const stmt = this.db.prepare(sql);
    if (params) stmt.bind(params);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows;
  }

  _getLastId() {
    const r = this._all('SELECT last_insert_rowid() as id');
    return r[0] ? Number(r[0].id) : 0;
  }

  initialize() {
    this.db.run(`CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT, nom TEXT NOT NULL, prenom TEXT NOT NULL,
      tel TEXT DEFAULT '', email TEXT DEFAULT '', dateNaissance TEXT DEFAULT '',
      genre TEXT DEFAULT 'M', adresse TEXT DEFAULT '', assurance TEXT DEFAULT '',
      allergies TEXT DEFAULT '[]', antecedents TEXT DEFAULT '[]', notes TEXT DEFAULT '',
      treated INTEGER DEFAULT 0, createdAt TEXT DEFAULT ''
    )`);
    this.db.run(`CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT, patientId INTEGER NOT NULL,
      date TEXT NOT NULL, heure TEXT NOT NULL, duree INTEGER DEFAULT 30,
      type TEXT DEFAULT 'Consultation', statut TEXT DEFAULT 'en attente',
      inSalle INTEGER DEFAULT 0, notes TEXT DEFAULT ''
    )`);
    this.db.run(`CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT, patientId INTEGER NOT NULL,
      date TEXT NOT NULL, montant REAL NOT NULL, paye REAL DEFAULT 0,
      statut TEXT DEFAULT 'impayé', actes TEXT DEFAULT '[]', sent INTEGER DEFAULT 0
    )`);
    this.db.run(`CREATE TABLE IF NOT EXISTS prescriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT, patientId INTEGER NOT NULL,
      date TEXT NOT NULL, meds TEXT DEFAULT '[]', notes TEXT DEFAULT ''
    )`);
    this.db.run(`CREATE TABLE IF NOT EXISTS devis (
      id INTEGER PRIMARY KEY AUTOINCREMENT, patientId INTEGER NOT NULL,
      date TEXT NOT NULL, lines TEXT DEFAULT '[]', total REAL DEFAULT 0, notes TEXT DEFAULT ''
    )`);
    this.db.run(`CREATE TABLE IF NOT EXISTS dental_chart (
      id INTEGER PRIMARY KEY AUTOINCREMENT, patientId INTEGER NOT NULL,
      toothNum INTEGER NOT NULL, condition TEXT DEFAULT 'sain',
      UNIQUE(patientId, toothNum)
    )`);
    this.db.run(`CREATE TABLE IF NOT EXISTS treatments (
      id INTEGER PRIMARY KEY AUTOINCREMENT, patientId INTEGER NOT NULL,
      dent TEXT DEFAULT '', acte TEXT NOT NULL, statut TEXT DEFAULT 'planifié',
      cout REAL DEFAULT 0, paye REAL DEFAULT 0, date TEXT NOT NULL
    )`);
    this.db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT, role TEXT NOT NULL UNIQUE,
      password TEXT DEFAULT '', label TEXT DEFAULT '', active INTEGER DEFAULT 1
    )`);
    const existingUsers = this._all('SELECT * FROM users');
    if (existingUsers.length === 0) {
      this._run("INSERT INTO users (role, password, label, active) VALUES ('doctor', 'doc2026', 'Docteur', 1)");
      this._run("INSERT INTO users (role, password, label, active) VALUES ('assistant', '', 'Assistante', 1)");
    }
    this._save();
  }

  // ===== PATIENTS =====
  getPatients() {
    this.reload();
    return this._all('SELECT * FROM patients ORDER BY nom, prenom').map(r => ({
      ...r, allergies: JSON.parse(r.allergies||'[]'), antecedents: JSON.parse(r.antecedents||'[]'), treated: !!r.treated
    }));
  }
  addPatient(data) {
    this._run('INSERT INTO patients (nom,prenom,tel,email,dateNaissance,genre,adresse,assurance,allergies,antecedents,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [data.nom||'',data.prenom||'',data.tel||'',data.email||'',data.dateNaissance||'',data.genre||'M',data.adresse||'',data.assurance||'',JSON.stringify(data.allergies||[]),JSON.stringify(data.antecedents||[]),data.notes||'']);
    return { id: this._getLastId(), ...data };
  }
  updatePatient(id, data) {
    this._run('UPDATE patients SET nom=?,prenom=?,tel=?,email=?,dateNaissance=?,genre=?,adresse=?,assurance=?,allergies=?,antecedents=?,notes=?,treated=? WHERE id=?',
      [data.nom||'',data.prenom||'',data.tel||'',data.email||'',data.dateNaissance||'',data.genre||'M',data.adresse||'',data.assurance||'',JSON.stringify(data.allergies||[]),JSON.stringify(data.antecedents||[]),data.notes||'',data.treated?1:0,id]);
    return { id, ...data };
  }
  deletePatient(id) { this._run('DELETE FROM patients WHERE id=?', [id]); }

  // ===== APPOINTMENTS =====
  getAppointments() {
    this.reload();
    return this._all('SELECT * FROM appointments ORDER BY date, heure').map(r => ({ ...r, inSalle: !!r.inSalle }));
  }
  addAppointment(data) {
    this._run('INSERT INTO appointments (patientId,date,heure,duree,type,statut,inSalle,notes) VALUES (?,?,?,?,?,?,?,?)',
      [data.patientId,data.date||'',data.heure||'09:00',data.duree||30,data.type||'Consultation',data.statut||'en attente',data.inSalle?1:0,data.notes||'']);
    return { id: this._getLastId(), ...data };
  }
  updateAppointment(id, data) {
    this._run('UPDATE appointments SET patientId=?,date=?,heure=?,duree=?,type=?,statut=?,inSalle=?,notes=? WHERE id=?',
      [data.patientId,data.date||'',data.heure||'',data.duree||30,data.type||'',data.statut||'',data.inSalle?1:0,data.notes||'',id]);
    return { id, ...data };
  }
  deleteAppointment(id) { this._run('DELETE FROM appointments WHERE id=?', [id]); }

  // ===== INVOICES =====
  getInvoices() {
    this.reload();
    return this._all('SELECT * FROM invoices ORDER BY date DESC').map(r => ({ ...r, actes: JSON.parse(r.actes||'[]'), sent: !!r.sent }));
  }
  addInvoice(data) {
    this._run('INSERT INTO invoices (patientId,date,montant,paye,statut,actes,sent) VALUES (?,?,?,?,?,?,?)',
      [data.patientId,data.date||'',data.montant||0,data.paye||0,data.statut||'impayé',JSON.stringify(data.actes||[]),data.sent?1:0]);
    return { id: this._getLastId(), ...data };
  }
  updateInvoice(id, data) {
    this._run('UPDATE invoices SET paye=?,statut=?,sent=? WHERE id=?', [data.paye,data.statut,data.sent?1:0,id]);
    return { id, ...data };
  }

  // ===== PRESCRIPTIONS =====
  getPrescriptions() {
    this.reload();
    return this._all('SELECT * FROM prescriptions ORDER BY date DESC').map(r => ({ ...r, meds: JSON.parse(r.meds||'[]') }));
  }
  addPrescription(data) {
    this._run('INSERT INTO prescriptions (patientId,date,meds,notes) VALUES (?,?,?,?)',
      [data.patientId,data.date||'',JSON.stringify(data.meds||[]),data.notes||'']);
    return { id: this._getLastId(), ...data };
  }

  // ===== DEVIS =====
  getDevis() {
    this.reload();
    return this._all('SELECT * FROM devis ORDER BY date DESC').map(r => ({ ...r, lines: JSON.parse(r.lines||'[]') }));
  }
  addDevis(data) {
    this._run('INSERT INTO devis (patientId,date,lines,total,notes) VALUES (?,?,?,?,?)',
      [data.patientId,data.date||'',JSON.stringify(data.lines||[]),data.total||0,data.notes||'']);
    return { id: this._getLastId(), ...data };
  }

  // ===== DENTAL CHART =====
  getChart(patientId) {
    const rows = this._all('SELECT toothNum, condition FROM dental_chart WHERE patientId=?', [patientId]);
    const chart = {};
    rows.forEach(r => { chart[r.toothNum] = r.condition; });
    return chart;
  }
  updateChart(patientId, toothNum, condition) {
    this._run('DELETE FROM dental_chart WHERE patientId=? AND toothNum=?', [patientId, toothNum]);
    if (condition !== 'sain') {
      this._run('INSERT INTO dental_chart (patientId,toothNum,condition) VALUES (?,?,?)', [patientId, toothNum, condition]);
    }
  }

  // ===== TREATMENTS =====
  getTreatments() { this.reload(); return this._all('SELECT * FROM treatments ORDER BY date DESC'); }
  addTreatment(data) {
    this._run('INSERT INTO treatments (patientId,dent,acte,statut,cout,paye,date) VALUES (?,?,?,?,?,?,?)',
      [data.patientId,data.dent||'',data.acte||'',data.statut||'planifié',data.cout||0,data.paye||0,data.date||'']);
    return { id: this._getLastId(), ...data };
  }

  // ===== USERS =====
  getUsers() { this.reload(); return this._all('SELECT * FROM users').map(u => ({ ...u, active: !!u.active })); }
  updateUserPassword(role, password) { this._run('UPDATE users SET password=? WHERE role=?', [password, role]); }
  updateUserActive(role, active) { this._run('UPDATE users SET active=? WHERE role=?', [active?1:0, role]); }

  close() {
    if (this.db) { this._save(); this.db.close(); }
  }
}

module.exports = Database;
