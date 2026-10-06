---
itemId: RQ-CRC-07
itemType: Requirement
itemTitle: Enforce the validated reportable range and flag out-of-range inputs
itemHasParent: RQ-CRC-00
Requirement type: Functional
---

The pipeline shall enforce the reportable range established during analytical validation for each quantitative input.

An input falling outside its validated reportable range shall not be scored as though it
were within range. The pipeline shall flag the out-of-range condition, record which input
was out of range and in which direction, and route the specimen for INVALID handling.

The reportable range in force shall be a configured, version-controlled value recorded
alongside each result.
