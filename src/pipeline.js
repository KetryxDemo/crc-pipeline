// CRC Screening Analysis Pipeline
//
// Turns instrument output into a releasable qualitative result. The module
// boundaries here mirror the specs under design/specs/ one-for-one, so a
// reviewer can read a spec and find the code that implements it.
//
// This directory is deliberately OUTSIDE the Ketryx git-based-item glob. The
// configuration items live in design/ and validation/; this is the
// implementation they describe.

/** Validated configuration, fixed at analytical validation. See SPEC-PIPE-CLASSIFIER. */
export const CONFIG = {
  coefficientSetVersion: 'CS-2024-11',
  markerWeights: { NDRG4: 0.31, BMP3: 0.27, ZDHHC1: 0.22, SFMBT2: 0.11 },
  haemoglobinWeight: 0.0021,
  positivityThreshold: 0.42,
  minimumDnaInputNg: 25,
  reportableRange: {
    haemoglobinNgPerMl: { min: 0, max: 2000 },
    markerRatio: { min: 0, max: 1 },
  },
  pipelineVersion: '1.0.0',
};

export const PANEL_MARKERS = Object.keys(CONFIG.markerWeights);

// --- SPEC-PIPE-INGEST --------------------------------------------------------

/**
 * Normalises the two instrument streams into one specimen record. The only
 * module that reads instrument output directly, so a platform change is
 * contained here. Performs no interpretation: a malformed input surfaces as a
 * structural error rather than being coerced into a specimen record.
 */
export function ingest(markerData, haemoglobinData) {
  if (!markerData?.markers) {
    return { record: null, error: 'sequencer manifest has no marker block' };
  }
  if (!haemoglobinData) {
    return { record: null, error: 'haemoglobin analyser output missing' };
  }
  return {
    error: null,
    record: {
      markerAccession: markerData.accession,
      haemoglobinAccession: haemoglobinData.accession,
      markers: markerData.markers,
      totalDnaInputNg: markerData.totalDnaInputNg,
      conversionControl: markerData.conversionControl,
      haemoglobinNgPerMl: haemoglobinData.haemoglobinNgPerMl,
    },
  };
}

// --- SPEC-PIPE-IDENTITY ------------------------------------------------------

/**
 * Verifies the accession identifier on the marker data matches the one on the
 * haemoglobin measurement. Runs before quantification so a mismatched specimen
 * consumes no downstream processing (RQ-CRC-05).
 */
export function verifyIdentity(markerData, haemoglobinData) {
  if (markerData.accession !== haemoglobinData.accession) {
    // No result is emitted against EITHER accession. The correct binding is
    // unknown at this point, so asserting one would be a fabrication.
    return {
      ok: false,
      rejected: true,
      observed: [markerData.accession, haemoglobinData.accession],
    };
  }
  return { ok: true, accession: markerData.accession };
}

// --- SPEC-PIPE-MARKERS -------------------------------------------------------

/**
 * Computes the normalised methylation ratio per panel marker (RQ-CRC-01).
 * A zero total copy count is unquantifiable, NOT a ratio of zero - scoring it
 * as zero would read as genuine absence of methylation and bias toward NEGATIVE.
 */
export function quantifyMarkers(markerData) {
  const ratios = {};
  const unquantifiable = [];
  for (const marker of PANEL_MARKERS) {
    const counts = markerData.markers?.[marker];
    if (!counts || counts.total === 0) {
      unquantifiable.push(marker);
      continue;
    }
    ratios[marker] = counts.methylated / counts.total;
  }
  return { ratios, unquantifiable };
}

// --- SPEC-PIPE-HGB -----------------------------------------------------------

/** Validates the haemoglobin input (RQ-CRC-02). Never substitutes a default. */
export function validateHaemoglobin(haemoglobinData) {
  const value = haemoglobinData?.haemoglobinNgPerMl;
  if (value === undefined || value === null) {
    return { scorable: false, reason: 'missing haemoglobin measurement' };
  }
  return { scorable: true, value };
}

// --- SPEC-PIPE-QC ------------------------------------------------------------

/**
 * Gates the classifier (RQ-CRC-04). Fail-closed: where adequacy cannot be
 * determined, the specimen is rejected rather than passed.
 */
export function evaluateAdequacy(markerData, quantified, haemoglobin) {
  if (markerData.totalDnaInputNg === undefined || markerData.totalDnaInputNg === null) {
    return { adequate: false, reason: 'DNA input not reported' };
  }
  if (markerData.totalDnaInputNg < CONFIG.minimumDnaInputNg) {
    return { adequate: false, reason: 'insufficient DNA input' };
  }
  if (markerData.conversionControl !== 'pass') {
    // Covers 'fail' and a control result that is itself missing.
    return { adequate: false, reason: 'failed conversion control' };
  }
  if (quantified.unquantifiable.length > 0) {
    return { adequate: false, reason: 'unquantifiable marker' };
  }
  if (!haemoglobin.scorable) {
    return { adequate: false, reason: haemoglobin.reason };
  }
  return { adequate: true };
}

