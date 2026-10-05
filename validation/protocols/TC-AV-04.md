---
itemId: TC-AV-04
itemType: Test Case
itemTitle: Reportable range enforcement and out-of-range input flagging
itemTests: RQ-CRC-07
---

## Item fields

### Description

Verifies that the pipeline enforces the configured reportable range for every quantitative
scoring input and that an input outside its validated range is flagged, not scored as if it
were in range, and routed to INVALID, with the offending input, the direction of the
violation, and the governing configuration recorded alongside the result.

The reportable range in force is `CONFIG.reportableRange` in `src/pipeline.js`:
`haemoglobinNgPerMl` bounded `{ min: 0, max: 2000 }` (ng/mL) and `markerRatio` bounded
`{ min: 0, max: 1 }`, applied to the faecal haemoglobin concentration and to each of the
four panel marker ratios (`NDRG4`, `BMP3`, `ZDHHC1`, `SFMBT2`) by `checkReportableRange()`
under `SPEC-PIPE-CLASSIFIER`.

Unlike TC-AV-01 through TC-AV-03, this is not bench work: the reportable-range check is
enforced entirely in software and can be exercised deterministically by supplying marker
and haemoglobin inputs at and around the configured boundaries through `analyseSpecimen()`.

### Preconditions and test setup

- Pipeline configuration in force: `CONFIG.reportableRange.haemoglobinNgPerMl = { min: 0,
  max: 2000 }`; `CONFIG.reportableRange.markerRatio = { min: 0, max: 1 }`;
  `CONFIG.pipelineVersion` as currently released (`1.0.0` at time of writing).
- Quantitative inputs under test: faecal haemoglobin concentration and the ratio for each
  of the four panel markers (`PANEL_MARKERS`: `NDRG4`, `BMP3`, `ZDHHC1`, `SFMBT2`).
- Each case starts from an otherwise-adequate specimen (passes identity verification and
  sample-adequacy QC per RQ-CRC-04) so that any INVALID outcome observed is attributable to
  the reportable-range check alone, not to a QC failure.
- Marker ratios are driven via the methylated/total copy counts supplied to
  `quantifyMarkers`; the haemoglobin value is driven via `haemoglobinNgPerMl` on the
  haemoglobin record.

### Steps

1. **In-range baseline.** For each of the five quantitative inputs (haemoglobin and each of
   the four marker ratios) in turn, process an otherwise-adequate specimen with that input
   set to a representative in-range value, and separately at exactly the lower bound (0)
   and exactly the upper bound (2000 for haemoglobin; 1 for marker ratio), with all other
   inputs held at typical in-range values. Confirm `checkReportableRange` reports
   `inRange: true` and that `analyseSpecimen` scores the specimen (result `POSITIVE` or
   `NEGATIVE`), with no out-of-range flag raised.
2. **Just below the lower bound.** Process a specimen with `haemoglobinNgPerMl` just below
   0 (e.g. -1 ng/mL), all other inputs in range. Separately, for each marker in turn,
   process a specimen with that marker's ratio driven just below 0 (e.g. -0.01), all other
   inputs in range. In every case confirm: `checkReportableRange` returns
   `inRange: false` with `input` naming the offending input and `direction: 'below'`;
   `analyseSpecimen` returns `result: 'INVALID'` with `score: null` (the specimen is not
   scored) and `outOfRangeInput` equal to the offending input's name, with the reason text
   naming the input and the "below" direction.
3. **Just above the upper bound.** Repeat step 2 with `haemoglobinNgPerMl` just above 2000
   (e.g. 2000.01 ng/mL) and, for each marker in turn, a ratio just above 1 (e.g. 1.01).
   Confirm `direction: 'above'` is recorded in each case, with the same
   not-scored / INVALID / `outOfRangeInput` behaviour as step 2.
4. **Independent checking, single violator.** Construct a specimen in which every
   quantitative input is in range except exactly one, cycling through haemoglobin and each
   of the four markers as the sole violator (one case per input, five cases total).
   Confirm the result is `INVALID`, that `outOfRangeInput` and the reason text identify
   only the one out-of-range input, and that the specimen is not scored, even though every
   other input was in range.
5. **Configuration recorded alongside the result.** For a fully in-range specimen
   (`POSITIVE` or `NEGATIVE` result) and for a specimen with one out-of-range input
   (`INVALID` result), generate the result report via `generateReport`. Confirm
   `pipelineVersion` on the report equals `CONFIG.pipelineVersion` in both cases, i.e. the
   version-controlled configuration that governs the reportable range in force is recorded
   alongside the result regardless of outcome.

### Acceptance criteria

All in-range values, including both boundary values, for every one of the five quantitative
inputs are scored normally (`POSITIVE` or `NEGATIVE`) with no out-of-range flag raised.

Every input driven just below its lower bound is flagged `inRange: false` with
`direction: 'below'`; the specimen is not scored (`score` is `null`) and is reported
`INVALID`, with the offending input recorded in `outOfRangeInput` and in the reason text.

Every input driven just above its upper bound is flagged `inRange: false` with
`direction: 'above'`, with the same not-scored / INVALID / recorded-input behaviour.

Each of the five inputs is range-checked independently: a single out-of-range input among
otherwise in-range inputs is, on its own, sufficient to produce an `INVALID` result
identifying only that input, for every one of the five inputs tested individually.

The pipeline version governing the reportable-range configuration in force
(`CONFIG.pipelineVersion`) is present on the generated report for both valid
(`POSITIVE`/`NEGATIVE`) and `INVALID` results.
