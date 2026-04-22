import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from './db.js';
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

// Load Firebase Config dynamically
function getAdmin() {
  if (admin.apps.length > 0) return admin;
  
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.projectId) {
        admin.initializeApp({ projectId: config.projectId });
        console.log('[FIREBASE] Admin SDK Successfully Initialized:', config.projectId);
        return admin;
      }
    } catch (err) {
      console.error('[FIREBASE] Config Parse Error:', err.message);
    }
  }
  
  // Minimal init for local or if config missing
  console.warn('[FIREBASE] Initializing with default project ID');
  admin.initializeApp({ projectId: 'axora-technical-default' });
  return admin;
}

const firebaseAdmin = getAdmin();
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'axora_secret';

async function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[AUTH] Missing or malformed Authorization header');
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token || token === 'null' || token === 'undefined') {
      console.error('[AUTH] Token value is invalid string:', token);
      return res.status(401).json({ error: 'Invalid token value' });
    }
    
    try {
      // Try verifying as Firebase Token first
      const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
      
      console.log(`[AUTH] Success: Verified ${decodedToken.email} for Project: ${decodedToken.aud}`);
      
      // Sink with local DB
      let user = db.prepare('SELECT * FROM users WHERE firebase_uid = ? OR email = ?').get(decodedToken.uid, decodedToken.email);
      
      if (!user) {
        console.log('[AUTH] Creating shadow user for:', decodedToken.email);
        const result = db.prepare('INSERT INTO users (name, email, password, firebase_uid, fleet_name) VALUES (?, ?, ?, ?, ?)')
          .run(decodedToken.name || 'Alex Morrison', decodedToken.email, 'FE_MANAGED', decodedToken.uid, 'Global Logistics Corp');
        user = { id: result.lastInsertRowid, email: decodedToken.email };
      } else if (!user.firebase_uid) {
        console.log('[AUTH] Linking profile to UID:', decodedToken.uid);
        db.prepare('UPDATE users SET firebase_uid = ? WHERE id = ?').run(decodedToken.uid, user.id);
      }

      req.user = { id: user.id, email: decodedToken.email, firebase: true };
      next();
    } catch (firebaseErr) {
      const rawDecoded = jwt.decode(token);
      console.warn('[AUTH] Firebase Verification Failure');
      console.warn('[AUTH] Error Message:', firebaseErr.message);
      
      // Fallback for legacy demo compatibility
      try {
        console.log('[AUTH] Attempting Legacy JWT Fallback...');
        req.user = jwt.verify(token, JWT_SECRET);
        next();
      } catch (legacyErr) {
        console.error('[AUTH] All authentication paths failed');
        res.status(401).json({ 
          error: 'Identity Linkage Failure', 
          detail: firebaseErr.message,
          expected_project: rawDecoded?.aud,
          code: firebaseErr.code
        });
      }
    }
  } catch (criticalErr) {
    console.error('[CRITICAL AUTH ERROR]', criticalErr);
    res.status(500).json({ error: 'Internal Auth Error', message: criticalErr.message });
  }
}

// ── AUTH ──
router.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'Invalid email or password' });
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, fleet_name: user.fleet_name, phone: user.phone } });
});

