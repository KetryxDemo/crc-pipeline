import assert from 'node:assert/strict';
import { Given, When, Then, Before } from '@cucumber/cucumber';
import {
  CONFIG,
  PANEL_MARKERS,
  analyseSpecimen,
  quantifyMarkers,
  validateHaemoglobin,
  generateReport,
  releaseWithAudit,
} from '../pipeline.js';

/** An adequate specimen: full panel, passing control, sufficient input. */
function adequateSpecimen(accession = 'ACC-1001') {
  const markers = {};
  for (const m of PANEL_MARKERS) markers[m] = { methylated: 30, total: 100 };
  return {
    marker: { accession, markers, totalDnaInputNg: 120, conversionControl: 'pass' },
    haemoglobin: { accession, haemoglobinNgPerMl: 45 },
  };
}

function inMemoryAuditStore() {
  const entries = [];
  return { entries, append: (e) => entries.push(e) };
}

Before(function () {
  this.specimen = adequateSpecimen();
  this.audit = inMemoryAuditStore();
  this.options = {};
});

// --- Given -------------------------------------------------------------------

Given('a specimen with an adequate marker panel and haemoglobin value', function () {
  this.specimen = adequateSpecimen();
});

Given('a specimen with methylated and total copy counts for every panel marker', function () {
  this.specimen = adequateSpecimen();
});

Given('a specimen whose total DNA input is below the validated minimum', function () {
  this.specimen = adequateSpecimen();
  this.specimen.marker.totalDnaInputNg = CONFIG.minimumDnaInputNg - 10;
});

Given('a specimen whose bisulfite conversion control has failed', function () {
  this.specimen = adequateSpecimen();
  this.specimen.marker.conversionControl = 'fail';
});

Given('a specimen where one panel marker has a total copy count of zero', function () {
  this.specimen = adequateSpecimen();
  this.specimen.marker.markers[PANEL_MARKERS[0]] = { methylated: 0, total: 0 };
});

Given('a specimen with no faecal haemoglobin measurement', function () {
  this.specimen = adequateSpecimen();
  delete this.specimen.haemoglobin.haemoglobinNgPerMl;
});

Given('marker data for accession A and a haemoglobin measurement for accession B', function () {
  this.specimen = adequateSpecimen('ACC-A');
  this.specimen.haemoglobin.accession = 'ACC-B';
});

Given('marker data and a haemoglobin measurement for the same accession', function () {
  this.specimen = adequateSpecimen('ACC-2002');
});

Given('a specimen reported NEGATIVE', function () {
  this.reportFor = 'NEGATIVE';
});

Given('a specimen reported POSITIVE', function () {
  this.reportFor = 'POSITIVE';
});

Given('a specimen reported INVALID for insufficient DNA input', function () {
  this.reportFor = 'INVALID';
  this.invalidReason = 'insufficient DNA input';
});

Given('a specimen that has been scored', function () {
  this.specimen = adequateSpecimen();
  this.outcome = analyseSpecimen(this.specimen.marker, this.specimen.haemoglobin);
});

Given('the audit store is unavailable', function () {
  this.audit = {
    append() {
      throw new Error('audit store unavailable');
    },
  };
});

// --- When --------------------------------------------------------------------

When('the composite score exceeds the positivity threshold', function () {
  this.outcome = analyseSpecimen(this.specimen.marker, this.specimen.haemoglobin, {
    forcedScore: CONFIG.positivityThreshold + 0.15,
  });
});

When('the composite score falls below the positivity threshold', function () {
  this.outcome = analyseSpecimen(this.specimen.marker, this.specimen.haemoglobin, {
    forcedScore: CONFIG.positivityThreshold - 0.15,
  });
});

When('the composite score is exactly equal to the positivity threshold', function () {
  this.outcome = analyseSpecimen(this.specimen.marker, this.specimen.haemoglobin, {
    forcedScore: CONFIG.positivityThreshold,
  });
});

When('the pipeline evaluates sample adequacy', function () {
  this.outcome = analyseSpecimen(this.specimen.marker, this.specimen.haemoglobin);
});

When('the pipeline quantifies the marker panel', function () {
  this.quantified = quantifyMarkers(this.specimen.marker);
});

When('the pipeline quantifies the marker panel twice', function () {
  this.firstRun = quantifyMarkers(this.specimen.marker);
  this.secondRun = quantifyMarkers(this.specimen.marker);
});

When('the pipeline validates the haemoglobin input', function () {
  this.haemoglobinCheck = validateHaemoglobin(this.specimen.haemoglobin);
  this.outcome = analyseSpecimen(this.specimen.marker, this.specimen.haemoglobin);
});

