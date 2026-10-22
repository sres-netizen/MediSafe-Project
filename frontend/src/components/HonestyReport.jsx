import React from 'react';

export default function HonestyReport({ coverageReport }) {
  if (!coverageReport) return null;

  const {
    knownMedicationsCount,
    unknownMedicationsCount,
    unknownMedications,
    totalPairs,
    evaluatedPairs,
    coveragePercent,
    coverageText,
    honestyDisclaimer
  } = coverageReport;

  return (
    <div className="card honesty-card">
      <div className="card-header honesty-header">
        <div className="header-icon">🛡️</div>
        <div>
          <h3>Data Coverage & Clinical Honesty Report</h3>
          <p className="card-subtitle">
            <strong>"No Data Is Not Safe"</strong> — MediSafe never assumes unlisted pairs are safe
          </p>
        </div>
      </div>

      <div className="card-body">
        {/* Coverage Progress Bar */}
        <div className="coverage-metrics-box">
          <div className="coverage-top-row">
            <span className="coverage-stat-label">
              Database Rule Coverage: <strong>{evaluatedPairs} of {totalPairs} potential pairs evaluated</strong>
            </span>
            <span className="coverage-percentage-badge">
              {coveragePercent}% Verified Pairs
            </span>
          </div>

          <div className="coverage-bar-track">
            <div
              className="coverage-bar-fill"
              style={{ width: `${Math.max(10, Math.min(100, coveragePercent))}%` }}
            ></div>
          </div>

          <p className="coverage-explanation-text">
            {coverageText}
          </p>
        </div>

        {/* Unknown Medications / Insufficient Data Section */}
        {unknownMedications && unknownMedications.length > 0 && (
          <div className="unknown-meds-alert">
            <div className="alert-title-row">
              <span className="alert-badge-grey">Not Enough Data</span>
              <strong>Unrecognized Medications in Regimen:</strong>
            </div>
            <p className="alert-description">
              The following medicines were not found in our current offline seed database. Because no clinical rules exist for them, their safety cannot be calculated.
            </p>
            <div className="unknown-chips-list">
              {unknownMedications.map((item, idx) => (
                <span key={idx} className="chip chip-grey-unknown">
                  ⚠️ {item.name} <em>({item.status})</em>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Mandatory Honesty Statement */}
        <div className="honesty-disclaimer-callout">
          <span className="callout-icon">ℹ️</span>
          <p className="callout-text">
            {honestyDisclaimer}
          </p>
        </div>
      </div>
    </div>
  );
}
