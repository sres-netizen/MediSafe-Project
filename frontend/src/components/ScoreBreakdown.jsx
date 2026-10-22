import React from 'react';

export default function ScoreBreakdown({ deductions, finalScore }) {
  const totalLost = deductions.reduce((sum, d) => sum + d.pointsLost, 0);

  return (
    <div className="card breakdown-card">
      <div className="card-header">
        <div className="header-icon">📊</div>
        <div>
          <h3>Traceable Score Breakdown</h3>
          <p className="card-subtitle">
            Every point lost is 100% deterministic and mapped directly to a clinical rule
          </p>
        </div>
      </div>

      <div className="card-body">
        {/* Starting baseline pill */}
        <div className="breakdown-baseline-row">
          <span className="baseline-title">Starting Baseline Safety Score:</span>
          <span className="baseline-score">100 / 100</span>
        </div>

        {deductions.length === 0 ? (
          <div className="no-deductions-box">
            <span className="check-icon">✓</span>
            <div>
              <strong>No Safety Deductions Triggered</strong>
              <p>Your current regimen did not trigger any active conflict rules in our database.</p>
            </div>
          </div>
        ) : (
          <div className="deductions-table-wrapper">
            <table className="deductions-table">
              <thead>
                <tr>
                  <th>Clinical Conflict / Trigger</th>
                  <th>Severity</th>
                  <th>Points Deducted</th>
                </tr>
              </thead>
              <tbody>
                {deductions.map((d, idx) => {
                  let badge = 'badge-minor';
                  if (d.severity === 'major') badge = 'badge-major';
                  else if (d.severity === 'moderate') badge = 'badge-moderate';

                  return (
                    <tr key={`${d.id}-${idx}`}>
                      <td className="deduction-title-cell">
                        <strong>{d.title}</strong>
                        <span className="deduction-items">
                          Involves: {d.itemsInvolved.join(' + ')}
                        </span>
                      </td>
                      <td>
                        <span className={`severity-tag ${badge}`}>
                          {d.severity.toUpperCase()}
                        </span>
                      </td>
                      <td className="points-cell">
                        <span className="points-lost-badge">-{d.pointsLost} pts</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="total-deduction-row">
                  <td colSpan="2">
                    <strong>Total Clinical Deductions:</strong>
                  </td>
                  <td className="points-cell">
                    <strong className="total-lost-text">-{totalLost} pts</strong>
                  </td>
                </tr>
                <tr className="final-score-row">
                  <td colSpan="2">
                    <strong>Calculated Regimen Safety Score:</strong>
                  </td>
                  <td className="points-cell">
                    <strong className="final-score-text">{finalScore} / 100</strong>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
