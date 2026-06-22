# Knowledge Base: ProjektDeutsch AI

This document serves as a comprehensive technical summary of **ProjektDeutsch AI**, detailing its core architecture, mathematical models, curriculum, engineering challenges solved, CI/CD pipeline, and deployment configurations. It is designed to be easily parsed by AI resume-builders and developer agents.

---

## 1. Project Overview & Product Vision
**ProjektDeutsch AI** (also referred to as German AI Coach) is a client-side, privacy-focused German language learning platform. It provides self-learners with structured, adaptive, CEFR-aligned practice topics. 

Rather than relying on expensive server infrastructure, the application uses a **Bring-Your-Own-Key (BYOK) model** where the user input’s their Google Gemini API key, which is saved locally in the browser to interact directly with Gemini endpoints. An offline fallback question database is available when no key is set.

---

## 2. Core Technical Stack & Architecture
- **Frontend Core**: React 19 (`react`, `react-dom`), Single Page Application (SPA).
- **Build System**: Vite 8 & Rollup (fast Hot Module Replacement & bundling).
- **Styling**: Vanilla CSS utilizing design tokens (custom CSS variables), supporting system dark-mode preferences, glassmorphism, and responsive spring animations.
- **Linter & Code Quality**: `oxlint` (Rust-based ultra-fast linter) and `eslint` for standard hooks checking.
- **Unit Testing**: Node.js native test runner (`node --test`) for storage logic and normalization.
- **Containerization**: Multi-stage `Dockerfile` compiling compiled static files and serving them via `nginx:alpine` virtual host.
- **Deployment Platform**: Vercel CDN hosting & Namecheap DNS registrar.
- **CI/CD Automation**: GitHub Actions.

---

## 3. Mathematical Models & Learning Algorithms

The application behaves as an adaptive coach using several deterministic mathematical algorithms:

### A. Confidence Decay Model
To simulate forgetting curves, the confidence $C_t$ for any practiced topic decays daily:

$$C_t = C_0 \times e^{-0.01 t}$$

Where:
- $C_0$ is the post-practice confidence (always reset to $100\%$ on practice completion).
- $t$ is the elapsed days since last practiced.
- $C_t$ is clamped between a minimum of $10\%$ and a maximum of $100\%$.

### B. Mastery Score Calculation
A topic's overall mastery score is a combined index of user correctness (Accuracy) and memory retention (Confidence):

$$\text{Mastery Score} = \text{Round}\left(\frac{\text{Accuracy} \times \text{Confidence}}{100}\right)$$

### C. Adaptive "Smart Practice" Selection
When the user clicks "Smart Practice", the system automatically creates a custom mixed-curriculum practice session based on the following target distribution:
- **60% Weak Topics**: Practice attempts $> 0$ with a mastery score $< 60\%$.
- **20% Review Topics**: Practice attempts $> 0$, mastery score $\ge 60\%$, but confidence has decayed (confidence $< 70\%$ or last practiced $> 7$ days ago).
- **20% New Topics**: Topics with attempts $= 0$.

#### Redistribution Logic:
If any categories are empty, the algorithm preserves the target session question count ($N$) using the following rules:
1. **If Weak is empty**: 50% of the weak allocation moves to Review, and the remaining 50% moves to New.
2. **If Review is empty**: Reassigns review allocation to Weak (if available), otherwise to New.
3. **If New is empty**: 75% of the new allocation goes to Weak, and 25% goes to Review.

### D. Subskills Mastery Grading Logic
On practice completion, subskill accuracies are updated recursively:
- **New Topics (attempts = 0)**:
  $$\text{Subskill Score} = \text{Round}(S_{\text{acc}})$$
- **Existing Topics (attempts > 0)**:
  $$\text{New Subskill Score} = \text{Round}\left(\frac{(S_{\text{current}} \times H) + (S_{\text{acc}} \times N)}{H + N}\right)$$
  Where $S_{\text{current}}$ is the historical subskill score, $H$ is historical attempts, $S_{\text{acc}}$ is the session subskill accuracy, and $N$ is the number of questions testing that subskill in the session.

### E. Dynamic Blank Input Width
Questions containing blanks `___` are rendered inline. The width of the input element scales dynamically based on answer length to maintain visual alignment:

$$\text{Width (px)} = \max\left(80, \text{Answer Length} \times 14 + 20\right)$$

---

## 4. Key Engineering Problems Solved (Production Hardening)

To make the app production-ready, several security, consistency, and storage issues were solved:

1. **Content Security Policy (CSP) Integration**:
   - Added a strict CSP header in [nginx.conf](file:///nginx.conf). It locks down script execution and limits the network connection target (`connect-src`) exclusively to `'self'` and the Google Gemini API (`https://generativelanguage.googleapis.com`), preventing API key exfiltration from compromised scripts.
2. **Timezone-Safe Date Tracking**:
   - Replaced UTC-based date parsing (`new Date().toISOString()`) in [App.jsx](file:///src/App.jsx) with local calendar date tracking. This ensures confidence decay calculations transition correctly at the user's local midnight instead of UTC midnight.
3. **Insecure context (non-HTTPS) Warnings**:
   - Implemented dynamic SSL verification in [SettingsModal.jsx](file:///src/components/SettingsModal.jsx). It displays a warnings banner if a user inputs a sensitive API key over an unencrypted connection (HTTP).
4. **Local Storage Write Health Checking**:
   - Wrapped storage writes in validation layers in [App.jsx](file:///src/App.jsx). If local storage write limits are reached (quota exceeded) or storage is blocked (private browsing mode), the app detects this and displays a visual warning header on the dashboard.
5. **Smart Offline Practice Padding**:
   - Refactored [PracticeSession.jsx](file:///src/components/PracticeSession.jsx) so that during offline sessions with limited mock questions, the app randomizes and recycles questions from the active topic instead of repeating a default welcome question.

---

## 5. CI/CD & Deployment Setup

### Continuous Integration (GitHub Actions)
A CI pipeline is configured in [.github/workflows/ci.yml](file:///.github/workflows/ci.yml). On every push or pull request to the `main` branch, the runner:
1. Boots up a clean `ubuntu-latest` VM.
2. Configures Node.js v24 environment with caching.
3. Performs a secure dependency install (`npm ci`).
4. Runs linter validation checks (`npm run lint`).
5. Executes the unit test suite (`npm run test`).
6. Verifies production Vite compilation (`npm run build`).

### CDN Hosting & Domain configuration
- **Hosting**: Served by **Vercel** via direct Git integration. Git pushes trigger automatic Vercel preview/production deployments.
- **Custom DNS Mapping**: 
  - Claimed a free `.me` student developer domain from Namecheap.
  - Linked Namecheap Advanced DNS records (A Record pointing to Vercel's Anycast IP and CNAME pointing to `cname.vercel-dns.com`).
  - Configured HTTPS enforcing with auto-renewing SSL certificates.
