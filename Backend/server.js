const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5000;

// === MIDDLEWARE ===
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(bodyParser.json());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// === SETUP ===
['uploads', 'database', 'config'].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
});

const USERS_FILE = './database/users.json';
const readJSON = (file) => {
    const fullPath = `database/${file}`;
    if (!fs.existsSync(fullPath)) return [];

    const content = fs.readFileSync(fullPath, 'utf-8');
    if (!content.trim()) return []; // return empty array if file is blank

    try {
        return JSON.parse(content);
    } catch (error) {
        console.error(`❌ Error parsing ${file}:`, error.message);
        return [];
    }
};
const writeJSON = (file, data) => fs.writeFileSync(`database/${file}`, JSON.stringify(data, null, 2));

// === MULTER CONFIG ===
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const companyId = req.body.companyId;
        const dir = `uploads/${companyId}`;
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });


// === AUTH: SIGNUP ===
function readUsers() {
    if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]');
    return JSON.parse(fs.readFileSync(USERS_FILE));
}

function writeUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function generateNextUserId(users) {
    if (users.length === 0) return 'APEDGE001';
    const lastUser = users[users.length - 1];
    const match = lastUser.id.match(/APEDGE(\d+)/);
    const lastNum = match ? parseInt(match[1], 10) : 0;
    return 'APEDGE' + (lastNum + 1).toString().padStart(3, '0');
}

app.post('/api/signup', (req, res) => {
    const { companyName, email, contact, password } = req.body;
    const role = 'Administrator';

    if (!companyName || !email || !contact || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const users = readUsers();
    if (users.some(u => u.email === email)) {
        return res.status(400).json({ error: 'Email already exists' });
    }

    const newUser = {
        id: generateNextUserId(users),
        companyName,
        email,
        contact,
        password,
        role
    };

    users.push(newUser);
    writeUsers(users);
    res.json(newUser);
});

// === AUTH: LOGIN ===
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const users = readUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    res.json(user);
});

// === Fetch: Users ===
app.get('/api/users', (req, res) => {
  const users = readUsers(); // loads from database/users.json
  res.json(users);
});


// === Post: Clerk ===

app.post('/api/add-new-clerk', (req, res) => {
  const { companyName, email, contact, adminId, name } = req.body;
  const role = 'Clerk';
  const password = '1234';

  if (!companyName || !email || !contact || !name || !adminId) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const users = readUsers();

  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: 'Email already exists' });
  }

  // 🔧 Generate Clerk ID like "AP005C3"
  function generateNewClerkId(users, adminId) {
    
    const clerks = users.filter(u => u.role === "User" && u.adminId === adminId);
    return `${adminId}C00${clerks.length + 1}`;
  }

  const newUser = {
    id: generateNewClerkId(users, adminId),
    companyName,
    email,
    contact,
    password,
    role,
    adminId,
    name
  };

  users.push(newUser);
  writeUsers(users);

//   console.log("✅ Clerk added:", newUser);

  res.json({
    success: true,
    user: newUser
  });
});


// server.js changes needed for update-clerk API

app.put('/api/update-clerk/:id', (req, res) => {
  const clerkId = req.params.id;
  const { name, email, contact, password, role, companyName, adminId } = req.body;

  if (!clerkId || !name || !email || !contact || !role || !companyName || !adminId) {
    return res.status(400).json({ error: 'All fields (except password for update) are required for update' });
  }

  const users = readUsers();
  const clerkIndex = users.findIndex(u => u.id === clerkId);

  if (clerkIndex === -1) {
    return res.status(404).json({ error: 'Clerk not found' });
  }

  // Check for duplicate email if email is being changed
  const existingEmailUser = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.id !== clerkId);
  if (existingEmailUser) {
    return res.status(400).json({ error: 'Email already exists for another user' });
  }

  const updatedClerk = { ...users[clerkIndex], name, email, contact, role, companyName, adminId };

  // Only update password if a new one is provided
  if (password) {
    updatedClerk.password = password;
  }

  users[clerkIndex] = updatedClerk;
  writeUsers(users);

  res.json({ success: true, user: updatedClerk });
});

