import assert from 'node:assert/strict';
import { Given, When, Then } from '@cucumber/cucumber';
import {
  CONFIG,
  PANEL_MARKERS,
  ingest,
  quantifyMarkers,
  validateHaemoglobin,
  evaluateAdequacy,
  verifyIdentity,
  computeScore,
  checkReportableRange,
  generateReport,
  releaseWithAudit,
} from '../pipeline.js';

function baseMarkerData(accession = 'ACC-9001') {
  const markers = {};
  for (const m of PANEL_MARKERS) markers[m] = { methylated: 30, total: 100 };
  return { accession, markers, totalDnaInputNg: 120, conversionControl: 'pass' };
}

// --- SPEC-PIPE-INGEST --------------------------------------------------------

Given('a sequencer manifest and a haemoglobin analyser file for the same accession', function () {
  this.manifest = baseMarkerData('ACC-9001');
  this.hgbFile = { accession: 'ACC-9001', haemoglobinNgPerMl: 45 };
});

Given('a sequencer manifest with no marker block', function () {
  this.manifest = { accession: 'ACC-9002', totalDnaInputNg: 120, conversionControl: 'pass' };
  this.hgbFile = { accession: 'ACC-9002', haemoglobinNgPerMl: 45 };
});

When('the ingestion module normalises them', function () {
  this.ingested = ingest(this.manifest, this.hgbFile);
});

Then('the specimen record carries the marker counts and the haemoglobin concentration', function () {
  assert.ok(this.ingested.record);
  assert.deepEqual(this.ingested.record.markers, this.manifest.markers);
  assert.equal(this.ingested.record.haemoglobinNgPerMl, 45);
  assert.equal(this.ingested.record.totalDnaInputNg, 120);
});

Then('a structural error is surfaced', function () {
  assert.ok(this.ingested.error);
});

Then('no specimen record is produced', function () {
  assert.equal(this.ingested.record, null);
});

// --- SPEC-PIPE-MARKERS -------------------------------------------------------

Given('a marker with {int} methylated copies and {int} total copies', function (m, t) {
  this.markerData = baseMarkerData();
  this.targetMarker = PANEL_MARKERS[0];
  this.markerData.markers[this.targetMarker] = { methylated: m, total: t };
});

When('the marker module quantifies the panel', function () {
  this.quantified = quantifyMarkers(this.markerData);
});

Then('that marker carries a ratio of {float}', function (expected) {
  assert.equal(this.quantified.ratios[this.targetMarker], expected);
});

Then('that marker is reported unquantifiable', function () {
  assert.ok(this.quantified.unquantifiable.includes(this.targetMarker));
});

Then('that marker carries no ratio', function () {
  assert.equal(this.quantified.ratios[this.targetMarker], undefined);
});

// --- SPEC-PIPE-HGB -----------------------------------------------------------

Given('a haemoglobin measurement of {int} nanograms per millilitre', function (v) {
  this.hgbInput = { accession: 'ACC-9003', haemoglobinNgPerMl: v };
});

Given('a haemoglobin measurement that was never reported', function () {
  this.hgbInput = { accession: 'ACC-9003' };
});

When('the haemoglobin module validates the input', function () {
  this.hgbResult = validateHaemoglobin(this.hgbInput);
});

Then('the haemoglobin input is scorable', function () {
  assert.equal(this.hgbResult.scorable, true);
});

Then('the validated haemoglobin value is {int}', function (v) {
  assert.equal(this.hgbResult.value, v);
});

Then('the haemoglobin input is not scorable', function () {
  assert.equal(this.hgbResult.scorable, false);
});

Then('no haemoglobin value is substituted by the module', function () {
  assert.equal(this.hgbResult.value, undefined);
  assert.match(this.hgbResult.reason, /missing haemoglobin/);
});

// --- SPEC-PIPE-QC ------------------------------------------------------------

Given('a specimen whose DNA input quantity is absent rather than low', function () {
  this.markerData = baseMarkerData();
  delete this.markerData.totalDnaInputNg;
});

Given('a specimen whose conversion control result is absent', function () {
  this.markerData = baseMarkerData();
  delete this.markerData.conversionControl;
});

When('the QC module evaluates adequacy', function () {
  const quantified = quantifyMarkers(this.markerData);
  const hgb = validateHaemoglobin({ haemoglobinNgPerMl: 45 });
  this.adequacy = evaluateAdequacy(this.markerData, quantified, hgb);
});

Then('the specimen is inadequate', function () {
  assert.equal(this.adequacy.adequate, false);
});

Then('the adequacy reason records that DNA input was not reported', function () {
  assert.match(this.adequacy.reason, /not reported/);
});

