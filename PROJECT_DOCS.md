# ProjektDeutsch AI

## AI-Powered German Learning System

ProjektDeutsch AI is a client-side, self-contained German learning coach designed to provide self-learners with structured, adaptive, and unlimited topic-specific practice. Rather than acting as a simple, generic AI question generator, the system functions as a personalized learning coach that tracks progress, analyzes weaknesses, and recommends practice topics based on a deterministic evaluation framework and a confidence decay model.

---

## 1. Executive Summary

- **Project Name:** ProjektDeutsch AI (also referred to as German AI Coach)
- **Description:** A lightweight, privacy-focused, single-page application (SPA) that allows learners to practice German grammar and vocabulary. The system uses a Bring-Your-Own-Key (BYOK) model to communicate directly with Google Gemini APIs for generating context-appropriate exercises, reducing infrastructure costs to zero.
- **CEFR Alignment:** The application's learning topics and vocabulary are structured according to Common European Framework of Reference for Languages (CEFR) levels. The curriculum has been updated to follow a textbook-aligned progression from A1 through B2.

---

## 2. Curriculum & Textbook-Aligned Structure

The curriculum is structured hierarchically into Levels, Topics, and Subskills to support precise weakness detection:

| Level | Topic ID | Topic Name | Subskills |
| :--- | :--- | :--- | :--- |
| **A1** | `family` | Family Vocabulary | `vocabulary`, `relationships` |
| | `numbers` | Numbers & Counting | `digits`, `spelling` |
| | `personal_pronouns` | Personal Pronouns | `nominative`, `accusative` |
| | `akkusativ` | Akkusativ Case | `articles`, `pronouns` |
| | `dativ` | Dativ Case | `articles`, `pronouns` |
| | `trennbare_verben` | Trennbare Verben | `prefixes`, `sentence_order` |
| | `perfekt` | Perfekt Tense | `auxiliary`, `participle` |
| | `modalverben` | Modalverben | `conjugation`, `syntax` |
| **A2** | `wechselpraepositionen` | Wechselpräpositionen | `dativ_wo`, `akkusativ_wohin` |
| | `adjektivdeklination` | Adjektivdeklination | `weak_inflection`, `strong_inflection` |
| | `nebensaetze_a2` | Subordinating Clauses (weil/dass) | `weil_dass` |
| | `relativsaetze` | Relativsätze | `nominative`, `accusative` |
| **B1** | `passiv` | Passiv Tense | `werden`, `von_durch` |
| | `konjunktiv_2` | Konjunktiv II | `wunschsaetze`, `hoeflichkeit` |
| | `nebensaetze` | Subordinating Clauses (obwohl/trotzdem) | `obwohl_trotzdem` |
| | `relativsaetze_b1` | Relativsätze (mit Präpositionen) | `prepositional`, `was_wo` |
| **B2** | `nominalstil` | Nominalstil | `preposition_noun`, `verb_noun_conversion` |
| | `passiversatz` | Passiv Ersatz | `sein_zu`, `sich_lassen` |

---

## 3. Architecture & Directory Structure

Below is the directory tree of the project with details on each file's responsibility:

```text
German-AI-Coach/ (Workspace Root)
├── .dockerignore             # Docker build ignores (e.g. node_modules, dist, git)
├── .gitignore                # Git untracked file patterns
├── Dockerfile                # Multi-stage build definition (Node.js compilation -> Nginx static serving)
├── docker-compose.yml        # Orchestration configuration for local production testing
├── nginx.conf                # Nginx virtual host with fallback rules for SPA routing
├── package.json              # App metadata, dependencies (React 19, Lucide, Vite)
├── vite.config.js            # Configuration settings for Vite and React plugins
├── index.html                # Main application HTML entry point
├── Project-Idea/             # Archive of product design specifications
│   ├── V1.md
│   ├── V2.md
│   ├── V3.md
│   └── V4.md                 # Latest Product Specification (v4.0)
└── src/                      # Client-side React source code
    ├── main.jsx              # Entry point linking React DOM to index.html
    ├── App.jsx               # Root component: manages global states, settings, and decay loops
    ├── App.css               # Main stylesheet (custom variables, glassmorphic designs, animations)
    ├── index.css             # Base reset CSS rules
    ├── assets/               # Image resources (e.g. hero illustrations, framework logos)
    ├── components/           # Modular visual components
    │   ├── Dashboard.jsx        # Landing dashboard featuring stats, ring charts, and queues
    │   ├── Navbar.jsx           # Top header navigation, level switching, and settings access
    │   ├── PracticeSession.jsx  # Setup, loader, and execution loop for practice drills
    │   ├── SettingsModal.jsx    # BYOK modal to store Gemini keys and adjust storage settings
    │   └── TopicList.jsx        # Subskills details, statistics, and individual topic review portal
    ├── data/                 # Data stores
    │   └── mockQuestions.js     # Fallback local exercise database for offline play
    └── utils/                # Helper libraries
        └── gemini.js            # Client-side Gemini integration with JSON Schema enforcement
```

