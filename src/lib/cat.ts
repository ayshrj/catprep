export const PROMPT_CAT = `YOU ARE: "CAT 2026 Coach" — strict, practical, high-signal. Audience: beginner preparing for CAT 2026 with a job. Goal: 99+ percentile and top 10–20 B-schools.

NON-NEGOTIABLE STYLE:
- Simple language. No analogies. No fluff. No motivation speeches.
- Prefer short bullets + small tables (BUT tables must be represented as JSON arrays).
- Be directly actionable: "do this today / this week / next 14 days".
- If user says "short", compress but keep steps and targets.

MATH OUTPUT (RENDERABLE):
- When writing formulas, use KaTeX-friendly math inside STRINGS:
  - Inline: "$...$"
  - Block: "$$\\n...\\n$$"
- Use LaTeX commands (\\\\frac, \\\\cdot, \\\\times, \\\\pm, \\\\lfloor \\\\rfloor, etc.).
- Avoid unicode math symbols inside formulas (use \\\\times instead of ×, \\\\pm instead of ±) INSIDE math.

🚨 OUTPUT FORMAT (STRICT JSON ONLY):
- Your FINAL response MUST be EXACTLY ONE valid JSON object.
- Do NOT wrap it in markdown, do NOT use code fences, do NOT add commentary outside JSON.
- Use double quotes for keys/strings. No trailing commas.
- If a field is unknown, use null (or [] for lists).
- ALWAYS include every top-level key listed in the schema below.

JSON SCHEMA (YOU MUST FOLLOW):
{
  "intent": "greeting|plan_request|mock_review|formula_request|topic_question|gdpi_request|other",
  "responseMode": "onboarding_questions|normal_coaching",
  "shouldAskQuickQuestions": true,
  "quickQuestions": ["..."],
  "scenario": { "code": "S1|S2|...|S18|unknown", "confidence": "low|med|high", "reason": "..." },
  "section": "QA|VARC|DILR|null",
  "topicTag": "string|null",
  "whatUserNeedsNow": "string",

  "mainAnswer": {
    "type": "greeting|onboarding_questions|plan|mock_review|formula|topic|gdpi|other",
    "bullets": ["..."],
    "table": { "headers": ["..."], "rows": [["..."]] } | null,
    "notes": ["..."]
  },

  "nextActions": {
    "today": ["..."],
    "thisWeek": ["..."]
  }
}

GREETING / ACK OVERRIDE:
- If the user message is ONLY a greeting/thanks/ack (examples: "hi", "hello", "thanks", "ok", "cool", "nice", "got it", "sure"):
  - Output JSON with:
    - intent="greeting"
    - mainAnswer.type="greeting"
    - mainAnswer.bullets in 1–2 short items
    - ask max 1 follow-up inside mainAnswer.bullets
    - nextActions can be empty lists

COACHING RULES:
- Do NOT dump giant tables unless user explicitly asks.
- For concept-heavy questions: use "formula + fastest method + when to skip".
- For DILR: always mention set selection rule (scan → select → commit; drop after 8–10 mins if stuck).
- For QA: always mention 2-pass rule (easy first; skip time sinks).
- For VARC: always mention elimination logic (out-of-scope / extreme words / distortion).

TOOL AWARENESS:
- You will receive tool outputs (intent, scenario, section/tag, mock extraction). Follow tool results strictly.
- You MUST still call tools when needed, but your FINAL assistant response must be JSON per schema.
`;

export type CatKnowledgeSection = {
  id: string;
  title: string;
  content: string;
};

export type CatKnowledgePart = {
  id: string;
  title: string;
  sections: CatKnowledgeSection[];
};

const KB_OVERVIEW = `# CAT 2026 — Complete Knowledge Base

This is the complete, consolidated **CAT preparation content** collected so far:
- Sections + tagging checklist (QA / DILR / VARC)
- Every-case scenario playbook
- Mock strategy + analysis framework
- Time management rules (section-wise)
- Working professional schedules
- QA formulas + shortcuts + traps (topic-wise)
- DILR frameworks + set-selection rules
- VARC frameworks + elimination rules + VA methods
- Final revision sheet (high-yield)`;

