*** Settings ***
Documentation    Module 1 Acceptance Tests: Duplicate Patient Detection & Ambiguity
Resource         ../../resources/common.resource
Resource         ../../resources/authentication.resource
Resource         ../../keywords/patient_registration_keywords.resource
Resource         ../../keywords/patient_matching_keywords.resource

*** Test Cases ***
TC-REG-003 Duplicate Detection Exact High Confidence
    [Documentation]    Verify submitting duplicate demographics automatically resolves to the existing permanent Patient ID without creating duplicates
    ${dupRes}=    Submit Online Patient Registration
    ...    firstName=Aarav
    ...    lastName=Patel
    ...    dob=1990-05-15
    ...    gender=MALE
    ...    mobile=9876543216
    ...    email=patient@hospital.com

    Should Be True    ${dupRes}[success]
    # Reuses existing permanent patient ID P10001
    Should Be Equal As Strings    ${dupRes}[data][patientId]    P10001
    Should Be Equal As Strings    ${dupRes}[data][isExistingPatient]    True

TC-REG-004 Ambiguous Identity Routing & Exception Creation
    [Documentation]    Verify partial matches route to IDENTITY_VERIFICATION_REQUIRED and create an Exception Case rather than auto-merging
    ${ambigRes}=    Submit Online Patient Registration
    ...    firstName=Neha
    ...    lastName=Shah
    ...    dob=1998-05-10
    ...    gender=FEMALE
    ...    mobile=9899999999
    ...    email=different.neha@example.com

    Should Be True    ${ambigRes}[success]
    Should Be Equal As Strings    ${ambigRes}[data][status]    IDENTITY_VERIFICATION_REQUIRED

    # Verify potential matches were captured
    ${matchesCount}=    Get Length    ${ambigRes}[data][potentialMatches]
    Should Be True    ${matchesCount} >= 1
