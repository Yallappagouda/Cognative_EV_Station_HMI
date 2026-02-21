# Cognitive EV Charging HMI System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green.svg)](https://nodejs.org/)
[![Vite](https://img.shields.io/badge/Vite-7-purple.svg)](https://vitejs.dev/)

A professional-grade, Cognitive Human-Machine Interface (HMI) for next-generation EV charging infrastructure. This system leverages adaptive behavioral detection and multimodal interaction to provide a seamless charging experience for all demographics.

---

## 1. Project Overview

The **Cognitive EV Charging HMI System** is an advanced HMI prototype that shifts away from traditional static interfaces toward an intelligent, adaptive ecosystem. By analyzing user interaction speed and patterns, the system dynamically reconfigures its UI/UX to match the user's cognitive profile.

### Core Capabilities:
- **Adaptive UI**: Real-time layout and density adjustments based on user behavior.
- **Multimodal Control**: Integrated Voice, NFC, and Touch interaction layers.
- **Intelligent Authentication**: Secure NFC Tap-and-Go + Phone OTP verification.
- **Behavioral Detection**: Latency-based user proficiency estimation (First-Time vs. Expert).
- **Accessibility Optimized**: Specialized modes for elderly users and different cognitive loads.

---

## 2. Problem Statement

Public EV charging remains a significant barrier to adoption due to several systemic issues:
- **Interface Anxiety**: New users often find public chargers confusing and intimidating.
- **Cognitive Overload**: Too much information on-screen can overwhelm non-technical or elderly users.
- **Authentication Latency**: Slow or multi-step verification processes frustrate returning users.
- **Low Accessibility**: Static font sizes and complex navigation patterns hinder inclusivity for elderly drivers.

**Our Solution**: An adaptive machine interface that matches the user's mental model, reducing time-to-charge and increasing user confidence through guided, reactive assistance.

---

## 3. Cognitive User Modes

The system operates in four distinct behavioral modes, automatically selected or manually triggered:

### A) First-Time Users (Guided Flow)
- **Guided Decision**: Initial prompt to identify the user's experience level.
- **Tutorial Integration**: AI-generated instructional video with **Manual Play** control.
- **Voice-Assisted Navigation**: Commands like *"Play"* and *"Continue"* bridge the physical-digital gap.
- **Simplified NFC**: Single-tap authentication path to reduce confusion.
- **Hardware Guidance**: Visual and audio cues for connector locking and cable management.

### B) Expert / Returning Users (Fast Flow)
- **Direct Entry**: Bypasses all tutorials for immediate authentication.
- **Dual Verification**: Expert-level NFC + Phone Number OTP sequence.
- **Continuous Voice STT**: High-speed numeric recognition for secondary verification.
- **Compact UI**: Increased information density for experienced users.

### C) Elderly Mode (Accessibility First)
- **Enhanced Visuals**: 25%+ larger buttons and ultra-high contrast color palettes.
- **Voice-Dominant**: Reduced reliance on precise touch; system announces every state change.
- **Minimal Steps**: Combined screens to reduce "panning" cognitive effort.

### D) Normal Users (Standard Flow)
- **Balanced Interface**: Standard dual authentication and interactive charging dashboard.
- **Proactive Help**: Tooltips and assistant icons available but not intrusive.

---

## 4. System Architecture

The project is architected as a Client-Side Progressive Application:

### Frontend Layer
- **Framework**: React 19 (Functional components, Hooks API).
- **State Engine**: Centralized interaction tracking to feed the cognitive engine.
- **Animations**: Framer Motion for smooth, high-frame-rate transitions.
- **Speech Engine**: Web Speech API for low-latency Speech-to-Text (STT) and Text-to-Speech (TTS).



### Directory Structure:
```text
voltcharge/
├── src/
│   ├── components/        # UI Modules (Authentication, Voice HUD, Dashboard)
│   ├── pages/             # Core views (Tutorial, Simulation, Receipt)
│   ├── hooks/             # Behavioral Analysis Engine (useCognitive)
│   ├── utils.js           # Shared Interaction Helpers (Haptics, Voice)
│   └── App.jsx            # Main Router and State Orchestrator
└── public/                # Static Media (Tutorial Videos, Icons)
```

---

## 5. Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Framework** | React 19 | Component-based UI Architecture |
| **Interaction** | Web Speech API | Voice recognition and synthesis |
| **Animation** | Framer Motion | High-performance UI state transitions |
| **Styling** | Tailwind CSS | Utility-first responsive design |
| **Icons** | Lucide React | Professional svg-based visual indicators |
| **Data Viz** | Recharts | Interactive history and analytics charts |
| **State** | React Hooks | Behavioral tracking and session management |
| **DevOps** | Vite | Lightning-fast build and HMR |

---

## 6. User Flow Diagrams

### First-Time User Flow (Guided)
```text
[START]
   ↓
[PROFICIENCY CHECK] (Is First Time? → YES)
   ↓
[TUTORIAL VIDEO] (Manual Play or Voice "Play")
   ↓
[GUIDED NFC AUTH]
   ↓
[CABLE GUIDANCE] (Connector detection)
   ↓
[CHARGING DASHBOARD] (0-100% Simulation)
   ↓
[SESSION SUMMARY] (Download Receipt)
   ↓
[EXIT]
```

### Expert / Returning User Flow (Fast)
```text
[START]
   ↓
[DIRECT AUTH] (NFC or Phone OTP)
   ↓
[VOICE NUMBER INPUT] (Continuous Listening)
   ↓
[DIRECT CHARGING] (Bypass tutorial)
   ↓
[AUTO-RECEIPT]
   ↓
[EXIT]
```

---

## 7. Voice Command System

The system implements a **Continuous Listening Engine** to ensure the HMI is always reactive to the user's presence.

- **Continuous Mode**: Auto-restarts recognition on silence or error to maintain "hands-free" state.
- **Command Mapping**: 
    - `"Play"`: Triggers media element playback.
    - `"Continue"`: Advances the navigation state.
    - `"Start Charging"` / `"Stop Charging"`: Controls the simulation engine.
- **STT Pattern Recognition**: Specialized logic for 10-digit mobile number parsing via voice.

---

## 8. Cognitive Equations & Logic Model

The system uses a mathematical approach to determine the optimal HMI state:

### Proficiency Factor ($P$):
$$P = f(\Delta T, E_{count}, S_{usage})$$
Where:
- $\Delta T$: Inter-interaction latency (Time between screen loads and clicks).
- $E_{count}$: Error frequency during authentication.
- $S_{usage}$: Historical session count.

### Cognitive Load ($L$):
$$L \propto \text{Steps} \times \text{UI Complexity}$$
The optimization goal for the system is to minimize $L$:
$$\text{Minimize } L \implies \text{Maximize Usability Index } (U)$$

### Usability Index ($U$):
$$U = \frac{\text{Successful Interactions}}{\text{Total Attempts}}$$

In simple terms, if the user hesitates (>5s) or makes errors, the system increases $U$ by automatically shifting into **Elderly or Guided mode**, reducing the complexity of the interface in real-time.

---

## 9. Responsiveness Strategy

To ensure industrial-level reliability, the HMI employs a multi-tiered responsiveness strategy:
- **Mobile-First Core**: All interfaces are built on a flexible grid for deployment on various tablet sizes.
- **Dynamic Scaling**: Font-weights and spacing adjust based on the detected user mode.
- **Media Optimization**: Video elements use `object-contain` combined with hardware-accelerated rendering.
- **Feedback Loops**: Every interaction triggers a visual (glow), auditory (beep), and simulated haptic pulse.

---

## 10. Guide Video System

- **Hosting**: Stored locally in `/public` to guarantee 0-latency access even with poor network.
- **Safety Protocol**: Manual play is enforced to ensure the user is paying attention before visuals start.
- **Recovery UI**: If the video engine fails (unsupported codec/missing file), the system triggers an `AlertTriangle` fallback allowing manual progression.

---

## 11. Authentication System

A secure, multi-factor-ready authentication gateway:
1. **NFC Verification**: Primary hardware-emulated ID check.
2. **Phone Number OTP**: Secondary security layer for transactions.
3. **Voice HUD**: A real-time wave-form visualizer appears when the system is listening for the numeric OTP/Mobile input.
4. **Haptic Confirmation**: Unique vibration patterns for "Verification Success" vs "Access Denied".

---

## 12. HMI Improvement Analysis

This project demonstrates several key improvements in Human-Machine Interaction:
- **Reduces Range Anxiety**: Clearer feedback on time and cost.
- **Universal Access**: Bridges the digital divide for elderly populations.
- **Cognitive Mapping**: Adapts the machine's behavior to human psychology rather than forcing the human to learn the machine.
- **Accelerated Adoption**: Makes public infrastructure approachable for the least tech-savvy users.

---

## 13. Installation Steps

### Prerequisites
- Node.js (v18+)
- npm / yarn

### Interface Setup (Frontend)
```bash
git clone <repo-url>
cd voltcharge
npm install
npm run dev
```



---

## 14. Deployment Steps

1. **Environment Config**: Update `.env` with production `API_URL`.
2. **Optimized Build**:
   ```bash
   npm run build
   ```
3. **Static Serving**: Deploy the `dist/` folder via Vercel, Netlify, or Nginx.

https://cognative-ev-station-hmi.vercel.app/

---

## 15. GitHub Push Steps

Follow this workflow for updates:
```bash
git add .
git commit -m "Industry: Final HMI Overhaul and Cognitive Engine Integration"
git branch -M main
git push origin main
```

---

## 16. Future Improvements

- **Biometric Integration**: Facial recognition for automatic mode selection.
- **Smart Recommendations**: Suggesting charging modes based on current grid load.
- **Machine Learning**: Predictive maintenance alerts for charger hardware.
- **CarPlay/Android Auto**: Syncing the station HMI with the vehicle's dashboard.

---

## 17. License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 18. Conclusion

This project represents a next-generation approach to public utility interfaces. By treating the EV charger as a **cognitive partner** rather than a static terminal, we solve the core human-factor issues that hinder the transition to sustainable energy.

---

**Original Contributors & Credits**:
- **VoltCharge HMI Team**: Core architecture and cognitive logic.
- **UI/UX Design**: Premium dark-mode design system.
- **Engineering Leads**: Behavioral flow and voice engine integration.

**Version**: 1.2.0  | **Last Updated**: 2026-02-21
