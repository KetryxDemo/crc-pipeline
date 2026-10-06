---
itemId: TC-AV-05
itemType: Test Case
itemTitle: Reportable range boundaries and single-input violations across the five quantitative inputs
itemTests: RQ-CRC-07
---

## Item fields

### Description

Verifies that the reportable range enforced by the classifier (`checkReportableRange` in
`src/pipeline.js`, `CONFIG.reportableRange`) is applied correctly at its boundaries, and
that each of the five quantitative inputs — the faecal haemoglobin concentration
(`haemoglobinNgPerMl`) and the four methylated-marker ratios (`NDRG4`, `BMP3`, `ZDHHC1`,
`SFMBT2`) — is individually enforced against that range.

This protocol covers the boundary and single-violator ground that `TC-VER-11`
(`validation/features/verification.feature`) does not: `TC-VER-11` is a module-level test
of a single case (one haemoglobin value above range). This protocol is the companion
reportable-range boundary protocol referenced by the reportable-range multi-violation
protocol proposed elsewhere in this `TC-AV-*` series: it establishes the in-range control,
the exact-bound behaviour at `min`/`max` for each input, and single-violator below/above
coverage for each input in turn. It intentionally does **not** cover multiple simultaneous
violations or non-finite/missing inputs (`NaN`, `Infinity`, `null`/`undefined`) — those
remain in scope for that companion multi-violation protocol.

Reportable range limits and the configuration identifier referenced below are read from
`CONFIG.reportableRange` and `CONFIG.pipelineVersion` in `src/pipeline.js` at the time of
execution, not hard-coded in this protocol. The values in force at the time this protocol
was authored are `CONFIG.reportableRange.haemoglobinNgPerMl = { min: 0, max: 2000 }`,
`CONFIG.reportableRange.markerRatio = { min: 0, max: 1 }` (applied to each of the four
markers), and `CONFIG.pipelineVersion = '1.0.0'`.

### Steps

1. Record the reportable range and pipeline version in force: `CONFIG.reportableRange.haemoglobinNgPerMl`,
   `CONFIG.reportableRange.markerRatio`, and `CONFIG.pipelineVersion`.
2. In-range control: process a specimen with all five quantitative inputs mid-range (for
   example haemoglobin = 100 ng/mL, all four marker ratios = 0.5) through `analyseSpecimen`.
   Confirm the result is `POSITIVE` or `NEGATIVE` (per `applyThreshold`) with a non-null
   `score`, and that `checkReportableRange` reports `inRange: true`.
3. Exact-bound control, one input at a time: for each of the five inputs in turn, set that
   input to its configured `min` and then to its configured `max` (`0` and `2000` for
   haemoglobin; `0` and `1` for each marker ratio), holding the other four inputs at the
   mid-range control values from step 2. For all ten cases, confirm `checkReportableRange`
   reports `inRange: true` for that input — the implemented comparison
   (`value < min || value > max`) treats both bounds as in range — and that
   `analyseSpecimen` scores the specimen normally (`result` is `POSITIVE` or `NEGATIVE`,
   `score` is non-null) rather than returning `INVALID`.
4. Single-violator below range, one input at a time: for each of the five inputs in turn,
   set that input just below its configured `min` (for example haemoglobin = -1; a marker
   ratio = -0.01), holding the other four inputs at the mid-range control values from
   step 2. For each of the five cases, confirm `analyseSpecimen` returns
   `result: 'INVALID'`, `score: null`, `outOfRangeInput` equal to that input's name as used
   by `checkReportableRange` (`'haemoglobin'` for the haemoglobin input, or the marker key —
   `'NDRG4'`, `'BMP3'`, `'ZDHHC1'`, or `'SFMBT2'` — for a marker input), and a `reason`
   string recording the offending input and `'below'` as the direction.
5. Single-violator above range, one input at a time: repeat step 4 with each input set just
   above its configured `max` (for example haemoglobin = 2001; a marker ratio = 1.01).
   Confirm the same `INVALID` / `score: null` / `outOfRangeInput` behaviour, with `reason`
   recording `'above'` as the direction.
6. Report generation on an INVALID outcome: for one of the ten violation cases from steps 4
   and 5, call `generateReport('INVALID', accession, { reason })` with the `reason`
   returned by `analyseSpecimen`. Confirm the rendered report's `pipelineVersion` field
   equals the `CONFIG.pipelineVersion` in force recorded in step 1.

### Acceptance criteria

The in-range control specimen (step 2) is scored, not flagged, with a non-null score. All
ten exact-bound cases (step 3) are treated as in range and scored, not flagged, consistent
with the implemented inclusive-at-both-bounds comparison. All ten single-violator cases
(steps 4-5) are reported `INVALID` with `score: null`, the correct `outOfRangeInput`, and
the correct direction (`'below'` or `'above'`) recorded in the reason. The INVALID report
generated in step 6 carries a `pipelineVersion` equal to the `CONFIG.pipelineVersion` value
recorded as a precondition in step 1, confirming the configuration in force is recorded
alongside the result as required by RQ-CRC-07.
