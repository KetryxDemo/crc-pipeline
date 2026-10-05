---
itemId: TC-AV-04
itemType: Test Case
itemTitle: Verify reportable range enforcement and out-of-range flagging
itemTests: RQ-CRC-07
---

## Item fields

### Description

Verifies that the pipeline enforces the validated reportable range for each quantitative
input (methylated DNA marker quantities and faecal haemoglobin), flags out-of-range
conditions instead of scoring an out-of-range input as though it were in range, routes
out-of-range specimens for INVALID handling, and records the reportable range configuration
in force alongside each result, as required by RQ-CRC-07 and implemented by
SPEC-PIPE-CLASSIFIER ("Composite scoring and threshold application").

This test case supports the laboratory's obligation under 42 CFR 493.1253(b)(2) to
establish and verify the reportable range of patient test results, and follows the
linearity / reportable range verification approach described in CLSI EP06.

### Preconditions

- Pipeline under test is at a known, recorded version (`CONFIG.pipelineVersion`) with a
  known coefficient set (`CONFIG.coefficientSetVersion`).
- The validated reportable range configuration is loaded from version control and its
  current boundary values are recorded in the test record before execution:
  - Faecal haemoglobin (`CONFIG.reportableRange.haemoglobinNgPerMl`): min 0, max 2000 ng/mL.
  - Methylated marker ratio (`CONFIG.reportableRange.markerRatio`, applied to each of the
    panel markers NDRG4, BMP3, ZDHHC1, SFMBT2): min 0, max 1.
- Test input datasets are prepared covering in-range (including exact lower/upper limits),
  below-range, above-range, and multiple-simultaneous-out-of-range combinations for both
  quantitative inputs.

### Steps

1. **In-range control, including boundary values.** For each quantitative input (each of
   the four methylated marker ratios and faecal haemoglobin), submit a specimen with the
   input exactly at its validated lower limit (haemoglobin = 0 ng/mL; marker ratio = 0),
   exactly at its validated upper limit (haemoglobin = 2000 ng/mL; marker ratio = 1), and at
   a mid-range value, with all other inputs in range.
   Expected result: `checkReportableRange` reports `inRange: true` for every case; the
   specimen is scored normally and the pipeline reports `result: 'POSITIVE'` or
   `result: 'NEGATIVE'` per the positivity threshold; no out-of-range condition
   (`outOfRangeInput`) is present on the result.

2. **Below-range input, each quantitative input in turn.** Submit a specimen in which one
   input at a time is set below its validated reportable range lower limit (e.g.
   haemoglobin < 0 ng/mL, then each marker ratio < 0 in turn), with all other inputs in
   range.
   Expected result: the input is not scored as though it were in range. `result: 'INVALID'`,
   `score: null`, `outOfRangeInput` identifies the specific out-of-range input
   (`'haemoglobin'` or the marker key, e.g. `'NDRG4'`), and the underlying
   `checkReportableRange` outcome records `direction: 'below'` for that input. The specimen
   is routed for INVALID handling (confirm `assertReleasable` blocks release of the result).

3. **Above-range input, each quantitative input in turn.** Repeat step 2 with each input set
   above its validated upper limit (haemoglobin > 2000 ng/mL; each marker ratio > 1 in turn).
   Expected result: as in step 2, with `direction: 'above'` recorded for the out-of-range
   input, `result: 'INVALID'`, `score: null`, specimen routed for INVALID handling.

4. **Multiple inputs out of range simultaneously.** Submit a specimen in which more than one
   quantitative input is simultaneously outside its reportable range (e.g. haemoglobin above
   its upper limit and one marker ratio below its lower limit).
   Expected result per RQ-CRC-07: every input that is out of range is recorded, together with
   its direction, and the specimen is routed INVALID. Record the pipeline's actual behavior
   against this expectation; as of this writing `checkReportableRange` returns on the first
   violation encountered (haemoglobin checked before markers), so confirm whether all
   violations are captured or only the first, and treat any shortfall as a finding against
   RQ-CRC-07 rather than adjusting the expected result.

5. **No extrapolated or clamped score released for out-of-range specimens.** For every
   out-of-range case exercised in steps 2-4, confirm `score` is `null` (not a clamped value
   at the range boundary and not an extrapolated value beyond it), and that no
   `thresholdApplied` / composite score is present or released for the specimen.

6. **Reportable range configuration recorded alongside each result.** For an in-range result
   (step 1) and an out-of-range result (steps 2-4), confirm that the version-controlled
   configuration in force is recorded alongside the result (e.g. `pipelineVersion` and/or
   `coefficientSetVersion` on the result/audit record). Record whether this version
   information is present on both in-range and INVALID (out-of-range) outcomes; if it is
   missing from the INVALID-due-to-range outcome, record this as a finding against the
   "recorded alongside each result" clause of RQ-CRC-07 rather than treating the step as not
   applicable.

7. **Controlled change of the configured range.** In a controlled configuration revision,
   change one or both reportable range boundaries (e.g. adjust
   `CONFIG.reportableRange.haemoglobinNgPerMl` or `CONFIG.reportableRange.markerRatio`) and
   bump the associated version identifier. Re-run representative in-range and out-of-range
   inputs from steps 1-3 at the new boundaries.
   Expected result: the new version identifier is recorded with subsequent results, and
   in-range/out-of-range determination is applied according to the newly configured
   boundaries rather than the previous ones.

### Acceptance criteria

All in-range inputs, including values exactly at the lower and upper reportable range
limits, are scored normally with a POSITIVE or NEGATIVE result and no out-of-range
indication. Every below-range and above-range input, tested individually for each
quantitative input, is not scored as in-range, is flagged as out of range with the specific
input and direction identified, and results in the specimen being routed INVALID with no
score released. Simultaneous multi-input violations are fully recorded (input and
direction) and routed INVALID. The reportable range / pipeline configuration version in
force is recorded alongside every result, in-range or INVALID, and a controlled change to
the configured range is reflected in both the recorded version identifier and in which
boundaries are subsequently applied. Any deviation from the above (see Steps 4 and 6) is a
fail against RQ-CRC-07 and shall be reported as a finding, not silently accepted.

### Notes

- Exercises `checkReportableRange` and `analyseSpecimen` in `src/pipeline.js`, and
  `assertReleasable` in `src/release/releaseGate.ts`.
- Related existing automated coverage: scenario `TC-PIPE... / TC-VER-11` ("A haemoglobin
  value above the reportable range is not scored as in range") in
  `validation/features/verification.feature`, backed by `src/steps/verification-steps.js`,
  covers only the above-range haemoglobin case at the `checkReportableRange` unit level. No
  new automated tests are added by this item; this manual protocol covers the remaining
  combinations (below-range, marker ratios, multiple simultaneous violations, boundary
  values, version recording, and configuration-change handling) not currently automated.