When('the pipeline verifies the accession identity chain', function () {
  this.outcome = analyseSpecimen(this.specimen.marker, this.specimen.haemoglobin);
});

When('the pipeline releases a result', function () {
  this.outcome = analyseSpecimen(this.specimen.marker, this.specimen.haemoglobin);
});

When('the result report is generated', function () {
  this.report = generateReport(this.reportFor, 'ACC-3003', { reason: this.invalidReason });
});

When('the pipeline releases the result', function () {
  this.release = releaseWithAudit(this.audit, {
    accession: this.outcome.accession,
    result: this.outcome.result,
    score: this.outcome.score,
    thresholdApplied: this.outcome.thresholdApplied,
    operator: 'svc-crc-pipeline',
    recordedAt: '2026-08-14T00:00:00Z',
  });
});

When('the pipeline attempts to release the result', function () {
  this.release = releaseWithAudit(this.audit, {
    accession: this.outcome.accession,
    result: this.outcome.result,
    score: this.outcome.score,
    thresholdApplied: this.outcome.thresholdApplied,
    operator: 'svc-crc-pipeline',
    recordedAt: '2026-08-14T00:00:00Z',
  });
});

// --- Then --------------------------------------------------------------------

Then('the reported result is {word}', function (expected) {
  assert.equal(this.outcome.result, expected);
});

Then('the recorded reason is {}', function (reason) {
  assert.equal(this.outcome.reason, reason);
});

Then('no classifier score is computed', function () {
  assert.equal(this.outcome.score, null);
});

Then('the threshold applied is recorded with the result', function () {
  assert.equal(this.outcome.thresholdApplied, CONFIG.positivityThreshold);
});

Then('each marker carries a normalised methylation ratio', function () {
  assert.equal(this.quantified.unquantifiable.length, 0);
  for (const m of PANEL_MARKERS) {
    assert.ok(typeof this.quantified.ratios[m] === 'number');
  }
});

Then('both runs produce identical marker ratios', function () {
  assert.deepEqual(this.firstRun.ratios, this.secondRun.ratios);
});

Then('the specimen is marked non-scorable', function () {
  assert.equal(this.haemoglobinCheck.scorable, false);
});

Then('no haemoglobin value is substituted', function () {
  assert.equal(this.haemoglobinCheck.value, undefined);
});

Then('the specimen is rejected', function () {
  assert.equal(this.outcome.rejected, true);
});

Then('no result is emitted against accession {word}', function (accession) {
  // Neither accession gets a result - not even INVALID. The correct binding is
  // unknown, so emitting against either would assert something unestablished.
  assert.equal(this.outcome.result, null);
  assert.ok(this.outcome.observed.includes(`ACC-${accession}`));
});

Then('the result carries exactly one accession identifier', function () {
  assert.equal(this.outcome.accession, 'ACC-2002');
});

Then('the report states that a negative result does not rule out colorectal cancer', function () {
  assert.ok(this.report.statements.some((s) => s.includes('does not rule out')));
});

Then('the report states that screening should continue at the recommended interval', function () {
  assert.ok(this.report.statements.some((s) => s.includes('recommended interval')));
});

Then('the report states that diagnostic colonoscopy is indicated', function () {
  assert.ok(this.report.statements.some((s) => s.includes('colonoscopy is indicated')));
});

Then('the report states the reason for the invalid result', function () {
  assert.ok(this.report.statements.some((s) => s.includes('insufficient DNA input')));
});

Then('the report states that a repeat specimen is required', function () {
  assert.ok(this.report.statements.some((s) => s.includes('repeat specimen')));
});

Then('an audit entry records the accession identifier and the released result', function () {
  const entry = this.audit.entries.at(-1);
  assert.equal(entry.accession, this.outcome.accession);
  assert.equal(entry.result, this.outcome.result);
});

Then('the audit entry records the classifier score and the threshold applied', function () {
  const entry = this.audit.entries.at(-1);
  assert.equal(entry.score, this.outcome.score);
  assert.equal(entry.thresholdApplied, this.outcome.thresholdApplied);
});

Then('the audit entry records the pipeline version and the initiating operator', function () {
  const entry = this.audit.entries.at(-1);
  assert.equal(entry.pipelineVersion, CONFIG.pipelineVersion);
  assert.equal(entry.operator, 'svc-crc-pipeline');
});

Then('the result is withheld', function () {
  assert.equal(this.release.withheld, true);
  assert.equal(this.release.released, false);
});
