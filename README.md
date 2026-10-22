# MediSafe

**Explainable Personalized Medication Safety Advisor for Drug Interaction and Patient Risk Analysis**

MediSafe is a patient-centred web app that checks your medicines, foods, drinks and supplements for risky combinations, then gives you a **personalized safety score** with a fully traceable breakdown and plain-language explanations.

🔗 **Live demo:** [https://medisafe-advisor.vercel.app/]

> ⚠️ **Disclaimer:** MediSafe is an educational decision-support tool built as a college project. It does **not** replace advice from a doctor or pharmacist. Its dataset is small and not clinical grade.

---

## Problem Statement

Existing drug interaction checkers (Drugs.com, Medscape, WebMD and similar) are mostly pair-lookup tools: they take a list of drugs and show generic "Drug A + Drug B" warnings. In practice this leaves several gaps:

- They barely adapt to the person: allergies, existing conditions, age and pregnancy are separate, limited or paywalled.
- They give one generic explanation, often written for clinicians.
- They give no overall number, so a mix of many warnings is hard to prioritise.
- They often imply false safety when a drug or pair simply isn't in their data.
- They are US/UK-centric and handle Indian brand names poorly.

## What Makes MediSafe Different

| # | Feature | Why it matters |
|---|---|---|
| 1 | **Personalized analysis** | Allergies, conditions, age and pregnancy are part of the analysis, so the same medicine list gives different results for different people. |
| 2 | **Explainable safety score (0-100)** | Every point deducted is listed with its cause and severity. Nothing is a black box. |
| 3 | **Three explanation depths** | A Simple / Detailed / Clinician slider rewrites every explanation for the reader. |
| 4 | **Indian brand recognition** | Typing "Dolo 650", "Brufen" or "Augmentin" resolves to the generic drug before analysis. |
| 5 | **Food, alcohol & supplement interactions** | Covers grapefruit, alcohol, St John's Wort, calcium and more, which are commonly forgotten. |
| 6 | **"No data is not safe" indicator** | Unknown drugs and unchecked pairs are shown as *not enough data*. The app never claims "no interactions found". |
| 7 | **What-if simulator + safer alternatives** | Remove or swap a medicine and watch the score update live (e.g. 62 → 81). Alternatives come from the same drug class and respect the user's allergies, conditions and pregnancy. |
| 8 | **Cumulative (stacked) risk detection** | Catches risks that individual pairs miss, such as multiple NSAIDs, blood thinners, sedatives or serotonergic drugs taken together. |
| 9 | **Mechanism-based (CYP enzyme) prediction** | If drug A blocks or speeds up a liver enzyme that clears drug B, the engine flags a *predicted* interaction even when no pair rule exists, and shows the reasoning chain. |
| 10 | **One-click demo scenarios** | Five preloaded cases (bleeding triad, pregnancy + allergy, elderly kidney disease, CYP prediction, and rule checks) fill the form instantly for easy demos and testing. |

## How the Score Works

The engine is **rule-based and deterministic**. There is no black-box ML model, no external API calls, and it works fully offline. Every number shown can be traced to a rule.

The score starts at **100** and points are deducted per finding:

| Finding | Deduction |
|---|---|
| Major drug-drug interaction | -25 |
| Moderate drug-drug interaction | -10 |
| Minor drug-drug interaction | -3 |
| Drug-allergy match | -30 |
| Drug-disease conflict | -15 to -20 |
| Pregnancy-risk drug | -30 |
| Food / alcohol / supplement interaction | -3 to -10 |
| Cumulative (stacked) risk | -8 to -15 |
| Predicted CYP interaction | about -5 |

Stacked and predicted deductions are **capped at 25 points combined**, and a pair with an explicit rule is never double-counted as a predicted interaction.

| Score | Risk level |
|---|---|
| 80-100 | 🟢 Safe |
| 50-79 | 🟡 Moderate |
| Below 50 | 🔴 High risk |

Each finding also carries an **evidence level** (established / moderate / theoretical) so users can see how strong the underlying evidence is.

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Recharts
- **Analysis engine:** JavaScript, written as a pure function separate from the UI
- **Data:** JSON seed files (drugs, Indian brands, interactions, drug-disease, drug-allergy, pregnancy, food, stacking rules)
- **Hosting:** Vercel, with the code on GitHub

## Getting Started

**Prerequisites:** Node.js 18+ and npm.

```bash
# 1. Clone the repository
git clone https://github.com/YOUR-USERNAME/medisafe.git
cd medisafe

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Then open the local URL shown in the terminal (usually `http://localhost:5173`).

To create a production build:

```bash
npm run build
```

## Try It Out

Use the **1-Click Demo Scenarios** buttons at the top of the page for instant examples, or try these manually:

1. **Bleeding risk:** add Warfarin + Aspirin + Ibuprofen. You'll see a major interaction and a stacked-risk finding.
2. **Indian brands:** add "Dolo 650" and "Brufen" and watch them resolve to Paracetamol and Ibuprofen.
3. **Allergy:** set a penicillin allergy and add Amoxicillin.
4. **Pregnancy:** mark the profile as pregnant and add a pregnancy-risk drug.
5. **What-if:** on the results page, remove a medicine and watch the score change.
6. **Honesty check:** add a drug that isn't in the database and see the *not enough data* section.

## Project Structure

```
medisafe/
├── src/                  # React UI (profile, medicine entry, results, what-if)
├── engine/               # Pure analysis engine (scoring, rules, CYP + stacked risk)
├── data/                 # JSON seed data
│   ├── drugs.json
│   ├── brands.json
│   ├── interactions.json
│   ├── drugDisease.json
│   ├── drugAllergy.json
│   ├── pregnancy.json
│   ├── food.json
│   └── stackRules.json
├── docs/                 # SRS, UML diagrams, test cases
└── README.md
```

## Testing

Functional testing of the frontend is done with **Cypress**, covering brand-name resolution, interaction detection, allergy and pregnancy warnings, input validation, the explanation slider, the what-if simulator and score colour thresholds. Test cases are documented in `docs/test-cases.md`.

```bash
npx cypress open
```

## Limitations

- The dataset is a **small, hand-curated demo set**, not a clinical-grade database.
- CYP-based predictions are theoretical and flagged as such.
- Results are guidance only. Always consult a doctor or pharmacist.

## Future Enhancements

- Daily medication schedule optimizer
- Symptom-to-medicine side-effect checker
- Downloadable PDF safety report and "questions for your doctor" generator
- User accounts and cloud-saved history
- Integration with a licensed drug database (DrugBank, openFDA)
- ML-based prediction for interactions not covered by rules
- Electronic Health Record (EHR) integration and multilingual support

## Software Engineering Practices

- **Version control:** Git and GitHub (branching, pull requests, issues)
- **Project management:** Jira (Scrum board, sprints, backlog)
- **Testing:** Cypress for frontend functional testing
- **Modelling:** Use case, class, ER, DFD, state, sequence, package, component and deployment diagrams (see `docs/`)

## Author

**Sreyas Sanil** (24BAI1413)
VIT Chennai
Software Engineering Lab Project

## License

This project is for educational purposes.