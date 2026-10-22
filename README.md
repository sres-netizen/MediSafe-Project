# MediSafe: Explainable Personalized Medication Safety Advisor

MediSafe is a software-only Clinical Decision Support System (CDSS) prototype focused on:
- Drug-drug interaction analysis
- Drug-condition interaction analysis
- Personalized patient risk assessment
- Medication safety scoring
- Explainable, patient-friendly clinical recommendations

This prototype is built to support **Software Engineering Experiment 9: Design and Demonstration of Test Cases**, specifically enabling:
1. **Functional Testing** using Selenium IDE.
2. **Load & Performance Testing** using Apache JMeter.

---

## 🛠️ Technology Stack

- **Frontend:** React, Vite, JavaScript, CSS3
- **Backend:** Node.js, Express (REST API)
- **Authentication:** Demo session handler (No external auth service required)
- **Database:** In-memory deterministic state (No external database required)

---

## 🔑 Demo Credentials

- **Username:** `doctor`
- **Password:** `medisafe123`

---

## 🚀 Quick Start Instructions

### Prerequisites
Make sure **Node.js** (v18 or higher) is installed on your system.

### 1. Install Dependencies

Open two terminal windows or command prompts:

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

---

### 2. Start the Backend Server

```bash
cd backend
npm start
```
*The backend API will run locally at `http://localhost:5000`.*

---

### 3. Start the Frontend Development Application

```bash
cd frontend
npm run dev
```
*The React application will run locally at `http://localhost:5173`.*

Open `http://localhost:5173` in your web browser.

---

## 📡 Backend API Endpoints

| Endpoint | Method | Purpose | Sample Input / Notes |
| :--- | :--- | :--- | :--- |
| `/api/health` | `GET` | Server Health & JMeter Load Target | Returns `200 OK` with timestamp |
| `/api/login` | `POST` | User Authentication | Body: `{ "username": "doctor", "password": "medisafe123" }` |
| `/api/analyze` | `POST` | Medication Risk Assessment | Body: `{ "patientName": "John", "age": 54, "disease": "Hypertension", "allergy": "None", "medicationName": "Warfarin", "dosage": "5mg" }` |

---

## ⚙️ Deterministic Prototype Safety Analysis Rules

To ensure reliable and reproducible Selenium testing, the prototype evaluates inputs using deterministic clinical rules:

1. **Rule 1 (Moderate Risk - Score 60):**
   - **Trigger:** `Medication = Warfarin` AND `Disease = Hypertension`
   - **Finding:** *"Potential medication-related risk detected. Review the patient's condition and medication combination."*
   - **Recommendation:** *"Consult a healthcare professional before continuing or modifying the medication."*

2. **Rule 2 (High Risk - Score 30):**
   - **Trigger:** `Medication = Aspirin` AND `Allergy = Aspirin`
   - **Finding:** *"Potential allergy-related medication risk detected."*
   - **Recommendation:** *"Avoid use and consult a healthcare professional."*

3. **Rule 3 (Low Risk - Score 90):**
   - **Trigger:** Any other combination (e.g., Metformin, Amoxicillin, Ibuprofen without triggers).
   - **Finding:** *"No significant interaction detected in this prototype analysis."*
   - **Recommendation:** *"Continue according to the prescribed instructions and consult a healthcare professional if concerns arise."*

---

## 🧪 Selenium IDE Functional Testing Guide

All key interactive components have dedicated, stable `id` and `data-testid` attributes.

### Target DOM Element Identifiers

