import React, { useState, useEffect } from 'react';
import DisclaimerBanner from './DisclaimerBanner';
import HealthProfileCard from './HealthProfileCard';
import MedicineInput from './MedicineInput';
import FoodSupplementInput from './FoodSupplementInput';
import ResultCard from './ResultCard';
import { analyzeSafety } from '../services/api';

export default function Dashboard({ onLogout }) {
  // Patient Profile state
  const [patientName, setPatientName] = useState('John Doe');
  const [patientAge, setPatientAge] = useState('54');
  const [patientGender, setPatientGender] = useState('Male');
  const [pregnant, setPregnant] = useState(false);
  const [conditions, setConditions] = useState(['Hypertension']);
  const [allergies, setAllergies] = useState([]);

  // Medications state
  const [medications, setMedications] = useState([
    {
      id: 'warfarin',
      genericName: 'Warfarin',
      drugClass: 'Vitamin K Antagonist',
      resolvedFrom: 'Warfarin',
      isBrand: false,
      isUnknown: false
    }
  ]);
  const [dosage, setDosage] = useState('5mg daily');

  // Food / Drinks / Supplements
  const [foodItems, setFoodItems] = useState([]);

  // Execution state
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  // Load last session from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('medisafe_current_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.patientName) setPatientName(parsed.patientName);
        if (parsed.age) setPatientAge(parsed.age);
        if (parsed.gender) setPatientGender(parsed.gender);
        if (typeof parsed.pregnant === 'boolean') setPregnant(parsed.pregnant);
        if (Array.isArray(parsed.conditions)) setConditions(parsed.conditions);
        if (Array.isArray(parsed.allergies)) setAllergies(parsed.allergies);
        if (Array.isArray(parsed.medications) && parsed.medications.length > 0) setMedications(parsed.medications);
        if (parsed.dosage) setDosage(parsed.dosage);
        if (Array.isArray(parsed.foodItems)) setFoodItems(parsed.foodItems);
      }
    } catch (e) {
      console.warn('Could not load session from localStorage', e);
    }
  }, []);

  // Save session to localStorage on changes
  useEffect(() => {
    try {
      const sessionData = {
        patientName,
        age: patientAge,
        gender: patientGender,
        pregnant,
        conditions,
        allergies,
        medications,
        dosage,
        foodItems
      };
      localStorage.setItem('medisafe_current_session', JSON.stringify(sessionData));
    } catch (e) {
      // ignore storage errors
    }
  }, [patientName, patientAge, patientGender, pregnant, conditions, allergies, medications, dosage, foodItems]);

  const handleAddMedication = (med) => {
    // Avoid exact duplicate
    if (!medications.some(m => m.id === med.id && m.genericName === med.genericName)) {
      setMedications([...medications, med]);
    }
  };

  const handleRemoveMedication = (index) => {
    setMedications(medications.filter((_, idx) => idx !== index));
  };

  const handleAddFood = (item) => {
    if (!foodItems.includes(item)) {
      setFoodItems([...foodItems, item]);
    }
  };

  const handleRemoveFood = (item) => {
    setFoodItems(foodItems.filter(f => f !== item));
  };

  // Run Safety Analysis
  const handleAnalyze = async (e) => {
    if (e) e.preventDefault();
    setAnalyzing(true);

    const payload = {
      profile: {
        patientName,
        age: patientAge,
        gender: patientGender,
        pregnant,
        conditions,
        allergies
      },
      medications,
      foodItems,
      // Pass top-level keys for backward compatibility
      patientName,
      age: patientAge,
      gender: patientGender,
      disease: conditions.join(', '),
      allergy: allergies.join(', '),
      medicationName: medications[0]?.genericName || 'Regimen',
      dosage
    };

    try {
      const result = await analyzeSafety(payload);
      setAnalysisResult(result);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Analysis error:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
  };

  const handleApplyModifiedRegimen = async (newMedsList) => {
    setMedications(newMedsList);
    setAnalyzing(true);
    const payload = {
      profile: {
        patientName,
        age: patientAge,
        gender: patientGender,
        pregnant,
        conditions,
        allergies
      },
      medications: newMedsList,
      foodItems,
      patientName,
      age: patientAge,
      gender: patientGender,
      disease: conditions.join(', '),
      allergy: allergies.join(', '),
      medicationName: newMedsList[0]?.genericName || 'Regimen',
      dosage
    };

    try {
      const res = await analyzeSafety(payload);
      setAnalysisResult(res);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  // Demo Scenarios Quick Loaders
  const loadScenario = (type) => {
    if (type === 'bleeding_stack') {
      // Scenario 1: Warfarin + Aspirin + Ibuprofen
      setPatientName('Robert Taylor');
      setPatientAge('68');
      setPatientGender('Male');
      setPregnant(false);
      setConditions(['Deep Vein Thrombosis', 'Osteoarthritis']);
      setAllergies([]);
      setMedications([
        { id: 'warfarin', genericName: 'Warfarin', drugClass: 'Anticoagulant', resolvedFrom: 'Warfarin' },
        { id: 'aspirin', genericName: 'Aspirin', drugClass: 'Antiplatelet', resolvedFrom: 'Ecosprin 75', isBrand: true, brandName: 'Ecosprin 75' },
        { id: 'ibuprofen', genericName: 'Ibuprofen', drugClass: 'NSAID', resolvedFrom: 'Brufen 400', isBrand: true, brandName: 'Brufen 400' }
      ]);
      setDosage('Warfarin 5mg evening, Ecosprin 75mg morning, Brufen as needed');
      setFoodItems(['alcohol']);
    } else if (type === 'pregnant_penicillin') {
      // Scenario 2: Pregnant user with Penicillin allergy taking Amoxicillin
      setPatientName('Priya Sharma');
      setPatientAge('29');
      setPatientGender('Female');
      setPregnant(true);
      setConditions(['Respiratory Tract Infection']);
      setAllergies(['Penicillin']);
      setMedications([
        { id: 'amoxicillin', genericName: 'Amoxicillin', drugClass: 'Penicillin Antibiotic', resolvedFrom: 'Augmentin', isBrand: true, brandName: 'Augmentin' }
      ]);
      setDosage('Augmentin 625mg twice daily');
      setFoodItems([]);
    } else if (type === 'elderly_kidney_brands') {
      // Scenario 3: Elderly with CKD taking Indian brands (Brufen + Cardace + Dolo 650)
      setPatientName('Ramesh Patel');
      setPatientAge('74');
      setPatientGender('Male');
      setPregnant(false);
      setConditions(['Chronic Kidney Disease', 'Hypertension']);
      setAllergies([]);
      setMedications([
        { id: 'ibuprofen', genericName: 'Ibuprofen', drugClass: 'NSAID', resolvedFrom: 'Brufen', isBrand: true, brandName: 'Brufen' },
        { id: 'ramipril', genericName: 'Ramipril', drugClass: 'ACE Inhibitor', resolvedFrom: 'Cardace 5', isBrand: true, brandName: 'Cardace 5' },
        { id: 'paracetamol', genericName: 'Paracetamol', drugClass: 'Analgesic', resolvedFrom: 'Dolo 650', isBrand: true, brandName: 'Dolo 650' }
      ]);
      setDosage('Brufen 400mg twice daily, Cardace 5mg morning, Dolo 650 for pain');
      setFoodItems(['potassium_rich_foods']);
    } else if (type === 'test_rule1') {
      // Rule 1: Warfarin + Hypertension (TC07)
      setPatientName('John Doe');
      setPatientAge('54');
      setPatientGender('Male');
      setPregnant(false);
      setConditions(['Hypertension']);
      setAllergies(['None']);
      setMedications([
        { id: 'warfarin', genericName: 'Warfarin', drugClass: 'Anticoagulant', resolvedFrom: 'Warfarin' }
      ]);
      setDosage('5mg daily');
      setFoodItems([]);
    } else if (type === 'test_rule2') {
      // Rule 2: Aspirin + Aspirin Allergy (TC07)
      setPatientName('Jane Doe');
      setPatientAge('42');
      setPatientGender('Female');
      setPregnant(false);
      setConditions(['None']);
      setAllergies(['Aspirin']);
      setMedications([
        { id: 'aspirin', genericName: 'Aspirin', drugClass: 'Antiplatelet', resolvedFrom: 'Aspirin' }
      ]);
      setDosage('100mg daily');
      setFoodItems([]);
    } else if (type === 'cyp_inference') {
      // Stage 4: CYP Enzyme Inference (Clarithromycin + Simvastatin)
      setPatientName('Arthur Pendelton');
      setPatientAge('58');
      setPatientGender('Male');
      setPregnant(false);
      setConditions(['Hyperlipidemia', 'Respiratory Infection']);
      setAllergies([]);
      setMedications([
        { id: 'clarithromycin', genericName: 'Clarithromycin', drugClass: 'Macrolide Antibiotic', resolvedFrom: 'Clarithromycin' },
        { id: 'simvastatin', genericName: 'Simvastatin', drugClass: 'HMG-CoA Reductase Inhibitor (Statin)', resolvedFrom: 'Simvastatin' }
      ]);
      setDosage('Clarithromycin 500mg twice daily, Simvastatin 40mg bedtime');
      setFoodItems([]);
    }
    setAnalysisResult(null);
  };

  return (
    <div className="dashboard-container">
      {/* Top Header */}
      <header className="app-header">
        <div className="header-brand">
          <div className="header-logo-badge">💊</div>
          <div>
            <h1 className="header-title">MediSafe</h1>
            <p className="header-tagline">Explainable Personalized Medication Safety Advisor</p>
          </div>
        </div>

        <div className="header-controls">
          <div className="offline-badge">
            <span className="dot-green"></span>
            <span>Deterministic Clinical Engine Active</span>
          </div>
          {onLogout && (
            <button
              id="logout-button"
              data-testid="logout-button"
              className="btn btn-logout-sm"
              onClick={onLogout}
            >
              Sign Out
            </button>
          )}
        </div>
      </header>

      {/* Mandatory Clinical Disclaimer */}
      <DisclaimerBanner />

      <main className="dashboard-content">
        {!analysisResult ? (
          <div className="analyzer-setup-view">
            {/* Quick Demo Scenarios Row */}
            <div className="demo-scenarios-panel">
              <span className="demo-label">⚡ 1-Click Demo Scenarios:</span>
              <div className="demo-buttons-row">
                <button
                  type="button"
                  className="btn-demo-scenario"
                  onClick={() => loadScenario('bleeding_stack')}
                >
                  🩸 Bleeding Triad (Warfarin + Aspirin + Ibuprofen)
                </button>
                <button
                  type="button"
                  className="btn-demo-scenario"
                  onClick={() => loadScenario('pregnant_penicillin')}
                >
                  🤰 Pregnancy & Allergy (Augmentin)
                </button>
                <button
                  type="button"
                  className="btn-demo-scenario"
                  onClick={() => loadScenario('elderly_kidney_brands')}
                >
                  👴 Elderly CKD (Brufen + Cardace + Dolo)
                </button>
                <button
                  type="button"
                  className="btn-demo-scenario"
                  onClick={() => loadScenario('cyp_inference')}
                >
                  🧬 Predicted CYP (Clarithromycin + Simvastatin)
                </button>
                <button
                  type="button"
                  className="btn-demo-scenario btn-demo-test"
                  onClick={() => loadScenario('test_rule1')}
                  title="Loads Rule 1: Warfarin + Hypertension"
                >
                  🧪 Rule 1 (Warfarin + HTN)
                </button>
                <button
                  type="button"
                  className="btn-demo-scenario btn-demo-test"
                  onClick={() => loadScenario('test_rule2')}
                  title="Loads Rule 2: Aspirin Allergy"
                >
                  🧪 Rule 2 (Aspirin Allergy)
                </button>
              </div>
            </div>

            {/* Main Form Layout */}
            <form onSubmit={handleAnalyze} className="regimen-form">
              <div className="form-columns-grid">
                {/* Column 1: Patient Health Profile */}
                <div className="col-profile">
                  <HealthProfileCard
                    patientName={patientName}
                    setPatientName={setPatientName}
                    age={patientAge}
                    setAge={setPatientAge}
                    gender={patientGender}
                    setGender={setPatientGender}
                    pregnant={pregnant}
                    setPregnant={setPregnant}
                    allergies={allergies}
                    setAllergies={setAllergies}
                    conditions={conditions}
                    setConditions={setConditions}
                  />
                </div>

                {/* Column 2: Medications & Dietary Factors */}
                <div className="col-meds">
                  <MedicineInput
                    medications={medications}
                    onAddMedication={handleAddMedication}
                    onRemoveMedication={handleRemoveMedication}
                    dosage={dosage}
                    setDosage={setDosage}
                  />

                  <FoodSupplementInput
                    foodItems={foodItems}
                    onAddFood={handleAddFood}
                    onRemoveFood={handleRemoveFood}
                  />
                </div>
              </div>

              {/* Big Action Submit Button (Preserves TC06 analyze-button ID) */}
              <div className="action-button-container">
                <button
                  type="submit"
                  id="analyze-button"
                  data-testid="analyze-button"
                  className="btn btn-primary btn-check-medicines"
                  disabled={analyzing || medications.length === 0}
                >
                  {analyzing ? 'Analyzing Regimen Safety...' : '🛡️ Check My Medicines Safety'}
                </button>
                {medications.length === 0 && (
                  <p className="no-meds-warning">Please add at least one medication above to analyze.</p>
                )}
              </div>
            </form>
          </div>
        ) : (
          <ResultCard
            result={analysisResult}
            profile={{
              patientName,
              age: patientAge,
              gender: patientGender,
              pregnant,
              conditions,
              allergies
            }}
            foodItems={foodItems}
            onReset={handleReset}
            onApplyModifiedRegimen={handleApplyModifiedRegimen}
          />
        )}
      </main>
    </div>
  );
}