Then('the adequacy reason records a failed conversion control', function () {
  assert.match(this.adequacy.reason, /conversion control/);
});

// --- SPEC-PIPE-IDENTITY ------------------------------------------------------

Given('marker data for one accession and haemoglobin for a different accession', function () {
  this.markerData = baseMarkerData('ACC-A');
  this.hgbInput = { accession: 'ACC-B', haemoglobinNgPerMl: 45 };
});

When('the identity module verifies the accession chain', function () {
  this.identity = verifyIdentity(this.markerData, this.hgbInput);
});

Then('identity verification fails', function () {
  assert.equal(this.identity.ok, false);
});

Then('both observed accession identifiers are recorded for follow-up', function () {
  assert.deepEqual(this.identity.observed, ['ACC-A', 'ACC-B']);
});

// --- SPEC-PIPE-CLASSIFIER ----------------------------------------------------

Given('a panel where every marker ratio is {float} and haemoglobin is {int}', function (r, h) {
  this.ratios = Object.fromEntries(PANEL_MARKERS.map((m) => [m, r]));
  this.hgbValue = h;
});

When('the classifier computes the composite score', function () {
  this.score = computeScore(this.ratios, this.hgbValue);
});

Then('the score equals the weighted sum of the marker and haemoglobin contributions', function () {
  let expected = 0;
  for (const [m, w] of Object.entries(CONFIG.markerWeights)) expected += this.ratios[m] * w;
  expected += this.hgbValue * CONFIG.haemoglobinWeight;
  assert.ok(Math.abs(this.score - expected) < 1e-9);
});

Given('a haemoglobin measurement above the validated reportable range', function () {
  this.ratios = Object.fromEntries(PANEL_MARKERS.map((m) => [m, 0.3]));
  this.hgbValue = CONFIG.reportableRange.haemoglobinNgPerMl.max + 1;
});

When('the classifier checks the reportable range', function () {
  this.range = checkReportableRange(this.ratios, this.hgbValue);
});

Then('the input is out of range', function () {
  assert.equal(this.range.inRange, false);
});

Then('the offending input and direction are recorded', function () {
  assert.equal(this.range.input, 'haemoglobin');
  assert.equal(this.range.direction, 'above');
});

// --- SPEC-PIPE-REPORT --------------------------------------------------------

Given('the report module renders a NEGATIVE report', function () {
  this.report = generateReport('NEGATIVE', 'ACC-9004', {});
});

When('the rendered report is inspected', function () {
  assert.ok(this.report);
});

Then('the report carries the standard negative limitations text', function () {
  assert.ok(this.report.statements.some((s) => s.includes('does not rule out')));
  assert.ok(this.report.statements.some((s) => s.includes('recommended interval')));
});

Then('the report carries the assay method and pipeline version', function () {
  assert.match(this.report.method, /colorectal cancer screening assay/);
  assert.equal(this.report.pipelineVersion, CONFIG.pipelineVersion);
});

// --- SPEC-PIPE-AUDIT ---------------------------------------------------------

Given('a scored specimen and an available audit store', function () {
  this.entries = [];
  this.auditStore = { append: (e) => this.entries.push(e) };
  this.scored = {
    accession: 'ACC-9005', result: 'POSITIVE', score: 0.61,
    thresholdApplied: CONFIG.positivityThreshold,
  };
});

Given('a scored specimen and an unavailable audit store', function () {
  this.auditStore = { append() { throw new Error('unavailable'); } };
  this.scored = {
    accession: 'ACC-9006', result: 'NEGATIVE', score: 0.11,
    thresholdApplied: CONFIG.positivityThreshold,
  };
});

When('the audit module records the release', function () {
  this.release = releaseWithAudit(this.auditStore, {
    ...this.scored, operator: 'svc-crc-pipeline', recordedAt: '2026-08-14T00:00:00Z',
  });
});

Then('the audit entry captures accession, result, score, threshold, version and operator', function () {
  const e = this.entries.at(-1);
  assert.equal(e.accession, this.scored.accession);
  assert.equal(e.result, this.scored.result);
  assert.equal(e.score, this.scored.score);
  assert.equal(e.thresholdApplied, this.scored.thresholdApplied);
  assert.equal(e.pipelineVersion, CONFIG.pipelineVersion);
  assert.equal(e.operator, 'svc-crc-pipeline');
});

Then('the release is withheld', function () {
  assert.equal(this.release.withheld, true);
  assert.equal(this.release.released, false);
});

Then('the withholding reason records that the audit entry could not be written', function () {
  assert.match(this.release.reason, /audit entry could not be written/);
});