---

## 4. Core Features & Learning Mechanics

### A. Level Selection & Progress Tracking
Users select CEFR levels from A1 through B2 in the navigation. The overall progress of the current level is calculated as the average of the mastery scores of all topics within that level:

$$\text{Level Progress} = \frac{\sum_{i=1}^{M} \text{Mastery Score}_i}{M}$$

Where $M$ is the number of topics in that level.

### B. Smart Practice Selection Algorithm
The **Smart Practice** session automatically constructs a blended curriculum of questions using a dynamic distribution:
- **60% Weak Topics:** Topics that have been practiced ($attempts > 0$) but have a mastery score under $60\%$.
- **20% Review Topics:** Topics that have been practiced, have a mastery score $\ge 60\%$, but have experienced confidence decay (confidence $< 70\%$ or last practiced $> 7$ days ago).
- **20% New Topics:** Topics that have never been practiced ($attempts = 0$).

#### Redistribution Rules
If any categories are empty, the algorithm redistributes question allocations dynamically to preserve the exact total target count:
1. **If Weak is empty:** 50% of the weak allocation is added to Review, and the remaining 50% is added to New.
2. **If Review is empty:** The review allocation is reassigned to Weak (if available) or New.
3. **If New is empty:** 75% of the new allocation is reassigned to Weak, and the remaining 25% is reassigned to Review.

Once topic counts are allocated, questions are fetched either through a dedicated multi-topic Gemini endpoint (`generateAiSmartQuestions`) or sliced from the local database.

### C. Player Inline Blanks
Questions containing the blank `___` are rendered dynamically. An interactive input box is placed inline inside the sentence. The input width is dynamically computed:

$$\text{Width (px)} = \max\left(80, \text{Answer Length} \times 14 + 20\right)$$

This provides an aesthetic, contextual, and structured input area directly within the sentence.

### D. Client-Side Deterministic Evaluation
Answer verification is performed entirely client-side for zero latency and cost. User inputs are compared in a normalized fashion:
1. Trim leading and trailing spaces.
2. Convert characters to lowercase.
3. Check if the result exists in the `accepted_answers` array.

### E. Confidence Decay & Visual Indicators
To simulate forgetting and prompt revisions, confidence decays daily:

$$C_t = C_0 \times e^{-0.01 t}$$

Where $C_0$ is the post-practice confidence ($100\%$), $t$ is the days elapsed, and confidence is clamped between $10\%$ and $100\%$. The Mastery Score is then calculated as:

$$\text{Mastery Score} = \text{Round}\left(\frac{\text{Accuracy} \times \text{Confidence}}{100}\right)$$

#### Visual Decay Indicators
Topics experiencing active confidence decay display a visual **"Decaying"** badge next to the topic name in both the **Dashboard** and **Topic List** interfaces. A topic is flagged as decaying if:
- It has been practiced ($attempts > 0$).
- **AND** either the current confidence is below $75\%$ or it has not been practiced for more than $5$ days.

This warning badge uses a `TrendingDown` (trending downwards arrow) icon to visually flag memory erosion.

### F. Individual Subskills Mastery Grading Logic
When a practice session finishes, overall topic accuracy is adjusted. In addition, accuracy is updated for individual subskills based on the specific questions encountered in that session. 

The grading logic is defined as:
- **For New Topics (Attempts = 0):** The subskill score is set directly to the session accuracy for that subskill:
  $$\text{Subskill Score} = \text{Round}(S_{\text{acc}})$$
- **For Existing Topics (Attempts > 0):** The system blends historical subskill performance with the current session's subskill accuracy, weighting by attempts and question distribution:
  $$\text{New Subskill Score} = \text{Round}\left(\frac{(S_{\text{current}} \times H) + (S_{\text{acc}} \times N)}{H + N}\right)$$
  Where:
  - $S_{\text{current}}$ is the historical subskill score.
  - $H$ is the historical topic attempts count.
  - $S_{\text{acc}}$ is the correctness percentage for this subskill in the current session.
  - $N$ is the number of questions testing this subskill in the current session.

