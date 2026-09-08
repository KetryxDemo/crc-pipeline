---
itemId: RQ-CRC-01
itemType: Requirement
itemTitle: Quantify each methylated DNA marker in the panel
itemHasParent: RQ-CRC-00
Requirement type: Functional
---

The pipeline shall compute, for each methylated DNA marker in the assay panel, a
normalised methylation ratio derived from methylated and total copy counts reported by the
sequencing instrument.

Marker quantification shall be reproducible: re-processing the same instrument output shall
yield identical marker values.

A specimen for which any marker in the panel cannot be quantified shall not proceed to
scoring, and shall be handled under the sample-adequacy rules in RQ-CRC-04.

update for 9/8
