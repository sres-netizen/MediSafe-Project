import React from 'react';

export default function SaferAlternatives({ suggestions = [], hasFindings = false, onSimulateSwap }) {
  if (!suggestions || suggestions.length === 0) {
    // Only show if there were findings — otherwise section shouldn't appear at all
    if (!hasFindings) return null;
    return (
      <div className="card safer-alternatives-card">
        <div className="card-header alternatives-header">
          <div className="header-icon">🔄</div>
          <div>
            <h3>Personalized Safer Alternative Recommendations</h3>
            <p className="card-subtitle">
              Vetted therapeutic alternatives from the same drug class that avoid your specific allergies, conditions, and interactions
            </p>
          </div>
        </div>
        <div className="card-body">
          <div className="alternatives-empty-state">
            <span className="empty-alt-icon">✅</span>
            <div>
              <h4>No Same-Class Swap Available</h4>
              <p>
                All same-class alternatives in our database either conflict with your allergies/conditions,
                are already in your regimen, or would not improve your safety score.
                Please consult your doctor or pharmacist for a personalised alternative.
              </p>
            </div>
          </div>
          <div className="alternatives-mandatory-disclaimer">
            <span className="disclaimer-icon">🩺</span>
            <div>
              <strong>Important Clinical Notice:</strong>
              <p>
                These suggestions are generated using deterministic pharmacology class rules and your profile data.
                Always discuss any change with your doctor or pharmacist before stopping or substituting any prescribed medication.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card safer-alternatives-card">
      <div className="card-header alternatives-header">
        <div className="header-icon">🔄</div>
        <div>
          <h3>Personalized Safer Alternative Recommendations</h3>
          <p className="card-subtitle">
            Vetted therapeutic alternatives from the same drug class that avoid your specific allergies, conditions, and interactions
          </p>
        </div>
      </div>

      <div className="card-body">
        <div className="alternatives-groups-list">
          {suggestions.map((group, groupIdx) => (
            <div key={groupIdx} className="alternative-drug-group">
              <div className="problematic-drug-banner">
                <span className="alert-icon">⚠️</span>
                <div>
                  <h4 className="group-title">
                    Problematic Medication: <strong>{group.problematicDrugName}</strong>
                  </h4>
                  <span className="group-subtitle">
                    Therapeutic Class: {group.drugClass}
                  </span>
                </div>
              </div>

              <div className="candidates-grid">
                {group.alternatives.map((alt, altIdx) => {
                  let scoreBadgeClass = 'badge-safe';
                  if (alt.projectedScore < 50) scoreBadgeClass = 'badge-high';
                  else if (alt.projectedScore <= 79) scoreBadgeClass = 'badge-moderate';

                  return (
                    <div key={altIdx} className="candidate-card">
                      <div className="candidate-top-row">
                        <div>
                          <span className="candidate-tag">Same-Class Option</span>
                          <h5 className="candidate-name">{alt.candidateName}</h5>
                          <span className="candidate-class">{alt.candidateClass}</span>
                        </div>
                        <div className="projected-score-container">
                          <span className="projected-label">Projected Score:</span>
                          <div className={`projected-score-pill ${scoreBadgeClass}`}>
                            <strong>{alt.projectedScore}</strong> / 100
                            {alt.scoreDiff > 0 && (
                              <span className="score-gain-pill">+{alt.scoreDiff} pts</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <p className="candidate-rationale">
                        {alt.clinicalRationale}
                      </p>

                      {alt.timingNotes && (
                        <div className="candidate-timing">
                          <span className="timing-label">Dosing / Timing:</span>
                          <span className="timing-text">{alt.timingNotes}</span>
                        </div>
                      )}

                      {onSimulateSwap && (
                        <div className="candidate-action-row">
                          <button
                            type="button"
                            className="btn btn-outline btn-swap"
                            onClick={() => onSimulateSwap(group.problematicDrugId, alt.candidateId, alt.candidateName, alt.candidateClass)}
                          >
                            🧪 Test Swap ({group.problematicDrugName} ➔ {alt.candidateName})
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Mandatory Doctor Consultation Notice */}
        <div className="alternatives-mandatory-disclaimer">
          <span className="disclaimer-icon">🩺</span>
          <div>
            <strong>Important Clinical Notice:</strong>
            <p>
              These suggestions are generated using deterministic pharmacology class rules and your profile data. Always discuss any change with your doctor or pharmacist before stopping or substituting any prescribed medication.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
