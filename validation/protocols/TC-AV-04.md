---
itemId: TC-AV-04
itemType: Test Case
itemTitle: Reportable range: multiple violations, non-finite inputs, and recorded configuration
itemTests: RQ-CRC-07
---

## Item fields

### Description

Complements the existing module-level reportable-range coverage (`TC-VER-11` in
`validation/features/verification.feature`, which checks a single haemoglobin value above
the validated range) by testing RQ-CRC-07 end to end for the cases a single-input,
single-boundary check does not exercise: more than one quantitative input out of range in
the same specimen, non-finite or missing inputs, and confirmation that the reportable
range in force is both configuration-driven and identifiable from the recorded result.
This protocol does not repeat in-range control, exact-bound, or single-violator
below/above coverage for the five quantitative inputs (`haemoglobinNgPerMl` and the
`NDRG4`, `BMP3`, `ZDHHC1`, `SFMBT2` marker ratios) - that coverage belongs to a companion
reportable-range boundary protocol in the same `TC-AV-*` series.

### Preconditions

- Pipeline at `CONFIG.pipelineVersion` as currently configured; `CONFIG.reportableRange`
  at its validated values (`haemoglobinNgPerMl` 0-2000, `markerRatio` 0-1) unless a step
  states a test-only modification.
- Each specimen used is otherwise adequate (`evaluateAdequacy` would pass: sufficient DNA
  input, passing conversion control, every marker quantifiable) so that any INVALID result
  obtained is attributable to `checkReportableRange`, not to an unrelated adequacy gate.

### Steps

1. Process a specimen whose haemoglobin value is below
   `CONFIG.reportableRange.haemoglobinNgPerMl.min` and whose `NDRG4` marker ratio is above
   `CONFIG.reportableRange.markerRatio.max`, with every other input in range.
   Expected: `analyseSpecimen` reports `result: 'INVALID'` and `score: null`. Per
   RQ-CRC-07 ("record which input was out of range and in which direction"), record which
   out-of-range input(s) and direction(s) are actually present in `outOfRangeInput` and the
   `reason` text returned.

2. Process a specimen whose `NDRG4` ratio is below range and whose `BMP3` ratio is above
   range, with haemoglobin and the remaining two markers in range.
   Expected: as step 1 - INVALID, score null, out-of-range input(s) and direction(s)
   recorded. Confirm whether both violations are reflected in the result or only one, and
   if only one, which.

3. Process a specimen with three simultaneous violations: haemoglobin above range, `ZDHHC1`
   below range, and `SFMBT2` above range.
   Expected: INVALID, score null. Record which of the three violations is reflected in the
   result returned by `checkReportableRange`.

4. Process a specimen with haemoglobin value `NaN`, all markers in range.
   Expected per RQ-CRC-07: a non-finite haemoglobin input is never scored as in range; the
   specimen is routed INVALID with haemoglobin identified as the offending input.

5. Process a specimen with haemoglobin value `Infinity`, all markers in range.
   Expected: INVALID, haemoglobin identified, direction `above`.

6. Process a specimen with haemoglobin value `-Infinity`, all markers in range.
   Expected: INVALID, haemoglobin identified, direction `below`.

7. Process a specimen with haemoglobin value `null`, and separately a specimen whose
   haemoglobin was never reported (`undefined`).
   Expected: neither is scored. Both are routed INVALID with a reason identifying the
   haemoglobin measurement as missing.

8. Process a specimen with haemoglobin value the non-numeric string `"invalid"`, all
   markers in range.
   Expected per RQ-CRC-07: never scored as in range; routed INVALID with haemoglobin
   identified.

9. Repeat steps 4, 5, 6, and 8 for one marker ratio (`NDRG4`): ratio values `NaN`,
   `Infinity`, `-Infinity`, and the non-numeric string `"invalid"`, with haemoglobin and the
   other three markers in range.
   Expected per RQ-CRC-07: none is scored as in range; each is routed INVALID with `NDRG4`
   identified and, for `Infinity`/`-Infinity`, the correct direction.

10. For a specimen scored POSITIVE or NEGATIVE (all inputs in range) and for the specimen
    routed INVALID in step 1, render the result with `generateReport`.
    Expected: `report.pipelineVersion` equals `CONFIG.pipelineVersion` for both outcomes,
    so the version-controlled configuration governing the reportable range in force is
    identifiable from the result report regardless of whether the specimen was scored or
    invalidated.

11. In a test-only copy of the pipeline configuration, set
    `CONFIG.reportableRange.haemoglobinNgPerMl.max` to `1500` (instead of the validated
    `2000`) and set `CONFIG.pipelineVersion` to a distinct test value (for example
    `'1.0.0-test-range'`) to reflect the changed, version-controlled configuration. Process
    a specimen with haemoglobin `1600` and all other inputs in range.
    Expected: under the default configuration this specimen would be in range and scored;
    under the modified configuration it is INVALID, haemoglobin identified, direction
    `above`. The report rendered by `generateReport` for this result carries
    `pipelineVersion: '1.0.0-test-range'`, confirming the reportable range is read from
    configuration at run time rather than hard-coded, and that the recorded version
    reflects the configuration actually applied.

### Acceptance criteria

Every specimen with two or three simultaneous out-of-range inputs (steps 1-3) is reported
INVALID with `score: null`, and the out-of-range input(s)/direction(s) actually recorded
are compared against the requirement text ("record which input was out of range and in
which direction"); any gap between all violations occurring and only one being recorded is
noted as a finding against `checkReportableRange`, not silently treated as a pass.

Every non-finite (`NaN`, `Infinity`, `-Infinity`) and missing (`null`/`undefined`)
haemoglobin and marker-ratio input (steps 4-9) results in INVALID with the offending input
identified - never scored as in range. Any case where a non-finite value is instead scored
is recorded as a finding against the requirement.

`generateReport` output carries `pipelineVersion` for both scored and INVALID outcomes
(step 10), so the reportable range's governing configuration is identifiable from every
released or withheld result.

Under a modified, version-controlled `CONFIG.reportableRange` and `CONFIG.pipelineVersion`
(step 11), range enforcement follows the modified limits and the recorded `pipelineVersion`
reflects the modified configuration, confirming the reportable range is configuration-driven
and not hard-coded.