// --- SPEC-PIPE-CLASSIFIER ----------------------------------------------------

/** Enforces the validated reportable range (RQ-CRC-07). */
export function checkReportableRange(ratios, haemoglobinValue) {
  const hgb = CONFIG.reportableRange.haemoglobinNgPerMl;
  if (haemoglobinValue < hgb.min || haemoglobinValue > hgb.max) {
    return {
      inRange: false,
      input: 'haemoglobin',
      direction: haemoglobinValue > hgb.max ? 'above' : 'below',
    };
  }
  const mr = CONFIG.reportableRange.markerRatio;
  for (const [marker, ratio] of Object.entries(ratios)) {
    if (ratio < mr.min || ratio > mr.max) {
      return {
        inRange: false,
        input: marker,
        direction: ratio > mr.max ? 'above' : 'below',
      };
    }
  }
  return { inRange: true };
}

/** Composite score from the marker panel and haemoglobin value (RQ-CRC-03). */
export function computeScore(ratios, haemoglobinValue) {
  let score = 0;
  for (const [marker, weight] of Object.entries(CONFIG.markerWeights)) {
    score += (ratios[marker] ?? 0) * weight;
  }
  score += haemoglobinValue * CONFIG.haemoglobinWeight;
  return score;
}

/**
 * Threshold comparison is INCLUSIVE at the boundary - a score exactly equal to
 * the threshold is POSITIVE. Deliberate, favouring sensitivity, consistent with
 * the screening intent in RQ-CRC-00.
 */
export function applyThreshold(score) {
  return score >= CONFIG.positivityThreshold ? 'POSITIVE' : 'NEGATIVE';
}

// --- SPEC-PIPE-REPORT --------------------------------------------------------

const LIMITATIONS = {
  NEGATIVE: [
    'A negative result does not rule out colorectal cancer or advanced adenoma.',
    'Screening should continue at the recommended interval.',
  ],
  POSITIVE: ['Diagnostic colonoscopy is indicated.'],
  INVALID: ['A repeat specimen is required.'],
};

/** Renders the result report (RQ-CRC-06). Limitations text is selected, not free. */
export function generateReport(result, accession, extra = {}) {
  const lines = [...LIMITATIONS[result]];
  if (result === 'INVALID' && extra.reason) {
    lines.unshift(`Reason: ${extra.reason}.`);
  }
  return {
    result,
    accession,
    method: 'Stool DNA and faecal haemoglobin colorectal cancer screening assay',
    pipelineVersion: CONFIG.pipelineVersion,
    analysedOn: extra.analysedOn ?? null,
    statements: lines,
  };
}

// --- SPEC-PIPE-AUDIT ---------------------------------------------------------

/**
 * Writes the audit entry and GATES release on it (RQ-CRC-08). A released result
 * with no audit record would be an unattributable electronic record, so the
 * write is a precondition of release, not a consequence of it.
 */
export function releaseWithAudit(auditStore, entry) {
  try {
    auditStore.append({
      accession: entry.accession,
      result: entry.result,
      score: entry.score ?? null,
      thresholdApplied: entry.thresholdApplied ?? null,
      pipelineVersion: CONFIG.pipelineVersion,
      operator: entry.operator,
      recordedAt: entry.recordedAt,
    });
  } catch {
    return { released: false, withheld: true, reason: 'audit entry could not be written' };
  }
  return { released: true, withheld: false };
}

// --- Orchestration -----------------------------------------------------------

/** Runs a specimen end to end. Mirrors the flow in SPEC-PIPE-INGEST's diagram. */
export function analyseSpecimen(markerData, haemoglobinData, options = {}) {
  const identity = verifyIdentity(markerData, haemoglobinData);
  if (!identity.ok) {
    return { rejected: true, result: null, observed: identity.observed };
  }

  const quantified = quantifyMarkers(markerData);
  const haemoglobin = validateHaemoglobin(haemoglobinData);
  const adequacy = evaluateAdequacy(markerData, quantified, haemoglobin);

  if (!adequacy.adequate) {
    return {
      rejected: false,
      accession: identity.accession,
      result: 'INVALID',
      reason: adequacy.reason,
      score: null,
    };
  }

  const range = checkReportableRange(quantified.ratios, haemoglobin.value);
  if (!range.inRange) {
    return {
      rejected: false,
      accession: identity.accession,
      result: 'INVALID',
      reason: `input out of reportable range: ${range.input} ${range.direction} range`,
      outOfRangeInput: range.input,
      score: null,
    };
  }

  const score = options.forcedScore ?? computeScore(quantified.ratios, haemoglobin.value);
  const result = applyThreshold(score);

  return {
    rejected: false,
    accession: identity.accession,
    result,
    score,
    thresholdApplied: CONFIG.positivityThreshold,
    coefficientSetVersion: CONFIG.coefficientSetVersion,
    ratios: quantified.ratios,
  };
}