// ── TRUCKS ──
router.get('/trucks', auth, (req, res) => {
  try {
    res.json(db.prepare('SELECT * FROM trucks WHERE user_id = ?').all(req.user.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/trucks', auth, (req, res) => {
  const { id, nickname, driver, status, next_service, last_location } = req.body;
  if (!id || !nickname) return res.status(400).json({ error: 'ID and Nickname required' });
  try {
    db.prepare(`
      INSERT INTO trucks (id, user_id, nickname, driver, status, next_service, last_location, lat, lng, fuel, km_today)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.user.id, nickname, driver || 'Unassigned', status || 'active', next_service || '', last_location || 'Headquarters', 0, 0, 100, 0);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/trucks/:id', auth, (req, res) => {
  const { driver, status, next_service } = req.body;
  db.prepare('UPDATE trucks SET driver=?, status=?, next_service=? WHERE id=? AND user_id=?')
    .run(driver, status, next_service, req.params.id, req.user.id);
  res.json({ success: true });
});

// ── COMPLIANCE ──
router.get('/compliance', auth, (req, res) => {
  const truckId = req.query.truck_id;
  const query = truckId
    ? db.prepare('SELECT * FROM compliance WHERE truck_id = ? AND user_id = ?').all(truckId, req.user.id)
    : db.prepare('SELECT * FROM compliance WHERE user_id = ?').all(req.user.id);
  res.json(query);
});

router.post('/compliance', auth, (req, res) => {
  const { truck_id, type, expiry, status } = req.body;
  if (!truck_id || !type || !expiry) return res.status(400).json({ error: 'All fields required' });
  db.prepare('INSERT INTO compliance (user_id, truck_id, type, expiry, status) VALUES (?,?,?,?,?)')
    .run(req.user.id, truck_id, type, expiry, status || 'ok');
  res.json({ success: true });
});

router.put('/compliance/:id', auth, (req, res) => {
  const { expiry } = req.body;
  if (!expiry) return res.status(400).json({ error: 'New expiry date required' });
  db.prepare("UPDATE compliance SET expiry=?, status='ok' WHERE id=?").run(expiry, req.params.id);
  res.json({ success: true });
});

// ── FUEL ──
router.get('/fuel', auth, (req, res) => {
  const logs = db.prepare('SELECT * FROM fuel_logs WHERE user_id = ? ORDER BY id ASC').all(req.user.id);
  res.json(logs);
});

router.post('/fuel', auth, (req, res) => {
  const { truck_id, day, expected_litres, actual_litres } = req.body;
  if (!truck_id || !day || !expected_litres || !actual_litres)
    return res.status(400).json({ error: 'All fields required' });
  db.prepare('INSERT INTO fuel_logs (user_id,truck_id,day,expected_litres,actual_litres) VALUES (?,?,?,?,?)')
    .run(req.user.id, truck_id, day, expected_litres, actual_litres);
  const variance = ((actual_litres - expected_litres) / expected_litres) * 100;
  let alertCreated = false;
  if (variance > 20) {
    db.prepare("INSERT INTO alerts (user_id,type,truck_id,message) VALUES (?,?,?,?)")
      .run(req.user.id, 'warning', truck_id, `Fuel anomaly on ${truck_id}. Reported ${actual_litres}L, expected ${expected_litres}L. Variance: ${variance.toFixed(0)}%.`);
    alertCreated = true;
  }
  res.json({ success: true, anomaly: alertCreated, variance: variance.toFixed(1) });
});

// ── DRIVERS ──
router.get('/drivers', auth, (req, res) => {
  res.json(db.prepare('SELECT * FROM drivers WHERE user_id = ? ORDER BY score DESC').all(req.user.id));
});

router.post('/drivers', auth, (req, res) => {
  const { name, truck_id } = req.body;
  if (!name || !truck_id) return res.status(400).json({ error: 'Name and Truck ID required' });
  db.prepare('INSERT INTO drivers (user_id, name, truck_id) VALUES (?,?,?)').run(req.user.id, name, truck_id);
  res.json({ success: true });
});

router.put('/drivers/:id', auth, (req, res) => {
  const { score, hard_brakes, overspeeding, fuel_waste } = req.body;
  db.prepare('UPDATE drivers SET score=?, hard_brakes=?, overspeeding=?, fuel_waste=? WHERE id=? AND user_id=?')
    .run(score, hard_brakes, overspeeding, fuel_waste, req.params.id, req.user.id);
  res.json({ success: true });
});

// ── ALERTS ──
router.get('/alerts', auth, (req, res) => {
  try {
    res.json(db.prepare("SELECT * FROM alerts WHERE resolved=0 AND user_id=? ORDER BY id DESC").all(req.user.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/alerts/:id/resolve', auth, (req, res) => {
  db.prepare('UPDATE alerts SET resolved=1 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ success: true });
});

// ── BREAKDOWN RISK ENGINE ──
router.get('/breakdown-risk/:truckId', auth, (req, res) => {
  const truck = db.prepare('SELECT * FROM trucks WHERE id=? AND user_id=?').get(req.params.truckId, req.user.id);
  if (!truck) return res.status(404).json({ error: 'Truck not found' });
  const driver = db.prepare('SELECT * FROM drivers WHERE truck_id=? AND user_id=?').get(req.params.truckId, req.user.id);
  const fuelLogs = db.prepare('SELECT * FROM fuel_logs WHERE truck_id=? AND user_id=? ORDER BY id DESC LIMIT 7').all(req.params.truckId, req.user.id);

  const today = new Date();
  const nextService = new Date(truck.next_service);
  const daysOverdue = Math.max(0, Math.floor((today - nextService) / (1000 * 60 * 60 * 24)));

  const maintenanceRisk = Math.min(40, daysOverdue > 0 ? Math.min(daysOverdue * 2, 40) : 0);
  const driverScore = driver ? driver.score : 75;
  const driverRisk = Math.round((100 - driverScore) * 0.35);

  let fuelVariance = 0;
  if (fuelLogs.length > 0) {
    const totalVariance = fuelLogs.reduce((sum, log) => {
      return sum + Math.abs((log.actual_litres - log.expected_litres) / log.expected_litres) * 100;
    }, 0);
    fuelVariance = totalVariance / fuelLogs.length;
  }
  const fuelRisk = fuelVariance > 20 ? 25 : fuelVariance > 10 ? 12 : 0;

  const totalRisk = Math.min(100, Math.round(maintenanceRisk + driverRisk + fuelRisk));

  let riskLevel = 'LOW';
  if (totalRisk >= 70) riskLevel = 'HIGH';
  else if (totalRisk >= 40) riskLevel = 'MEDIUM';

  res.json({
    truckId: req.params.truckId,
    riskPercent: totalRisk,
    riskLevel,
    breakdown: {
      maintenanceRisk,
      driverRisk,
      fuelRisk,
      daysOverdue,
      driverScore
    },
    recommendation: totalRisk >= 70
      ? `Schedule immediate service. Breakdown likely within 10 days.`
      : totalRisk >= 40
      ? `Service recommended within 3 weeks.`
      : `No immediate action needed.`
  });
});

// ── AXORA SCORE (Financial Identity) ──
router.get('/axora-score', auth, (req, res) => {
  try {
    const compliance = db.prepare('SELECT * FROM compliance WHERE user_id=?').all(req.user.id);
    const drivers = db.prepare('SELECT * FROM drivers WHERE user_id=?').all(req.user.id);
    const trucks = db.prepare('SELECT * FROM trucks WHERE user_id=?').all(req.user.id);
    const fuelLogs = db.prepare('SELECT * FROM fuel_logs WHERE user_id=?').all(req.user.id);

    const total = compliance.length;
    const good = compliance.filter(c => c.status === 'ok').length;
    const complianceScore = total > 0 ? Math.round((good / total) * 100) : 0;

    const avgDriverScore = drivers.length > 0
      ? Math.round(drivers.reduce((s, d) => s + d.score, 0) / drivers.length)
      : 0;

    const truckIds = [...new Set(fuelLogs.map(f => f.truck_id))];
    let trucksWithGoodFuel = 0;
    truckIds.forEach(tid => {
      const logs = fuelLogs.filter(f => f.truck_id === tid);
      const variance = logs.length > 0
        ? logs.reduce((s, l) => s + Math.abs((l.actual_litres - l.expected_litres) / l.expected_litres) * 100, 0) / logs.length
        : 0;
      if (variance < 20) trucksWithGoodFuel++;
    });
    const fuelScore = truckIds.length > 0 ? Math.round((trucksWithGoodFuel / truckIds.length) * 100) : 100;

    const today = new Date();
    const onServiceTrucks = trucks.filter(t => new Date(t.next_service) >= today).length;
    const maintenanceScore = trucks.length > 0 ? Math.round((onServiceTrucks / trucks.length) * 100) : 0;

    const axoraScore = Math.round(
      complianceScore * 0.30 +
      avgDriverScore * 0.25 +
      fuelScore * 0.25 +
      maintenanceScore * 0.20
    );

    const loanRate = axoraScore >= 80 ? '11%' : axoraScore >= 60 ? '14%' : axoraScore >= 40 ? '18%' : '22%+';

    res.json({
      axoraScore,
      loanRate,
      breakdown: { complianceScore, avgDriverScore, fuelScore, maintenanceScore },
      message: `Your fleet qualifies for truck loans at ${loanRate} interest rate based on your Axora Score.`
    });
  } catch (err) {
    console.error('[AXORA-SCORE ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

// ── MECHANICS ──
router.get('/mechanics', auth, async (req, res) => {
  const mechanics = db.prepare('SELECT * FROM mechanics ORDER BY rating DESC').all();
  res.json(mechanics);
});

router.get('/mechanics/search', auth, async (req, res) => {
  const { query, location } = req.query;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
    // Fallback to internal mechanics if no API key
    return res.json(db.prepare('SELECT * FROM mechanics ORDER BY rating DESC').all());
  }

  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query || 'truck mechanics')}+in+${encodeURIComponent(location || 'near me')}&key=${apiKey}`
    );
    const data = response.data;
    
    // Map Google Places data to our Mechanic schema
    const realMechanics = data.results.map((p, idx) => ({
      id: `google-${idx}`,
      name: p.name,
      shop: p.formatted_address,
      phone: 'Contact via Google Maps',
      rating: p.rating || 4.0,
      distance_km: (Math.random() * 5 + 1).toFixed(1), // Mock distance if not calculated
      speciality: p.types ? p.types.join(', ') : 'General Repair',
      available: 1,
      lat: p.geometry.location.lat,
      lng: p.geometry.location.lng
    }));

    res.json(realMechanics);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch from Google' });
  }
});

router.get('/mechanics/bookings', auth, (req, res) => {
  res.json(db.prepare('SELECT * FROM mechanic_bookings WHERE user_id=? ORDER BY created_at DESC').all(req.user.id));
});

router.post('/mechanics/book', auth, (req, res) => {
  const { truck_id, mechanic_name, mechanic_shop, mechanic_phone, service_type, booking_date } = req.body;
  if (!truck_id || !mechanic_name || !service_type || !booking_date)
    return res.status(400).json({ error: 'Missing required booking fields' });
    
  const estimatedCost = service_type.includes('Full') ? 3500 : 1500;
  
  const result = db.prepare(`
    INSERT INTO mechanic_bookings (user_id, truck_id, mechanic_name, mechanic_shop, mechanic_phone, service_type, estimated_cost, booking_date)
    VALUES (?,?,?,?,?,?,?,?)
  `).run(req.user.id, truck_id, mechanic_name, mechanic_shop, mechanic_phone || 'N/A', service_type, estimatedCost, booking_date);
  
  res.json({ success: true, bookingId: result.lastInsertRowid, estimatedCost });
});

// ── DASHBOARD SUMMARY ──
router.get('/dashboard', auth, (req, res) => {
  try {
    const trucks = db.prepare('SELECT * FROM trucks WHERE user_id=?').all(req.user.id);
    const alerts = db.prepare("SELECT * FROM alerts WHERE resolved=0 AND user_id=? ORDER BY id DESC").all(req.user.id);
    const compliance = db.prepare('SELECT * FROM compliance WHERE user_id=?').all(req.user.id);
    const drivers = db.prepare('SELECT * FROM drivers WHERE user_id=?').all(req.user.id);
    const fuelLogs = db.prepare('SELECT * FROM fuel_logs WHERE user_id=?').all(req.user.id);

    const activeTrucks = trucks.filter(t => t.status === 'active').length;
    const totalFuelLitres = fuelLogs.reduce((s, f) => s + f.actual_litres, 0);
    const monthlyFuelCost = Math.round(totalFuelLitres * 1.20);
    const totalComp = compliance.length;
    const goodComp = compliance.filter(c => c.status === 'ok').length;
    const complianceScore = totalComp > 0 ? Math.round((goodComp / totalComp) * 100) : 0;

    const weeklyFuel = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => {
      const logs = fuelLogs.filter(f => f.day === day);
      return {
        day,
        expected: Math.round(logs.reduce((s, l) => s + l.expected_litres, 0)),
        actual: Math.round(logs.reduce((s, l) => s + l.actual_litres, 0))
      };
    });

    res.json({
      activeTrucks,
      totalTrucks: trucks.length,
      alertCount: alerts.length,
      complianceScore,
      monthlyFuelCost,
      trucks,
      alerts: alerts.slice(0, 6),
      weeklyFuel,
      drivers: drivers.slice(0, 3)
    });
  } catch (err) {
    console.error('[DASHBOARD ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

// ── AI CHAT ──
router.post('/chat/log', auth, (req, res) => {
  const { role, content } = req.body;
  if (!role || !content) return res.status(400).json({ error: 'Role and content required' });
  try {
    db.prepare('INSERT INTO chat_messages (user_id, role, content) VALUES (?,?,?)').run(req.user.id, role, content);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/chat/history', auth, (req, res) => {
  try {
    res.json(db.prepare('SELECT * FROM chat_messages WHERE user_id=? ORDER BY created_at ASC').all(req.user.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/chat/history', auth, (req, res) => {
  try {
    db.prepare('DELETE FROM chat_messages WHERE user_id=?').run(req.user.id);
    res.json({ success: true, message: 'Neural history purged' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/ai-context', auth, (req, res) => {
  try {
    const trucks = db.prepare('SELECT * FROM trucks WHERE user_id=?').all(req.user.id);
    const alerts = db.prepare('SELECT * FROM alerts WHERE resolved=0 AND user_id=?').all(req.user.id);
    const fuel = db.prepare('SELECT * FROM fuel_logs WHERE user_id=? ORDER BY id DESC LIMIT 15').all(req.user.id);
    const drivers = db.prepare('SELECT * FROM drivers WHERE user_id=?').all(req.user.id);
    
    res.json({ trucks, alerts, fuel, drivers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── USER ──
router.get('/user', auth, (req, res) => {
  const user = db.prepare('SELECT id,name,email,fleet_name,phone FROM users WHERE id=?').get(req.user.id);
  res.json(user);
});

router.put('/user', auth, (req, res) => {
  const { name, phone, fleet_name } = req.body;
  db.prepare('UPDATE users SET name=?,phone=?,fleet_name=? WHERE id=?').run(name, phone, fleet_name, req.user.id);
  res.json({ success: true });
});

export default router;