const KB_SECTIONS_TAGGING = `## 1) CAT Sections & Topic Tagging Checklist

### 1.1 QA (Quantitative Aptitude)

| Bucket | Sub-topics (tags) |
|---|---|
| Arithmetic | Percentages; Profit–Loss–Discount; SI/CI; Ratio–Proportion; Averages; Mixtures–Alligation; Time & Work; Pipes–Cisterns; Time–Speed–Distance (trains/boats); Partnerships; Installments |
| Algebra | Linear equations; Simultaneous equations; Inequalities; Quadratic equations; Polynomials; Surds/Indices; Logarithms; Functions; Graphs; Modulus; Sequences & Series (AP/GP); Special equations |
| Geometry | Lines & Angles; Triangles; Similarity; Quadrilaterals/Polygons; Circles; Coordinate geometry (line/distance/section basics; circle basics) |
| Mensuration | 2D (area/perimeter); 3D (surface area/volume); combined figures |
| Number System | Divisibility; Primes; Factors; HCF/LCM; Remainders & cyclicity; Last digit; Trailing zeros; Factorials; number properties; base/system (rare) |
| Modern Math | Sets & Venn basics; Permutation–Combination; Probability; Basic Statistics (mean/median/mode); Counting principles |

### 1.2 VARC (Verbal Ability & Reading Comprehension)

| Bucket | Sub-topics (tags) |
|---|---|
| RC Question Types | Main idea; Inference; Tone/Attitude; Specific detail; Vocabulary-in-context; Purpose; Structure/logic |
| Verbal Ability | Para-jumbles (PJ); Para-summary; Odd sentence out; Sentence insertion/para-completion (varies) |
| Support Skills | Reading speed; Comprehension stamina; Elimination; Basic grammar sense (supportive) |

### 1.3 DILR (Data Interpretation & Logical Reasoning)

| Bucket | Sub-topics (tags) |
|---|---|
| DI | Tables; Bar graphs; Line graphs; Pie charts; Mixed graphs; Caselets; Missing data; Ratio/percentage-heavy sets |
| LR | Seating (linear/circular); Arrangements; Grouping/Selection; Distribution; Ordering/Ranking; Scheduling; Games/Tournaments; Routes/Networks; Venn/Set-based logic; Binary logic; Constraints puzzles |
| Hybrid | DI+LR mixed sets (most CAT-like) |

### 1.4 Mandatory “Quick Classification” for Any Question
Whenever you see any question (mock/screenshot/text), classify it as:
- **Section:** QA / DILR / VARC  
- **Tag:** (e.g., QA → Arithmetic → Percentages)  
- **Skill used:** (e.g., ratio conversion + equation framing)  
- **How to recognize quickly:** (1 line)`;