### G. Cloud Sync ("Coming Soon")
The Google Drive synchronization architecture is designed to allow users to store their local learning history in their own private cloud. This feature is currently marked as **"Coming Soon"** in the application interface (the settings page displays a coming soon status and alerts the user that direct Google Drive integration is not yet active).

### H. Production Hardening & Security
To ensure production-grade safety and reliability, several defense-in-depth security mitigations are implemented:
1. **Content Security Policy (CSP)**: Nginx enforces a strict Content Security Policy. Script execution and connect targets are limited to authorized domains. Data exfiltration routes are locked down by restricting `connect-src` specifically to `'self'` and the Google Gemini API endpoint (`https://generativelanguage.googleapis.com`).
2. **BYOK Insecure Connection Warning**: Storing API keys in local storage over unencrypted HTTP is vulnerable. The settings panel detects insecure context dynamically (`window.location.protocol !== 'https:'`) and displays a critical warning banner to advise users to transition to HTTPS.
3. **Local Storage Health Check**: If local storage is full, blocked, or running in an unsupported private browser context, write operations fail. The app detects this failure state dynamically and renders a dashboard alert banner to inform the user that progress cannot be saved.
4. **Offline Practice Question Recycling**: Offline single-topic practice sessions recycle and randomize questions from the selected topic database if local pool sizes are smaller than the session size, rather than repeatedly serving a default welcome question.

---

## 5. Tech Stack & Tooling

- **Runtime Environment:** Node.js (v20+ supported)
- **Frontend Framework:** React 19 (`react`, `react-dom`)
- **Build System & HMR:** Vite 5 (`vite`, `@vitejs/plugin-react`)
- **Icons:** Lucide React (`lucide-react`)
- **CSS Preprocessing/Styling:** Raw CSS with custom variables for themes, responsive grids, flexbox, and glassmorphic cards (`App.css`)
- **Formatting & Linting:** ESLint 10 (`eslint`, `@eslint/js`)
- **Web Server:** Nginx (alpine-based)

---

## 6. Deployment & Docker Configuration

The application is fully containerized for easy distribution and hosting.

### Multi-Stage Dockerfile
The project uses a two-stage Docker build to maintain a tiny container footprint:
1. **Stage 1 (Build):** Uses `node:20-alpine` to install packages via `npm ci` and compile production static files via `npm run build`.
2. **Stage 2 (Serve):** Uses `nginx:alpine`, copies the compiled build output from `/app/dist` to `/usr/share/nginx/html`, and overrides the Nginx config with `nginx.conf`.

```dockerfile
# Stage 1: Build the Vite React application
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve the static assets with Nginx
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose
A `docker-compose.yml` file is provided in the workspace root for local production testing:
```yaml
services:
  web:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8080:80"
```

To run the containerized application locally, execute:
```bash
docker compose up --build -d
```
The application will then be accessible at `http://localhost:8080`.

### CI/CD Pipeline Automation
The codebase is configured with automated continuous integration (CI) via GitHub Actions. The workflow configuration is located in `.github/workflows/ci.yml`.

Every push or pull request to the `main` branch triggers:
1. **Runner Provisioning**: Bootstraps an Ubuntu execution runner.
2. **Node.js Environment Setup**: Installs Node.js matching requirements and initializes the npm dependency cache.
3. **Clean Installation**: Executes `npm ci` to fetch packages securely based on the lock file.
4. **Validation Suite**:
   - **Linter Execution**: Runs `npm run lint` (uses `oxlint`) to inspect code quality.
   - **Unit Tests**: Runs `npm run test` to verify stored metrics and storage schemas normalizations.
   - **Production Bundling**: Runs `npm run build` to verify Vite bundle compiles with no module resolution errors.

---

## 7. Version Control Status

- **Active Branch:** `main` (synchronized with `origin/main`)
- **Commit History Details:**
  - `d225d1b`: *fix: Remove nginx.conf from .dockerignore to resolve Docker build failure*
  - `b68fc38`: *feat: Initialize German AI Coach with glassmorphic UI, live Gemini integration, and Docker setup*
- **Modified Working Copy:**
  - Untracked/modified submodules in `.agents/skills/ui-ux-pro-max`.
