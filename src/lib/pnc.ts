export const PNC = `## 1) Factorial (Section 1) — Definitions + Properties


## 1) Definition
### 1.1 Definition Overview
- \`n! = 1 × 2 × 3 × ... × (n-1) × n\`  (for positive integers)

### 1.2 Core properties
- \`n! = n × (n-1)!\`
- \`0! = 1\`
- \`n!\` is defined for **whole numbers** (non-negative integers)
- If \`x! = y!\`, then typically \`x = y\` (special: \`0! = 1! = 1\`)

**Example (p.64 style)**
- \`4! = 4×3×2×1 = 24\`
- \`5! = 5×4×3×2×1 = 120\`

---

## 2) Fundamental Principle of Counting (Section 2)

### 2.1 Addition Principle
If task-1 can be done in \`m\` ways and task-2 (independent) can be done in \`n\` ways, then doing **either one** can be done in:
- \`m + n\` ways

**Example (p.4)**
- Enter from north (15 gates) OR east (10 gates)  
  → total ways = \`15 + 10 = 25\`

### 2.2 Multiplication Principle
If operation-1 can be done in \`m\` ways and operation-2 can be done in \`n\` ways, then doing **both in sequence** can be done in:
- \`m × n\` ways  
More operations: \`m × n × p × ...\`

**Example (p.5)**
- A→B: 3 routes, B→C: 4 routes, C→D: 7 routes  
  → total routes = \`3×4×7 = 84\`

**Example (p.5)**
- 12 gates enter (12 ways), exit from a different gate (11 ways)  
  → total ways = \`12×11 = 132\`

---

## 3) Permutation (Section 3)

### 3.1 Permutations of \`n\` different objects in a row (all at a time)
- \`n!\`

### 3.2 Permutations of \`n\` different objects taken \`r\` at a time
- \`nPr = n! / (n-r)!\`

### 3.3 Permutations when some objects are identical
If total objects \`n\`, where \`p\` are identical of one kind, \`q\` identical of another, \`r\` identical of another, ...
- \`n! / (p! q! r! ...)\`

### 3.4 Permutations with repetition allowed
- Arrangements of length \`n\` using \`n\` distinct symbols (repetition allowed): \`n^n\`
- Arrangements of length \`r\` using \`n\` distinct symbols (repetition allowed): \`n^r\`

**Example (from Section 3 intro, p.12)**
- Objects A, B, C → permutations in a row:
  - \`3! = 6\` → ABC, ACB, BAC, BCA, CAB, CBA
- Taken 2 at a time:
  - \`3P2 = 3!/1! = 6\`

---

## 4) Combination (Section 4)

### 4.1 Combinations of \`n\` different objects taken \`r\` at a time (no repetition)
- \`nCr = n! / (r!(n-r)!)\`
- Also: \`nCr = nPr / r!\`

### 4.2 Combinations with repetition allowed
- Number of ways to select \`r\` items from \`n\` types (repetition allowed):
- \`(n + r - 1)Cr\`

---

## 5) Properties / Identities of \`nCr\` (Section 4 “Things to Remember”, p.65)

- \`nC0 = nCn = 1\`
- \`nCr = nC(n-r)\`
- If \`nCr = nCk\` then \`r = k\` OR \`r = n-k\`
- Pascal identity:
  - \`nCr + nC(r-1) = (n+1)Cr\`
- \`r · nCr = n · (n-1)C(r-1)\`
- Useful ratio:
  - \`nC(r+1) / nCr = (n-r)/(r+1)\`
- Another identity:
  - \`nCr = (n/r) · (n-1)C(r-1)\`
- Maximum value:
  - If \`n\` is even → max at \`r = n/2\`
  - If \`n\` is odd → max at \`r = (n-1)/2\` and \`r = (n+1)/2\`

---

## 6) Typical Problem Categories (TPC) — “Ready formulas” (Section 5)

### TPC-1: Always include \`p\` particular objects in selection
- Ways to select \`r\` from \`n\` with \`p\` fixed included:
- \`(n-p)C(r-p)\`

**Example (p.26)**
- Team of 11 from 16, two specific players must be included:
- \`(16-2)C(11-2) = 14C9\`

### TPC-2: Always exclude \`p\` particular objects in selection
- Ways to select \`r\` from \`n\` excluding \`p\` fixed:
- \`(n-p)Cr\`

### TPC-3: Select AND arrange \`r\` from \`n\` such that \`p\` particular are always included
- Choose remaining: \`(n-p)C(r-p)\`
- Arrange all selected: \`r!\`
- Total:
- \`(n-p)C(r-p) × r!\`

### TPC-4: Select AND arrange \`r\` from \`n\` such that \`p\` particular are always excluded
- \`(n-p)Cr × r!\`

### TPC-5: Arrange \`n\` distinct objects such that \`p\` particular objects stay together
Treat the \`p\` as 1 block:
- Total units = \`n - p + 1\`
- Arrange units: \`(n-p+1)!\`
- Arrange inside block: \`p!\`
- Total:
- \`(n-p+1)! × p!\`

### TPC-6: Arrange \`n\` distinct objects such that \`p\` particular objects are always separated
- Arrange the other \`(n-p)\` objects: \`(n-p)!\`
- Gaps = \`(n-p+1)\`
- Choose \`p\` gaps: \`(n-p+1)Cp\`
- Arrange the \`p\` objects: \`p!\`
- Total:
- \`(n-p)! × (n-p+1)Cp × p!\`

### TPC-7: Minimum/maximum constraints in selection
Method:
- “At least k” → sum: \`nCk + nC(k+1) + ... + nCn\`
- “At most k” → sum: \`nC0 + nC1 + ... + nCk\`
(Use complements when faster.)

### TPC-10: Selection of one or more objects
(i) From \`n\` distinct objects:
- \`2^n - 1\`

(ii) From \`n\` identical objects:
- \`n\`  (choose 1..n)

(iii) From mixed groups: \`p\` alike of kind-1, \`q\` alike of kind-2, \`r\` alike of kind-3, and \`n\` distinct:
- \`[(p+1)(q+1)(r+1)...(2^n)] - 1\`

**Example (p.39) — “Attempt at least one from each section”**
- Section A: 6 questions → \`2^6 - 1\`
- Section B: 4 questions → \`2^4 - 1\`
- Section C: 3 questions → \`2^3 - 1\`
- Total ways:
- \`(2^6-1)(2^4-1)(2^3-1) = 63×15×7 = 6615\`

### TPC-11: Derangement (Dearrangement theorem)
Number of ways to arrange \`n\` distinct items so that **no item is in its original place**:
- \`!n = n! [ 1 - 1/1! + 1/2! - 1/3! + ... + (-1)^n (1/n!) ]\`

**Example (p.40)**
- \`!5 = 5![1 - 1/1! + 1/2! - 1/3! + 1/4! - 1/5!]\`
- The solution in the PDF computes it as:
  - \`120 - 60 + 20 - 5 + 1 = 44\`

### TPC-12: Sum of all numbers formed using given digits (no repetition)
Core trick:
- Total permutations: \`n!\`
- Each digit appears equally often in each place: \`(n!/n) = (n-1)!\` times
- If digits are \`d1..dn\`, then sum of digits = \`S = d1 + ... + dn\`
- Contribution per place = \`(n-1)! × S\`
- Total sum = \`(n-1)! × S × (111...1)\` (n ones)

**Example (p.41)**
Digits: 1,2,3,4,5 (5 digits)
- \`S = 15\`
- Each digit per place appears \`5!/5 = 24\` times
- Total sum:
- \`24 × 15 × 11111 = 3999960\`

### TPC-13: Rank of a word in dictionary order
General method:
- For each position, count how many words can be formed using a **smaller** available letter at that position,
  multiplied by permutations of remaining letters (divide by factorials of repeats), then move to next position.
- Final rank = (count of words before it) + 1

**Example (p.42)**
Rank of “RANDOM” shown as:
- \`Rank = 5×(5!) + 2×(3!) + 2 = 614\`

### TPC-15: Points of intersection / Lines / Triangles / Diagonals (p.45–46)
- Intersections of \`n\` non-parallel, non-concurrent lines: \`nC2\`
- Lines from \`n\` points (no 3 collinear): \`nC2\`
- Triangles from \`n\` points (no 3 collinear): \`nC3\`
- Diagonals in \`n\`-gon:
  - \`nC2 - n = n(n-3)/2\`

**Example (p.46)**
10 points, no 3 collinear except 4 collinear:
- Lines total: \`10C2 = 45\`
- Lines from 4 collinear pairs: \`4C2 = 6\` but they form only 1 line
- Required lines: \`45 - 6 + 1 = 40\`

Triangles:
- Total triangles: \`10C3 = 120\`
- Triangles using 3 of the 4 collinear points: \`4C3 = 4\` (invalid)
- Required triangles: \`120 - 4 = 116\`

---

## 7) Division & Distribution of Non-Identical (Distinct) Objects (Section 6)

### 7.1 Case I: Unequal group sizes (divide only)
If \`(m+n+p)\` distinct objects are divided into 3 **unlabeled** groups of sizes \`m, n, p\`:
- \`(m+n+p)! / (m! n! p!)\`

### 7.2 Case I: Unequal group sizes (divide + distribute to labeled groups)
If those 3 groups are assigned to **3 labeled recipients**:
- \`(m+n+p)! / (m! n! p!) × 3!\`

**Example idea matches p.50**
3 distinct balls among 2 boys such that one gets 2 and other gets 1:
- Choose 2 for one: \`3C2\`
- remaining 1 fixed: \`1C1\`
- choose who gets 2 balls: \`2\` ways
- Total: \`3C2 × 1C1 × 2 = 6\`

### 7.3 Case II: Equal division into \`m\` groups each size \`n\` (total \`mn\` objects)
- Divide into **unlabeled** equal groups:
  - \`(mn)! / [(n!)^m × m!]\`
- Divide and distribute into **labeled** groups:
  - \`(mn)! / (n!)^m\`

### 7.4 Case III: Mixed equal + unequal sizes (pattern groups)
If you have \`(m + 2n + 3p)\` distinct objects divided into 6 groups of sizes:
- \`m, n, n, p, p, p\`  (two groups of size n and three groups of size p)

Divide into **unlabeled** groups:
- \`(m+2n+3p)! / [ m! (n!)^2 (p!)^3 × 2! × 3! ]\`

Divide and distribute into **6 labeled** groups:
- \`(m+2n+3p)! / [ m! (n!)^2 (p!)^3 ]\`  
(Reason: labeling removes the \`2!\` and \`3!\` identical-group correction.)

---

## 8) Other Distribution Formulae (p.68)

### 8.1 \`n\` distinct objects into \`r\` groups (empty allowed)
- \`r^n\`

### 8.2 \`n\` distinct objects into \`r\` groups (each group at least one)
(Inclusion–exclusion)
- \`r^n - rC1 (r-1)^n + rC2 (r-2)^n - ... + (-1)^(r-1) rC(r-1) (1)^n\`

---

## 9) Circular Permutation (Section 7)

### 9.1 Distinct objects around a circle (rotations same)
- \`(n-1)!\`

### 9.2 If clockwise and anticlockwise are also same (necklace/garland)
- \`(n-1)! / 2\`

**Example prompt shown (p.56)**
- “4 men and 4 women at a circular table so that no two women are adjacent”
(Use: arrange men in circle \`(4-1)!\`, then place women in gaps, then arrange women.)

---

## 10) Division of Identical Objects into Groups (Section 8)

### 10.1 \`n\` identical objects into \`r\` distinct groups (empty allowed)
(Stars and Bars)
- \`(n + r - 1)C(r - 1)\`

### 10.2 \`n\` identical objects into \`r\` distinct groups (each ≥ 1)
- \`(n - 1)C(r - 1)\`

### 10.3 Each group has min \`m\` and max \`k\`
- Coefficient of \`x^n\` in:
- \`(x^m + x^(m+1) + ... + x^k)^r\`

**Example (p.59)**
- 5 identical books among 3 boys, each gets at least 1:
- \`(5-1)C(3-1) = 4C2 = 6\`

---

## 11) Quick “What to apply when” Map (fast decision)

- “Arrange / order matters” → Permutation (\`nPr\`, factorial)
- “Select / order doesn’t matter” → Combination (\`nCr\`)
- “Repeated letters / identical items” → divide by factorial of repeats
- “At least one / none” → \`2^n - 1\` or complement
- “Distribute distinct objects into groups” → \`r^n\` (then inclusion-exclusion if non-empty)
- “Distribute identical objects into groups” → Stars & Bars
- “Circle” → \`(n-1)!\` (or \`/2\` for necklace)
- “No one in original position” → Derangement \`!n\`
- “Sum of all numbers formed” → symmetry: each digit repeats equally in each place

---
`;