const KB_SCENARIOS = `## 2) “Every Case Scenario” Playbook (Complete)

| Scenario | Trigger | Meaning | What to do (next 14 days) | Daily structure (working professional) | Target metric |
|---|---|---|---|---|---|
| S1 | Starting from scratch | Need fundamentals + habit | Pick 1 main resource; start basics; daily RC; LRDI exposure | 2–2.5h weekdays + 5–6h weekend | 1 QA topic/week + 10 RC/week + 6 LRDI sets/week |
| S2 | Time low (≤4 months) | Mock-first learning | Start mocks now; learn from gaps; stop chasing “perfect syllabus” | Weekdays: sectionals + review; Weekend: mock + deep analysis | 1–2 mocks/week + 2–3 sectionals/week |
| S3 | Work heavy | Weekend-heavy needed | Weekdays micro only; weekends deep work | Weekdays 45–75m; weekends 8–10h total | 6/7 day streak |
| S4 | Improving but slow | Normal | Don’t change resources; add timed practice gradually | Add 1 sectional/week | +5 to +10 marks/month |
| S5 | Plateau (3+ mocks) | Analysis not converting | Build “error syllabus”: top 10 mistakes; drill those | 60% error drills; 40% tests | Repeat errors down 50% in 2 weeks |
| S6 | Cutoff risk (one section low) | Eligibility risk | Shift time to weak section; maintain others | 50% weak; 25% each other | Weak section safely above cutoff |
| S7 | QA weak (can’t start) | Concepts missing | Arithmetic → Algebra → Geometry → NS → Modern; easy drills first | 60m concept + 60m practice + 20m review | 70%+ accuracy in easy QA |
| S8 | QA negatives high | Guessing/rushing | Attempt filter; 2-pass; accuracy drills | 30m accuracy drills daily | QA negative near zero |
| S9 | QA slow | Methods not optimized | Redo solved Qs faster; mental math | 20 “speed Qs” daily | Avg time down 20–30% |
| S10 | RC accuracy low | Misread/inference traps | RC-only training; elimination; review | 2 RC/day + error review | RC accuracy 60 → 75%+ |
| S11 | VA weak | Pattern missing | Daily PJ/summary/odd drills + review | 25–30m VA daily | VA accuracy 60%+ |
| S12 | DILR can’t start | Representation weak | Learn diagrams/tables/grids; start easy sets | 1 set/day + full write-up | 2 sets/40m consistently |
| S13 | DILR time sinks | Poor set selection | 3-min scan; drop rule at 8–10 min | Selection drills + 1 set/day | 2–3 sets solved/section |
| S14 | Mock chaos/panic | Strategy not fixed | Freeze strategy for 5 mocks | 1 mock/week + decision review | Decision errors drop each mock |
| S15 | Studying a lot, no score | Busy work | More timed tests; less content | 70% tests, 30% revision | Score up in 3 mocks |
| S16 | Forgetting topics | Weak revision | Spaced revision + formula/error notebook | 20m daily revision + weekly recap | Wrong-Q reattempt 80%+ |
| S17 | Uneven strengths | Leverage but keep cutoffs | Strong maintain; weak focus | Strong 2 days/week; weak 4 days/week | All sectionals safe |
| S18 | Last 8 weeks | Score-max mode | Only mocks + analysis + revision + error drills | 2 mocks/week + sectionals | Stable score band + low negatives |

**Playbook rules**
- DILR: **scan → select → commit**, never marry a set  
- QA: **easy first**, skip time sinks  
- VARC: **RC daily** is non-negotiable  `;

const KB_MOCK_STRATEGY = `## 3) Mock Strategy + Analysis Framework (Complete)

### 3.1 Output format for mock review
1) **Score snapshot**
- Overall:
- VARC / DILR / QA:
- Attempts + Accuracy (if known)

2) **Diagnosis (pick max 2 root causes)**
- negatives / accuracy
- time sinks
- wrong set selection (DILR)
- weak concepts (QA)
- reading speed / inference errors (VARC)
- panic / strategy changes

3) **Fix plan (14 days)**
- Keep:
- Stop:
- Start:
- Drills (topic-wise):
- Tests (mocks/sectionals count):

4) **Error log format**
- Date | Section | Topic tag | Mistake type (concept / calculation / selection / inference / time) | Correct method | Trigger line

### 3.2 Non-negotiable mock analysis steps
Bucket every question into:
- **WRONG**
- **GUESSED**
- **TIME-SINK** (>2.5 min)
- **SKIPPED-BUT-DOABLE**

Fix order:
1) **Silly/calc mistakes** (fastest marks)
2) **Strategy mistakes** (DILR set selection, QA time sink)
3) **Concept gaps** (topic revision)

Reattempt:
- Reattempt **wrong + time-sink** questions after **7–10 days**`;

const KB_TIME_MANAGEMENT = `## 4) Time Management Rules (Section-wise)

### QA
- **2-pass**
  - Pass 1: easy sitters
  - Pass 2: medium
  - Skip time sinks
- If stuck **>2 minutes** with no clear path → skip

### DILR
- First **2–3 minutes**: scan all sets, rank comfort
- Drop rule: if no progress by **8–10 minutes** → drop
- Goal: **2 strong sets consistently**, then push to 3–4

### VARC
- Default: **RC first then VA** (unless your data says otherwise)
- Use elimination; avoid overthinking inference
- Daily RC practice + review errors`;

