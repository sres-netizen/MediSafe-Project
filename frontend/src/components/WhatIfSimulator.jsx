import React, { useState, useEffect } from 'react';
import { runClientAnalysis } from '../services/clientEngine';

export default function WhatIfSimulator({
  originalResult,
  profile,
  foodItems,
  onApplyChanges
}) {
  const originalMeds = originalResult?.medications || [];
  
  // State: Set of drug IDs that are actively enabled in the simulator
  const [enabledDrugIds, setEnabledDrugIds] = useState(
    new Set(originalMeds.map(m => m.id))
  );

  // State: Additional simulated medications (e.g. from safer alternative swaps)
  const [extraSimulatedMeds, setExtraSimulatedMeds] = useState([]);

  // State: Recalculated simulated result
  const [simulatedResult, setSimulatedResult] = useState(originalResult);

  // Reset simulation state when a new analysis result arrives
  useEffect(() => {
    setEnabledDrugIds(new Set(originalMeds.map(m => m.id)));
    setExtraSimulatedMeds([]);
    setSimulatedResult(originalResult);
  }, [originalResult]);

  // Re-run the pure function engine whenever toggles or extra meds change
  useEffect(() => {
    const activeOriginal = originalMeds.filter(m => enabledDrugIds.has(m.id));
    const allSimulated = [...activeOriginal, ...extraSimulatedMeds];

    const newResult = runClientAnalysis({
      profile,
      medications: allSimulated,
      foodItems
    }, false);

    setSimulatedResult(newResult);
  }, [enabledDrugIds, extraSimulatedMeds]);

  const toggleDrug = (drugId) => {
    const updated = new Set(enabledDrugIds);
    if (updated.has(drugId)) {
      updated.delete(drugId);
    } else {
      updated.add(drugId);
    }
    setEnabledDrugIds(updated);
  };

  const removeExtraMed = (drugId) => {
    setExtraSimulatedMeds(extraSimulatedMeds.filter(m => m.id !== drugId));
  };

  const resetToggles = () => {
    setEnabledDrugIds(new Set(originalMeds.map(m => m.id)));
    setExtraSimulatedMeds([]);
  };

  const handleApply = () => {
    if (onApplyChanges) {
      const activeOriginal = originalMeds.filter(m => enabledDrugIds.has(m.id));
      const allSimulated = [...activeOriginal, ...extraSimulatedMeds];
      onApplyChanges(allSimulated);
    }
  };

  // Compare original findings vs simulated findings to identify resolved conflicts
  const originalFindings = originalResult?.findings || [];
  const currentSimulatedFindings = simulatedResult?.findings || [];
  
  const resolvedFindings = originalFindings.filter(origF => 
    !currentSimulatedFindings.some(simF => simF.id === origF.id)
  );

  const originalScore = originalResult?.safetyScore ?? 100;
  const currentScore = simulatedResult?.safetyScore ?? 100;
  const scoreDiff = currentScore - originalScore;

  let scoreDiffClass = 'diff-neutral';
  if (scoreDiff > 0) scoreDiffClass = 'diff-positive';
  else if (scoreDiff < 0) scoreDiffClass = 'diff-negative';

  let simulatedRiskBadge = 'badge-safe';
  if (currentScore < 50) simulatedRiskBadge = 'badge-high';
  else if (currentScore <= 79) simulatedRiskBadge = 'badge-moderate';

  return (
    <div className="card what-if-card">
      <div className="card-header what-if-header">
        <div className="header-icon">🧪</div>
        <div className="header-text-container">
          <div className="title-with-pill">
            <h3>Interactive "What-If" Regimen Simulator</h3>
            <span className="live-engine-pill">⚡ Instant Live Recalculation</span>
          </div>
          <p className="card-subtitle">
            Toggle any medicine off to see how removing it impacts your safety score and which warnings disappear
          </p>
        </div>
      </div>

      <div className="card-body">
        {/* Before ➔ After Comparison Meter */}
        <div className="score-comparison-banner">
          <div className="comparison-metric">
            <span className="metric-label">Original Score</span>
            <div className="metric-value-box original-box">
              <span className="score-num">{originalScore}</span>
              <span className="score-denom">/100</span>
            </div>
            <span className="metric-risk-label">({originalResult?.riskLevel} Risk)</span>
          </div>

          <div className="comparison-arrow-box">
            <span className="arrow-icon">➔</span>
            <span className={`score-diff-pill ${scoreDiffClass}`}>
              {scoreDiff > 0 ? `+${scoreDiff} pts` : (scoreDiff === 0 ? 'No Change' : `${scoreDiff} pts`)}
            </span>
          </div>

          <div className="comparison-metric">
            <span className="metric-label">Simulated Score</span>
            <div className={`metric-value-box simulated-box ${simulatedRiskBadge}`}>
              <span className="score-num">{currentScore}</span>
              <span className="score-denom">/100</span>
            </div>
            <span className={`metric-risk-label simulated-risk-text ${simulatedRiskBadge}`}>
              ({simulatedResult?.riskLevel} Risk)
            </span>
          </div>
        </div>

        {/* Medicines Toggle Matrix */}
        <div className="simulator-toggles-section">
          <div className="toggles-header">
            <h4>Active Medication Controls</h4>
            <button
              type="button"
              className="btn-reset-simulator"
              onClick={resetToggles}
              title="Reset all toggles to original regimen"
            >
              ↺ Reset Toggles
            </button>
          </div>

          <div className="toggles-grid">
            {originalMeds.map((med) => {
              const isEnabled = enabledDrugIds.has(med.id);
              return (
                <div
                  key={med.id}
                  className={`toggle-row ${isEnabled ? 'toggle-active' : 'toggle-disabled'}`}
                  onClick={() => toggleDrug(med.id)}
                >
                  <div className="toggle-switch-container">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() => {}} // Handled by container click
                      className="toggle-checkbox"
                    />
                    <span className="toggle-slider"></span>
                  </div>

                  <div className="toggle-drug-info">
                    <span className="toggle-drug-name">
                      {med.brandName ? `${med.brandName} (${med.genericName})` : med.genericName}
                    </span>
                    <span className="toggle-drug-class">{med.drugClass}</span>
                  </div>

                  <span className={`status-state-pill ${isEnabled ? 'state-active' : 'state-off'}`}>
                    {isEnabled ? 'Active in Regimen' : 'Temporarily Disabled'}
                  </span>
                </div>
              );
            })}

            {/* Extra Simulated Medications (Swaps) */}
            {extraSimulatedMeds.map((med) => (
              <div key={med.id} className="toggle-row toggle-extra-swap">
                <span className="swap-indicator-icon">🔄</span>
                <div className="toggle-drug-info">
                  <span className="toggle-drug-name">{med.genericName}</span>
                  <span className="toggle-drug-class">Simulated Alternative ({med.drugClass})</span>
                </div>
                <button
                  type="button"
                  className="btn-remove-extra"
                  onClick={() => removeExtraMed(med.id)}
                  title="Remove simulated alternative"
                >
                  Remove ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Resolved Conflicts vs Remaining Conflicts */}
        <div className="conflict-impact-grid">
          {/* Disappeared / Resolved Findings */}
          <div className="resolved-panel">
            <div className="panel-title-row">
              <span className="icon-check">✅</span>
              <h5>Resolved Conflicts ({resolvedFindings.length})</h5>
            </div>
            {resolvedFindings.length === 0 ? (
              <p className="empty-panel-text">
                Toggle off a problematic drug above to eliminate active interactions.
              </p>
            ) : (
              <ul className="resolved-list">
                {resolvedFindings.map((f, idx) => (
                  <li key={idx} className="resolved-item">
                    <span className="strikethrough-title">{f.title}</span>
                    <span className="points-restored-tag">+{f.pointsLost} pts restored</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Remaining Findings */}
          <div className="remaining-panel">
            <div className="panel-title-row">
              <span className="icon-warn">⚠️</span>
              <h5>Remaining Warnings ({currentSimulatedFindings.length})</h5>
            </div>
            {currentSimulatedFindings.length === 0 ? (
              <p className="clean-panel-text">
                🎉 No conflicts detected with this simulated combination!
              </p>
            ) : (
              <ul className="remaining-list">
                {currentSimulatedFindings.map((f, idx) => (
                  <li key={idx} className="remaining-item">
                    <span>{f.title}</span>
                    <span className={`mini-severity ${f.severity}`}>{f.severity}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Action Button: Apply Changes */}
        {scoreDiff !== 0 && (
          <div className="apply-changes-footer">
            <button
              type="button"
              className="btn btn-primary btn-apply-sim"
              onClick={handleApply}
            >
              ✓ Update Regimen with this Simulated Plan
            </button>
            <p className="disclaimer-note">
              * Remember to always consult with your prescribing physician before making actual changes to your medication schedule.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
