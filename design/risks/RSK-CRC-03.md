---
itemId: RSK-CRC-03
itemType: Risk
itemTitle: Reagent lot change shifts the classifier threshold and reduces sensitivity
Hazard type: Diagnostic information
System categories: Clinical, Software, Operational, Safety
Risk assessment methodologies: FMEA, FTA
Initial severity: High
Initial likelihood of occurrence (P1): Medium
Initial likelihood of harm (P2): High
Residual severity: High
Residual likelihood of occurrence (P1): Medium
Residual likelihood of harm (P2): High
CLIA validity characteristic: Analytical sensitivity
Detection level: Per reagent lot
Lot acceptance dependency: Yes
---

## Item fields

### Description

A new reagent lot shifts the measured methylation ratios relative to the lot used to
establish the positivity threshold. The threshold in force is no longer the correct decision
boundary for the assay as it now performs. Sensitivity falls, and specimens that would have
been reported POSITIVE under the validating lot are reported NEGATIVE.

The failure is silent, and that is what makes it the most dangerous item in this register.
Every individual result is internally consistent. Every specimen passes sample-adequacy QC.
The pipeline raises no error. The audit trail records a correctly computed score and a
correctly applied threshold. From the software's point of view nothing has gone wrong, and
nothing has: the software is faithfully applying a threshold that is no longer right.

This is a systematic failure affecting every specimen processed on the affected lot, not a
per-specimen failure. It converts RSK-CRC-01 from an occasional event into a population-level
one, and it does so without producing a single detectable symptom in the result stream.

**Benefit-risk analysis**

Unlike RSK-CRC-01 and RSK-CRC-05, this risk carries **no offsetting clinical benefit** and
cannot be accepted on a benefit-risk basis.

A residual false negative rate at a validated threshold is an inherent and accepted property
of screening at a finite decision boundary, and it is justified by the benefit of screening a
population that would otherwise not be screened at all. That argument does not extend here.
This risk is not the assay performing as validated within its known limits; it is the assay
performing **differently from how it was validated**, while continuing to claim the validated
performance. There is no clinical benefit attached to that, and no patient consents to it.

It is also not a risk the patient or clinician can compensate for. The limitations statement
on a negative report tells a clinician that a negative result does not rule out cancer, which
is true and useful. It does not tell them that this particular negative result was produced
at a sensitivity below the one printed on the report.

**Disposition.** This risk requires a defined risk control measure before the residual risk
can be assessed as acceptable. Until a lot-acceptance procedure exists, is traced to a
requirement, and is verified, the risk register carries an unmitigated high-severity risk and
the acceptability determination for the design is incomplete.

### Harm

The harm is that of RSK-CRC-01, false negative leading to missed or delayed cancer diagnosis,
multiplied across every patient whose specimen is processed on the affected lot for as long
as the drift goes undetected.

**Scale.** A reagent lot in routine high-throughput use may cover thousands of specimens
across weeks or months. Where the drift is not detected at lot acceptance, the entire cohort
carries a degraded sensitivity that no individual record discloses.

**Direct patient harm**

- Stage migration and its consequences, per RSK-CRC-01, across the affected cohort.
- Death from screen-detectable cancer, across the affected cohort.

**Programme-level harm**

- The assay's stated sensitivity, carried on every result report and relied on by ordering
  clinicians, becomes untrue for the affected period while continuing to be published.
- Retrospective notification and re-screening of an affected cohort, once discovered, is
  itself a substantial harm: patient anxiety, loss of programme credibility, and a
  re-screening burden that falls hardest on the population least likely to comply.
- The event is reportable and would call the laboratory's analytical validity determination
  into question for the affected period.

**Severity classification: High**

Potential for death or permanent impairment, across a cohort rather than an individual.

### Hazard

Application of a positivity threshold that is no longer the validated decision boundary for
the assay as currently performing, because the measurement scale has shifted underneath it.

### Hazardous situation

The laboratory is processing patient specimens in routine production on a reagent lot whose
marker ratio distribution differs systematically from the distribution against which the
positivity threshold was established. Results are being released continuously. Sensitivity
is below the claimed and validated level.

