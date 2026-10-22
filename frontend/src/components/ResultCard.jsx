import React, { useState } from 'react';
import ScoreGauge from './ScoreGauge';
import ScoreBreakdown from './ScoreBreakdown';
import FindingCard from './FindingCard';
import ExplanationSlider from './ExplanationSlider';
import HonestyReport from './HonestyReport';
import WhatIfSimulator from './WhatIfSimulator';
import SaferAlternatives from './SaferAlternatives';

export default function ResultCard({
  result,
  profile,
  foodItems,
  onReset,
  onApplyModifiedRegimen
}) {
  const [explanationDepth, setExplanationDepth] = useState('simple');

  if (!result) return null;

  const findings = result.findings || [];
  const deductions = result.deductions || [];
  const suggestedAlternatives = result.suggestedAlternatives || [];

  return (
    <div className="results-wrapper" id="analysis-result" data-testid="analysis-result">
      {/* Top Banner */}
      <div className="results-top-banner">
        <div>
          <h2>Medication Safety Risk Assessment</h2>
          <p className="results-subtitle">
            Personalized clinical safety evaluation for {result.patientName || 'Patient'}
          </p>
        </div>
        <button
          type="button"
          id="analyze-again-button"
          data-testid="analyze-again-button"
          className="btn btn-outline btn-analyze-again"
          onClick={onReset}
        >
          🔄 Check Another Regimen
        </button>
      </div>

      {/* Regimen Summary Bar */}
      <div className="regimen-summary-bar">
        <div className="summary-item">
          <strong>Patient:</strong> {result.patientName} ({result.age ? `${result.age} yrs, ` : ''}{result.gender})
        </div>
        <div className="summary-item">
          <strong>Conditions:</strong> {result.conditions?.length ? result.conditions.join(', ') : 'None'}
        </div>
        <div className="summary-item">
          <strong>Allergies:</strong> {result.allergies?.length ? result.allergies.join(', ') : 'None'}
        </div>
        <div className="summary-item">
          <strong>Medications:</strong> {result.medications?.map(m => m.genericName).join(', ') || 'None'}
        </div>
      </div>

      {/* Top Grid: Gauge + Traceable Deductions */}
      <div className="results-overview-grid">
        <ScoreGauge score={result.safetyScore} riskLevel={result.riskLevel} />
        <ScoreBreakdown deductions={deductions} finalScore={result.safetyScore} />
      </div>

      {/* STAGE 2: Interactive What-If Regimen Simulator */}
      <div className="what-if-section">
        <WhatIfSimulator
          originalResult={result}
          profile={profile}
          foodItems={foodItems}
          onApplyChanges={onApplyModifiedRegimen}
        />
      </div>

      {/* STAGE 2: Safer Alternatives Recommendations */}
      {(suggestedAlternatives.length > 0 || findings.length > 0) && (
        <div className="safer-alternatives-section">
          <SaferAlternatives
            suggestions={suggestedAlternatives}
            hasFindings={findings.length > 0}
            onSimulateSwap={(origId, candidateId, candidateName, candidateClass) => {
              // Scroll up to What-If simulator with helpful highlight
              const simEl = document.querySelector('.what-if-card');
              if (simEl) {
                simEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
          />
        </div>
      )}

      {/* Explanation Depth Selector */}
      <div className="depth-slider-section">
        <ExplanationSlider depth={explanationDepth} setDepth={setExplanationDepth} />
      </div>

      {/* Findings Section */}
      <div className="findings-container">
        <div className="findings-header">
          <h3>
            Clinical Findings & Interactions ({findings.length})
          </h3>
          <span className="findings-sort-note">Sorted by severity (Major ➔ Moderate ➔ Minor)</span>
        </div>

        {findings.length === 0 ? (
          <div className="card clean-findings-card">
            <div className="clean-findings-icon">✅</div>
            <h4>No Known Adverse Interactions Detected</h4>
            <p className="clean-findings-message" id="risk-message" data-testid="risk-message">
              No significant interaction detected in this prototype analysis.
            </p>
            <p className="clean-findings-precaution" id="recommendation" data-testid="recommendation">
              Continue according to the prescribed instructions and consult a healthcare professional if concerns arise.
            </p>
          </div>
        ) : (
          <div className="findings-list">
            {findings.map((finding, idx) => (
              <FindingCard
                key={`${finding.id}-${idx}`}
                finding={finding}
                depth={explanationDepth}
                isFirst={idx === 0}
              />
            ))}
          </div>
        )}
      </div>

      {/* Honesty & Coverage Report */}
      <div className="honesty-section">
        <HonestyReport coverageReport={result.coverageReport} />
      </div>

      {/* Bottom Actions */}
      <div className="results-bottom-actions">
        <button
          type="button"
          className="btn btn-primary btn-large"
          onClick={onReset}
        >
          ← Return to Regimen Editor
        </button>
      </div>
    </div>
  );
}