// === ONE TIME table Configuration ===

const TABLE_CONFIG_FILE = './database/tableConfig.json';

app.post('/api/save-or-update-table-config', (req, res) => {
  const { adminId, config } = req.body;

  if (!adminId || !config || typeof config !== 'object') {
    return res.status(400).json({ error: 'Invalid request payload' });
  }

  // Load existing config if any
  let existing = {};
  if (fs.existsSync(TABLE_CONFIG_FILE)) {
    const content = fs.readFileSync(TABLE_CONFIG_FILE, 'utf-8');
    if (content.trim()) {
      try {
        existing = JSON.parse(content);
      } catch (err) {
        return res.status(500).json({ error: "Failed to parse existing table config file" });
      }
    }
  }

  // Overwrite or insert config
  existing[adminId] = [config]; // You can use just config instead of [config] if you're not supporting history

  // Save back to file
  try {
    fs.writeFileSync(TABLE_CONFIG_FILE, JSON.stringify(existing, null, 2));
    res.json({ success: true, updatedFor: adminId });
  } catch (err) {
    res.status(500).json({ error: "Failed to write config file" });
  }
});

// === fetch  table Configuration ===

app.get('/api/get-table-config/:adminId', (req, res) => {
  const { adminId } = req.params;

  if (!adminId) {
    return res.status(400).json({ error: 'Admin ID is required' });
  }

  if (!fs.existsSync(TABLE_CONFIG_FILE)) {
    return res.status(404).json({ error: 'No config file found' });
  }

  const raw = fs.readFileSync(TABLE_CONFIG_FILE, 'utf-8');
  const data = raw ? JSON.parse(raw) : {};

  const foundConfig = data[adminId];

  if (!foundConfig || (Array.isArray(foundConfig) && foundConfig.length === 0)) {
    return res.json({ error: 'No config for this admin' });
  }

  res.json({
    config: Array.isArray(foundConfig) ? foundConfig[0] : foundConfig
  });
});

// === Check if a table was created by admin ===

app.get('/api/check-config/:adminId', (req, res) => {
  const { adminId } = req.params;

  if (!adminId) {
    return res.status(400).json({ exists: false, error: "Admin ID is required" });
  }

  if (!fs.existsSync(TABLE_CONFIG_FILE)) {
    return res.status(404).json({ exists: false, error: "No config file found" });
  }

  const content = fs.readFileSync(TABLE_CONFIG_FILE, 'utf-8');
  const data = content ? JSON.parse(content) : {};

  const foundConfig = data[adminId];
  console.log("foundConfig",foundConfig);

  if (foundConfig && Array.isArray(foundConfig) && foundConfig.length > 0) {
    return res.json({
      exists: true,
      config: foundConfig[0] // or return the array if needed
    });
  }

  return res.json({ exists: false, error: "Admin has no config saved" });
});


// === INVOICE UPLOAD ===
app.post('/api/upload', upload.single('invoice'), (req, res) => {
    const { companyId, clerkId, poId } = req.body;
    const file = req.file;

    const invoices = readJSON('invoices.json');
    const ocrResults = readJSON('ocr_results.json');

    // === Generate APEDGE-style Invoice ID ===
    let nextIdNum = 1;
    if (invoices.length > 0) {
        const last = invoices[invoices.length - 1].id;
        const match = last.match(/APEDGEDOC(\d+)/);
        if (match) nextIdNum = parseInt(match[1]) + 1;
    }
    const newInvoiceId = `APEDGEDOC${String(nextIdNum).padStart(3, '0')}`;

    // === Rename the uploaded file ===
    const ext = path.extname(file.originalname); // e.g., .pdf
    const newFileName = `${newInvoiceId}${ext}`;
    const newFilePath = path.join(path.dirname(file.path), newFileName);
    fs.renameSync(file.path, newFilePath); // Renames the file on disk

    // === Create new invoice object ===
    const newInvoice = {
        id: newInvoiceId,
        filePath: newFilePath.replace(/\\/g, '/'),
        fileName: newFileName,
        companyId,
        clerkId,
        poId,
        status: 'ocr_done',
        date: new Date().toISOString(),
        logs: [{ action: 'uploaded', by: clerkId, at: new Date().toISOString() }]
    };

    invoices.push(newInvoice);
    writeJSON('invoices.json', invoices);

    // === Simulated OCR result ===
    const simulatedOCR = {
        invoiceId: newInvoiceId,
        ocrData: {
            invoiceNumber: `INV-${newInvoiceId}`,
            date: new Date().toISOString().split('T')[0],
            vendor: 'ABC Pvt Ltd',
            amount: '25000',
            gst: '18%',
            items: [
                { name: 'Item A', quantity: 5, rate: 1000 },
                { name: 'Item B', quantity: 10, rate: 1500 }
            ],
            extractedBy: clerkId
        },
        ocr_confidence: Math.floor(Math.random() * 10) + 90,
        timestamp: new Date().toISOString()
    };

    ocrResults.push(simulatedOCR);
    writeJSON('ocr_results.json', ocrResults);

    res.json({ success: true, invoice: newInvoice });
});