No per-specimen control detects this condition, because each specimen individually satisfies
every adequacy criterion. No software control detects it, because the software has no
knowledge of the distribution it is supposed to be operating against. The situation persists
until either a lot-acceptance comparison is performed, or the deficit surfaces indirectly
through an unusually low positivity rate, an external proficiency testing challenge, or
clinical feedback from interval cancers - all of which are lagging indicators measured in
months.

### Sequence of events

1. The existing reagent lot is exhausted and a new lot is introduced into production.
2. The new lot differs in bisulfite conversion efficiency, probe binding affinity, or
   enzyme activity, in a way that is within the manufacturer's release specification.
3. Measured methylation ratios shift systematically - for example uniformly downward by a
   small proportion - across all specimens processed on the lot.
4. The shift is well within every per-specimen adequacy criterion. DNA input is sufficient,
   the conversion control passes, every marker is quantifiable, haemoglobin is reported.
   Sample-adequacy QC therefore passes every specimen, correctly.
5. Composite scores computed from the shifted ratios are systematically lower. Specimens
   whose true scores sat just above the threshold now fall just below it.
6. The pipeline applies the configured positivity threshold, which is unchanged, and reports
   NEGATIVE for those specimens.
7. Results are released with a full and correct audit trail. Nothing in any record indicates
   a problem.
8. The cohort processed on this lot carries a sensitivity below the validated and claimed
   level. Affected patients follow the false-negative pathway in RSK-CRC-01.
9. The condition persists until lot acceptance, proficiency testing, positivity-rate
   trending, or interval-cancer feedback surfaces it - or until the lot is exhausted and the
   evidence is gone.

### Risk controls description

**No risk control measures are currently defined for this risk.**

This is a genuine and known gap in the design, recorded here rather than papered over.

**Why the existing controls do not address it.** Every control in this register operates per
specimen. Sample-adequacy QC (SPEC-PIPE-QC) asks whether *this* specimen carries enough
signal to be scored, and on an affected lot the honest answer is yes. Marker quantification
(SPEC-PIPE-MARKERS) asks whether *this* marker could be computed, and it could. The
reportable-range check (SPEC-PIPE-CLASSIFIER) asks whether *this* input falls inside its
validated bounds, and a small systematic shift does not leave those bounds. None of these
controls has any view of the distribution across specimens, which is the only level at which
this failure is visible.

**What a control would require.** Detection is a distribution-level comparison, not a
per-specimen check: the marker ratio distribution of a candidate lot, measured across a
bridging panel, compared against the distribution established at analytical validation, with
a pre-defined acceptance criterion and a defined action on failure. That is a lot-acceptance
procedure. It sits outside the pipeline, it is not currently specified, it is not scheduled,
and it is not traced to any requirement in this project.

**Partial and inadequate coverage.** TC-AV-02 measures between-lot precision across three
lots and includes an acceptance criterion for a systematic distribution shift. It is the
closest thing to a detection mechanism that currently exists, and it is not sufficient for
three reasons: it is a validation-time activity rather than a routine lot-acceptance gate;
its acceptance criterion for a distribution shift is qualitative, with no quantitative
bridging procedure defined; and it is not performed on lots introduced after validation,
which is precisely when this risk materialises.

The execution record TE-AV-02 already contains a positive observation of this exact
phenomenon - lot RL-2508 showed a consistent downward shift in mean methylation ratio
relative to the two comparator lots. That run passed as specified, because the shift was
within the between-lot coefficient of variation criterion, and the observation was referred
to laboratory management without a defined disposition. The signal has therefore already
been seen and not acted on.

**Residual risk: unchanged from initial.** With no control defined, residual severity,
likelihood of occurrence, and likelihood of harm are all identical to the initial
assessment. This risk is **not currently reduced**.

### Post-market signal

Positivity rate falling after a lot changeover; external proficiency testing challenge
failures; interval cancers clustering within a single lot's processing window. All are
lagging indicators measured in months, which is why lot acceptance is the needed control.
