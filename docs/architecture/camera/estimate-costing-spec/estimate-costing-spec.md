# Estimate & Costing — v1 / v2 Implementation Spec

## North star

> v1 does not "capture data." v1 produces **trainable records** — job histories clean
> enough that a per-customer agent can take over quoting in v2. The fidelity of capture
> now is the ceiling on agent capability later. There is no v2 recovery from dirty v1 data.

---

## Goals — what is actually tracked

The feature exists to track, for every job, two sets of values and the gap between them:

- **Forward (the estimate):** what we predict the job will take — per line, the quantity,
  unit, labour hours, and material cost.
- **Back (the close-out):** what the job *actually* took — the same dimensions, measured at
  job close: actual quantity, actual hours, actual material cost.

The point of the feature is that these two meet, line for line. The **variance between
forward and back is the product** — it's both the contractor's profit visibility today and
the training signal for the v2 quoting agent tomorrow. The original failure this spec fixes
was that forward and back costing didn't meet: the estimate carried `item / qty / unit` and
no time, while close-out carried hours and materials — they measured different dimensions and
couldn't reconcile.

### The symmetry requirement (the core rule)

> **Every dimension you estimate, you measure. If a field exists on the estimate, its actual
> counterpart must exist at close-out.**

Estimate and close-out are mirror images. `estimated_qty` ↔ `actual_qty`,
`estimated_hours` ↔ `actual_hours`, `estimated_material_cost` ↔ `actual_material_cost`. A
value captured on only one side is a blind spot — you can record it but never reconcile it,
and the variance for that dimension is permanently unrecoverable.

This rule is **forward-compatible**: it governs future schema changes, not just today's
fields. The day you add a new estimable dimension to the estimate (waste %, equipment hours,
subcontractor cost, travel time — whatever), you add its actual counterpart to job close in
the same change. An estimate field without a matching close-out field is an incomplete
feature, not a smaller one. When in doubt, the test is: *"at job close, can the contractor
report the real number for this?"* If not, don't add it to the estimate either.

---

## 0. Non-negotiables (the sharp edges)

These are guardrails, not goals. They lead the doc deliberately — they must hold across
every session, every agent, every onboarding. If a change violates one of these, it is
wrong even if it ships faster.

1. **Estimate lines are frozen at quote time.** `estimated_qty` / `estimated_hours` are
   stored computed values, never recomputed from the live template at read time. Tuning a
   template rate must not retroactively alter what a customer was quoted. The estimate is a
   historical record; the template is a living function. Never couple them.

2. **Every actual maps to exactly one estimate line.** `job_line.estimate_line_id` is the
   single FK that makes forward and back costing meet. Completion is not a fresh list of
   materials — it is a per-line fulfilment of the estimate. Lose this and you have
   job-level reconciliation but never line-level, which is where all the learning lives.

3. **Store the spoken input.** `estimate.param_values` records what the contractor actually
   said ("area: 20"). That value is the *denominator* the learned rate divides by. Actuals
   without the parameter that drove them are uncuttable — you can't recover a rate.

4. **Rates version, never overwrite.** Every rate adjustment writes a new
   `template_line_rate_history` row. Overwriting destroys the ability to ask "what would we
   have quoted six months ago" and you cannot reconstruct it. This is the one place the
   cheap option also preserves data you can't recreate.

5. **Statistical learning and the agent are separate layers.** The regression that tunes
   rates (no LLM) is the foundation. The agent (LLM, voice + photos → proposed quote) is a
   consumer of that foundation. Build them apart.

6. **The agent never commits a quote silently.** Any agent-proposed estimate goes through
   the confirmation-card pattern before it becomes a real `estimate`. Low-stakes logging may
   auto-confirm with undo; an outbound quote does not.

7. **Estimate and close-out stay symmetric.** Every field present on the estimate side has an
   actual counterpart at job close. This holds for new fields too — adding an estimable
   dimension to the estimate without adding its actual to close-out ships a permanent blind
   spot. Forward without back is not a smaller feature; it's a broken one.

---

## 1. The four layers

```
  CAPTURE          →  CORPUS            →  STATISTICAL       →  AGENT
  (v1, build now)     (v1 guarantee)       (v1 silent / v2)     (v2, per-customer flip)

  voice + photos      trainable-job        learned_rate         hears job description,
  template instant.   records, labeled,    write-back per       retrieves similar jobs,
  job completion      complete, retriev-   template_line        proposes a quote using
  variance compute    able                 (pure math)          rates + history + photos
```

The agent in the rightmost box is the visible v2 feature. Everything to its left is v1.
The statistical layer can — and should — run quietly during v1, writing to shadow rates,
so that the day the agent flips on, the math underneath it is already tuned and warm.

---

## 2. Data model (the v1 deliverable)

Relational / Postgres. Five tables. Template side defines the parametric function; estimate
side freezes an instance; job side records reality.

