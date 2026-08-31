---
itemId: SPEC-PIPE-MARKERS
itemType: Software Item Spec
itemTitle: Marker quantification and panel assembly
itemFulfills: RQ-CRC-01

Software item type: Function
---

## Item fields

### Description

Computes the normalised methylation ratio for each marker in the assay panel from the
methylated and total copy counts in the normalised specimen record, and assembles the
complete marker panel consumed by the classifier.

The ratio for a marker is its methylated copy count divided by its total copy count. A
marker whose total copy count is zero is not quantifiable and is reported as such rather
than being emitted as a zero ratio, which would otherwise be scored as genuine absence of
methylation.

### Outputs

A quantified panel: one normalised ratio per marker, or an explicit unquantifiable marker
for any marker that could not be computed. Quantification is deterministic - the same
counts always produce the same ratios.

