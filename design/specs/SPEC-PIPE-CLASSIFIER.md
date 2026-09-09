---
itemId: SPEC-PIPE-CLASSIFIER
itemType: Software Item Spec
itemTitle: Composite scoring and threshold application
itemFulfills: RQ-CRC-03, RQ-CRC-07
itemIntroducesRisk: RSK-CRC-01, RSK-CRC-03, RSK-CRC-05
Software item type: Function
---

## Item fields

### Description

Computes the composite classifier score from the quantified marker panel and the validated
haemoglobin value, applies the configured positivity threshold, and emits the qualitative
result.

The score is a weighted combination of the marker ratios and the haemoglobin
concentration, using coefficients fixed at analytical validation. Both the coefficient set
and the threshold are version-controlled configuration, not code constants. The configured
positivity threshold in force is 0.38, and the values in force are recorded against every
result so that a released result can be reproduced from its inputs.

Threshold comparison is inclusive at the boundary: a score exactly equal to the threshold
is POSITIVE. This is a deliberate choice that favours sensitivity, consistent with the
screening intent stated in RQ-CRC-00.

This module also enforces the reportable range for each scoring input. An input outside its
validated range is not scored as though it were in range; the specimen is routed for
INVALID handling with the offending input and direction recorded.

### Outputs

A qualitative result of POSITIVE or NEGATIVE, the computed score, the threshold applied,
and the coefficient set version. For a reportable-range violation, an INVALID outcome with
the offending input identified.

