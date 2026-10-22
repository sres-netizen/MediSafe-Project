import React from 'react';

export default function ScoreGauge({ score, riskLevel }) {
  // Determine color and class based on score
  let strokeColor = '#16a34a'; // Safe Green
  let badgeClass = 'badge-safe';
  let riskText = 'Safe';

  if (score < 50) {
    strokeColor = '#dc2626'; // High Risk Red
    badgeClass = 'badge-high';
    riskText = 'High Risk';
  } else if (score <= 79) {
    strokeColor = '#ca8a04'; // Moderate Risk Yellow
    badgeClass = 'badge-moderate';
    riskText = 'Moderate Risk';
  }

  // SVG Gauge calculations (radius = 70, circumference = 2 * PI * 70 = 439.82)
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  // Arc gauge from 0 to 100
  const strokeDashoffset = circumference - (score / 100) * (circumference * 0.75);

  return (
    <div className="score-gauge-card">
      <div className="gauge-container">
        <svg className="gauge-svg" viewBox="0 0 180 180">
          {/* Background circle track */}
          <circle
            cx="90"
            cy="90"
            r={radius}
            className="gauge-bg"
            strokeWidth="14"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * 0.25}
            transform="rotate(135 90 90)"
          />
          {/* Active score meter */}
          <circle
            cx="90"
            cy="90"
            r={radius}
            className="gauge-meter"
            strokeWidth="14"
            fill="none"
            stroke={strokeColor}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(135 90 90)"
          />
        </svg>

        {/* Inner Score Numbers (Preserves Selenium TC07 test IDs) */}
        <div className="gauge-inner">
          <span className="gauge-score-number" id="safety-score" data-testid="safety-score">
            {score}
          </span>
          <span className="gauge-score-max">/ 100</span>
          <span className="gauge-label">Safety Index</span>
        </div>
      </div>

      <div className="gauge-footer">
        <span className="risk-level-tag-label">Personalized Regimen Risk:</span>
        <div id="risk-level" data-testid="risk-level" className={`risk-badge-large ${badgeClass}`}>
          {riskText}
        </div>
      </div>
    </div>
  );
}