```
TEMPLATE
  id            PK
  contractor_id FK          -- whose library (lock-in lives here)
  name                      -- "Bedroom repaint"
  primary_param             -- "area" | "length" | "count" | "fixed"
  primary_unit              -- "sq_ft" | "linear_ft" | "ea"

TEMPLATE_LINE               -- the parametric definition
  id                  PK
  template_id         FK
  item                      -- "wall paint, labour"
  kind                      -- "labour" | "material"
  unit                      -- "hrs" | "gal" | "ea"
  rate                      -- per unit of param: 0.25 (hrs per sq_ft)
  param_binding             -- "primary" | "secondary:<key>" | "fixed"
  default_secondary_value   -- e.g. 2 (outlets); null if primary/fixed

ESTIMATE
  id            PK
  job_id        FK
  contractor_id FK
  param_values  jsonb       -- {area: 20, outlets: 4}  the spoken + adjusted inputs
  description   text        -- the transcript: "repaint the back bedroom"  (RETRIEVAL KEY)

ESTIMATE_LINE               -- instantiated, FROZEN at quote time
  id                  PK
  estimate_id         FK
  template_id         FK    -- origin; null if hand-added
  template_line_id    FK    -- exact line it came from (the natural key for learning)
  item
  kind                      -- labour | material
  unit
  estimated_qty             -- computed: rate × param_value, then frozen
  estimated_hours           -- if kind = labour
  estimated_material_cost

JOB_LINE                    -- the back-costing counterpart
  id                  PK
  job_id              FK
  estimate_line_id    FK    -- ← THE JOINT (non-negotiable #2)
  actual_qty
  actual_hours
  actual_material_cost
  variance_note       text  -- optional, captured at close (see §4) — disproportionately valuable

TEMPLATE_LINE_RATE_HISTORY  -- non-negotiable #4
  id                  PK
  template_line_id    FK
  rate
  effective_at
  source                    -- "seed" | "learned" | "manual"
  n_jobs_at_adjustment      -- how much data backed this rate (feeds confidence, §6)
```

### Reconciliation (back costing) — one join

```sql
SELECT el.template_line_id,
       el.estimated_hours, jl.actual_hours,
       jl.actual_hours - el.estimated_hours AS hours_variance
FROM   estimate_line el
JOIN   job_line jl ON jl.estimate_line_id = el.id;
```

### Learned rate — per template line, grouped by its own param binding

Each line learns against the parameter it is bound to, not a single global divisor. Labour
may scale on area while terminations scale on outlet count — so the denominator is per-line.

```sql
-- conceptual: divisor is the param_values key named by template_line.param_binding
SELECT el.template_line_id,
       SUM(jl.actual_hours)
         / NULLIF(SUM( (e.param_values ->> tl.driver_key)::numeric ), 0) AS learned_rate,
       COUNT(*) AS n_jobs
FROM   job_line jl
JOIN   estimate_line el ON el.id = jl.estimate_line_id
JOIN   estimate e       ON e.id = el.estimate_id
JOIN   template_line tl ON tl.id = el.template_line_id
GROUP BY el.template_line_id;
```

`learned_rate` is written into `template_line_rate_history` (source = "learned"), never over
the original. Confidence (§6) decides whether it becomes the active rate.

---

## 3. v1 scope — build now

The estimate ↔ completion loop, end to end, with **no agent surfaced**. v1 is the capture
machine and the training-corpus generator.

- [ ] **Parametric templates.** A template is a list of lines where `qty = rate × param`.
      Fixed lines are just `rate × 1`. One primary parameter spoken up front; secondary
      parameters defaulted but editable. "Bedroom 20" is a complete estimate; "cable run 40"
      assumes 2 outlets until tapped otherwise.
- [ ] **User-grown library.** Contractors save any estimate as a reusable template. You do
      not author the per-trade library — they do. Each business sees only its own. This is
      the lock-in and the unit the engine learns on. Flat templates for v1 (no nesting — see
      Open Decisions).
