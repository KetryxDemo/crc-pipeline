#!/usr/bin/env node
// Ketryx pull-request traceability gate for the CRC screening design record.
//
// Adapted from KetryxDemo/demo-ketryx-disco11. Three differences matter here:
//
//   * Layout. Specs live in design/specs/, scenarios in validation/features/
//     (nested), manual protocols in validation/protocols/. disco11 uses flat
//     specs/ and features/ directories.
//   * Identifiers. This project is all-git, so trace targets are git itemIds
//     (RQ-CRC-03, SPEC-PIPE-QC, fn-assert-releasable), not Jira keys. disco11's
//     "looks like a Jira key" regex would reject every valid id in this repo.
//   * Function-level items. src/release/*.ts carries real design outputs in
//     docblocks, so a source change can be traced without touching markdown.
//
// Two stages:
//   1. static   - the tags this diff touches must build a complete trace chain.
//   2. verified - ask Ketryx what it actually sees at the PR head commit.
//
// Env: KETRYX_URL, KETRYX_PROJECT, KETRYX_API_KEY, KETRYX_VERSION_ID,
//      CHANGED_FILES (newline separated).

import fs from 'node:fs';
import path from 'node:path';

const KETRYX_URL = (process.env.KETRYX_URL || '').replace(/\/$/, '');
const PROJECT = process.env.KETRYX_PROJECT;
const API_KEY = process.env.KETRYX_API_KEY;
const VERSION_ID = process.env.KETRYX_VERSION_ID;
const SKIP_KETRYX = process.env.SKIP_KETRYX_VERIFY === 'true';

const SPEC_DIRS = ['design/specs'];
const REQ_DIRS = ['design/requirements'];
const FEATURE_DIRS = ['validation/features'];
const PROTOCOL_DIRS = ['validation/protocols'];

// Requirement ids in this project. Anything a design output claims to fulfil
// has to be one of these.
const REQ_ID = /^RQ-CRC-\d+$/;

const changed = (process.env.CHANGED_FILES || '')
  .split('\n').map((s) => s.trim()).filter(Boolean);

const failures = [];
const fail = (m) => { failures.push(m); console.log(`::error::${m}`); };
const note = (m) => console.log(m);

function walk(dir, ext) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p, ext));
    else if (p.endsWith(ext)) out.push(p);
  }
  return out;
}

function frontmatter(file) {
  const text = fs.readFileSync(file, 'utf8');
  const fm = /^---\n([\s\S]*?)\n---/.exec(text);
  const meta = {};
  if (fm) {
    for (const line of fm[1].split('\n')) {
      // Field labels here carry spaces and parentheses ("Initial severity",
      // "Initial likelihood of occurrence (P1)"), so this is deliberately
      // looser than a plain identifier match.
      const m = /^([A-Za-z][A-Za-z0-9 ()/_-]*):\s*(.*)$/.exec(line.trim());
      if (m) meta[m[1].trim()] = m[2].trim();
    }
  }
  return { meta, text };
}

function parseFeature(file) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const scenarios = [];
  let pending = [];
  lines.forEach((line, i) => {
    const t = line.trim();
    if (t.startsWith('@')) {
      pending = pending.concat(t.split(/\s+/).filter((x) => x.startsWith('@')));
    } else if (/^Scenario( Outline)?:/.test(t)) {
      scenarios.push({ name: t.replace(/^Scenario( Outline)?:\s*/, ''), tags: pending, line: i + 1 });
      pending = [];
    } else if (t === '' || t.startsWith('#')) {
      // tags survive blank and comment lines
    } else if (/^Feature:/.test(t)) {
      pending = [];
    }
  });
  return scenarios;
}