// === GET ALL INVOICES ===
app.get('/api/invoices', (req, res) => {
    const invoices = readJSON('invoices.json');
    res.json(invoices);
});

// === OCR RESULT ===
app.get('/api/ocr-results', (req, res) => {
    try {
        const data = readJSON('ocr_results.json');
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: 'Failed to read OCR results' });
    }
});


app.post('/api/ocr/:invoiceId', (req, res) => {
    const { invoiceId } = req.params;
    const newOcr = req.body;
    const allOCR = readJSON('ocr_results.json');

    const existing = allOCR.find(o => o.invoiceId == invoiceId);
    if (existing) {
        // Only update the changed fields
        Object.assign(existing.ocrData, newOcr);
        existing.timestamp = new Date().toISOString();
    } else {
        allOCR.push({ invoiceId, ocrData: newOcr, timestamp: new Date().toISOString() });
    }

    writeJSON('ocr_results.json', allOCR);

    const invoices = readJSON('invoices.json');
    const invoice = invoices.find(i => i.id == invoiceId);
    if (invoice) {
        invoice.status = 'ocr_done';
        invoice.logs.push({ action: 'draft_saved', at: new Date().toISOString() });
        writeJSON('invoices.json', invoices);
    }

    res.json({ success: true });
});


// === EXTRACTION RESULT ===
app.post('/api/extraction/:invoiceId', (req, res) => {
    const { invoiceId } = req.params;
    const extracted = req.body;
    const data = readJSON('extracted_data.json');
    data.push({ invoiceId, extracted, timestamp: new Date().toISOString() });
    writeJSON('extracted_data.json', data);

    const invoices = readJSON('invoices.json');
    const invoice = invoices.find(i => i.id == invoiceId);
    if (invoice) {
        invoice.status = 'extracted';
        invoice.logs.push({ action: 'extracted', at: new Date().toISOString() });
        writeJSON('invoices.json', invoices);
    }

    res.json({ success: true });
});

// === RECONCILIATION RESULT ===

// GET all reconciled invoices
app.get('/api/reconciliation', (req, res) => {
    const data = readJSON('reconciliation.json');
    res.json(data);
});

app.post('/api/reconcile/:invoiceId', (req, res) => {
    const { invoiceId } = req.params;
    const result = req.body;
    const data = readJSON('reconciliation.json');

    // Only if approved, push to reconciliation
    if (result.approved) {
        data.push({ invoiceId, result, timestamp: new Date().toISOString() });
        writeJSON('reconciliation.json', data);
    }

    // Update invoice status only
    const invoices = readJSON('invoices.json');
    const invoice = invoices.find(i => i.id == invoiceId);
    if (invoice) {
        invoice.status = result.rejected ? 'rejected' : 'reconciled';
        invoice.logs.push({
            action: result.rejected ? 'rejected' : 'reconciled',
            at: new Date().toISOString(),
            reason: result.reason || '',
        });
        writeJSON('invoices.json', invoices);
    }

    res.json({ success: true });
});

