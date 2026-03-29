# GForm Visualizer

> Upload any CSV. Get instant charts, narrative insights, and a plain-English answer to "Was this workshop effective?"

---

## Depolyment Link
https://visualizer-self.vercel.app/

---

## What it does

Most data tools tell you what your data *looks like*. CSV Intelligence Dashboard tells you what your data *means*.

Upload a CSV from a workshop survey, training evaluation, or feedback form and the dashboard will:

- Auto-detect every column type and pick the right chart for it
- Find before/after question pairs and calculate how much each dimension improved
- Give every dataset an **Effectiveness Score** (0–100) with a one-line verdict
- Surface specific callouts like *"Concept Clarity improved 35% after the session"* or *"Split opinions on Session Pace — high variance"*
- Let you compare any two columns against each other, in any chart type you choose

No configuration. No mapping. Just upload and read.

---

## Screenshots / Feature Overview

### Workshop Effectiveness Analysis
The first thing you see after upload is a verdict panel — a circular gauge, a label (Highly Effective / Effective / Mixed Results / Needs Improvement), and a plain-English rationale. Below it, insight cards are grouped into:

- **What Improved** — before/after pairs where scores rose
- **Strengths** — high-scoring dimensions and strong majority responses
- **Areas to Address** — low scores, negative majorities, high variance
- **No Significant Change** — paired dimensions that didn't move

### Auto-Generated Charts
The dashboard reads your column types and generates the most appropriate visualization for each one automatically — histograms for numeric distributions, pie/bar charts for categories, line charts for time series, keyword frequency charts for free-text.

### Column Comparison Tool
Pick any two columns from dropdowns and the dashboard generates the right chart for that combination. Switch chart types using the pill selector — only compatible types are enabled for the columns you've chosen.

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install and run

```bash
# 1. Unzip and enter the project
unzip csv-intelligence-dashboard.zip
cd project-modified

# 2. Install dependencies
npm install

# 3. Configure environment (see below)
cp .env.example .env

# 4. Start the dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Environment variables

Create a `.env` file at the project root (or edit the existing `.env`):

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

If you don't have a Supabase project, create one at [supabase.com](https://supabase.com) — the free tier is sufficient. Then run the migration in `supabase/migrations/` to create the required tables.

> **Running without Supabase?** The app works without a database — datasets are held in memory for the session. You just won't have persistence across page refreshes.

### Build for production

```bash
npm run build
npm run preview   # serve the build locally
```

---

## How to use it

### 1. Upload your CSV

Drag and drop a file onto the upload area, or click to browse. The app also accepts a Google Sheets shareable link — paste it into the Google Sheets tab on the import screen.

Supported input types:
- `.csv` files (any delimiter — auto-detected)
- Google Sheets shared as CSV

### 2. Read the insight layer

The **Workshop Effectiveness Analysis** panel appears immediately. It shows:

- The **Effectiveness Score** (0–100) and verdict label
- A rationale sentence explaining why that score was assigned
- Insight cards grouped by type — improvements, strengths, concerns, no-change

### 3. Explore the charts

Below the insight layer, auto-generated charts cover every column in the dataset. Scroll to review distributions, trends, keyword clouds, and summary statistics.

### 4. Compare columns

Use the **Compare Columns** panel to explore relationships manually:

1. Pick Column A and Column B from the dropdowns
2. A chart type is auto-selected based on the column types
3. Click any compatible chart type pill to switch views
4. Incompatible types are shown greyed out

### 5. Export a report

Click **Export Report** in the top-right of the summary banner to download a plain-text analysis file you can share or archive.

---

## Before/After tracking

The insight engine automatically detects before/after question pairs by looking for the words **before** and **after** in column names. For best results, name your columns like this:

| Before column | After column |
|---|---|
| `Confidence (Before)` | `Confidence (After)` |
| `Understanding Before` | `Understanding After` |
| `Pre: Concept Clarity` | `Post: Concept Clarity` |

When a pair is found, the dashboard computes:
- Average score before and after
- Absolute delta and percentage change
- Whether the change is significant, noticeable, or negligible
- A plain-English headline describing what happened

---

## Supported data types

| Column type | Detected when | Visualized as |
|---|---|---|
| **Numeric** | >90% of values parse as numbers | Histogram, scatter, line |
| **Categorical** | ≤20 unique values, short strings | Pie chart (≤6 values) or bar chart |
| **Boolean** | yes/no, true/false, 0/1 values | Pie chart |
| **Date** | >80% of values parse as dates | Line chart (trend over time) |
| **Text** | Long or high-cardinality strings | Keyword frequency chart |
| **ID** | >95% unique values in a large set | Excluded from charts |

Likert scale text values (`Strongly Agree`, `Satisfied`, `Poor`, etc.) are automatically converted to numeric scores (1–5) for averaging and comparison.

---

## Effectiveness Score methodology

The score is computed from signals found in the data:

| Signal | Effect on score |
|---|---|
| Before/after improvement | +12 per improved pair |
| Before/after decline | −10 per declined pair |
| No change in paired dimension | −4 per flat pair |
| High-scoring standout column (≥80% of scale) | +8 |
| Low-scoring concern column (<50% of scale) | −6 |
| High completion rate (≥95%) | Positive |
| Low completion rate (<70%) | Negative |
| High variance on a column (σ/mean > 0.4) | Flags concern |
| Average % delta across all pairs | Scaled ×30 |

Scores are clamped to 0–100 and mapped to labels:

| Score | Label |
|---|---|
| 78–100 | Highly Effective |
| 58–77 | Effective |
| 38–57 | Mixed Results |
| 0–37 | Needs Improvement |

---

## Project structure

```
src/
├── components/
│   ├── Dashboard.tsx          # Main dashboard layout, column comparison tool
│   ├── InsightLayer.tsx       # Effectiveness verdict + narrative insight cards
│   ├── Charts.tsx             # UniversalChart — renders all recharts chart types
│   ├── DataImport.tsx         # Import tab switcher (CSV / Google Sheets)
│   ├── FileUpload.tsx         # Drag-and-drop CSV uploader
│   ├── GoogleSheetsImport.tsx # Google Sheets URL importer
│   └── Sidebar.tsx            # Dataset list and navigation
├── lib/
│   ├── dataProcessor.ts       # Column profiling, type detection, viz generation
│   ├── intelligenceEngine.ts  # Before/after detection, insight generation
│   ├── csvParser.ts           # PapaParse wrapper
│   ├── textAnalysis.ts        # Keyword extraction, stopword filtering
│   └── supabase.ts            # Supabase client
├── App.tsx                    # Root component, dataset state management
└── main.tsx                   # Entry point
```

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| Charts | Recharts 3 |
| CSV parsing | PapaParse 5 |
| Icons | Lucide React |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase anonymous auth |

---

## Example use cases

**Workshop and training evaluation**
Name your feedback columns with `(Before)` and `(After)` suffixes and the dashboard will automatically measure every dimension's improvement, compute an effectiveness score, and tell you which areas landed and which didn't.

**Employee or student surveys**
Upload a satisfaction or engagement survey CSV and get instant category distributions, high/low performers called out, and variance flags for polarising questions.

**Event feedback**
Post-event feedback forms become readable in seconds — top keywords from open responses, rating distributions, and a completion rate signal for engagement.

**Research data exploration**
Any tabular CSV with numeric and categorical columns gets auto-charted. Use the column comparison tool to explore correlations and group differences interactively.

---

## Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server at localhost:5173 |
| `npm run build` | Build for production into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript compiler check without emitting |

---

## License

Private — all rights reserved.
