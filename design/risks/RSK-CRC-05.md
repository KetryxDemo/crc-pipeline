---
itemId: RSK-CRC-05
itemType: Risk
itemTitle: False positive result leads to an unnecessary diagnostic colonoscopy
itemIsRiskControlledBy: SPEC-PIPE-REPORT, SPEC-PIPE-CLASSIFIER, TC-AV-01, TC-PIPE-10
Hazard type: Diagnostic information
System categories: Clinical, Software, Safety
Risk assessment methodologies: FMEA, PHA
Initial severity: Medium
Initial likelihood of occurrence (P1): High
Initial likelihood of harm (P2): Medium
Residual severity: Medium
Residual likelihood of occurrence (P1): Medium
Residual likelihood of harm (P2): Low
CLIA validity characteristic: Analytical specificity
Detection level: Per specimen
Lot acceptance dependency: No
---

## Item fields

### Description

A specimen from a patient with no colorectal cancer and no advanced adenoma produces a
composite classifier score at or above the positivity threshold and is reported POSITIVE. The
patient is referred for diagnostic colonoscopy, an invasive procedure carrying its own risks,
with no underlying disease to find.

This risk is the deliberate counterpart of RSK-CRC-01. The positivity threshold cannot be
moved to reduce false negatives without increasing false positives, and the design chooses
sensitivity: threshold comparison is inclusive at the boundary, so a score exactly equal to
the threshold is reported POSITIVE. This risk is therefore partly a consequence of a conscious
design decision rather than solely a defect, and it is documented as such.

It is also, unlike the false negative, a self-resolving risk. A false positive leads to a
colonoscopy, and the colonoscopy establishes the truth. The harm is real but bounded, and it
is discovered rather than persisting silently.

**Benefit-risk analysis**

This risk is knowingly accepted in exchange for a reduction in RSK-CRC-01, and the exchange is
the central design trade-off of the assay.

**Asymmetry of the two errors.** A false positive costs a healthy patient an invasive
procedure, some weeks of anxiety, and a day of work; the error is discovered and corrected by
the very procedure it causes. A false negative costs a patient with cancer the window in which
that cancer was curable; the error is never discovered until it presents symptomatically. The
two are not commensurate, and the design does not treat them as commensurate.

**How the trade is made.** The positivity threshold is set to favour sensitivity, and
threshold comparison is inclusive at the boundary, so borderline specimens resolve toward
POSITIVE. Each such decision moves a patient from the RSK-CRC-01 pathway to the RSK-CRC-05
pathway - from a possible missed cancer to a probably unnecessary colonoscopy. That is a
favourable exchange, and it is made deliberately.

**The bound on that argument.** The trade is only favourable while the false positive rate
stays within the specificity established at validation and disclosed on the report. Beyond
that point the harms invert: colonoscopy capacity consumed by false positives lengthens waits
for patients who genuinely need the procedure, and participation falls in the population the
programme most needs to reach. Specificity is therefore not merely characterised at validation
(RC-3) but is the quantity that bounds the acceptability of this whole trade-off.

**Disposition.** Residual risk is acceptable in the context of the intended use in RQ-CRC-00,
on the explicit basis that the sensitivity gain is worth the specificity cost for a screening
test whose realistic alternative is no screening at all, and provided measured specificity
continues to hold at the validated level.

### Harm

**Procedural harm from colonoscopy in a patient with no disease**

- Bowel perforation, with a rate on the order of 1 in 1,000 diagnostic colonoscopies, which
  may require surgical repair and in rare cases is fatal.
- Post-procedural bleeding, particularly where biopsy is performed on incidental findings.
- Sedation-related adverse events including respiratory depression and aspiration, with risk
  elevated in older patients and those with cardiopulmonary comorbidity.
- Bowel preparation harms: dehydration, electrolyte disturbance, and in patients with renal
  impairment or heart failure, clinically significant decompensation.

**Psychological harm**

- Sustained anxiety from being told a cancer screening test is positive, spanning the interval
  between result and colonoscopy - typically weeks.
- Residual health anxiety persisting after a negative colonoscopy.

**Practical and systemic harm**