const KB_WORKING_PRO = `## 5) Working Professional Schedule Templates

### Template A: Normal weekday (2 hours/day)
- 45m QA (concept + drill)
- 45m DILR (1 set or timed mini-set)
- 30m VARC (1 RC + review OR VA drill)

### Template B: Micro weekday (45–75m)
- 25–35m VARC (reading + 1 RC)
- 20–30m QA formula + 8–10 easy Qs OR 1 LRDI set (alternate days)

### Weekend template (5–6h/day)
- 1 full mock OR 2 sectionals
- Deep analysis
- Weak-topic drill block (2h)`;

const KB_QA_FORMULAS = `# 6) QA — Formulas + Shortcuts + Traps

## 6.1 Arithmetic

### Percentages
**Must-know**
- Basic change:
  $$
  \\text{New}=\\text{Old}\\left(1\\pm\\frac{p}{100}\\right)
  $$
- Successive change (signs matter):
  $$
  \\text{Net\\%}=a+b+\\frac{ab}{100}
  $$
- If $A$ is $x\\%$ more than $B$:
  $$
  A=B\\left(1+\\frac{x}{100}\\right),\\quad B=\\frac{A}{1+\\frac{x}{100}}
  $$

**Shortcuts**
- Fraction anchors:
  $$
  \\frac{1}{8}=12.5\\%,\\ \\frac{1}{6}\\approx16.67\\%,\\ \\frac{1}{11}\\approx9.09\\%,\\ \\frac{1}{7}\\approx14.29\\%
  $$

**Traps**
- Base confusion (old vs new)
- Successive discounts are not additive (use successive change)

**Practice types**
- Reverse percentage
- Successive changes
- Discount + profit chains

---

### Profit–Loss–Discount
**Must-know**
- Profit/Loss:
  $$
  \\text{Profit\\%}=\\frac{SP-CP}{CP}\\cdot100,\\quad \\text{Loss\\%}=\\frac{CP-SP}{CP}\\cdot100
  $$
- Discount:
  $$
  SP=MP\\left(1-\\frac{d}{100}\\right)
  $$

**Shortcuts**
- Convert each step to a multiplier (chain quickly)
- Back-solve from options

**Traps**
- Profit\\% base is $CP$
- Discount\\% base is $MP$

**Practice**
- $MP\\rightarrow SP\\rightarrow$ profit\\%
- Successive discounts
- Target profit then find $MP$/$d$

---

### Simple Interest / Compound Interest
**Must-know**
- Simple interest:
  $$
  SI=\\frac{P\\cdot r\\cdot t}{100}
  $$
- Compound amount:
  $$
  A=P\\left(1+\\frac{r}{100}\\right)^t
  $$
- Compounded $n$ times/year:
  $$
  A=P\\left(1+\\frac{r}{100n}\\right)^{nt}
  $$

**Shortcuts**
- For small $r$: $(1+r)^2\\approx 1+2r+r^2$ (use only when appropriate)
- Back-solve from options (common)

**Traps**
- Unit mismatch (months/years)
- Mixing SI and CI periods

**Practice**
- $CI-SI$
- Effective annual rate
- Mixed compounding

---

### Ratio–Proportion
**Must-know**
- Proportion:
  $$
  a:b=c:d\\ \\Rightarrow\\ ad=bc
  $$
- Unit method: if total is $T$ split in $a:b$:
  $$
  \\text{One part}=\\frac{T}{a+b}
  $$

**Traps**
- Misreading “$x\\%$ of”
- Scaling mistakes

---

### Averages
**Must-know**
- Average:
  $$
  \\bar{x}=\\frac{\\sum x_i}{n}
  $$
- Weighted average:
  $$
  \\bar{x}=\\frac{\\sum w_i x_i}{\\sum w_i}
  $$

**Traps**
- Adding averages directly
- Ignoring weights

---

### Mixtures–Alligation / Dilution
**Must-know**
- Concentration idea:
  $$
  \\text{Concentration}=\\frac{\\text{solute}}{\\text{solution}}
  $$
- Dilution: solute stays constant

**Traps**
- Forgetting solute constancy in replacement
- Wrong base for concentration

---

### Time & Work
**Must-know**
- Rate:
  $$
  \\text{Rate}=\\frac{1}{\\text{Time}}
  $$
- Together (A in $a$, B in $b$):
  $$
  T_{\\text{together}}=\\frac{ab}{a+b}
  $$
- Work proportionality:
  $$
  \\text{Work}\\propto (\\text{men})\\cdot(\\text{days})\\cdot(\\text{hours})\\cdot(\\text{efficiency})
  $$

**Traps**
- Confusing work done vs remaining
- Sign errors when subtracting contributions

---

### Pipes & Cisterns
**Must-know**
- Net rate:
  $$
  \\text{Net rate}=\\sum(\\text{inlet rates})-\\sum(\\text{outlet rates})
  $$
- Time:
  $$
  T=\\frac{1}{\\text{Net rate}}
  $$

**Traps**
- Wrong sign for outlet/leak
- Unit mismatch

---

### Time–Speed–Distance (Trains/Boats)
**Must-know**
- Core:
  $$
  D=S\\cdot T
  $$
- Relative speed:
  $$
  v_{\\text{rel}}=
  \\begin{cases}
  v_1+v_2 & \\text{opposite directions}\\\\
  |v_1-v_2| & \\text{same direction}
  \\end{cases}
  $$
- Average speed (equal distance):
  $$
  v_{\\text{avg}}=\\frac{2v_1v_2}{v_1+v_2}
  $$
- Conversion:
  $$
  1\\ \\text{m/s}=3.6\\ \\text{km/h}
  $$

**Traps**
- Wrong relative speed sign
- Unit mismatch

---

## 6.2 Algebra (Key formulas)

### Quadratic
**Must-know**
- Discriminant:
  $$
  D=b^2-4ac
  $$
- If roots are $\\alpha,\\beta$:
  $$
  \\alpha+\\beta=-\\frac{b}{a},\\quad \\alpha\\beta=\\frac{c}{a}
  $$

---

### Sequences & Series
**AP**
- Term:
  $$
  T_n=a+(n-1)d
  $$
- Sum:
  $$
  S_n=\\frac{n}{2}\\left(2a+(n-1)d\\right)
  $$

**GP ($r\\ne 1$)**
- Term:
  $$
  T_n=ar^{n-1}
  $$
- Sum:
  $$
  S_n=a\\frac{r^n-1}{r-1}
  $$

---

## 6.3 Geometry (Core formulas)

**Triangle area**
  $$
  \\text{Area}=\\frac{1}{2}bh
  $$

**Pythagoras**
  $$
  a^2+b^2=c^2
  $$

**Polygon**
- Interior angle sum:
  $$
  180(n-2)
  $$
- Number of diagonals:
  $$
  \\frac{n(n-3)}{2}
  $$

**Circle**
- Area and circumference:
  $$
  \\text{Area}=\\pi r^2,\\quad \\text{Circumference}=2\\pi r
  $$

---

## 6.4 Mensuration (Core)
- Cylinder:
  $$
  V=\\pi r^2h
  $$
- Sphere:
  $$
  V=\\frac{4}{3}\\pi r^3,\\quad A=4\\pi r^2
  $$

Similarity scaling:
  $$
  \\text{Area}\\propto k^2,\\quad \\text{Volume}\\propto k^3
  $$

---

## 6.5 Number System (High-yield)

### Divisors
If $N=p^a q^b r^c\\cdots$ then number of divisors:
  $$
  (a+1)(b+1)(c+1)\\cdots
  $$

### Trailing zeros in factorial
Zeros in $n!$:
  $$
  Z=\\left\\lfloor\\frac{n}{5}\\right\\rfloor+\\left\\lfloor\\frac{n}{25}\\right\\rfloor+\\left\\lfloor\\frac{n}{125}\\right\\rfloor+\\cdots
  $$

---

## 6.6 Modern Math (High-yield)

### Permutation–Combination
- Permutation:
  $$
  {}^nP_r=\\frac{n!}{(n-r)!}
  $$
- Combination:
  $$
  {}^nC_r=\\frac{n!}{r!(n-r)!}
  $$
- Multiset permutations:
  $$
  \\frac{n!}{a!\\,b!\\,c!\\cdots}
  $$
- Repetition arrangements:
  $$
  n^r
  $$

### Probability
- Union:
  $$
  P(A\\cup B)=P(A)+P(B)-P(A\\cap B)
  $$
- At least one:
  $$
  P(\\ge 1)=1-P(0)
  $$
- Independence:
  $$
  P(A\\cap B)=P(A)\\cdot P(B)
  $$`;

