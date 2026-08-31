---
itemId: RSK-CRC-01
itemType: Risk
itemTitle: False negative result leads to missed or delayed cancer diagnosis
itemIsRiskControlledBy: SPEC-PIPE-QC, SPEC-PIPE-MARKERS, SPEC-PIPE-REPORT, TC-AV-01
Hazard type: Diagnostic information
System categories: Clinical, Software, Safety
Risk assessment methodologies: FMEA, FTA
Initial severity: High
Initial likelihood of occurrence (P1): Medium
Initial likelihood of harm (P2): High
Residual severity: High
Residual likelihood of occurrence (P1): Low
Residual likelihood of harm (P2): High
CLIA validity characteristic: Analytical sensitivity
Detection level: Per specimen
Lot acceptance dependency: No
---

## Item fields

### Description

A specimen from a patient with colorectal cancer produces a composite classifier score below
the positivity threshold and is reported NEGATIVE. The result is clinically plausible, the
pipeline reports no error, and nothing in the record signals that anything went wrong.

This is the most consequential failure mode of a screening assay. The harm is not caused by
the software emitting a wrong number - it is caused by a correct-looking result being acted
on as reassurance. A false negative in screening is silent by construction: there is no
subsequent step in the workflow that would catch it, because a negative screen ends the
workflow.

**Benefit-risk analysis**

**Clinical benefit.** The assay addresses the dominant failure of colorectal cancer
screening, which is not test accuracy but non-participation. Roughly one in three eligible
adults is not up to date with screening, overwhelmingly because colonoscopy is invasive,
requires bowel preparation, requires time off work, and requires sedation and an escort. A
non-invasive stool test collected at home converts a portion of that never-screened
population into screened patients.

The relevant comparison is therefore not against colonoscopy. It is against no screening at
all, which is the actual alternative for this population, and whose sensitivity is zero.

**Weighing.** A false negative from the assay leaves a patient no worse off diagnostically
than they were unscreened, with the important exception of false reassurance, which RC-3
exists to constrain. Against that, the assay detects a substantial share of screen-relevant
disease in a population that would otherwise have been detected only at symptomatic
presentation.

The positivity threshold is deliberately set to favour sensitivity over specificity, and
threshold comparison is inclusive at the boundary. That choice increases RSK-CRC-05, false
positives leading to unnecessary colonoscopy, and it is made knowingly: an unnecessary
colonoscopy is a procedural risk in an otherwise healthy patient, while a missed cancer is
a mortality risk. The two are not symmetric and the threshold does not treat them as such.

**Conclusion.** Residual risk is acceptable in the context of the intended use stated in
RQ-CRC-00, provided the limitations in RC-3 are carried on every negative report and the
sensitivity claim in RC-4 continues to hold under routine lot-to-lot variation. That proviso
is not currently fully discharged - see RSK-CRC-03.

### Harm

**Direct patient harm**

- Colorectal cancer progresses undetected between the missed screen and the next screening
  interval, typically three years for a stool DNA test.
- Stage migration: a cancer detectable at Stage I or II at the time of the missed screen is
  diagnosed at Stage III or IV, where five-year survival falls from roughly 90 percent to
  roughly 15 percent for distant disease.
- More extensive surgical resection, and adjuvant chemotherapy or radiotherapy that
  earlier-stage disease would not have required.
- Permanent consequences of later-stage treatment: permanent colostomy, chemotherapy-induced
  peripheral neuropathy, reduced functional status.
- Death from a cancer that was screen-detectable at the time the specimen was analysed.

**Psychological and indirect harm**

- Loss of trust in screening, in the ordering clinician, and in subsequent negative results,
  for the patient and for their family.
- False reassurance actively suppresses appropriate care-seeking: a patient who later
  develops rectal bleeding or unexplained weight loss may attribute it to a benign cause
  because they were recently screened negative.
- Loss of the specific clinical benefit screening exists to deliver, which is stage shift.

**Severity classification: High**

Potential for death or permanent impairment. The harm is delayed rather than immediate, but
that delay is the mechanism of the harm rather than a mitigation of it.

### Hazard

Emission of a NEGATIVE qualitative result for a specimen whose underlying measurement does
not support that result, or whose measurement was never adequate to support any result.

### Hazardous situation

A patient with undiagnosed colorectal cancer, and the clinician who ordered the screen,
both hold a NEGATIVE assay result and act on it. Diagnostic colonoscopy is not
scheduled. The patient is returned to the routine screening interval, and the case is
closed. No further step in the care pathway re-examines the result, because a negative
screen is by design the end of the episode.

The situation persists for the length of the screening interval, and is only resolved by
symptomatic presentation - which is precisely the outcome screening exists to prevent.

### Sequence of events

1. A specimen is collected from a patient with an undiagnosed colorectal neoplasm shedding
   methylated DNA markers at a detectable level.
2. One or more of the following occurs:
   - Specimen degradation in transit reduces recoverable DNA below the level at which the
     marker panel is informative, but not below the QC minimum input threshold.
   - A panel marker returns a total copy count of zero and is scored as a methylation ratio
     of zero, which is arithmetically indistinguishable from confirmed absence of
     methylation.
   - The classifier coefficients or positivity threshold in force do not match the set
     established at analytical validation.
3. The composite score is computed from the affected inputs and falls below the positivity
   threshold.
4. Sample-adequacy QC does not reject the specimen, because every individual adequacy
   criterion is satisfied.
5. The pipeline reports NEGATIVE. The audit trail records a correctly applied threshold and
   a correctly computed score. Nothing is anomalous in the record.
6. The result report is released to the ordering clinician.
7. No diagnostic colonoscopy is scheduled. The patient is returned to the routine screening
   interval.
8. The neoplasm progresses. Diagnosis occurs at symptomatic presentation, at a later stage,
   with correspondingly worse prognosis and more aggressive treatment.

### Risk controls description

**RC-1 - Sample-adequacy QC gates the classifier (SPEC-PIPE-QC).** Adequacy is evaluated
before scoring, and an inadequate specimen is rejected as INVALID rather than scored weakly.
QC is fail-closed: where adequacy cannot be determined, the specimen is rejected. This
removes the class of false negatives caused by scoring a specimen that never carried enough
signal to be scored at all.

**RC-2 - Unquantifiable markers are reported as unquantifiable (SPEC-PIPE-MARKERS).** A
marker with a total copy count of zero yields an explicit unquantifiable state, never a
methylation ratio of zero. This is the single most important control in this risk: a zero
ratio is indistinguishable from confirmed absence of methylation and biases the composite
score toward NEGATIVE in exactly the specimens most likely to be true positives.

**RC-3 - Every NEGATIVE report carries its limitations (SPEC-PIPE-REPORT).** The report
states that a negative result does not rule out colorectal cancer or advanced adenoma and
that screening must continue at the recommended interval. This does not prevent the false
negative; it constrains how far a false negative propagates into clinical decision-making,
and it is the only control acting after release.

**RC-4 - Clinical sensitivity is established and monitored (TC-AV-01).** Sensitivity is
measured against a colonoscopy-confirmed reference panel during analytical validation, with
a lower confidence bound that must exceed the performance claimed in the result report.

**Residual risk.** Severity is unchanged - no software control can reduce the harm of a
missed cancer once it occurs. Likelihood of occurrence is reduced from Medium to Low. A
residual false negative rate is inherent to any screening assay operating at a finite
threshold, and is accepted on the benefit-risk basis below rather than eliminated.

### Post-market signal

Interval cancers reported after a negative screen; positivity rate trending below the
validated expectation.
