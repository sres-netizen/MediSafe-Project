import React from 'react';

export default function ExplanationSlider({ depth, setDepth }) {
  const options = [
    { id: 'simple', label: 'Simple', desc: 'Plain language for patients' },
    { id: 'detailed', label: 'Detailed', desc: 'Pharmacology mechanism & organ impact' },
    { id: 'clinician', label: 'Clinician', desc: 'Pharmacokinetic & prescribing guidelines' }
  ];

  return (
    <div className="explanation-slider-container">
      <div className="slider-header">
        <span className="slider-title">🔍 Explanation Depth Level:</span>
        <span className="slider-active-label">
          Currently displaying: <strong>{depth.toUpperCase()}</strong> explanations
        </span>
      </div>

      <div className="slider-buttons-group">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={`slider-pill-btn ${depth === opt.id ? 'active' : ''}`}
            onClick={() => setDepth(opt.id)}
          >
            <span className="pill-name">{opt.label}</span>
            <span className="pill-desc">{opt.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
