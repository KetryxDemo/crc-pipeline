---
itemId: RSK-CRC-04
itemType: Risk
itemTitle: Degraded or low-input specimen scored as valid and an unreliable result released
itemIsRiskControlledBy: SPEC-PIPE-QC, SPEC-PIPE-MARKERS, TC-PIPE-04, TC-PIPE-05, TC-PIPE-06, TC-AV-03
Hazard type: Diagnostic information
System categories: Clinical, Software, Safety
Risk assessment methodologies: FMEA, PHA
Initial severity: High
Initial likelihood of occurrence (P1): High
Initial likelihood of harm (P2): Medium
Residual severity: High
Residual likelihood of occurrence (P1): Low
Residual likelihood of harm (P2): Medium
CLIA validity characteristic: Analytical sensitivity
Detection level: Per specimen
Lot acceptance dependency: No
---

## Item fields

### Description

A specimen with insufficient DNA input, degraded nucleic acid, or a failed bisulfite
conversion control passes sample-adequacy evaluation and is scored. The resulting composite
score is not supported by the underlying measurement, and a POSITIVE or NEGATIVE result is
released on the strength of it.

This is the highest-likelihood risk in the register before controls. Stool is an unforgiving
matrix: specimens are self-collected by patients without supervision, held at ambient
temperature, and shipped by post. Low input and partial degradation are routine occurrences
rather than exceptional ones, which is exactly why adequacy evaluation is a gating control
rather than an advisory one.

The clinically significant direction is toward NEGATIVE. A degraded specimen has less
recoverable methylated signal, so a degradation-driven scoring error systematically
understates the score and feeds the false-negative pathway of RSK-CRC-01.

**Benefit-risk analysis**

There is no clinical benefit to scoring an inadequate specimen. The benefit-risk question is
not whether to accept the risk but where to set the gate, and that is a genuine trade-off.

A stricter adequacy threshold reduces this risk but raises the INVALID rate. A high INVALID
rate is not harmless: every INVALID requires a repeat specimen, requested from a population
that was already reluctant to be screened. A meaningful fraction of patients asked to
re-collect will simply not do so, and a patient who abandons screening after an INVALID is
left unscreened - the outcome with zero sensitivity that the programme exists to avoid.

The gate is therefore set at the empirically established limit of detection plus a margin
(RC-4), rather than at the most conservative threshold available. That choice accepts a
somewhat higher residual risk in exchange for an INVALID rate that keeps patients inside the
screening programme. The direction of the trade is deliberate and grounded in the
dilution-series data rather than in judgement.

**Disposition.** Residual risk is acceptable. The control set is layered - ordering,
fail-closed defaults, explicit unquantifiable states, and an empirically grounded threshold -
and each layer is independently verified. The residual case, a specimen degraded in a way no
measurable criterion detects, is bounded by the reliability of the conversion control and is
accepted on the same benefit-risk basis as RSK-CRC-01.

### Harm

**Predominant direction - false negative**

- The full harm pathway of RSK-CRC-01: undetected progression, stage migration, more
  aggressive treatment, potential death. Degradation reduces recoverable signal, so the error
  is directional rather than random.

**Less common direction - false positive**

- The harm pathway of RSK-CRC-05: unnecessary diagnostic colonoscopy with its procedural
  risks, plus the psychological harm of a positive cancer screen.

**Compounding harm - the repeat that never happens**

- An INVALID result is an inconvenience that is recoverable: the patient is asked for a
  repeat specimen. A wrong result derived from an inadequate specimen is not recoverable,
  because nothing in the workflow will ever ask for a repeat. Scoring an inadequate specimen
  therefore converts a recoverable inconvenience into an unrecoverable harm.

**Severity classification: High**

Potential for death or permanent impairment via the false-negative pathway.

### Hazard

Computation and release of a qualitative result from measurements that do not meet the
analytical conditions under which the assay was validated.

### Hazardous situation

A patient and their clinician hold a POSITIVE or NEGATIVE assay result that was derived
from a specimen incapable of supporting a reliable determination. Because the result is
qualitative, it carries no indication of the measurement quality behind it - a result derived
from a marginal specimen is textually identical to one derived from an excellent specimen.

The patient is managed on that result. Where the result is NEGATIVE, the situation persists
for the full screening interval and no repeat is requested, because from the workflow's
perspective the episode completed successfully.

### Sequence of events

1. A patient self-collects a stool specimen and returns it by post. Transit time, ambient
   temperature, or collection volume is suboptimal.
2. Recoverable DNA is reduced, nucleic acid is partially degraded, or bisulfite conversion
   is incomplete.
3. One or more of the following conditions exists:
   - Total DNA input is below the level at which the assay was validated to perform.
   - The bisulfite conversion control has failed, or its result is missing rather than failed.
   - A panel marker has a total copy count of zero and cannot be quantified.
   - The faecal haemoglobin measurement was not reported for the specimen.
4. Sample-adequacy evaluation does not reject the specimen - because a threshold is set below
   the validated minimum, because a missing control result is treated as a pass, because an
   unquantifiable marker is silently scored as a zero ratio, or because adequacy is evaluated
   after scoring rather than before.
5. A composite score is computed from measurements that do not support scoring.
6. The score is compared against the positivity threshold and a qualitative result is emitted.
7. The result is released and is textually indistinguishable from one derived from an adequate
   specimen. No repeat specimen is requested.

### Risk controls description

**RC-1 - Adequacy is evaluated before scoring and gates it (SPEC-PIPE-QC).** Sample adequacy
is evaluated before the classifier runs, and an inadequate specimen is rejected as INVALID.
There is no code path by which an inadequate specimen reaches the classifier. Ordering is the
control: an adequacy check that ran after scoring could be bypassed or ignored, and would turn
a gate into an annotation.

**RC-2 - Adequacy is fail-closed (SPEC-PIPE-QC).** Where adequacy cannot be determined the
specimen is rejected rather than passed. This specifically covers a conversion control result
that is *missing* rather than *failed*, and a haemoglobin measurement that was never reported
- both of which are absences of evidence, and neither of which is evidence of adequacy.

**RC-3 - Unquantifiable markers are explicit, never zero (SPEC-PIPE-MARKERS).** A marker with
a total copy count of zero yields an explicit unquantifiable state which triggers rejection,
rather than a methylation ratio of zero which would be scored as genuine absence of
methylation. This is the control that prevents degradation from silently biasing the score
downward.

**RC-4 - The minimum input threshold is empirically grounded (TC-AV-03).** The QC minimum DNA
input is not chosen arbitrarily; it is set at or above the limit of detection established by
dilution series during analytical validation. TE-AV-03 records the established limit of
detection at 18 nanograms against an enforced QC threshold of 25 nanograms, so the gate sits
above the point at which the assay stops performing reliably.

**RC-5 - Each rejection path is verified by automated test.** TC-PIPE-04 covers low DNA
input, TC-PIPE-05 covers failed conversion control, TC-PIPE-06 covers an unquantifiable
marker being rejected rather than scored as zero. Each confirms that the result is INVALID,
that the specific reason is recorded, and that no classifier score is computed.

**Residual risk.** Likelihood of occurrence falls from High to Low - the underlying rate of
inadequate specimens is unchanged and remains high, but the likelihood of an inadequate
specimen being *scored* is reduced to the residual case of a specimen degraded in a manner
that satisfies every measurable adequacy criterion. Severity is unchanged.

### Post-market signal

INVALID rate trending away from the validated expectation in either direction; repeat
specimen requests not returned.