const KB_DILR_FRAMEWORKS = `# 7) DILR — Frameworks + Selection (Complete)

## 7.1 Universal DILR solve template
1) Convert text → **table/grid**
2) Mark constraints; apply strongest constraints first
3) Find anchors (unique/extreme/fixed positions)
4) Fill forced deductions; avoid random branching early
5) Solve questions only after structure is stable

## 7.2 Common representation templates
- Seating/arrangements → line/circle positions + mini grid
- Grouping/distribution → matrix (people × attributes)
- Scheduling → timeline / slots
- Tournaments → points table (team × played/win/loss/points)
- Networks/routes → graph with nodes/edges
- DI → rewrite as clean table; compute only required columns

## 7.3 Set selection rules (non-negotiable)
- **Scan 2–3 minutes**: rank sets (easy/medium/hard)
- Attempt **easiest 2 first**
- Drop rule: if no progress by **8–10 minutes**, drop and move
- Goal: **2 solid sets** consistently, then push to 3

## 7.4 DILR traps
- Starting hardest set first
- Spending 20 minutes on one set
- Over-calculating when only comparison needed
- Not writing a clean table early`;

const KB_VARC_FRAMEWORKS = `# 8) VARC — RC + VA Frameworks (Complete)

## 8.1 RC reading method (stable)
- Read structure: intro → claim → evidence → caveat → conclusion
- Track author stance (support/criticize/neutral)
- For inference: must be supported by passage logic; no outside knowledge

## 8.2 RC elimination rules (fast)
Eliminate options that are:
- Out-of-scope
- Extreme language (always/never) unless passage supports
- Distorted (uses same words but changes meaning)
- Too broad / too narrow vs passage scope
- Partial truth with an extra wrong detail

## 8.3 Para-jumbles (PJ)
- Find opener: no pronouns, no “however/therefore”
- Build link pairs via connectors (however/therefore/for example)
- Find conclusion: summary/generalization tone

## 8.4 Para-summary
- Match main claim + scope
- Reject options adding new claims
- Reject overly narrow or overly general options

## 8.5 Odd sentence out
- Identify the paragraph’s “thread”
- Odd sentence breaks topic/time/logic/flow`;

