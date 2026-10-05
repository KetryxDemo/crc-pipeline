Feature: Reportable range enforcement

  @id:TC-PIPE-17 @tests:RQ-CRC-07
  Scenario: A methylated marker value below the lower reportable limit is reported INVALID
    Given a specimen with an adequate marker panel and haemoglobin value
    When a panel marker value falls below the lower bound of its validated reportable range
    Then the reported result is INVALID
    And the recorded reason identifies the marker as the out-of-range input and records the below-range direction
    And no classifier score is computed
    And the reportable range version applied is recorded with the result

  @id:TC-PIPE-18 @tests:RQ-CRC-07
  Scenario: A faecal haemoglobin value above the upper reportable limit is reported INVALID
    Given a specimen with an adequate marker panel and haemoglobin value
    When the faecal haemoglobin value exceeds the upper bound of its validated reportable range
    Then the reported result is INVALID
    And the recorded reason identifies haemoglobin as the out-of-range input and records the above-range direction
    And no classifier score is computed
    And the reportable range version applied is recorded with the result

  @id:TC-PIPE-19 @tests:RQ-CRC-07
  Scenario: A haemoglobin value exactly at the upper reportable limit is treated as in range
    Given a specimen with an adequate marker panel and haemoglobin value
    When the faecal haemoglobin value is exactly equal to the upper bound of its validated reportable range
    Then the input is treated as in range
    And a classifier score is computed
    And the reportable range version applied is recorded with the result
