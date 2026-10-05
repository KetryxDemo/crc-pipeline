---
itemId: TC-AV-04
itemType: Test Case
itemTitle: Verify reportable range enforcement and out-of-range handling
itemTests: RQ-CRC-07
---

## Item fields

### Description

Confirms that the pipeline enforces the reportable range established at analytical
validation for every quantitative scoring input - each methylated DNA marker ratio
(NDRG4, BMP3, ZDHHC1, SFMBT2) and the faecal haemoglobin concentration - and that an
input outside its validated range is never scored as though it were within range.

Exercises the enforcement in SPEC-PIPE-CLASSIFIER (`checkReportableRange` against the
version-controlled `CONFIG.reportableRange` limits in `src/pipeline.js`): an
out-of-range input is flagged with the offending input and direction recorded, the
specimen is routed to INVALID, and the reportable-range configuration in force is
recorded alongside every result it applies to.

Unlike the wet-lab protocols in this set, this verification exercises pipeline logic
directly and can be run against recorded or synthetic specimen inputs; it does not
require bench material.

### Steps

1. Record the pipeline version and the reportable-range configuration version in
   force (the version-controlled configuration covering the marker-ratio and
   haemoglobin limits) as the precondition for this execution.
2. In-range boundary control: for each quantitative input in turn, submit a specimen
   with that input exactly at its configured lower limit, and a second specimen with
   that input exactly at its configured upper limit, all other inputs well within
   range. Confirm each specimen is scored normally, no out-of-range flag is raised,
   and the reported result is POSITIVE or NEGATIVE per the positivity threshold.
3. Below-range, single input: submit a specimen with one quantitative input just
   below its configured lower limit and all other inputs in range. Confirm the
   specimen is not scored as in-range, the out-of-range flag identifies that input
   with direction "below", the result is routed to INVALID, and no POSITIVE or
   NEGATIVE is released.
4. Above-range, single input: repeat step 3 with that input just above its
   configured upper limit. Confirm the flag identifies the same input with direction
   "above", with the same INVALID routing and no POSITIVE or NEGATIVE released.
5. Repeat steps 3 and 4 for every quantitative input in the scoring panel: NDRG4,
   BMP3, ZDHHC1, SFMBT2, and the faecal haemoglobin concentration.
6. Multiple inputs out of range simultaneously: submit a specimen with two or more
   quantitative inputs outside their configured range at once (at least one marker
   ratio together with the haemoglobin concentration). Confirm the specimen is
   routed to INVALID, and record which input(s) the implementation under test
   identifies as out of range and in which direction(s). Where the implementation
   reports only the first offending input it encounters rather than every
   simultaneously out-of-range input, record that as the observed behaviour against
   this step rather than presuming full multi-input reporting.
7. Traceability of range: for every result produced in steps 2-6, confirm the
   reportable-range configuration identifier/version recorded alongside the result
   matches the version recorded as the precondition in step 1.
8. Configuration control: confirm the reportable range applied in steps 2-6 is read
   from the version-controlled pipeline configuration and is not overridable by
   caller-supplied input at run time; an attempt to supply a different range at call
   time is rejected or has no effect on the range enforced.

### Acceptance criteria

All steps pass. No specimen with any quantitative input outside its configured
reportable range yields a released result of POSITIVE or NEGATIVE. Every out-of-range
condition records at least the offending input and direction. The reportable-range
configuration version recorded against each result in steps 2-6 matches the version
recorded as the precondition in step 1.