const KB_REVISION_SHEET = `# 9) Final High-Yield Revision Sheet (One Page)

## QA (core)
- Percent:
  $$
  \\text{New}=\\text{Old}\\left(1\\pm\\frac{p}{100}\\right),\\quad \\text{Net\\%}=a+b+\\frac{ab}{100}
  $$
- Profit/Loss:
  $$
  \\text{Profit\\%}=\\frac{SP-CP}{CP}\\cdot 100
  $$
- SI/CI:
  $$
  SI=\\frac{P\\cdot r\\cdot t}{100},\\quad A=P\\left(1+\\frac{r}{100}\\right)^t
  $$
- TSD:
  $$
  D=S\\cdot T,\\quad v_{\\text{avg}}=\\frac{2v_1v_2}{v_1+v_2}
  $$
- Work:
  $$
  \\text{Rate}=\\frac{1}{T},\\quad T_{\\text{together}}=\\frac{ab}{a+b}
  $$
- Geometry:
  $$
  a^2+b^2=c^2,\\quad \\text{Area}=\\frac{1}{2}bh
  $$
- Circle:
  $$
  \\text{Area}=\\pi r^2,\\quad \\text{Circumference}=2\\pi r
  $$
- Polygon:
  $$
  \\text{Interior sum}=180(n-2),\\quad \\text{Diagonals}=\\frac{n(n-3)}{2}
  $$
- Trailing zeros:
  $$
  Z=\\left\\lfloor\\frac{n}{5}\\right\\rfloor+\\left\\lfloor\\frac{n}{25}\\right\\rfloor+\\left\\lfloor\\frac{n}{125}\\right\\rfloor+\\cdots
  $$
- P\\&C:
  $$
  {}^nP_r=\\frac{n!}{(n-r)!},\\quad {}^nC_r=\\frac{n!}{r!(n-r)!}
  $$
- Probability:
  $$
  P(A\\cup B)=P(A)+P(B)-P(A\\cap B),\\quad P(\\ge 1)=1-P(0)
  $$

## DILR (core)
- Scan 2–3 mins → pick easiest 2 sets  
- Drop after 8–10 mins stuck  
- Draw grid/table first, solve later  

## VARC (core)
- Eliminate out-of-scope / extreme / distorted options  
- Main idea ≠ detail; inference must be supported  
- PJ: opener + link pairs + conclusion  `;

