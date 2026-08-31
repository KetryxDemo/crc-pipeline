---
itemId: TC-AV-01
itemType: Test Case
itemTitle: Clinical accuracy against a colonoscopy-confirmed reference panel
itemTests: RQ-CRC-03
---

## Item fields

### Description

Establishes clinical sensitivity and specificity of the assay against a reference panel of
specimens whose disease status is known from colonoscopy, and confirms that the positivity
threshold in force reproduces the sensitivity and specificity claimed at validation.

This is bench work. It cannot be produced by the CI pipeline, and its execution record is
entered manually.

### Steps

1. Assemble a reference panel of at least 400 specimens with colonoscopy-confirmed status,
   spanning colorectal cancer, advanced adenoma, and no-neoplasia findings.
2. Process each specimen through the full assay and pipeline at the threshold in force.
3. Cross-tabulate reported results against colonoscopy findings.
4. Compute sensitivity for colorectal cancer, sensitivity for advanced adenoma, and
   specificity for no-neoplasia, each with 95 percent confidence intervals.

### Acceptance criteria

Sensitivity for colorectal cancer at least 90 percent. Specificity for no-neoplasia at
least 85 percent. Both lower confidence bounds above the claimed performance stated in the
result report.