app.get('/api/invoice/:id', (req, res) => {
    const invoices = readJSON('invoices.json');
    const invoice = invoices.find(i => i.id == req.params.id);
    res.json(invoice);
});

// All POs
app.get('/api/po/all', (req, res) => {
    const poList = readJSON('purchase_orders.json');
    res.json(poList);
});

// All GRNs
app.get('/api/grn/all', (req, res) => {
    const grnList = readJSON('grn.json');
    res.json(grnList);
});


app.post('/api/match/:invoiceId', (req, res) => {
  const { invoiceId } = req.params;
  const { status, verified, reason = '', amount = 0, date = '', vendor = '' } = req.body;

  const invoices = readJSON('invoices.json');
  const matches = readJSON('matching_results.json');
  const reconciliation = readJSON('reconciliation.json');

  const invoice = invoices.find(i => i.id == invoiceId);
  if (invoice) {
    invoice.status = status;
    invoice.logs.push({ action: status, at: new Date().toISOString(), reason });
    writeJSON('invoices.json', invoices);
  }

  // Save match result
  matches.push({ invoiceId, status, verified, reason, timestamp: new Date().toISOString() });
  writeJSON('matching_results.json', matches);

  // Save to reconciliation only if rejected
  if (status === 'rejected') {
    reconciliation.push({
      invoiceId,
      invoiceNumber: invoiceId,
      vendor,
      amount,
      date,
      result: { status, reason },
      timestamp: new Date().toISOString()
    });
    writeJSON('reconciliation.json', reconciliation);
  }

  res.json({ success: true });
});

// === DASHBOARD METRICS API ===
app.get('/api/dashboard-stats', (req, res) => {
    const invoices = readJSON('invoices.json');
    const reconciliation = readJSON('reconciliation.json');

    const invoiceUploaded = invoices.length;
    const invoiceDraft = invoices.filter(i => i.status === 'ocr_done' || i.status === 'extracted').length;
    const invoiceReviewed = invoices.filter(i => i.status === 'verified' || i.status === 'matched').length;
    const invoiceRejected = invoices.filter(i => i.status === 'rejected').length;

    const reconDraft = invoices.filter(i => i.status === 'verified').length;
    const reconCompleted = invoices.filter(i => i.status === 'reconciled').length;
    const reconRejected = reconciliation.filter(r => r.result?.status === 'rejected').length;

    res.json({
        invoiceUploaded,
        invoiceDraft,
        invoiceReviewed,
        invoiceRejected,
        reconDraft,
        reconCompleted,
        reconRejected
    });
});

// === SERVE GENERIC FIELD STRUCTURE ===


app.get('/api/generic-fields', (req, res) => {
  try {
    const data = fs.readFileSync('./database/genereicFields.json', 'utf-8'); // be sure path and spelling are exact
    res.json(JSON.parse(data));
  } catch (e) {
    console.error("❌ Error reading JSON:", e.message);
    res.status(500).json({ error: "Failed to load generic fields." });
  }
});

app.get('/api/form-fields/:userId', (req, res) => {
  const userId = req.params.userId;
  const config = readJSON('tableConfig.json');

  const userFieldsArray = config[userId];
  if (!userFieldsArray || !Array.isArray(userFieldsArray) || userFieldsArray.length === 0) {
    return res.status(404).json({ error: 'No schema for user' });
  }

  const userFields = userFieldsArray[0]; // since stored as [{ field1: {}, field2: {}, ... }]

  const schema = {
    type: 'object',
    properties: {},
    required: [],
  };

  const uiSchema = {
    type: 'Group',
    label: 'Invoice Details',
    elements: [],
  };

  Object.entries(userFields).forEach(([label, def]) => {
    const key = label.trim().replace(/\s+/g, '_');

    schema.properties[key] = {
      type: def.type === 'number' ? 'number' : 'string'
    };

    if (def.required) schema.required.push(key);

    uiSchema.elements.push({
      type: 'Control',
      label: label,
      scope: `#/properties/${key}`,
    });
  });

  res.json({ schema, uiSchema });
});

app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));