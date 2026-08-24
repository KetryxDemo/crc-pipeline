Feature: Release gateway verification

  Verification tests for the function-level design outputs in
  src/release/releaseGate.ts, whose specs are authored in the source itself
  rather than in markdown.

  @id:TC-VER-15 @tests:fn-normalise-accession
  Scenario: An accession is normalised to its canonical form
    Given the raw accession "  acc-1042 "
    When the release gateway normalises it
    Then the canonical accession is "ACC-1042"

  @id:TC-VER-16 @tests:fn-normalise-accession
  Scenario: A malformed accession is rejected rather than repaired
    Given the raw accession "patient-smith"
    When the release gateway normalises it
    Then no canonical accession is produced

  @id:TC-VER-17 @tests:fn-assert-releasable
  Scenario: A scored specimen with a written audit entry is releasable
    Given a scored specimen for accession "ACC-1042" with the audit entry written
    When the release gateway evaluates it
    Then the specimen is releasable

  @id:TC-VER-18 @tests:fn-assert-releasable
  Scenario: Release is refused when the audit entry has not been written
    Given a scored specimen for accession "ACC-1042" with no audit entry
    When the release gateway evaluates it
    Then the specimen is not releasable
    And the refusal reason mentions the audit entry

  @id:TC-VER-19 @tests:fn-redact-for-export
  Scenario: Export redaction keeps only allow-listed fields
    Given a result report carrying a patient name and date of birth
    When the report is redacted for export
    Then the accession and result are retained
    And no patient identifiers remain

  @id:TC-VER-20 @tests:fn-assert-threshold-provenance
  Scenario: A threshold from validated configuration is accepted
    Given a positivity threshold sourced from validated configuration
    When the provenance of the threshold is checked
    Then the threshold is accepted for scoring

  @id:TC-VER-21 @tests:fn-assert-threshold-provenance
  Scenario: A threshold falling back to a code default is refused
    Given a positivity threshold that fell back to a code default
    When the provenance of the threshold is checked
    Then the threshold is refused for scoring
    And the refusal reason names the threshold source
