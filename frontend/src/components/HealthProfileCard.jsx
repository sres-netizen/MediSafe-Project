import React, { useState } from 'react';

const COMMON_ALLERGIES = [
  'Penicillin',
  'Aspirin',
  'NSAID',
  'Sulfa',
  'Cephalosporin',
  'Opioid',
  'Statin',
  'Ciprofloxacin'
];

const COMMON_CONDITIONS = [
  'Hypertension',
  'Chronic Kidney Disease',
  'Peptic Ulcer Disease',
  'Diabetes',
  'Asthma',
  'Epilepsy',
  'Liver Disease',
  'Sleep Apnea',
  'Active Bleeding'
];

export default function HealthProfileCard({
  patientName,
  setPatientName,
  age,
  setAge,
  gender,
  setGender,
  pregnant,
  setPregnant,
  allergies,
  setAllergies,
  conditions,
  setConditions
}) {
  const [allergyInput, setAllergyInput] = useState('');
  const [conditionInput, setConditionInput] = useState('');

  const addAllergy = (item) => {
    const val = item.trim();
    if (val && !allergies.includes(val)) {
      setAllergies([...allergies, val]);
      setAllergyInput('');
    }
  };

  const removeAllergy = (item) => {
    setAllergies(allergies.filter(a => a !== item));
  };

  const addCondition = (item) => {
    const val = item.trim();
    if (val && !conditions.includes(val)) {
      setConditions([...conditions, val]);
      setConditionInput('');
    }
  };

  const removeCondition = (item) => {
    setConditions(conditions.filter(c => c !== item));
  };

  return (
    <div className="card profile-card">
      <div className="card-header">
        <div className="header-icon">👤</div>
        <div>
          <h3>Optional Health Profile</h3>
          <p className="card-subtitle">Personalize safety checks against your allergies, conditions, and biology</p>
        </div>
      </div>

      <div className="card-body">
        {/* Patient Name (Preserves TC04 test ID) */}
        <div className="form-group">
          <label htmlFor="patient-name">Patient Name / Identifier</label>
          <input
            type="text"
            id="patient-name"
            data-testid="patient-name"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="e.g. John Doe (or leave anonymous)"
          />
        </div>

        {/* Demographics Row */}
        <div className="form-row-3">
          <div className="form-group">
            <label htmlFor="patient-age">Age (Years)</label>
            <input
              type="number"
              id="patient-age"
              data-testid="patient-age"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 54"
              min="1"
              max="120"
            />
          </div>

          <div className="form-group">
            <label htmlFor="patient-gender">Gender</label>
            <select
              id="patient-gender"
              data-testid="patient-gender"
              value={gender}
              onChange={(e) => {
                const newGender = e.target.value;
                setGender(newGender);
                if (newGender === 'Male') setPregnant(false);
              }}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="patient-pregnant">Pregnant?</label>
            <select
              id="patient-pregnant"
              value={pregnant ? 'yes' : 'no'}
              onChange={(e) => setPregnant(e.target.value === 'yes')}
              disabled={gender === 'Male'}
              className={gender === 'Male' ? 'disabled-input' : ''}
            >
              <option value="no">No / Not Applicable</option>
              <option value="yes">Yes, Currently Pregnant</option>
            </select>
          </div>
        </div>

        {/* Existing Conditions Section (Preserves patient-disease ID) */}
        <div className="form-group">
          <label htmlFor="patient-disease">Existing Medical Conditions</label>
          <div className="search-tag-input">
            <input
              type="text"
              id="patient-disease"
              data-testid="patient-disease"
              value={conditionInput}
              onChange={(e) => setConditionInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCondition(conditionInput);
                }
              }}
              placeholder="Type condition (e.g. Hypertension, Kidney Disease) and press Enter"
            />
            {conditionInput && (
              <button
                type="button"
                className="btn-add-tag"
                onClick={() => addCondition(conditionInput)}
              >
                + Add
              </button>
            )}
          </div>

          {/* Quick preset chips */}
          <div className="preset-chips">
            <span className="chips-label">Quick select:</span>
            {COMMON_CONDITIONS.map(c => (
              <button
                key={c}
                type="button"
                className={`chip chip-preset ${conditions.includes(c) ? 'active' : ''}`}
                onClick={() => conditions.includes(c) ? removeCondition(c) : addCondition(c)}
              >
                {conditions.includes(c) ? '✓ ' : '+ '}{c}
              </button>
            ))}
          </div>

          {/* Selected Conditions list */}
          {conditions.length > 0 && (
            <div className="selected-chips-container">
              {conditions.map(c => (
                <span key={c} className="chip chip-selected condition-chip">
                  🏥 {c}
                  <button type="button" onClick={() => removeCondition(c)} className="chip-remove">×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Known Allergies Section (Preserves patient-allergy ID) */}
        <div className="form-group">
          <label htmlFor="patient-allergy">Known Medication Allergies</label>
          <div className="search-tag-input">
            <input
              type="text"
              id="patient-allergy"
              data-testid="patient-allergy"
              value={allergyInput}
              onChange={(e) => setAllergyInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addAllergy(allergyInput);
                }
              }}
              placeholder="Type allergy (e.g. Penicillin, Aspirin, Sulfa) and press Enter"
            />
            {allergyInput && (
              <button
                type="button"
                className="btn-add-tag"
                onClick={() => addAllergy(allergyInput)}
              >
                + Add
              </button>
            )}
          </div>

          {/* Quick preset chips */}
          <div className="preset-chips">
            <span className="chips-label">Common allergies:</span>
            {COMMON_ALLERGIES.map(a => (
              <button
                key={a}
                type="button"
                className={`chip chip-preset ${allergies.includes(a) ? 'active' : ''}`}
                onClick={() => allergies.includes(a) ? removeAllergy(a) : addAllergy(a)}
              >
                {allergies.includes(a) ? '✓ ' : '+ '}{a}
              </button>
            ))}
          </div>

          {/* Selected Allergies list */}
          {allergies.length > 0 && (
            <div className="selected-chips-container">
              {allergies.map(a => (
                <span key={a} className="chip chip-selected allergy-chip">
                  ⚠️ {a}
                  <button type="button" onClick={() => removeAllergy(a)} className="chip-remove">×</button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
