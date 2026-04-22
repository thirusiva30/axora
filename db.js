import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'axora.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    fleet_name TEXT,
    phone TEXT,
    firebase_uid TEXT UNIQUE
  );
`);

// Robust Schema Migration: Ensure firebase_uid exists
try {
  db.prepare('ALTER TABLE users ADD COLUMN firebase_uid TEXT UNIQUE').run();
  console.log('[DB] Migrated: Added firebase_uid to users table');
} catch (err) {
  // Column likely already exists
  if (!err.message.includes('duplicate column name')) {
    console.error('[DB] Migration error:', err.message);
  }
}

db.exec(`
  CREATE TABLE IF NOT EXISTS trucks (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    nickname TEXT,
    driver TEXT,
    status TEXT DEFAULT 'active',
    lat REAL,
    lng REAL,
    speed INTEGER DEFAULT 0,
    fuel INTEGER DEFAULT 100,
    km_today INTEGER DEFAULT 0,
    next_service TEXT,
    last_location TEXT,
    last_service TEXT
  );

  CREATE TABLE IF NOT EXISTS compliance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    truck_id TEXT NOT NULL,
    type TEXT NOT NULL,
    expiry TEXT NOT NULL,
    status TEXT DEFAULT 'ok'
  );

  CREATE TABLE IF NOT EXISTS fuel_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    truck_id TEXT NOT NULL,
    day TEXT NOT NULL,
    expected_litres REAL NOT NULL,
    actual_litres REAL NOT NULL,
    logged_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS drivers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    truck_id TEXT NOT NULL,
    score INTEGER DEFAULT 100,
    hard_brakes INTEGER DEFAULT 0,
    overspeeding INTEGER DEFAULT 0,
    fuel_waste INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    truck_id TEXT,
    message TEXT NOT NULL,
    resolved INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS mechanic_bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    truck_id TEXT NOT NULL,
    mechanic_name TEXT NOT NULL,
    mechanic_shop TEXT NOT NULL,
    mechanic_phone TEXT NOT NULL,
    service_type TEXT NOT NULL,
    estimated_cost INTEGER NOT NULL,
    booking_date TEXT NOT NULL,
    status TEXT DEFAULT 'confirmed',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS mechanics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    shop TEXT NOT NULL,
    phone TEXT NOT NULL,
    rating REAL DEFAULT 4.5,
    distance_km REAL,
    speciality TEXT,
    available INTEGER DEFAULT 1,
    lat REAL,
    lng REAL
  );
`);

// Migration helper
const addColumn = (table, column, type) => {
  try {
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`).run();
    console.log(`[DB] Migrated: Added ${column} to ${table} table`);
  } catch (err) {
    if (!err.message.includes('duplicate column name')) {
      console.error(`[DB] Migration error on ${table}:`, err.message);
    }
  }
};

// Execute migrations
addColumn('trucks', 'user_id', 'INTEGER NOT NULL DEFAULT 1');
addColumn('compliance', 'user_id', 'INTEGER NOT NULL DEFAULT 1');
addColumn('fuel_logs', 'user_id', 'INTEGER NOT NULL DEFAULT 1');
addColumn('drivers', 'user_id', 'INTEGER NOT NULL DEFAULT 1');
addColumn('alerts', 'user_id', 'INTEGER NOT NULL DEFAULT 1');
addColumn('mechanic_bookings', 'user_id', 'INTEGER NOT NULL DEFAULT 1');

