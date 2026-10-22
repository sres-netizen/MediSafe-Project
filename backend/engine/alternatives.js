const drugsData = require('../data/drugs.json');
const drugDiseaseData = require('../data/drugDisease.json');
const drugAllergyData = require('../data/drugAllergy.json');
const pregnancyData = require('../data/pregnancy.json');
const { analyzeRegimen } = require('./analyzer');

// Map for quick drug lookup
const drugMap = new Map();
drugsData.forEach(d => drugMap.set(d.id.toLowerCase(), d));

/**
 * Checks whether a candidate drug is safe against the patient's profile
 * (no allergy triggers, no condition conflicts, no pregnancy contraindications)
 */
function isDrugSafeForPatient(candidateDrug, profile = {}) {
  const patientAllergies = Array.isArray(profile.allergies) ? profile.allergies : [];
  const patientConditions = Array.isArray(profile.conditions) ? profile.conditions : [];
  const isPregnant = Boolean(profile.pregnant);

  // 1. Check Pregnancy
  if (isPregnant) {
    if (candidateDrug.safeInPregnancy === false || pregnancyData[candidateDrug.id]) {
      return { safe: false, reason: 'Contraindicated in pregnancy' };
    }
  }

  // 2. Check Allergies
  for (const allergy of patientAllergies) {
    const normAllergy = allergy.trim().toLowerCase();

    // Direct match with candidate drug name or id
    if (candidateDrug.id === normAllergy || candidateDrug.genericName.toLowerCase() === normAllergy) {
      return { safe: false, reason: `Direct allergy to ${candidateDrug.genericName}` };
    }

    for (const [allergyKey, rule] of Object.entries(drugAllergyData)) {
      if (normAllergy.includes(allergyKey) || allergyKey.includes(normAllergy)) {
        if (rule.affectedDrugs.includes(candidateDrug.id)) {
          return { safe: false, reason: `Triggers patient allergy (${rule.allergyName || allergy})` };
        }
      }
    }
  }

  // 3. Check Condition Conflicts
  for (const condition of patientConditions) {
    const normCond = condition.trim().toLowerCase();
    const conflict = drugDiseaseData.find(rule => {
      if (rule.drug !== candidateDrug.id) return false;
      const ruleCond = rule.condition.toLowerCase();
      return normCond.includes(ruleCond) || ruleCond.includes(normCond);
    });

    if (conflict && conflict.severity === 'major') {
      return { safe: false, reason: `Contraindicated with ${condition}` };
    }
  }

  return { safe: true };
}

/**
 * Finds vetted same-class safer alternatives for drugs involved in major or moderate findings.
 * Computes the projected score if the drug is swapped.
 * 
 * @param {Object} params
 * @param {Array<Object>} params.medications - Currently analyzed medications
 * @param {Array<Object>} params.findings - Current findings
 * @param {Object} params.profile - Patient profile
 * @param {Array<string>} [params.foodItems] - Active food/supplement items
 * @param {number} params.currentScore - Current safety score
 * @returns {Array<Object>} List of vetted alternative suggestions grouped by problematic drug
 */
function findSaferAlternatives({ medications = [], findings = [], profile = {}, foodItems = [], currentScore = 100 }) {
  const suggestions = [];

  // Identify problematic drugs involved in major or moderate findings
  const problematicDrugIds = new Set();
  findings.forEach(f => {
    if (f.severity === 'major' || f.severity === 'moderate') {
      // Find matching medication objects
      medications.forEach(m => {
        if (f.itemsInvolved.some(item => 
          item.toLowerCase() === m.genericName.toLowerCase() || 
          item.toLowerCase() === m.id.toLowerCase()
        )) {
          problematicDrugIds.add(m.id);
        }
      });
    }
  });

  problematicDrugIds.forEach(drugId => {
    const originalDrug = drugMap.get(drugId);
    if (!originalDrug) return;

    const candidateIds = originalDrug.sameClassAlternatives || [];
    const vettedAlternatives = [];

    candidateIds.forEach(altId => {
      const candidateDrug = drugMap.get(altId.toLowerCase());
      if (!candidateDrug) return;

      // Ensure candidate isn't already in the regimen
      if (medications.some(m => m.id === candidateDrug.id)) return;

      // Check safety against patient profile (allergies, conditions, pregnancy)
      const safetyCheck = isDrugSafeForPatient(candidateDrug, profile);
      if (!safetyCheck.safe) return; // Exclude unsafe alternative

      // Simulate swap: Replace originalDrug with candidateDrug
      const simulatedMeds = medications
        .filter(m => m.id !== drugId)
        .concat([candidateDrug]);

      const simulatedReport = analyzeRegimen({
        profile,
        medications: simulatedMeds,
        foodItems
      });

      const projectedScore = simulatedReport.safetyScore;
      const scoreDiff = projectedScore - currentScore;

      // Only recommend if it improves or maintains a safe score
      if (projectedScore > currentScore || projectedScore >= 80) {
        vettedAlternatives.push({
          candidateId: candidateDrug.id,
          candidateName: candidateDrug.genericName,
          candidateClass: candidateDrug.drugClass,
          projectedScore,
          scoreDiff,
          timingNotes: candidateDrug.timingNotes,
          clinicalRationale: `Swapping ${originalDrug.genericName} for ${candidateDrug.genericName} avoids the detected interaction and projects a score improvement of +${scoreDiff > 0 ? scoreDiff : 0} points.`
        });
      }
    });

    if (vettedAlternatives.length > 0) {
      // Sort by projected score descending
      vettedAlternatives.sort((a, b) => b.projectedScore - a.projectedScore);

      suggestions.push({
        problematicDrugId: originalDrug.id,
        problematicDrugName: originalDrug.genericName,
        drugClass: originalDrug.drugClass,
        alternatives: vettedAlternatives,
        disclaimer: 'Discuss any change with your doctor or pharmacist. Never adjust prescribed medications on your own.'
      });
    }
  });

  return suggestions;
}

module.exports = {
  findSaferAlternatives,
  isDrugSafeForPatient
};
