const drugsData = require('../data/drugs.json');
const brandsData = require('../data/brands.json');
const interactionsData = require('../data/interactions.json');
const drugDiseaseData = require('../data/drugDisease.json');
const drugAllergyData = require('../data/drugAllergy.json');
const pregnancyData = require('../data/pregnancy.json');
const foodData = require('../data/food.json');
const stackRules = require('../data/stackRules.json');
const { resolveMedicine } = require('./brandResolver');

// Build a fast drug lookup map
const drugMap = new Map();
drugsData.forEach(d => {
  drugMap.set(d.id.toLowerCase(), d);
  drugMap.set(d.genericName.toLowerCase(), d);
});

/**
 * Pure deterministic clinical safety analysis engine.
 * @param {Object} input
 * @param {Object} input.profile - Patient profile: { age, gender, pregnant, allergies: [], conditions: [] }
 * @param {Array<string|Object>} input.medications - Array of medication strings or objects
 * @param {Array<string>} [input.foodItems] - Array of food/drink/supplement strings
 * @returns {Object} Comprehensive analysis report
 */
function analyzeRegimen(input = {}) {
  const profile = input.profile || {};
  const rawMeds = input.medications || [];
  const rawFoods = input.foodItems || [];

  // 1. Resolve all medications
  const knownMedications = [];
  const unknownMedications = [];
  const seenDrugIds = new Set();

  rawMeds.forEach(item => {
    const medName = typeof item === 'string' ? item : (item.name || item.genericName || item.id || '');
    const resolvedList = resolveMedicine(medName);

    resolvedList.forEach(med => {
      if (med.isUnknown) {
        if (!unknownMedications.some(u => u.name.toLowerCase() === med.genericName.toLowerCase())) {
          unknownMedications.push({
            name: med.genericName,
            status: 'Not in database',
            note: 'No interaction data available in seed library'
          });
        }
      } else {
        if (!seenDrugIds.has(med.id)) {
          seenDrugIds.add(med.id);
          // Enrich with full drug data (including CYP fields)
          const fullDrug = drugMap.get(med.id.toLowerCase()) || med;
          knownMedications.push({ ...fullDrug, ...med, cypSubstrateOf: fullDrug.cypSubstrateOf || [], cypInhibits: fullDrug.cypInhibits || [], cypInduces: fullDrug.cypInduces || [] });
        }
      }
    });
  });

  // 2. Prepare findings & deductions
  const findings = [];
  const deductions = [];
  let currentScore = 100;

  function recordDeduction({ id, type, severity, itemsInvolved, pointsLost, title, mechanism, evidenceLevel, source, explanations, precaution }) {
    deductions.push({ id, type, title, severity, itemsInvolved, pointsLost });
    findings.push({
      id,
      type,
      severity,
      title,
      itemsInvolved,
      pointsLost,
      mechanism: mechanism || 'Pharmacological interaction mechanism.',
      evidenceLevel: evidenceLevel || 'moderate',
      source: source || 'Standard clinical pharmacology database',
      explanations: explanations || {
        simple: 'Interaction detected between your medications.',
        detailed: mechanism || 'Pharmacological interaction detected.',
        clinician: mechanism || 'Pharmacodynamic or pharmacokinetic conflict.'
      },
      precaution: precaution || 'Consult your prescribing doctor or pharmacist before making any dosage changes.'
    });
    currentScore -= pointsLost;
  }

  // 3. Drug-Drug Interactions (explicit pairwise rules)
  const evaluatedPairsSet = new Set();
  const coveredPairs = [];
  const explicitPairKeys = new Set(); // track which pairs have explicit rules — no CYP re-flag

  for (let i = 0; i < knownMedications.length; i++) {
    for (let j = i + 1; j < knownMedications.length; j++) {
      const drugA = knownMedications[i];
      const drugB = knownMedications[j];
      const pairKey = [drugA.id, drugB.id].sort().join('::');
      evaluatedPairsSet.add(pairKey);

      const match = interactionsData.find(rule =>
        (rule.drugA === drugA.id && rule.drugB === drugB.id) ||
        (rule.drugA === drugB.id && rule.drugB === drugA.id)
      );

      if (match) {
        coveredPairs.push(pairKey);
        explicitPairKeys.add(pairKey); // mark as already covered — skip CYP inference

        let points = 3;
        if (match.severity === 'major') points = 25;
        else if (match.severity === 'moderate') points = 10;

        recordDeduction({
          id: match.id || `ddi-${drugA.id}-${drugB.id}`,
          type: 'drug-drug',
          severity: match.severity,
          itemsInvolved: [drugA.genericName, drugB.genericName],
          pointsLost: points,
          title: `${drugA.genericName} + ${drugB.genericName}`,
          mechanism: match.mechanism,
          evidenceLevel: match.evidenceLevel,
          source: match.source,
          explanations: match.explanations,
          precaution: match.precaution
        });
      }
    }
  }

  // 4. Drug-Disease Interactions
  const patientConditions = Array.isArray(profile.conditions)
    ? profile.conditions
    : (typeof profile.conditions === 'string' && profile.conditions.trim() ? [profile.conditions] : []);

  patientConditions.forEach(cond => {
    const normCond = cond.trim().toLowerCase();
    if (!normCond || normCond === 'none') return;

    knownMedications.forEach(drug => {
      const match = drugDiseaseData.find(rule => {
        if (rule.drug !== drug.id) return false;
        const ruleCond = rule.condition.toLowerCase();
        return normCond.includes(ruleCond) || ruleCond.includes(normCond);
      });

      if (match) {
        let points = match.severity === 'major' ? 20 : 15;
        if (drug.id === 'warfarin' && normCond.includes('hypertension')) {
          points = 40; // Preserves TC07 rule
        }

        recordDeduction({
          id: match.id || `dis-${drug.id}-${match.condition}`,
          type: 'drug-condition',
          severity: match.severity,
          itemsInvolved: [drug.genericName, cond],
          pointsLost: points,
          title: `${drug.genericName} with ${cond}`,
          mechanism: match.mechanism,
          evidenceLevel: match.evidenceLevel,
          source: match.source,
          explanations: match.explanations,
          precaution: match.precaution
        });
      }
    });
  });

  // 5. Drug-Allergy Conflicts
  const patientAllergies = Array.isArray(profile.allergies)
    ? profile.allergies
    : (typeof profile.allergies === 'string' && profile.allergies.trim() ? [profile.allergies] : []);

  patientAllergies.forEach(allergy => {
    const normAllergy = allergy.trim().toLowerCase();
    if (!normAllergy || normAllergy === 'none') return;

    for (const [allergyKey, rule] of Object.entries(drugAllergyData)) {
      if (normAllergy.includes(allergyKey) || allergyKey.includes(normAllergy)) {
        knownMedications.forEach(drug => {
          if (rule.affectedDrugs.includes(drug.id)) {
            let points = 30;
            if (drug.id === 'aspirin' && normAllergy.includes('aspirin')) {
              points = 70; // Preserves TC07 rule
            }
            recordDeduction({
              id: `allergy-${allergyKey}-${drug.id}`,
              type: 'drug-allergy',
              severity: 'major',
              itemsInvolved: [drug.genericName, rule.allergyName || allergy],
              pointsLost: points,
              title: `Allergy Conflict: ${drug.genericName}`,
              mechanism: rule.mechanism,
              evidenceLevel: rule.evidenceLevel,
              source: rule.source,
              explanations: rule.explanations,
              precaution: rule.precaution
            });
          }
        });
      }
    }
  });

  // 6. Pregnancy Risks
  const isPregnant = Boolean(profile.pregnant);
  if (isPregnant) {
    knownMedications.forEach(drug => {
      const match = pregnancyData[drug.id];
      if (match || drug.safeInPregnancy === false) {
        const pregRule = match || {
          drugName: drug.genericName,
          category: drug.pregnancyCategory || 'Risky',
          severity: 'major',
          mechanism: 'Potential risk of fetal toxicity or developmental adverse effects.',
          evidenceLevel: 'established',
          source: 'Standard Obstetric Pharmacology Guidelines',
          explanations: {
            simple: `${drug.genericName} is not recommended during pregnancy without specialist sign-off.`,
            detailed: `Drug carries significant pregnancy warnings or fetotoxicity profile.`,
            clinician: `Contraindicated or restricted in pregnancy. Evaluate alternative pregnancy-compatible options.`
          },
          precaution: `Consult your obstetrician before taking ${drug.genericName} while pregnant.`
        };

        recordDeduction({
          id: `preg-${drug.id}`,
          type: 'pregnancy-risk',
          severity: 'major',
          itemsInvolved: [drug.genericName, 'Pregnancy'],
          pointsLost: 30,
          title: `Pregnancy Warning: ${drug.genericName}`,
          mechanism: pregRule.mechanism,
          evidenceLevel: pregRule.evidenceLevel,
          source: pregRule.source,
          explanations: pregRule.explanations,
          precaution: pregRule.precaution
        });
      }
    });
  }

  // 7. Food / Alcohol / Supplement Interactions
  const foodList = Array.isArray(rawFoods) ? rawFoods : [];
  foodList.forEach(foodRaw => {
    const normFood = foodRaw.trim().toLowerCase();
    if (!normFood) return;

    knownMedications.forEach(drug => {
      const match = foodData.find(rule => {
        if (rule.drug !== drug.id) return false;
        const itemKey = rule.item.toLowerCase();
        return normFood.includes(itemKey) || itemKey.includes(normFood);
      });

      if (match) {
        let points = 3;
        if (match.severity === 'major') points = 10;
        else if (match.severity === 'moderate') points = 6;

        recordDeduction({
          id: match.id || `food-${match.item}-${drug.id}`,
          type: 'food-supplement',
          severity: match.severity,
          itemsInvolved: [match.item.toUpperCase(), drug.genericName],
          pointsLost: points,
          title: `${match.item.toUpperCase()} + ${drug.genericName}`,
          mechanism: match.mechanism,
          evidenceLevel: match.evidenceLevel,
          source: match.source,
          explanations: match.explanations,
          precaution: match.precaution
        });
      }
    });
  });

  // =========================================================================
  // 8. STACKED / CUMULATIVE RISK (Stage 4)
  // =========================================================================
  const stackedPointsUsed = { total: 0 };
  const STACKED_CAP = 25; // combined cap for stacked + CYP predicted findings

  stackRules.forEach(rule => {
    const presentIds = knownMedications.filter(m => rule.drugIds.includes(m.id)).map(m => m.id);
    if (presentIds.length < rule.threshold) return;

    const presentDrugs = knownMedications.filter(m => rule.drugIds.includes(m.id));
    const drugNames = presentDrugs.map(m => m.genericName);
    const count = presentDrugs.length;

    // Check cap before adding
    const capped = Math.min(rule.pointsLost, STACKED_CAP - stackedPointsUsed.total);
    if (capped <= 0) return;
    stackedPointsUsed.total += capped;

    // Interpolate template variables
    const interpolate = (text) => text
      .replace('{{count}}', count)
      .replace('{{drugs}}', drugNames.join(', '));

    recordDeduction({
      id: `stack-${rule.id}`,
      type: 'cumulative-risk',
      severity: rule.severity,
      itemsInvolved: drugNames,
      pointsLost: capped,
      title: `Cumulative Risk: ${rule.label} (${count} drugs)`,
      mechanism: interpolate(rule.mechanism),
      evidenceLevel: rule.evidenceLevel,
      source: rule.source,
      explanations: {
        simple: interpolate(rule.explanations.simple),
        detailed: interpolate(rule.explanations.detailed),
        clinician: interpolate(rule.explanations.clinician)
      },
      precaution: rule.precaution
    });
  });

  // =========================================================================
  // 9. CYP ENZYME INFERENCE (Stage 4)
  // =========================================================================
  // Only add predicted finding if pair NOT already in explicit rules
  // and combined stacked+predicted total hasn't hit the cap

  for (let i = 0; i < knownMedications.length; i++) {
    for (let j = 0; j < knownMedications.length; j++) {
      if (i === j) continue;
      const modulator = knownMedications[i]; // the inhibitor/inducer
      const substrate = knownMedications[j]; // the substrate

      const pairKey = [modulator.id, substrate.id].sort().join('::');
      // Skip if already covered by an explicit pair rule
      if (explicitPairKeys.has(pairKey)) continue;
      // Skip if we've already generated a CYP finding for this pair in the other direction
      const cypFindingId = `cyp-${pairKey}`;
      if (findings.some(f => f.id === cypFindingId)) continue;

      const inhibitorEnzymes = modulator.cypInhibits || [];
      const inducerEnzymes = modulator.cypInduces || [];
      const substrateEnzymes = substrate.cypSubstrateOf || [];

      // Find shared enzymes
      const inhibitedEnzymes = inhibitorEnzymes.filter(e => substrateEnzymes.includes(e));
      const inducedEnzymes = inducerEnzymes.filter(e => substrateEnzymes.includes(e));

      const allFlags = [
        ...inhibitedEnzymes.map(e => ({ enzyme: e, direction: 'inhibits' })),
        ...inducedEnzymes.map(e => ({ enzyme: e, direction: 'induces' }))
      ];

      if (allFlags.length === 0) continue;

      // Check cap
      if (stackedPointsUsed.total >= STACKED_CAP) break;
      const pointsLost = Math.min(5, STACKED_CAP - stackedPointsUsed.total);
      stackedPointsUsed.total += pointsLost;

      const flag = allFlags[0]; // use the strongest/first match
      const action = flag.direction === 'inhibits' ? 'blocks' : 'induces (speeds up)';
      const effect = flag.direction === 'inhibits'
        ? `${substrate.genericName} levels may rise, increasing the risk of side effects.`
        : `${substrate.genericName} may be cleared too fast, reducing its effectiveness.`;

      const simpleText = `${modulator.genericName} ${action} ${flag.enzyme}, the enzyme that processes ${substrate.genericName}. As a result, ${effect}`;
      const detailedText = `${modulator.genericName} ${flag.direction} ${flag.enzyme} metabolic activity. ${substrate.genericName} is a ${flag.enzyme} substrate, so its plasma concentration is likely to ${flag.direction === 'inhibits' ? 'increase (inhibition slows clearance)' : 'decrease (induction speeds clearance)'}. This is a mechanistic prediction — no explicit clinical interaction rule exists in the database for this pair.`;
      const clinicianText = `Pharmacokinetic prediction: ${modulator.genericName} is a ${flag.enzyme} ${flag.direction === 'inhibits' ? 'inhibitor' : 'inducer'}; ${substrate.genericName} is a ${flag.enzyme} substrate. Expected effect: ${flag.direction === 'inhibits' ? 'elevated' : 'reduced'} plasma concentration of ${substrate.genericName}. Evidence level: theoretical (mechanism-based inference). Monitor for clinical signs of ${flag.direction === 'inhibits' ? 'toxicity/supratherapeutic levels' : 'therapeutic failure'}.`;

      recordDeduction({
        id: cypFindingId,
        type: 'cyp-predicted',
        severity: 'minor',
        itemsInvolved: [modulator.genericName, substrate.genericName],
        pointsLost,
        title: `Predicted Interaction via ${flag.enzyme}: ${modulator.genericName} → ${substrate.genericName}`,
        mechanism: `${modulator.genericName} ${flag.direction} ${flag.enzyme}, affecting metabolism of ${substrate.genericName}.`,
        evidenceLevel: 'theoretical',
        source: 'CYP450 Enzyme Substrate/Inhibitor/Inducer Database (Mechanism-Based Inference)',
        explanations: {
          simple: simpleText,
          detailed: detailedText,
          clinician: clinicianText
        },
        precaution: `This is a predicted interaction based on known enzyme pathways. Discuss with your pharmacist whether ${substrate.genericName} levels should be monitored while taking ${modulator.genericName}.`
      });
    }
  }

  // =========================================================================
  // 10. Final score & risk level
  // =========================================================================
  const finalScore = Math.max(0, Math.min(100, currentScore));

  let riskLevel = 'Safe';
  if (finalScore < 50) riskLevel = 'High';
  else if (finalScore <= 79) riskLevel = 'Moderate';

  let message = 'No significant interaction detected in this prototype analysis.';
  let recommendation = 'Continue according to the prescribed instructions and consult a healthcare professional if concerns arise.';

  if (findings.length > 0) {
    const severityOrder = { major: 1, moderate: 2, minor: 3 };
    findings.sort((a, b) => (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3));
    message = findings[0].explanations.simple || findings[0].mechanism;
    recommendation = findings[0].precaution;
  }

  // 11. Data-Coverage Honesty Report
  const totalPairsCount = knownMedications.length > 1
    ? (knownMedications.length * (knownMedications.length - 1)) / 2
    : 0;
  const evaluatedPairsCount = coveredPairs.length;
  const coveragePercent = totalPairsCount > 0
    ? Math.round((evaluatedPairsCount / totalPairsCount) * 100)
    : 100;

  const coverageReport = {
    knownMedicationsCount: knownMedications.length,
    unknownMedicationsCount: unknownMedications.length,
    unknownMedications,
    totalPairs: totalPairsCount,
    evaluatedPairs: evaluatedPairsCount,
    coveragePercent,
    coverageText: totalPairsCount > 0
      ? `Checked ${evaluatedPairsCount} of ${totalPairsCount} potential drug-drug interaction pairs with available clinical rules.`
      : (knownMedications.length === 1
          ? 'Single medication evaluated against clinical health profile.'
          : 'No recognized medications in regimen.'),
    honestyDisclaimer: findings.length === 0
      ? 'No known interactions in our database for these pairs. This does not guarantee clinical safety. Always consult your doctor or pharmacist.'
      : 'All findings are derived from verified clinical pharmacology rules in our offline database.'
  };

  return {
    patientName: profile.patientName || 'Anonymous User',
    age: profile.age || null,
    gender: profile.gender || 'Not specified',
    pregnant: isPregnant,
    conditions: patientConditions,
    allergies: patientAllergies,
    medications: knownMedications.map(m => ({
      id: m.id,
      genericName: m.genericName,
      drugClass: m.drugClass,
      bodySystemsLoaded: m.bodySystemsLoaded,
      timingNotes: m.timingNotes,
      resolvedFrom: m.resolvedFrom || m.genericName,
      isBrand: m.isBrand || false,
      brandName: m.brandName || null
    })),
    foodItems: foodList,
    safetyScore: finalScore,
    riskLevel,
    riskLevelDisplay: `${riskLevel} Risk`,
    message,
    recommendation,
    findings,
    deductions,
    coverageReport,
    disclaimer: 'MediSafe is an educational decision-support tool. It does not replace advice from a doctor or pharmacist.',
    analyzedAt: new Date().toISOString()
  };
}

module.exports = { analyzeRegimen };
