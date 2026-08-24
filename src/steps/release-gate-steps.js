import assert from 'node:assert/strict';
import { Given, When, Then } from '@cucumber/cucumber';
// Imported straight from TypeScript - Node strips the types at load time.
import {
  normaliseAccession,
  assertReleasable,
  redactForExport,
  assertThresholdProvenance,
} from '../release/releaseGate.ts';

Given('the raw accession {string}', function (raw) {
  this.rawAccession = raw;
});

When('the release gateway normalises it', function () {
  this.canonical = normaliseAccession(this.rawAccession);
});

Then('the canonical accession is {string}', function (expected) {
  assert.equal(this.canonical, expected);
});

Then('no canonical accession is produced', function () {
  assert.equal(this.canonical, null);
});

Given(
  'a scored specimen for accession {string} with the audit entry written',
  function (acc) {
    this.specimen = { accession: acc, result: 'POSITIVE', score: 0.61,
                      thresholdApplied: 0.42, auditWritten: true };
  }
);

Given(
  'a scored specimen for accession {string} with no audit entry',
  function (acc) {
    this.specimen = { accession: acc, result: 'POSITIVE', score: 0.61,
                      thresholdApplied: 0.42, auditWritten: false };
  }
);

When('the release gateway evaluates it', function () {
  this.decision = assertReleasable(this.specimen);
});

Then('the specimen is releasable', function () {
  assert.equal(this.decision.releasable, true);
});

Then('the specimen is not releasable', function () {
  assert.equal(this.decision.releasable, false);
});

Then('the refusal reason mentions the audit entry', function () {
  assert.match(this.decision.reason, /audit entry/);
});

Given('a result report carrying a patient name and date of birth', function () {
  this.report = {
    accession: 'ACC-1042',
    result: 'NEGATIVE',
    method: 'ClarityCRC stool DNA and faecal haemoglobin screening assay',
    pipelineVersion: '1.0.0',
    statements: ['A negative result does not rule out colorectal cancer.'],
    patientName: 'Jordan Rivera',
    dateOfBirth: '1971-04-02',
    orderingClinician: 'Dr M. Okafor',
  };
});

When('the report is redacted for export', function () {
  this.redacted = redactForExport(this.report);
});

Then('the accession and result are retained', function () {
  assert.equal(this.redacted.accession, 'ACC-1042');
  assert.equal(this.redacted.result, 'NEGATIVE');
});

Then('no patient identifiers remain', function () {
  for (const k of ['patientName', 'dateOfBirth', 'orderingClinician']) {
    assert.equal(k in this.redacted, false, `${k} should have been redacted`);
  }
});

// --- fn-assert-threshold-provenance -----------------------------------------

Given('a positivity threshold sourced from validated configuration', function () {
  this.provenance = { value: 0.42, coefficientSetVersion: 'CS-2024-11',
                      source: 'validated-configuration' };
});

Given('a positivity threshold that fell back to a code default', function () {
  this.provenance = { value: 0.42, coefficientSetVersion: 'CS-2024-11',
                      source: 'default' };
});

When('the provenance of the threshold is checked', function () {
  this.provenanceDecision = assertThresholdProvenance(this.provenance);
});

Then('the threshold is accepted for scoring', function () {
  assert.equal(this.provenanceDecision.releasable, true);
});

Then('the threshold is refused for scoring', function () {
  assert.equal(this.provenanceDecision.releasable, false);
});

Then('the refusal reason names the threshold source', function () {
  assert.match(this.provenanceDecision.reason, /threshold source/);
});