- [ ] **Estimate instantiation** with frozen lines (#1) and stored `param_values` + spoken
      `description` (#3).
- [ ] **Job completion** mapping each actual to its `estimate_line_id` (#2). Resist any UI
      that lets completion be a free-floating materials list.
- [ ] **Variance computation** at line granularity, surfaced in a back-costing view.
- [ ] **Silent statistical rate-learning.** Run the learned-rate write-back to shadow rates
      from day one. Do not surface it. By v2 flip the math is already warm.
- [ ] **Progressive disclosure on the line.** Item / qty / unit by default; hours and
      material cost behind an expand or auto-filled from history. Four fields for the fast
      quoter, depth for the margin-tuner.

Explicitly **out of v1**: the agent, agent-proposed quotes, cross-customer priors, nesting,
MCP orchestration.

---

## 4. The trainable-job contract (the v1 → v2 bridge)

This is the most important section. v1's deliverable is judged by whether each completed job
is *trainable*. An agent in v2 retrieves and reasons over past jobs; a job missing any of the
below is dirty and silently poisons or starves the agent. Treat this as a validation gate at
job close.

A job is **trainable** iff:

```
is_trainable(job) =
     job.estimate.description       is non-empty   -- semantic retrieval key
  AND job.estimate.param_values     is non-empty   -- the denominators
  AND every job_line.estimate_line_id is set       -- the joint holds
  AND every labour line has actual_hours           -- the supervised signal
  AND template origin is recorded                  -- "what kind of job was this"
  AND finish photo is attached                     -- proof + portfolio (your close gate)
```

### The variance-note opportunity

The single highest-value, lowest-cost addition: at job close, when a line's variance is
large, prompt **one optional voice note** — "anything unexpected on this one?" Free text like
*"took three extra hours, wall was lath and plaster"* is context pure numbers can never carry,
and it's exactly what an agent can later surface to explain or hedge a quote. Gate it at the
same moment you gate the finish photo — same habit, one extra beat. Store on
`job_line.variance_note`.

> Design rule: a job that isn't trainable should be visibly flagged in the back-costing view,
> not silently accepted. The contractor fixing it later is cheap; an agent trained on holes
> is not.

---

## 5. v2 scope — the agent turns on

Two sub-layers, in order. The first is already running silently from v1.

### 5a. Statistical (already warm)

Promote shadow learned-rates to active rates per template line once confidence clears the
gate (§6). No LLM. This alone improves every future estimate's accuracy and is the floor the
agent stands on.

### 5b. The agent (the visible feature)

Flow: contractor speaks a job description + adds photos → transcript + images → agent
**retrieves the customer's most similar past jobs** (via `estimate.description` + template
match) → assembles a proposed estimate using the customer's templates, learned rates, and the
nearest historical actuals → returns it as a **confirmation card**, not a committed quote (#6).

What the agent consumes (all produced by v1):
- the customer's template library + active learned rates,
- the trainable-job corpus (descriptions, param_values, per-line estimated vs actual, variance notes, photos),
- confidence per template line (to set the band it shows).

What the agent must surface, not hide:
- its confidence band ("bedroom repaints: tight, ±8%; deck builds: thin data, wide"),
- which past jobs it leaned on (so the contractor can sanity-check),
- a single tap to accept, adjust, or discard — feeding the result back as another trainable job.

The agent is not fine-tuned per customer. It is given the customer's structured corpus as
retrieval + context. "Training" here means *accumulating clean records and exposing them*,
not gradient updates.

---

## 6. Per-customer readiness gate (the onboarding flip)

The agent turns on **per customer, per template** — not globally. A business with 40 bedroom
repaints and 1 deck build should get confident auto-proposals on bedrooms and suggest-only on
decks, simultaneously.

### Confidence

Per template line, a function of how much data backs its current rate and how tight the
variance spread is:

```
confidence(template_line) ≈ f( n_completed_jobs , variance_spread )
   low n  OR  wide spread  → suggest-only, wide band, agent stays cautious
   high n AND tight spread → auto-propose, narrow band, agent leans in
```

`n_jobs_at_adjustment` and the variance history give you both inputs directly.

### Cold start (customer #1, day 1, zero jobs)

1. **Seed templates from the contractor's gut** during onboarding — their starting rates
   (source = "seed"). Confidence starts at floor.
2. Optionally, **anonymized cross-customer priors** to seed a brand-new template (see Open
   Decisions — this touches the moat; decide deliberately).
3. Every completed job raises confidence on the templates it used. The agent's role shifts
   continuously from "fill in a blank estimate from seed rates" → "suggest with a wide band"
   → "auto-propose with a tight band." There is no hard on/off; there is a confidence ramp,
   and "turned on" just means a template crossed the auto-propose threshold.

### Onboarding as a repeatable process

Per the product framing, each new customer runs the same loop: seed their library → capture
clean trainable jobs → watch per-template confidence climb → agent crosses the gate template
by template. Onboarding isn't a one-time setup; it's the funnel that fills the corpus that
flips the agent. Worth instrumenting from day one (jobs-to-first-auto-propose is a real
activation metric).

---

## 7. Open decisions (carry forward)

| Decision | Tension | Leaning |
|---|---|---|
| **Flat vs nested templates** | Nesting ("kitchen reno" contains "cabinet run") is tempting but complicates the editor and the back-costing rollup, and is hard to retrofit if the line table assumes a single parent. | Flat for v1 (your "defer complexity" instinct). Gut-check the line-table parent assumption now so nesting *is* retrofittable. |
| **Cross-customer priors for cold start** | Seeding a new customer's blank template from anonymized aggregate rates beats a pure guess — and creates a network effect (more customers → better priors). But it touches the per-customer-learning moat and has a trust/privacy dimension. | Additive to the moat if framed as cold-start aid only, never a replacement for per-customer learning. Decide explicitly; name it in onboarding copy if used. |
| **Rate promotion threshold** | Where exactly confidence flips a learned rate from shadow to active, and a template from suggest-only to auto-propose. | Start conservative (favor suggest-only); loosen once you observe real variance spreads in the field. |
| **Variance-note prompting** | Always prompt vs only on large variance. Always-prompt enriches the corpus but adds close friction. | Prompt on large variance only for v1; revisit if the notes prove as valuable as expected. |