export type PncSection = {
  id: string;
  title: string;
  content: string;
};

export type PncPart = {
  id: string;
  title: string;
  sections: PncSection[];
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const parsePnc = (markdown: string): { title: string; parts: PncPart[] } => {
  const trimmed = markdown.trim();
  const [titleLine = "PNC", ...restLines] = trimmed.split("\n");
  const title = titleLine.replace(/^#\s+/, "").trim() || "PNC";
  const body = restLines.join("\n").trim();

  const partBlocks = body
    .split(/(?:^|\n)##\s+/)
    .map(block => block.trim())
    .filter(Boolean);

  const parts = partBlocks.map(block => {
    const [partTitleLine = "PNC", ...partLines] = block.split("\n");
    const partTitle = partTitleLine.replace(/^##\s+/, "").trim();
    const partBody = partLines.join("\n").trim();

    const sectionBlocks = partBody.split(/(?:^|\n)###\s+/);
    const sections: PncSection[] = [];

    const intro = sectionBlocks.shift();
    if (intro && intro.trim()) {
      sections.push({
        id: slugify(`${partTitle}-overview`),
        title: `${partTitle} Overview`,
        content: `### ${partTitle} Overview\n\n${intro.trim()}`,
      });
    }

    sectionBlocks.forEach(sectionBlock => {
      const [sectionTitleLine = "Section", ...sectionLines] = sectionBlock.split("\n");
      const sectionTitle = sectionTitleLine.trim();
      const sectionBody = sectionLines.join("\n").trim();
      const content = [`### ${sectionTitle}`, sectionBody].filter(Boolean).join("\n\n");

      sections.push({
        id: slugify(`${partTitle}-${sectionTitle}`),
        title: sectionTitle,
        content,
      });
    });

    return {
      id: slugify(partTitle),
      title: partTitle,
      sections,
    };
  });

  return { title, parts };
};

const parsedPnc = parsePnc(PNC);

export const PNC_TITLE = parsedPnc.title;
export const PNC_PARTS = parsedPnc.parts;
