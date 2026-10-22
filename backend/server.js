const express = require('express');
const cors = require('cors');
const path = require('path');
const drugsData = require('./data/drugs.json');
const brandsData = require('./data/brands.json');
const { searchMedicines, resolveMedicine } = require('./engine/brandResolver');
const { analyzeRegimen } = require('./engine/analyzer');
const { findSaferAlternatives } = require('./engine/alternatives');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health Check Endpoint (Optimized for Apache JMeter Performance Testing)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'MediSafe Advisor API',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// Authentication Endpoint (Demo Credentials for Experiment 9)
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (username === 'doctor' && password === 'medisafe123') {
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        username: 'doctor',
        fullName: 'Dr. Alexander Fleming',
        role: 'Attending Physician'
      },
      token: 'medisafe-demo-session-token'
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Invalid username or password.'
  });
});

// Catalog Endpoints
app.get('/api/drugs', (req, res) => {
  res.status(200).json({
    total: drugsData.length,
    drugs: drugsData
  });
});

app.get('/api/brands', (req, res) => {
  res.status(200).json({
    total: Object.keys(brandsData).length,
    brands: brandsData
  });
});

// Search Autocomplete Endpoint
app.get('/api/search', (req, res) => {
  const query = req.query.q || '';
  const limit = parseInt(req.query.limit, 10) || 12;
  const results = searchMedicines(query, limit);
  res.status(200).json({ query, results });
});

// Brand/Generic Resolver Endpoint
app.post('/api/resolve', (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name parameter is required' });
  }
  const resolved = resolveMedicine(name);
  res.status(200).json({ query: name, resolved });
});

// Safer Alternatives Query Endpoint
app.post('/api/alternatives', (req, res) => {
  const { medications, findings, profile, foodItems, currentScore } = req.body || {};
  const suggestions = findSaferAlternatives({
    medications,
    findings,
    profile,
    foodItems,
    currentScore
  });
  res.status(200).json({ suggestions });
});

// Comprehensive Deterministic Safety Analysis Endpoint
// Supports both new regimen schema and legacy single-form schema for backward compatibility
app.post('/api/analyze', (req, res) => {
  try {
    const body = req.body || {};

    let profile = body.profile || {};
    let medications = body.medications || [];
    let foodItems = body.foodItems || [];

    // Support legacy single-item test payload format
    if (body.medicationName && medications.length === 0) {
      medications = [body.medicationName];
    }
    if (body.disease && (!profile.conditions || profile.conditions.length === 0)) {
      profile.conditions = [body.disease];
    }
    if (body.allergy && (!profile.allergies || profile.allergies.length === 0)) {
      profile.allergies = [body.allergy];
    }
    if (body.patientName && !profile.patientName) {
      profile.patientName = body.patientName;
    }
    if (body.age && !profile.age) {
      profile.age = body.age;
    }
    if (body.gender && !profile.gender) {
      profile.gender = body.gender;
    }

    const report = analyzeRegimen({
      profile,
      medications,
      foodItems
    });

    // Compute Safer Alternatives for major/moderate conflicts
    const suggestedAlternatives = findSaferAlternatives({
      medications: report.medications,
      findings: report.findings,
      profile,
      foodItems,
      currentScore: report.safetyScore
    });

    // Attach legacy fields for automated Selenium test case assertions
    const responsePayload = {
      ...report,
      suggestedAlternatives,
      patientName: profile.patientName || body.patientName || 'Anonymous Patient',
      age: profile.age || body.age || 'N/A',
      gender: profile.gender || body.gender || 'N/A',
      disease: profile.conditions?.join(', ') || body.disease || 'None',
      allergy: profile.allergies?.join(', ') || body.allergy || 'None',
      medicationName: body.medicationName || (report.medications[0]?.genericName || 'Regimen'),
      dosage: body.dosage || 'Prescribed dose'
    };

    return res.status(200).json(responsePayload);
  } catch (error) {
    console.error('Error in /api/analyze:', error);
    return res.status(500).json({
      error: 'Failed to process medication safety analysis',
      details: error.message
    });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`MediSafe Clinical Advisor API running on port ${PORT}`);
  });
}

module.exports = app;