- Bowel preparation, a day of work lost, an escort required for sedation, and out-of-pocket
  cost for a procedure that was not needed.
- Consumption of colonoscopy capacity that would otherwise serve symptomatic or genuinely
  screen-positive patients. At programme scale, an elevated false positive rate directly
  lengthens waits for patients who do have disease.
- Erosion of willingness to participate in future screening rounds, for the patient and
  within their social network.

**Severity classification: Medium**

Serious procedural risk requiring intervention is possible, but permanent impairment or death
is rare and the condition is self-limiting once colonoscopy resolves it. Deliberately assessed
below RSK-CRC-01, whose severity is High.

### Hazard

Emission of a POSITIVE qualitative result for a specimen from a patient without colorectal
cancer or advanced adenoma.

### Hazardous situation

A patient without colorectal neoplasia, and their clinician, hold a POSITIVE assay
result. The patient is referred for diagnostic colonoscopy and undergoes bowel preparation and
sedation. During the interval between result and procedure the patient believes they may have
cancer.

The situation is resolved by the colonoscopy itself, which is both the harm and the remedy.
Unlike RSK-CRC-01, it does not persist beyond the diagnostic pathway.

### Sequence of events

1. A specimen is collected from a patient with no colorectal cancer and no advanced adenoma.
2. One or more sources of non-neoplastic signal is present:
   - Faecal haemoglobin elevated by a non-neoplastic source: haemorrhoidal bleeding, anal
     fissure, menstrual contamination, NSAID-related mucosal irritation, or inflammatory
     bowel disease.
   - Age-related or inflammation-related methylation at panel loci in the absence of
     neoplasia.
   - A true score marginally below the threshold combined with normal analytical variability
     placing the measured score at or above it.
3. The composite score reaches or exceeds the positivity threshold. Because comparison is
   inclusive at the boundary, a score exactly equal to the threshold is POSITIVE.
4. Sample-adequacy QC passes - correctly, since the specimen is entirely adequate. This is not
   a specimen quality failure.
5. The pipeline reports POSITIVE and the report states that diagnostic colonoscopy is
   indicated.
6. The patient is referred, prepares, and undergoes colonoscopy under sedation.
7. Colonoscopy finds no cancer and no advanced adenoma. The patient has incurred the
   procedural, psychological, and practical harms above with no diagnostic benefit.

### Risk controls description

**RC-1 - The report frames colonoscopy as investigation, not as a finding of disease
(SPEC-PIPE-REPORT).** A POSITIVE report states that diagnostic colonoscopy is indicated,
rather than stating or implying that cancer has been detected. Limitations text is selected by
result and is not free text, so the framing cannot drift between reports. This does not reduce
the number of false positives; it reduces the psychological harm component and supports
correct clinical interpretation of a screening result. Verified by TC-PIPE-10.

**RC-2 - The threshold trade-off is explicit, version-controlled, and recorded
(SPEC-PIPE-CLASSIFIER).** The positivity threshold and the coefficient set are
version-controlled configuration rather than code constants, and the values in force are
recorded against every result. The specificity consequence of the threshold is therefore a
reviewable, auditable decision with a reproducible basis, rather than an emergent property of
the implementation.

**RC-3 - Specificity is quantified during analytical validation (TC-AV-01).** Specificity is
measured against a colonoscopy-confirmed reference panel with a lower confidence bound that
must exceed the performance claimed on the report. TE-AV-01 records specificity of 87.1
percent (95 percent CI 83.4 to 90.3), meaning the expected false positive rate is
characterised and disclosed rather than unknown.

**Residual risk.** Likelihood of harm falls from Medium to Low, principally through RC-1:
correct framing of a screening positive substantially reduces the psychological component and
supports appropriate clinical handling. Likelihood of occurrence falls only from High to
Medium, because the dominant driver is the threshold itself, which is intentionally set to
favour sensitivity and is not moved by these controls. Severity is unchanged at Medium.

### Post-market signal

Colonoscopy outcomes for screen-positive patients trending toward no-neoplasia beyond the
validated specificity; declining participation in subsequent screening rounds.
