# CRC Screening Analysis Pipeline

Software component of a **laboratory-developed test** that screens average-risk
adults for colorectal cancer from a self-collected stool specimen, combining a methylated
DNA marker panel with a faecal immunochemical haemoglobin measurement.

This repository is the **source of truth for the design record**. Requirements, design
specifications, risks, test cases, and manual test executions are all version-controlled
here as markdown and Gherkin. Ketryx reads them directly from git - there is no ALM system
in the middle, and nothing is re-keyed into a second tool.

## Why the design record lives in git

Engineers author and review design changes the same way they review code: a branch, a pull
request, a diff, an approval. Ketryx supplies what git does not - Part 11 controlled
records and e-signature, live traceability across the V-model, and generated formal
documents for the CLIA record.

## Layout

```
design/requirements/    RQ-CRC-*     Requirement items
design/specs/           SPEC-PIPE-*  Software Item Spec items
design/risks/           RSK-CRC-*    Risk items
validation/features/    TC-PIPE-*    Test Cases (Gherkin, one per Scenario)
validation/protocols/   TC-AV-*      Manual Test Cases (wet-lab analytical validity)
validation/executions/  TE-AV-*      Manual Test Executions
src/                                 Pipeline implementation - NOT a configuration item
tools/                               Laboratory helper scripts - NOT configuration items
```

`src/` and `tools/` sit deliberately outside the Ketryx glob. The implementation is
described by the specs; it is not itself part of the design record.

## Traceability, expressed in source

Relations are declared in frontmatter and Gherkin tags, never edited in a UI. A relation
edited in Ketryx would be overwritten by the next scan - the tags are what persist.

```
RQ-CRC-00 (intended use)
  |  itemHasParent
  +-- RQ-CRC-01 .. RQ-CRC-08 (functional requirements)
        ^  itemFulfills
        +-- SPEC-PIPE-* (design specifications)
        |     |  itemIntroducesRisk
        |     +-- RSK-CRC-* (risks)
        |           |  itemIsRiskControlledBy
        |           +-- specs and test cases acting as risk controls
        ^  @tests:
        +-- TC-PIPE-* (Gherkin scenarios) and TC-AV-* (manual protocols)
              ^  itemExecutes
              +-- TE-AV-* (manual test executions)
```

Note the direction of `itemIsRiskControlledBy`: it is declared **on the risk**, pointing at
its controls. There is no inverse tag, so a test or requirement cannot declare itself a
control from its own file.

## Test evidence

Automated scenarios run in CI and are reported to Ketryx as Cucumber JSON, wrapped as Test
Cases with Test Executions against a pinned version.

Analytical validity work - accuracy against a colonoscopy-confirmed panel, precision across
reagent lots, limit of detection - is bench work and cannot come out of CI. Those protocols
and their execution records are maintained here as markdown.

```bash
npm ci
npm test                # run the acceptance suite
npm run test:report     # emit reports/cucumber.json for Ketryx
```

## Ketryx project settings

| Setting | Value |
| --- | --- |
| Enable Git-based items | on |
| Git-based items glob patterns | `design/**/*.md`, `validation/**/*.md`, `validation/features/**/*.feature` |
| Release ref pattern | `refs/tags/v#` |

## Regulatory context

The test is performed exclusively within a single CLIA-certified high-complexity
laboratory and is not distributed as a kit. Oversight sits with CMS under CLIA rather than
with FDA premarket device review; the FDA laboratory-developed test final rule was vacated
in full on 2025-03-31 and that decision was not appealed.

The controlling obligation is establishment of analytical validity under 42 CFR 493.1253
before any patient result is released. Records supporting result release are maintained as
electronic records under 21 CFR Part 11.

---

*Demonstration environment. This is a fictional assay created for evaluation
purposes and is not a real diagnostic product.*
