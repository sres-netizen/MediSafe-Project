const { analyzeRegimen } = require('./engine/analyzer');
const { resolveMedicine } = require('./engine/brandResolver');

console.log('====================================================');
console.log('🧪 MediSafe Engine Unit Tests (Stage 1 Verification)');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ FAIL: ${testName}`);
  }
}

// TEST 1: Indian Brand Name Resolution
console.log('--- Test 1: Brand Name Resolution ---');
const doloRes = resolveMedicine('Dolo 650');
assert(doloRes.length === 1 && doloRes[0].id === 'paracetamol', 'Dolo 650 resolves to Paracetamol');

const combiRes = resolveMedicine('Combiflam');
assert(combiRes.length === 2 && combiRes.some(d => d.id === 'ibuprofen') && combiRes.some(d => d.id === 'paracetamol'), 'Combiflam resolves to Ibuprofen + Paracetamol');

const augRes = resolveMedicine('Augmentin');
assert(augRes.length === 2 && augRes.some(d => d.id === 'amoxicillin'), 'Augmentin resolves to Amoxicillin + Clavulanate');

// TEST 2: Rule 1 Test Case Compatibility (Warfarin + Hypertension)
console.log('\n--- Test 2: Rule 1 (Warfarin + Hypertension) ---');
const r1 = analyzeRegimen({
  profile: { conditions: ['Hypertension'] },
  medications: ['Warfarin']
});
assert(r1.safetyScore === 60, `Score is 60 (Actual: ${r1.safetyScore})`);
assert(r1.riskLevel === 'Moderate', `Risk is Moderate (Actual: ${r1.riskLevel})`);
assert(r1.findings.length > 0, 'Finding generated for Warfarin + Hypertension');

// TEST 3: Rule 2 Test Case Compatibility (Aspirin + Aspirin Allergy)
console.log('\n--- Test 3: Rule 2 (Aspirin + Aspirin Allergy) ---');
const r2 = analyzeRegimen({
  profile: { allergies: ['Aspirin'] },
  medications: ['Aspirin']
});
assert(r2.safetyScore === 30, `Score is 30 (Actual: ${r2.safetyScore})`);
assert(r2.riskLevel === 'High', `Risk is High (Actual: ${r2.riskLevel})`);
assert(r2.findings.some(f => f.type === 'drug-allergy'), 'Allergy finding flagged correctly');

// TEST 4: Scenario 1 - Warfarin + Aspirin + Ibuprofen
console.log('\n--- Test 4: Scenario 1 (Warfarin + Aspirin + Ibuprofen) ---');
const s1 = analyzeRegimen({
  profile: { age: 62 },
  medications: ['Warfarin', 'Aspirin', 'Ibuprofen']
});
assert(s1.safetyScore < 50, `Score is High Risk (<50) due to multiple major DDIs (Actual: ${s1.safetyScore})`);
assert(s1.findings.length >= 3, `Multiple pairwise interactions detected (Actual count: ${s1.findings.length})`);
assert(s1.deductions.some(d => d.itemsInvolved.includes('Warfarin') && d.itemsInvolved.includes('Aspirin')), 'Warfarin + Aspirin pair detected');
assert(s1.deductions.some(d => d.itemsInvolved.includes('Warfarin') && d.itemsInvolved.includes('Ibuprofen')), 'Warfarin + Ibuprofen pair detected');

// TEST 5: Scenario 2 - Pregnant User + Penicillin Allergy taking Amoxicillin
console.log('\n--- Test 5: Scenario 2 (Pregnant + Penicillin Allergy + Amoxicillin) ---');
const s2 = analyzeRegimen({
  profile: { pregnant: true, allergies: ['Penicillin'] },
  medications: ['Amoxicillin']
});
assert(s2.findings.some(f => f.type === 'drug-allergy'), 'Penicillin allergy detected for Amoxicillin');
assert(s2.safetyScore <= 70, `Penicillin allergy triggers score deduction (Actual: ${s2.safetyScore})`);

// TEST 6: Scenario 3 - Indian Brands (Brufen + Cardace + Dolo 650) with Kidney Disease
console.log('\n--- Test 6: Scenario 3 (Brufen + Cardace + Dolo 650 + Chronic Kidney Disease) ---');
const s3 = analyzeRegimen({
  profile: { age: 72, conditions: ['Chronic Kidney Disease'] },
  medications: ['Brufen', 'Cardace', 'Dolo 650']
});
assert(s3.medications.some(m => m.id === 'ibuprofen'), 'Brufen resolved to Ibuprofen');
assert(s3.medications.some(m => m.id === 'ramipril'), 'Cardace resolved to Ramipril');
assert(s3.medications.some(m => m.id === 'paracetamol'), 'Dolo 650 resolved to Paracetamol');
assert(s3.findings.some(f => f.type === 'drug-condition'), 'Kidney disease conflict detected for Ibuprofen');
assert(s3.findings.some(f => f.type === 'drug-drug'), 'Ibuprofen + Ramipril interaction detected');

// TEST 7: Honesty Feature & Unknown Drug
console.log('\n--- Test 7: "No Data Is Not Safe" Honesty Feature ---');
const s4 = analyzeRegimen({
  profile: {},
  medications: ['Paracetamol', 'UnknownHerbalExtract999']
});
assert(s4.coverageReport.unknownMedications.length === 1, 'Unknown drug caught in coverage report');
assert(s4.coverageReport.unknownMedications[0].name === 'UnknownHerbalExtract999', 'Unknown drug name preserved');
assert(typeof s4.coverageReport.coverageText === 'string', 'Coverage text computed');

// TEST 8: What-If Simulator Recalculation
console.log('\n--- Test 8: What-If Simulator Recalculation ---');
const originalTriad = analyzeRegimen({
  profile: { age: 65 },
  medications: ['Warfarin', 'Aspirin', 'Ibuprofen']
});
assert(originalTriad.safetyScore <= 40, `Original score is in high risk range (Actual: ${originalTriad.safetyScore})`);

// Simulate toggling OFF Ibuprofen
const simulatedWithoutIbu = analyzeRegimen({
  profile: { age: 65 },
  medications: ['Warfarin', 'Aspirin']
});
assert(simulatedWithoutIbu.safetyScore > originalTriad.safetyScore, 'Score improves when disabling Ibuprofen');
assert(simulatedWithoutIbu.safetyScore === 60, `Simulated score without Ibuprofen is 60 with blood-thinner stack (Actual: ${simulatedWithoutIbu.safetyScore})`);

// TEST 9: Safer Alternatives Engine
console.log('\n--- Test 9: Safer Alternatives Engine ---');
const { findSaferAlternatives, isDrugSafeForPatient } = require('./engine/alternatives');

const alternativesForTriad = findSaferAlternatives({
  medications: originalTriad.medications,
  findings: originalTriad.findings,
  profile: { age: 65 },
  currentScore: 40
});
assert(alternativesForTriad.length > 0, 'Alternatives found for problematic drugs in triad');
const ibuAlts = alternativesForTriad.find(g => g.problematicDrugId === 'ibuprofen');
assert(ibuAlts && ibuAlts.alternatives.some(a => a.candidateId === 'paracetamol'), 'Paracetamol suggested as safer alternative to Ibuprofen');
assert(ibuAlts.alternatives.find(a => a.candidateId === 'paracetamol').projectedScore > 40, 'Projected score for Paracetamol swap is higher than current score');

// TEST 10: Alternatives Safety Filtering (Allergies & Pregnancy)
console.log('\n--- Test 10: Alternatives Filtering (Allergies & Pregnancy) ---');
// When patient has a Paracetamol allergy, Paracetamol must NOT be suggested
const allergicAlternatives = findSaferAlternatives({
  medications: originalTriad.medications,
  findings: originalTriad.findings,
  profile: { age: 65, allergies: ['Paracetamol'] },
  currentScore: 40
});
const ibuAltsWithAllergy = allergicAlternatives.find(g => g.problematicDrugId === 'ibuprofen');
const paracetamolSuggested = ibuAltsWithAllergy ? ibuAltsWithAllergy.alternatives.some(a => a.candidateId === 'paracetamol') : false;
assert(!paracetamolSuggested, 'Paracetamol is successfully filtered out when patient has Paracetamol allergy');

// TEST 11: Stage 4 - Stacked Bleeding Risk (Warfarin + Aspirin + Ibuprofen)
console.log('\n--- Test 11: Stage 4 - Stacked Cumulative Risk ---');
const stackedReport = analyzeRegimen({
  profile: { age: 65 },
  medications: ['Warfarin', 'Aspirin', 'Ibuprofen']
});
const bleedingStackFindings = stackedReport.findings.filter(
  f => f.type === 'cumulative-risk' && f.title.toLowerCase().includes('blood thinners')
);
assert(bleedingStackFindings.length === 1, 'Warfarin + Aspirin + Ibuprofen shows stacked bleeding risk exactly once');
assert(bleedingStackFindings[0].evidenceLevel === 'established', 'Stacked bleeding risk has established evidence level');
assert(bleedingStackFindings[0].pointsLost <= 25, 'Stacked deduction is within cap limit');

// TEST 12: Stage 4 - No Double Counting (Explicit-rule pair never gets a predicted duplicate)
console.log('\n--- Test 12: Stage 4 - No Double Counting (Explicit Pair vs CYP) ---');
const explicitPairReport = analyzeRegimen({
  profile: {},
  medications: ['Warfarin', 'Aspirin']
});
const hasExplicitDDI = explicitPairReport.findings.some(f => f.type === 'drug-drug');
const hasPredictedDuplicate = explicitPairReport.findings.some(
  f => f.type === 'cyp-predicted' && f.itemsInvolved.includes('Warfarin') && f.itemsInvolved.includes('Aspirin')
);
assert(hasExplicitDDI, 'Explicit DDI rule exists for Warfarin + Aspirin');
assert(!hasPredictedDuplicate, 'Explicit-rule pair never gets a predicted CYP duplicate');

// TEST 13: Stage 4 - CYP Enzyme Inference (Clarithromycin + Simvastatin)
console.log('\n--- Test 13: Stage 4 - Predicted CYP Interaction (Clarithromycin + Simvastatin) ---');
const cypReport = analyzeRegimen({
  profile: {},
  medications: ['Clarithromycin', 'Simvastatin']
});
const cypPredictedFinding = cypReport.findings.find(f => f.type === 'cyp-predicted');
assert(Boolean(cypPredictedFinding), 'Clarithromycin + Simvastatin produces a predicted CYP finding');
assert(cypPredictedFinding && cypPredictedFinding.evidenceLevel === 'theoretical', 'CYP predicted interaction has theoretical evidence level');
assert(cypPredictedFinding && cypPredictedFinding.pointsLost === 5, 'CYP predicted interaction deducts ~5 points');
assert(
  cypPredictedFinding && cypPredictedFinding.explanations.simple.includes('CYP3A4') && cypPredictedFinding.explanations.simple.includes('Simvastatin'),
  'CYP explanation shows mechanism reasoning chain mentioning enzyme and substrate'
);

// TEST 14: Stage 4 - Single Drug Produces No Stacked or Predicted Findings
console.log('\n--- Test 14: Stage 4 - Single Drug Isolation ---');
const singleDrugReport = analyzeRegimen({
  profile: {},
  medications: ['Paracetamol']
});
const hasStackedInSingle = singleDrugReport.findings.some(f => f.type === 'cumulative-risk');
const hasPredictedInSingle = singleDrugReport.findings.some(f => f.type === 'cyp-predicted');
assert(!hasStackedInSingle, 'Single drug produces no stacked findings');
assert(!hasPredictedInSingle, 'Single drug produces no predicted findings');

console.log(`\n====================================================`);
console.log(`📊 Test Results: ${passedTests} / ${totalTests} Passed`);
console.log(`====================================================\n`);

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
