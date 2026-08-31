---
itemId: RSK-CRC-02
itemType: Risk
itemTitle: Specimen mix-up causes a result to be reported against the wrong patient
itemIsRiskControlledBy: SPEC-PIPE-IDENTITY, TC-PIPE-07, TC-PIPE-08
Hazard type: Data
System categories: Clinical, Software, Safety, Human system interface
Risk assessment methodologies: FMEA, FTA
Initial severity: High
Initial likelihood of occurrence (P1): Medium
Initial likelihood of harm (P2): High
Residual severity: High
Residual likelihood of occurrence (P1): Low
Residual likelihood of harm (P2): High
CLIA validity characteristic: Specimen identity
Detection level: Per specimen
Lot acceptance dependency: No
---

## Item fields

### Description

Marker data from one specimen is combined with the haemoglobin measurement from another, or a
result is released bound to the wrong accession identifier. One patient receives a result
derived wholly or partly from another patient's sample.

This failure harms two patients from a single event, and it defeats every other control in
the register. A result can be computed perfectly, pass every adequacy criterion, apply the
correct threshold, and carry a complete audit trail, and still be clinically worthless
because it describes the wrong person.

It is also uniquely undetectable by the recipient. A clinician has no way to look at a
NEGATIVE assay result and tell that it belongs to someone else.

**Benefit-risk analysis**

This risk carries **no offsetting clinical benefit**. Unlike the false negative and false
positive risks, which arise from operating a screening assay at a finite threshold and are
justified by the benefit of screening an otherwise unscreened population, a specimen mix-up
delivers no diagnostic value to anyone. It is pure harm.

It is therefore not a risk to be accepted on a benefit-risk basis, but one to be driven as
close to elimination as the design allows. The controls above are structured accordingly:
identity is verified before any other processing, and the failure mode is fail-closed with no
result emitted rather than a best-effort result attached to a guessed accession.

**Disposition.** Residual risk is acceptable for the software boundary, on the basis that
divergence between instrument streams is detected deterministically and fails closed. This
determination explicitly does not extend to mislabelling at collection or accessioning, which
must be controlled by laboratory specimen-handling procedures and is out of scope for this
project.

### Harm

**Patient A, whose true status is positive, receives patient B's negative result**

- The full false-negative harm pathway of RSK-CRC-01: undetected progression, stage
  migration, more aggressive treatment, potential death - with none of the statistical
  justification that makes a threshold-limited false negative acceptable.

**Patient B, whose true status is negative, receives patient A's positive result**

- Diagnostic colonoscopy with no clinical indication: bowel preparation, sedation, and
  procedural risk of perforation and bleeding.
- Significant psychological harm from being told a cancer screen is positive, sustained
  across the interval until colonoscopy resolves it.

**Both patients, and the laboratory**

- Once discovered, every result processed in the affected batch is suspect, since a mix-up is
  rarely provably isolated. This triggers batch-level investigation and re-testing.
- Loss of confidence in specimen handling is not recoverable by a software fix, and is
  reportable.

**Severity classification: High**

Potential for death or permanent impairment for patient A, and an unnecessary invasive
procedure for patient B.

### Hazard

Release of a qualitative result bound to an accession identifier that does not correspond to
the specimen from which the underlying measurements were taken.

### Hazardous situation

Two patients, and the clinicians who ordered their screens, hold results that have been
exchanged or cross-contaminated. Both act on information describing someone else. Patient A
is falsely reassured and returned to the routine screening interval; patient B is referred
for an invasive procedure they do not need.

Neither patient nor clinician has any means of detecting the condition from the result
itself. It is resolved only by an independent audit of specimen handling, or by patient B's
colonoscopy returning a finding inconsistent with a positive screen - which resolves it for B
while leaving A unresolved indefinitely.

### Sequence of events

1. Two specimens are accessioned and enter processing in the same batch.
2. A divergence in identity occurs between the two instrument streams:
   - The sequencing run manifest and the haemoglobin analyser output are associated with
     different accession identifiers for the same physical sample, or
   - An accession identifier is truncated or transcribed incorrectly during ingestion so that
     it collides with, or resolves to, another accession, or
   - A run manifest contains more than one accession and the pipeline associates the wrong
     one with a set of marker counts.
3. The pipeline combines marker data belonging to one accession with a haemoglobin
   measurement belonging to another.
4. Because both inputs are individually well-formed, every adequacy criterion passes.
5. A composite score is computed from mixed inputs and a qualitative result is emitted.
6. The result is bound to one of the two accessions and released. The audit trail records
   that accession, correctly and unhelpfully.
7. Both patients act on results that do not describe them, following the harm pathways above.

### Risk controls description

**RC-1 - Accession identity is verified before quantification (SPEC-PIPE-IDENTITY).** The
pipeline compares the accession identifier carried by the marker data against the one carried
by the haemoglobin measurement, and proceeds only on an exact match. Verification runs before
quantification, so a mismatched specimen consumes no downstream processing and cannot reach
the classifier by any path.

**RC-2 - Mismatch produces no result against either accession (SPEC-PIPE-IDENTITY).** On
mismatch the specimen is rejected outright, and specifically no result is emitted against
either accession - not even INVALID. This is a deliberate design decision rather than an
omission. Emitting INVALID against one of two mismatched accessions would assert a binding
that has not been established, and at the point of detection the correct binding is unknown.
Both observed identifiers are recorded for laboratory follow-up, so the event is
investigable.

**RC-3 - Exactly one accession is bound to every released result (SPEC-PIPE-IDENTITY).** The
verified identifier is bound to the specimen record for the remainder of the run, and no
result is releasable without exactly one bound accession.

**RC-4 - Both behaviours are verified by automated test (TC-PIPE-07, TC-PIPE-08).**
TC-PIPE-07 confirms that mismatched identifiers are rejected with no result emitted against
either accession. TC-PIPE-08 confirms that a released result carries exactly one accession
identifier.

**Residual risk and its boundary.** Likelihood of occurrence is reduced from Medium to Low.
Severity is unchanged, since the harm of a mix-up that does occur is not lessened by these
controls.

The important limitation: these controls detect divergence **between the two instrument
streams**. They cannot detect an error upstream of both - if a physical sample is labelled
with the wrong accession at collection or accessioning, both streams will carry the same
wrong identifier, agree with each other, and pass verification. That failure mode is a
specimen-handling control in the laboratory, outside this software, and is not claimed as
covered here.

### Post-market signal

Discordant repeat results on the same patient; accession mismatch rejections trending
upward; clinician-reported results inconsistent with clinical picture.