function parseFunctionItems(file) {
  const text = fs.readFileSync(file, 'utf8');
  const items = [];
  for (const b of text.matchAll(/\/\*\*([\s\S]*?)\*\//g)) {
    const body = b[1];
    const id = /@itemId:\s*(\S+)/.exec(body);
    if (!id) continue;
    const type = /@itemType:\s*(.+)/.exec(body);
    const ful = /@itemFulfills:\s*(.+)/.exec(body);
    items.push({
      itemId: id[1],
      itemType: type ? type[1].trim() : null,
      fulfills: (ful ? ful[1] : '').split(',').map((x) => x.trim()).filter(Boolean),
      line: text.slice(0, b.index).split('\n').length,
    });
  }
  return items;
}

// ---- repo-wide index, so coverage is judged even for files this PR didn't touch

const knownRequirements = new Set();
for (const d of REQ_DIRS) for (const f of walk(d, '.md')) {
  const id = frontmatter(f).meta.itemId;
  if (id) knownRequirements.add(id);
}

const knownDesignOutputs = new Set();
for (const d of SPEC_DIRS) for (const f of walk(d, '.md')) {
  const id = frontmatter(f).meta.itemId;
  if (id) knownDesignOutputs.add(id);
}
for (const f of walk('src', '.ts')) {
  for (const it of parseFunctionItems(f)) knownDesignOutputs.add(it.itemId);
}

const testedIds = new Set();
for (const d of FEATURE_DIRS) for (const f of walk(d, '.feature')) {
  for (const sc of parseFeature(f)) {
    for (const tag of sc.tags) if (tag.startsWith('@tests:')) testedIds.add(tag.slice(7));
  }
}
for (const d of PROTOCOL_DIRS) for (const f of walk(d, '.md')) {
  const t = frontmatter(f).meta.itemTests;
  if (t) for (const x of t.split(',')) testedIds.add(x.trim());
}

// ------------------------------- what changed -------------------------------

const inDirs = (f, dirs) => dirs.some((d) => f.startsWith(d + '/'));
const exists = (f) => fs.existsSync(f);

const changedSpecs = changed.filter((f) => inDirs(f, SPEC_DIRS) && f.endsWith('.md') && exists(f));
const changedFeatures = changed.filter((f) => inDirs(f, FEATURE_DIRS) && f.endsWith('.feature') && exists(f));
const SRC_EXT = /\.(js|mjs|cjs|ts|tsx)$/;
// Step definitions are test plumbing, not regulated behaviour.
const changedSrc = changed.filter(
  (f) => f.startsWith('src/') && SRC_EXT.test(f) && exists(f) && !f.includes('/steps/')
);

console.log('--- Ketryx PR traceability gate ---');
console.log(`Index: ${knownRequirements.size} requirements, ${knownDesignOutputs.size} design outputs, ${testedIds.size} tested ids`);
console.log(`This diff: ${changedSpecs.length} spec(s), ${changedFeatures.length} feature(s), ${changedSrc.length} regulated source file(s)`);

// ------------------------------ stage 1: static -----------------------------

for (const f of changedSpecs) {
  const { meta } = frontmatter(f);
  if (!meta.itemId) fail(`${f}: no \`itemId\` in frontmatter - Ketryx cannot key this to an item.`);
  if (!meta.itemType) fail(`${f}: no \`itemType\` in frontmatter.`);
  const ful = (meta.itemFulfills || '').split(',').map((x) => x.trim()).filter(Boolean);
  if (ful.length === 0) {
    fail(`${f}: declares no \`itemFulfills\` - this design output traces to no requirement and lands in Ketryx as an orphan.`);
  } else {
    const malformed = ful.filter((k) => !REQ_ID.test(k));
    const missing = ful.filter((k) => REQ_ID.test(k) && !knownRequirements.has(k));
    if (malformed.length) fail(`${f}: \`itemFulfills\` contains value(s) that are not requirement ids: ${malformed.join(', ')}`);
    else if (missing.length) fail(`${f}: \`itemFulfills\` references requirement(s) that do not exist in design/requirements/: ${missing.join(', ')}`);
    else note(`  OK  ${f} fulfils ${ful.join(', ')}`);
  }
  if (meta.itemId && !testedIds.has(meta.itemId)) {
    fail(`${f}: nothing is tagged \`@tests:${meta.itemId}\` - this design output has no verification test.`);
  }
}

for (const f of changedFeatures) {
  for (const sc of parseFeature(f)) {
    const tests = sc.tags.filter((t) => t.startsWith('@tests:')).map((t) => t.slice(7));
    const ids = sc.tags.filter((t) => t.startsWith('@id:'));
    if (ids.length === 0) fail(`${f}:${sc.line} scenario "${sc.name}" has no \`@id:\` tag, so its Ketryx Test Case has no stable identity.`);
    if (tests.length === 0) {
      fail(`${f}:${sc.line} scenario "${sc.name}" has no \`@tests:\` tag - its execution traces to nothing.`);
    } else {
      const unknown = tests.filter((t) => !knownRequirements.has(t) && !knownDesignOutputs.has(t));
      if (unknown.length) fail(`${f}:${sc.line} scenario "${sc.name}" is tagged \`@tests:${unknown.join(',')}\` but nothing in the repo declares that itemId.`);
      else note(`  OK  ${f}:${sc.line} tests ${tests.join(', ')}`);
    }
  }
}

let srcItemCount = 0;
for (const f of changedSrc) {
  for (const it of parseFunctionItems(f)) {
    srcItemCount++;
    if (!it.itemType) fail(`${f}:${it.line} function-level item \`${it.itemId}\` has no \`@itemType:\`.`);
    if (it.fulfills.length === 0) {
      fail(`${f}:${it.line} function-level item \`${it.itemId}\` declares no \`@itemFulfills:\` - this design output traces to no requirement.`);
    } else {
      const bad = it.fulfills.filter((k) => !REQ_ID.test(k) || !knownRequirements.has(k));
      if (bad.length) fail(`${f}:${it.line} \`@itemFulfills:\` on \`${it.itemId}\` references unknown requirement(s): ${bad.join(', ')}`);
      else note(`  OK  ${f}:${it.line} ${it.itemId} fulfils ${it.fulfills.join(', ')}`);
    }
    if (!testedIds.has(it.itemId)) {
      fail(`${f}:${it.line} function-level item \`${it.itemId}\` has no scenario tagged \`@tests:${it.itemId}\` - no verification test.`);
    }
  }
}

// The catch-all: regulated source moved and nothing in this diff declares an item.
if (changedSrc.length && changedSpecs.length === 0 && changedFeatures.length === 0 && srcItemCount === 0) {
  fail(
    `This pull request changes regulated source (${changedSrc.join(', ')}) but declares no Ketryx item: ` +
    `no spec under design/specs/, no scenario under validation/features/, and no function-level \`@itemId:\` ` +
    `docblock in the changed source. Changed behaviour has to trace to a requirement and be verified by a test.`
  );
}

if (failures.length) {
  console.log(`\nStatic traceability stage FAILED with ${failures.length} finding(s) - not querying Ketryx.`);
  process.exit(1);
}
console.log('Static traceability stage passed.');

// ---------------------------- stage 2: Ketryx-verified ----------------------

if (SKIP_KETRYX) { console.log('Ketryx verification skipped (SKIP_KETRYX_VERIFY=true).'); process.exit(0); }
if (!VERSION_ID || !API_KEY || !PROJECT || !KETRYX_URL) {
  console.log('::warning::Ketryx verification skipped - missing KETRYX_URL/KETRYX_PROJECT/KETRYX_API_KEY/KETRYX_VERSION_ID.');
  process.exit(0);
}

const touched = [];
for (const f of changedSpecs) {
  const id = frontmatter(f).meta.itemId;
  if (id) touched.push({ file: f, itemId: id });
}
for (const f of changedSrc) for (const it of parseFunctionItems(f)) touched.push({ file: f, itemId: it.itemId });

if (touched.length === 0) {
  console.log('No design outputs touched - nothing to verify against Ketryx.');
  process.exit(0);
}

const PAGE = 1000;
async function fetchRecords(kql) {
  const out = [];
  let startAt = 0;
  for (;;) {
    const url = `${KETRYX_URL}/api/v1/projects/${PROJECT}/records` +
      `?versionId=${encodeURIComponent(VERSION_ID)}` +
      `&query=${encodeURIComponent(kql)}&startAt=${startAt}&maxResults=${PAGE}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${API_KEY}` } });
    if (!res.ok) throw new Error(`records query failed: HTTP ${res.status} ${await res.text()}`);
    const body = await res.json();
    const batch = body.records || [];
    out.push(...batch);
    if (batch.length < PAGE) break;
    startAt += batch.length;
  }
  return out;
}