export function seedIfEmpty() {
  const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  if (userCount > 0) return;

  const hashedPw = bcrypt.hashSync('fleet123', 10);
  db.prepare('INSERT INTO users (name, email, password, fleet_name, phone) VALUES (?,?,?,?,?)')
    .run('Alex Morrison', 'demo@axora.in', hashedPw, 'Morrison Global Freight', '+1 415 555 0192');

  const trucks = [
    ['US-CA-TRK-001', 1, 'Truck 1','James Whitfield','active',37.7749,-122.4194,58,82,210,'2025-05-15','San Francisco Bay Bridge','2025-01-10'],
    ['DE-BW-TRK-002', 1, 'Truck 2','Klaus Hoffmann','active',48.7758,9.1829,44,61,178,'2025-05-20','Stuttgart Autobahn A8','2025-02-01'],
    ['JP-TK-TRK-003', 1, 'Truck 3','Hiroshi Tanaka','alert',35.6762,139.6503,0,28,290,'2025-04-10','Tokyo Expressway C2','2024-11-15'],
    ['BR-SP-TRK-004', 1, 'Truck 4','Carlos Mendes','active',-23.5505,-46.6333,67,91,145,'2025-06-01','São Paulo Rodovia Anhangüera','2025-03-01'],
    ['AU-NSW-TRK-005', 1, 'Truck 5','Liam O\'Brien','active',-33.8688,151.2093,51,74,98,'2025-04-28','Sydney Harbour Tunnel','2025-02-20'],
    ['ZA-GP-TRK-006', 1, 'Truck 6','Thabo Nkosi','offline',-26.2041,28.0473,0,49,0,'2025-07-10','Johannesburg N1 Highway','2025-03-05'],
    ['AE-DXB-TRK-007', 1, 'Truck 7','Omar Al-Rashidi','active',25.2048,55.2708,72,88,167,'2025-06-15','Dubai Sheikh Zayed Road','2025-03-10'],
    ['GB-LDN-TRK-008', 1, 'Truck 8','Oliver Hartley','active',51.5074,-0.1278,39,66,113,'2025-05-25','London M25 Motorway','2025-02-15'],
    ['IN-MH-TRK-009', 1, 'Truck 9','Rahul Sharma','alert',19.0760,72.8777,0,35,180,'2025-04-20','Mumbai Eastern Express Highway','2024-12-01'],
    ['SG-TRK-010', 1, 'Truck 10','Wei Liang Chen','active',1.3521,103.8198,55,79,134,'2025-06-05','Singapore PIE Expressway','2025-03-08'],
  ];
  const ins = db.prepare('INSERT INTO trucks VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)');
  trucks.forEach(t => ins.run(...t));

  const compliance = [
    [1, 'US-CA-TRK-001','Insurance','2025-04-22','critical'],
    [1, 'US-CA-TRK-001','Registration','2025-06-30','ok'],
    [1, 'US-CA-TRK-001','DOT Inspection','2025-07-15','ok'],
    [1, 'DE-BW-TRK-002','Insurance','2025-05-10','warning'],
    [1, 'DE-BW-TRK-002','TÜV Certificate','2025-04-30','warning'],
    [1, 'DE-BW-TRK-002','Road Tax','2025-09-15','ok'],
    [1, 'JP-TK-TRK-003','Insurance','2025-03-31','expired'],
    [1, 'JP-TK-TRK-003','Shaken Certificate','2025-04-15','critical'],
    [1, 'JP-TK-TRK-003','Fitness Certificate','2025-05-20','warning'],
    [1, 'BR-SP-TRK-004','ANTT License','2025-08-20','ok'],
    [1, 'BR-SP-TRK-004','Insurance','2025-10-01','ok'],
    [1, 'AU-NSW-TRK-005','CTP Insurance','2025-04-28','warning'],
    [1, 'AU-NSW-TRK-005','Registration','2025-07-10','ok'],
    [1, 'ZA-GP-TRK-006','Insurance','2025-09-10','ok'],
    [1, 'ZA-GP-TRK-006','Roadworthy Certificate','2025-11-30','ok'],
    [1, 'AE-DXB-TRK-007','Mulkiya Registration','2025-12-31','ok'],
    [1, 'AE-DXB-TRK-007','Insurance','2025-10-20','ok'],
    [1, 'GB-LDN-TRK-008','MOT Certificate','2025-05-05','warning'],
    [1, 'GB-LDN-TRK-008','Road Tax','2025-08-01','ok'],
    [1, 'IN-MH-TRK-009','Insurance','2025-03-20','expired'],
    [1, 'IN-MH-TRK-009','Fitness Certificate','2025-04-10','critical'],
    [1, 'SG-TRK-010','LTA Inspection','2025-06-20','ok'],
    [1, 'SG-TRK-010','Insurance','2025-09-15','ok'],
  ];
  const insC = db.prepare('INSERT INTO compliance (user_id, truck_id,type,expiry,status) VALUES (?,?,?,?,?)');
  compliance.forEach(c => insC.run(...c));

  const fuelData = [
    [1, 'JP-TK-TRK-003','Mon',52,74], [1, 'JP-TK-TRK-003','Tue',49,52], [1, 'JP-TK-TRK-003','Wed',54,78],
    [1, 'JP-TK-TRK-003','Thu',51,55], [1, 'JP-TK-TRK-003','Fri',53,57], [1, 'JP-TK-TRK-003','Sat',47,48], [1, 'JP-TK-TRK-003','Sun',32,33],
    [1, 'US-CA-TRK-001','Mon',58,60], [1, 'US-CA-TRK-001','Tue',55,57], [1, 'US-CA-TRK-001','Wed',52,53],
    [1, 'US-CA-TRK-001','Thu',60,62], [1, 'US-CA-TRK-001','Fri',57,58], [1, 'US-CA-TRK-001','Sat',44,45], [1, 'US-CA-TRK-001','Sun',30,31],
    [1, 'DE-BW-TRK-002','Mon',48,49], [1, 'DE-BW-TRK-002','Tue',46,47], [1, 'DE-BW-TRK-002','Wed',50,51],
    [1, 'DE-BW-TRK-002','Thu',47,48], [1, 'DE-BW-TRK-002','Fri',49,50], [1, 'DE-BW-TRK-002','Sat',38,39], [1, 'DE-BW-TRK-002','Sun',27,28],
    [1, 'IN-MH-TRK-009','Mon',50,71], [1, 'IN-MH-TRK-009','Tue',48,52], [1, 'IN-MH-TRK-009','Wed',52,75],
    [1, 'IN-MH-TRK-009','Thu',49,53], [1, 'IN-MH-TRK-009','Fri',51,54], [1, 'IN-MH-TRK-009','Sat',42,43], [1, 'IN-MH-TRK-009','Sun',29,30],
    [1, 'AE-DXB-TRK-007','Mon',62,64], [1, 'AE-DXB-TRK-007','Tue',60,62], [1, 'AE-DXB-TRK-007','Wed',65,67],
    [1, 'AE-DXB-TRK-007','Thu',61,63], [1, 'AE-DXB-TRK-007','Fri',63,65], [1, 'AE-DXB-TRK-007','Sat',50,51], [1, 'AE-DXB-TRK-007','Sun',35,36],
  ];
  const insF = db.prepare('INSERT INTO fuel_logs (user_id, truck_id,day,expected_litres,actual_litres) VALUES (?,?,?,?,?)');
  fuelData.forEach(f => insF.run(...f));

  const drivers = [
    [1, 'James Whitfield','US-CA-TRK-001',72,5,3,420],
    [1, 'Klaus Hoffmann','DE-BW-TRK-002',85,2,1,180],
    [1, 'Hiroshi Tanaka','JP-TK-TRK-003',28,19,12,2900],
    [1, 'Carlos Mendes','BR-SP-TRK-004',91,0,0,60],
    [1, 'Liam O\'Brien','AU-NSW-TRK-005',67,6,4,550],
    [1, 'Thabo Nkosi','ZA-GP-TRK-006',80,3,1,210],
    [1, 'Omar Al-Rashidi','AE-DXB-TRK-007',88,1,0,90],
    [1, 'Oliver Hartley','GB-LDN-TRK-008',74,4,2,310],
    [1, 'Rahul Sharma','IN-MH-TRK-009',31,17,11,2600],
    [1, 'Wei Liang Chen','SG-TRK-010',93,0,0,40],
  ];
  const insD = db.prepare('INSERT INTO drivers (user_id, name,truck_id,score,hard_brakes,overspeeding,fuel_waste) VALUES (?,?,?,?,?,?,?)');
  drivers.forEach(d => insD.run(...d));

  const alerts = [
    [1, 'critical','JP-TK-TRK-003','Insurance EXPIRED Mar 31. Truck 3 (Tokyo) cannot legally operate.'],
    [1, 'critical','US-CA-TRK-001','Insurance expires Apr 22 — TOMORROW. Renew immediately. (San Francisco)'],
    [1, 'critical','IN-MH-TRK-009','Insurance EXPIRED Mar 20. Truck 9 (Mumbai) grounded.'],
    [1, 'warning','JP-TK-TRK-003','Fuel anomaly: Reported 78L, expected 54L. Variance 44%. Investigate Hiroshi Tanaka.'],
    [1, 'warning','IN-MH-TRK-009','Fuel anomaly: Reported 75L, expected 52L. Variance 44%. Investigate Rahul Sharma.'],
    [1, 'warning','JP-TK-TRK-003','Breakdown risk HIGH (83%). Service overdue 160+ days. Tokyo truck.'],
    [1, 'warning','AU-NSW-TRK-005','CTP Insurance expires Apr 28 — 7 days remaining. Sydney truck.'],
    [1, 'warning','DE-BW-TRK-002','TÜV Certificate expiring Apr 30. Stuttgart truck.'],
    [1, 'warning','GB-LDN-TRK-008','MOT Certificate expiring May 5. London truck.'],
    [1, 'info','BR-SP-TRK-004','Truck 4 completed São Paulo–Campinas route. 145 km logged.'],
    [1, 'info','AE-DXB-TRK-007','Truck 7 completed Dubai–Abu Dhabi corridor. 167 km logged.'],
  ];
  const insA = db.prepare('INSERT INTO alerts (user_id, type,truck_id,message) VALUES (?,?,?,?)');
  alerts.forEach(a => insA.run(...a));

  const mechanics = [
    ['Marcus Webb','Webb Truck Services','+1 415 555 0134',4.8,2.1,'Engine & Transmission',1,37.7700,-122.4100],
    ['Heinrich Braun','Braun Fahrzeugservice','+49 711 555 0198',4.7,3.2,'Full Service & TÜV',1,48.7700,9.1900],
    ['Kenji Yamamoto','Yamamoto Auto Works','+81 3 5555 0167',4.9,1.5,'Shaken & Full Service',1,35.6700,139.6600],
    ['Paulo Ferreira','Ferreira Transportes','+55 11 5555 0143',4.4,4.8,'Engine & Bodywork',1,-23.5600,-46.6400],
    ['Shane Connolly','Connolly Heavy Vehicles','+61 2 5555 0112',4.6,2.9,'Tyres & Brakes',1,-33.8700,151.2200],
    ['Ahmed Al-Mansoori','Al-Mansoori Garage','+971 4 555 0189',4.8,1.8,'AC & Electrical',1,25.2100,55.2800],
    ['Robert Ashford','Ashford Fleet Services','+44 20 5555 0176',4.5,3.6,'MOT & Full Service',1,51.5100,-0.1200],
  ];
  const insM = db.prepare('INSERT INTO mechanics (name,shop,phone,rating,distance_km,speciality,available,lat,lng) VALUES (?,?,?,?,?,?,?,?,?)');
  mechanics.forEach(m => insM.run(...m));
}

seedIfEmpty();
export default db;