| Component | Element | Target ID (`id` / `data-testid`) |
| :--- | :--- | :--- |
| **Login** | Username Input | `username` |
| **Login** | Password Input | `password` |
| **Login** | Submit Button | `login-button` |
| **Login** | Error Message Box | `login-error` |
| **Patient Form** | Patient Name Input | `patient-name` |
| **Patient Form** | Age Input | `patient-age` |
| **Patient Form** | Gender Select | `patient-gender` |
| **Patient Form** | Disease Input | `patient-disease` |
| **Patient Form** | Allergy Input | `patient-allergy` |
| **Medication Form** | Medication Select | `medication-name` |
| **Medication Form** | Dosage Input | `dosage` |
| **Medication Form** | Analyze Button | `analyze-button` |
| **Results** | Analysis Card Container | `analysis-result` |
| **Results** | Risk Level Display | `risk-level` |
| **Results** | Safety Score Badge | `safety-score` |
| **Results** | Risk Finding Text | `risk-message` |
| **Results** | Recommendation Text | `recommendation` |
| **Results** | Analyze Again Button | `analyze-again-button` |
| **Navigation** | Logout Button | `logout-button` |

---

### Test Cases Summary (TC01 – TC09)

- **TC01 – Verify MediSafe login page loads:** Assert element `id=username` and `id=login-button` present.
- **TC02 – Login with valid credentials:** Type `doctor` in `id=username`, `medisafe123` in `id=password`, click `id=login-button`. Assert `id=patient-name` present.
- **TC03 – Login with invalid credentials:** Type `wronguser` in `id=username`, `wrongpass` in `id=password`, click `id=login-button`. Assert `id=login-error` contains *"Invalid username or password."*
- **TC04 – Enter patient information:** Type name into `id=patient-name`, age into `id=patient-age`, disease into `id=patient-disease`, allergy into `id=patient-allergy`.
- **TC05 – Enter medication information:** Select medication in `id=medication-name`, type dosage into `id=dosage`.
- **TC06 – Analyze medication safety:** Click `id=analyze-button`. Assert `id=analysis-result` renders.
- **TC07 – Verify Risk Level & Safety Score:** Assert `id=risk-level` text matches expected risk (`Moderate Risk`, `High Risk`, or `Low Risk`) and `id=safety-score` matches score (`60`, `30`, or `90`).
- **TC08 – Verify recommendation is displayed:** Assert text in `id=recommendation` is populated.
- **TC09 – Logout:** Click `id=logout-button`. Assert redirect to login page with `id=login-button` visible.

---

## 📊 Apache JMeter Performance Testing Guide

The API is structured for high-performance load testing.

### Target Endpoints for JMeter

1. **Lightweight Health Check Endpoint:**
   - **URL:** `http://localhost:5000/api/health`
   - **HTTP Method:** `GET`
   - **Purpose:** Baseline latency and request throughput without payload overhead.

2. **Medication Analysis Endpoint:**
   - **URL:** `http://localhost:5000/api/analyze`
   - **HTTP Method:** `POST`
   - **Header:** `Content-Type: application/json`
   - **Body (JSON):**
     ```json
     {
       "patientName": "JMeter Test User",
       "age": "45",
       "gender": "Male",
       "disease": "Hypertension",
       "allergy": "None",
       "medicationName": "Warfarin",
       "dosage": "5mg"
     }
     ```

### Sample JMeter Test Plan Setup

1. Add a **Thread Group**:
   - *Number of Threads (Users):* `50` or `100`
   - *Ramp-Up Period (seconds):* `5`
   - *Loop Count:* `10` (or Infinite for 60 seconds)
2. Add an **HTTP Request Sampler**:
   - *Server Name:* `localhost`
   - *Port:* `5000`
   - *Method:* `POST`
   - *Path:* `/api/analyze`
3. Add an **HTTP Header Manager**:
   - `Content-Type`: `application/json`
4. Add Listener Reports:
   - **Aggregate Report** (Measures Average Response Time, Median, 95th Percentile, Throughput requests/sec, Error %)
   - **Summary Report**
   - **View Results Tree**

---

## ⚠️ Academic & Educational Disclaimer

**Prototype / Educational Demonstration — Not for real medical decisions.**
This application is designed solely as an academic software engineering prototype for test case demonstration. It does not replace real clinical decision-making or professional medical advice.