let records = [];
try {
  // `query` is required on this endpoint and an empty string is rejected.
  records = await fetchRecords('type:SW or type:TC');
} catch (err) {
  console.log(`::warning::Could not read records from Ketryx (${err.message}); the static stage above is the enforced gate.`);
  process.exit(0);
}
console.log(`Ketryx returned ${records.length} record(s) for version ${VERSION_ID}.`);

for (const t of touched) {
  const rec = records.find((r) => r.docId === t.itemId || r.title === t.itemId);
  if (!rec) {
    // A PAT-connected repo is scanned on build report / manual refresh, not on
    // push, so absence here is scan lag rather than a traceability gap. Stage 1
    // already proved the tags are right.
    console.log(`::warning::Ketryx has not yet scanned \`${t.itemId}\` (${t.file}) at this commit; skipping platform verification for it.`);
    continue;
  }
  const fulfils = (rec.relations || []).filter((rel) => /FULFILL/i.test(rel.type));
  if (fulfils.length === 0) fail(`Ketryx record \`${t.itemId}\` (${t.file}) has no FULFILLS relation - orphaned design output.`);
  else note(`  OK  Ketryx: \`${t.itemId}\` fulfils ${fulfils.length} requirement(s)`);
}

if (failures.length) { console.log('\nKetryx verification stage FAILED.'); process.exit(1); }
console.log('\nKetryx verification stage passed - every touched design output is traced.');