export const CAT_KB_PARTS: CatKnowledgePart[] = [
  {
    id: "overview",
    title: "Overview",
    sections: [
      {
        id: "overview",
        title: "CAT 2026 — Complete Knowledge Base",
        content: KB_OVERVIEW,
      },
    ],
  },
  {
    id: "foundations",
    title: "Foundations",
    sections: [
      {
        id: "sections-tagging",
        title: "CAT Sections & Topic Tagging Checklist",
        content: KB_SECTIONS_TAGGING,
      },
      {
        id: "scenario-playbook",
        title: "Every Case Scenario Playbook",
        content: KB_SCENARIOS,
      },
      {
        id: "mock-strategy",
        title: "Mock Strategy + Analysis Framework",
        content: KB_MOCK_STRATEGY,
      },
      {
        id: "time-management",
        title: "Time Management Rules",
        content: KB_TIME_MANAGEMENT,
      },
      {
        id: "schedule-templates",
        title: "Working Professional Schedules",
        content: KB_WORKING_PRO,
      },
    ],
  },
  {
    id: "qa-formulas",
    title: "QA Formulas",
    sections: [
      {
        id: "qa-formulas",
        title: "QA — Formulas + Shortcuts + Traps",
        content: KB_QA_FORMULAS,
      },
    ],
  },
  {
    id: "dilr-frameworks",
    title: "DILR Frameworks",
    sections: [
      {
        id: "dilr-frameworks",
        title: "DILR — Frameworks + Selection",
        content: KB_DILR_FRAMEWORKS,
      },
    ],
  },
  {
    id: "varc-frameworks",
    title: "VARC Frameworks",
    sections: [
      {
        id: "varc-frameworks",
        title: "VARC — RC + VA Frameworks",
        content: KB_VARC_FRAMEWORKS,
      },
    ],
  },
  {
    id: "revision-sheet",
    title: "Final Revision Sheet",
    sections: [
      {
        id: "revision-sheet",
        title: "Final High-Yield Revision Sheet",
        content: KB_REVISION_SHEET,
      },
    ],
  },
];

export const CAT_KB_SECTIONS = CAT_KB_PARTS.flatMap((part) => part.sections);

export const COMPLETE_MARKDOWN = CAT_KB_SECTIONS.map((section) =>
  section.content.trim()
).join("\n\n---\n\n");

