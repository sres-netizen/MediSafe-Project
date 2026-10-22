import React, { useState } from 'react';

export default function FindingCard({ finding, depth, isFirst }) {
  const [expanded, setExpanded] = useState(true);

  // Get explanation based on active depth
  const explanationText = finding.explanations?.[depth] || 
    finding.explanations?.simple || 
    finding.mechanism || 
    'Interaction detected.';

  let severityBadgeClass = 'badge-minor';
  if (finding.severity === 'major') severityBadgeClass = 'badge-major';
  else if (finding.severity === 'moderate') severityBadgeClass = 'badge-moderate';

  let evidenceBadgeClass = 'badge-evidence-est';
  if (finding.evidenceLevel === 'moderate') evidenceBadgeClass = 'badge-evidence-mod';
  else if (finding.evidenceLevel === 'theoretical') evidenceBadgeClass = 'badge-evidence-theo';

  return (
    <div className={`finding-card ${finding.severity}`}>
      <div className="finding-header">
        <div className="finding-title-row">
          <div className="finding-badges">
            <span className={`severity-badge ${severityBadgeClass}`}>
              {finding.severity.toUpperCase()} RISK
            </span>
            {finding.type === 'cumulative-risk' && (
              <span className="type-badge badge-cumulative">
                📚 CUMULATIVE RISK
              </span>
            )}
            {finding.type === 'cyp-predicted' && (
              <span className="type-badge badge-predicted">
                🔬 PREDICTED VIA MECHANISM
              </span>
            )}
            <span className={`evidence-badge ${evidenceBadgeClass}`}>
              {finding.evidenceLevel === 'theoretical'
                ? 'Predicted via mechanism (not in pair database)'
                : `Evidence: ${finding.evidenceLevel?.toUpperCase() || 'ESTABLISHED'}`}
            </span>
            <span className="points-loss-tag">-{finding.pointsLost} pts</span>
          </div>
          <h4 className="finding-title">{finding.title}</h4>
          <div className="finding-items-row">
            <span className="items-label">Items involved:</span>
            {finding.itemsInvolved.map((item, idx) => (
              <span key={idx} className="item-pill">
                {item}
              </span>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="toggle-expand-btn"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
        >
          {expanded ? '▲ Hide Details' : '▼ View Explanation'}
        </button>
      </div>

      {expanded && (
        <div className="finding-body">
          {/* Why is this a problem accordion */}
          <div className="finding-section problem-section">
            <h5 className="section-heading">
              <span className="section-icon">❓</span> Why is this a problem?
            </h5>
            {/* Preserves TC07/TC08 risk-message ID on the primary finding */}
            <p
              className="explanation-paragraph"
              id={isFirst ? 'risk-message' : undefined}
              data-testid={isFirst ? 'risk-message' : undefined}
            >
              {explanationText}
            </p>
          </div>

          {/* What to do precaution section */}
          <div className="finding-section precaution-section">
            <h5 className="section-heading">
              <span className="section-icon">🛡️</span> What to do (Actionable Advice):
            </h5>
            {/* Preserves TC08 recommendation ID on the primary finding */}
            <p
              className="precaution-paragraph"
              id={isFirst ? 'recommendation' : undefined}
              data-testid={isFirst ? 'recommendation' : undefined}
            >
              {finding.precaution}
            </p>
          </div>

          {/* Clinical citation footer */}
          <div className="finding-footer">
            <span className="source-citation">
              <strong>Source:</strong> {finding.source || 'Standard clinical pharmacology reference'}
            </span>
            {finding.mechanism && depth !== 'simple' && (
              <span className="mechanism-note">
                <strong>Mechanism:</strong> {finding.mechanism}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
