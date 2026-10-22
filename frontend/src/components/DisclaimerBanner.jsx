import React from 'react';

export default function DisclaimerBanner() {
  return (
    <div className="disclaimer-banner" role="alert">
      <div className="disclaimer-content">
        <span className="disclaimer-icon">⚠️</span>
        <span className="disclaimer-text">
          <strong>Medical Notice:</strong> MediSafe is an educational decision-support tool. It does not replace advice from a doctor or pharmacist.
        </span>
      </div>
    </div>
  );
}