export const GAMES = {
  goal: "CAT 2026 skill-building via games (DILR + QA heavy, VARC included)",
  baseline_ratio_by_section: {
    DILR: 0.5,
    QA: 0.3,
    VARC: 0.2,
  },
  recommended_games_ranked: {
    do_most: [
      {
        name: "Logic Grid Puzzles (Zebra/Einstein style)",
        section: "DILR",
        weight: 0.18,
        why: "Closest to CAT LR: constraints -> table -> deductions",
      },
      {
        name: "Sudoku (9x9 + variants)",
        section: "DILR",
        weight: 0.17,
        why: "Constraint discipline + no-guessing habit",
      },
      {
        name: "KenKen / Calcudoku",
        section: "DILR+QA",
        weight: 0.15,
        why: "Constraints + arithmetic fluency under time",
      },
      {
        name: "Minesweeper",
        section: "DILR",
        weight: 0.1,
        why: "Inference + marking + avoiding random clicks",
      },
      {
        name: "24 Game (make 24 using + - × ÷)",
        section: "QA",
        weight: 0.12,
        why: "Fast operations + flexible arithmetic",
      },
      {
        name: "Mental-math timed drills (as a game)",
        section: "QA",
        weight: 0.12,
        why: "Speed + accuracy; reduces silly mistakes",
      },
    ],
    do_some: [
      {
        name: "SET (pattern card game)",
        section: "DILR",
        weight: 0.06,
        why: "Pattern recognition + speed",
      },
      {
        name: "Nonograms (Picross)",
        section: "DILR",
        weight: 0.05,
        why: "Constraint tracking + clean notation",
      },
      {
        name: "Reading + 2-line summary (daily)",
        section: "VARC",
        weight: 0.08,
        why: "RC structure + retention",
      },
      {
        name: "Inference mini-drill (must be true?)",
        section: "VARC",
        weight: 0.07,
        why: "CAT-style inference discipline",
      },
    ],
    do_minimal_or_skip: [
      {
        name: "Reflex-only games (aim/reaction)",
        reason: "Low transfer to CAT skills",
      },
      {
        name: "Long grind RPGs / open-world time sinks",
        reason: "Kills consistency; low ROI per minute",
      },
      {
        name: "Tilt-heavy competitive multiplayer",
        reason: "High time cost + inconsistent routine",
      },
    ],
  },
  daily_time_budget_minutes: {
    weekday: 30,
    weekend: 60,
    max_if_busy: 20,
  },
  weekly_plan_template: {
    weekday_sessions: [
      {
        days_per_week: 3,
        minutes: 30,
        focus: "DILR",
        games: ["Logic Grid Puzzles", "Sudoku"],
      },
      {
        days_per_week: 2,
        minutes: 30,
        focus: "QA",
        games: ["24 Game", "Mental-math timed drills"],
      },
      {
        days_per_week: 2,
        minutes: 20,
        focus: "VARC",
        games: ["Reading + 2-line summary", "Inference mini-drill"],
      },
    ],
    weekend_sessions: [
      {
        days_per_week: 2,
        minutes: 60,
        focus: "DILR+QA",
        games: ["KenKen/Calcudoku", "Logic Grid Puzzles", "24 Game"],
      },
    ],
  },
  adjustment_rules: {
    if_DILR_is_weakest: {
      new_ratio_by_section: { DILR: 0.6, QA: 0.25, VARC: 0.15 },
      move_time_from: ["QA drills", "VARC drills"],
      move_time_to: ["Logic Grid Puzzles", "Sudoku", "KenKen"],
    },
    if_QA_is_weakest: {
      new_ratio_by_section: { DILR: 0.45, QA: 0.4, VARC: 0.15 },
      move_time_to: ["24 Game", "Mental-math timed drills", "KenKen"],
    },
    if_VARC_is_weakest: {
      new_ratio_by_section: { DILR: 0.45, QA: 0.25, VARC: 0.3 },
      move_time_to: ["Reading + 2-line summary", "Inference mini-drill"],
    },
  },
  progress_metrics: {
    DILR: [
      "finish 1 logic grid in <= 25 min with clean table",
      "reduce 'random trial' to near zero",
    ],
    QA: [
      "24-game success rate >= 70% within 2 minutes",
      "mental math accuracy >= 90%",
    ],
    VARC: [
      "2-line summaries reflect main idea + author tone correctly",
      "inference errors decreasing week over week",
    ],
  },
};
