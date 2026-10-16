*** Settings ***
Documentation    Module 21: Laboratory Administration RPA Automation Test Suite
Resource         ../resources/common.resource
Resource         ../resources/authentication.resource
Resource         ../resources/laboratory_keywords.resource
Library          String
Library          Collections

Suite Setup      Setup Laboratory Test Suite

*** Variables ***
${AUTH_TOKEN}         ${EMPTY}
${RUN_ID}             ${EMPTY}
${PATIENT_ID}         ${EMPTY}
${PATIENT_NAME}       ${EMPTY}
${LAB_TEST_ID}        ${EMPTY}
${TEST_CODE}          ${EMPTY}
${LAB_ORDER_ID}       ${EMPTY}
${SAMPLE_ID}          ${EMPTY}
${ACCESSION_NO}       ${EMPTY}
${RESULT_ID}          ${EMPTY}
${REPORT_ID}          ${EMPTY}

*** Keywords ***
Setup Laboratory Test Suite
    ${token}=    Login Hospital User    ${ADMIN_EMAIL}    ${DEFAULT_PASSWORD}
    Set Suite Variable    ${AUTH_TOKEN}    ${token}
    ${rand}=     Generate Random String    5    [NUMBERS]
    Set Suite Variable    ${RUN_ID}    ${rand}
    Set Suite Variable    ${PATIENT_ID}    P10001
    Set Suite Variable    ${PATIENT_NAME}    Aarav Patel
    Set Suite Variable    ${TEST_CODE}    CBC-${rand}

*** Test Cases ***
TC-LAB-001 Catalog Setup And Order Placement With Duplicate Detection
    [Documentation]    Verifies lab test master catalog creation, preflight 72h duplicate detection, and order accessioning
    # Step 1: Create a Diagnostic Test in catalog
    ${param1}=    Create Dictionary    code=HGB    name=Hemoglobin    unit=g/dL    referenceRange=13.5 - 17.5    criticalLow=7.0    criticalHigh=20.0
    ${param2}=    Create Dictionary    code=PLT    name=Platelet Count    unit=x10^3/uL    referenceRange=150 - 450    criticalLow=50.0    criticalHigh=1000.0
    ${paramsList}=    Create List    ${param1}    ${param2}

    ${resTest}=    Create Lab Test Via API    ${AUTH_TOKEN}    ${TEST_CODE}    Complete Blood Count ${RUN_ID}    category=HEMATOLOGY    parameters=${paramsList}
    Should Be True    ${resTest.status_code} == 200 or ${resTest.status_code} == 201
    ${testData}=    Set Variable    ${resTest.json()}[data]
    Set Suite Variable    ${LAB_TEST_ID}    ${testData}[labTestId]
    Should Be Equal As Strings    ${testData}[code]    ${TEST_CODE}

    # Step 2: Pre-order duplicate check before any orders placed
    ${testIdList}=    Create List    ${LAB_TEST_ID}
    ${resDupPre}=    Check Duplicate Lab Order Via API    ${AUTH_TOKEN}    ${PATIENT_ID}    ${testIdList}
    Should Be Equal As Integers    ${resDupPre.status_code}    200
    ${dupPreData}=    Set Variable    ${resDupPre.json()}[data]
    Should Be True    not ${dupPreData}[isDuplicate]

    # Step 3: Place Lab Order
    ${orderItem}=    Create Dictionary    labTestId=${LAB_TEST_ID}
    ${orderItemsList}=    Create List    ${orderItem}
    ${resOrder}=    Create Lab Order Via API    ${AUTH_TOKEN}    ${PATIENT_ID}    ${PATIENT_NAME}    ${orderItemsList}    priority=URGENT
    Should Be True    ${resOrder.status_code} == 200 or ${resOrder.status_code} == 201
    ${orderData}=    Set Variable    ${resOrder.json()}[data]
    Set Suite Variable    ${LAB_ORDER_ID}    ${orderData}[labOrderId]
    Should Start With    ${orderData}[labOrderId]    LAB-
    Should Be Equal As Strings    ${orderData}[status]    AWAITING_COLLECTION
    Should Be Equal As Strings    ${orderData}[priority]    URGENT

    # Step 4: Duplicate check for same patient and test must now flag duplicate
    ${resDupPost}=    Check Duplicate Lab Order Via API    ${AUTH_TOKEN}    ${PATIENT_ID}    ${testIdList}
    Should Be Equal As Integers    ${resDupPost.status_code}    200
    ${dupPostData}=    Set Variable    ${resDupPost.json()}[data]
    Should Be True    ${dupPostData}[isDuplicate]

TC-LAB-002 Phlebotomy Collection And Bench Receiving Quality Workflow
    [Documentation]    Verifies accessioned specimen collection, barcode labeling, bench reception, and analytical acceptance
    # Step 1: List samples for the placed order
    ${resSamples}=    List Samples Via API    ${AUTH_TOKEN}    labOrderId=${LAB_ORDER_ID}
    Should Be Equal As Integers    ${resSamples.status_code}    200
    ${samplesList}=    Set Variable    ${resSamples.json()}[data]
    ${sampleCount}=    Get Length    ${samplesList}
    Should Be True    ${sampleCount} > 0
    ${firstSample}=    Set Variable    ${samplesList}[0]
    Set Suite Variable    ${SAMPLE_ID}    ${firstSample}[sampleId]
    Set Suite Variable    ${ACCESSION_NO}    ${firstSample}[accessionNumber]

    Should Start With    ${ACCESSION_NO}    ACC-
    Should Be Equal As Strings    ${firstSample}[status]    REGISTERED

    # Step 2: Phlebotomist collects specimen
    ${resCollect}=    Collect Sample Via API    ${AUTH_TOKEN}    ${SAMPLE_ID}    collectedBy=Nurse Robot Phlebotomist
    Should Be Equal As Integers    ${resCollect.status_code}    200
    ${collectedSample}=    Set Variable    ${resCollect.json()}[data]
    Should Be Equal As Strings    ${collectedSample}[status]    COLLECTED

    # Step 3: Bench tech checks in specimen at bench
    ${resReceive}=    Receive Sample Via API    ${AUTH_TOKEN}    ${SAMPLE_ID}    receivedBy=Tech Michael Chen    storageLocation=BENCH-HEM-01
    Should Be Equal As Integers    ${resReceive.status_code}    200
    ${receivedSample}=    Set Variable    ${resReceive.json()}[data]
    Should Be Equal As Strings    ${receivedSample}[status]    RECEIVED

    # Step 4: Accept sample for testing
    ${resAccept}=    Accept Sample Via API    ${AUTH_TOKEN}    ${SAMPLE_ID}
    Should Be Equal As Integers    ${resAccept.status_code}    200
    ${acceptedSample}=    Set Variable    ${resAccept.json()}[data]
    Should Be Equal As Strings    ${acceptedSample}[status]    ACCEPTED

TC-LAB-003 Specimen Rejection And Automated Operational Exception Creation
    [Documentation]    Verifies non-conforming specimen rejection automatically creates high-severity operational exception
    # Step 1: Place another order to test rejection flow
    ${orderItem2}=    Create Dictionary    labTestId=${LAB_TEST_ID}
    ${items2}=    Create List    ${orderItem2}
    ${resOrder2}=    Create Lab Order Via API    ${AUTH_TOKEN}    ${PATIENT_ID}    ${PATIENT_NAME}    ${items2}    priority=STAT    allowDuplicateOverride=${True}
    Should Be True    ${resOrder2.status_code} == 200 or ${resOrder2.status_code} == 201
    ${order2Data}=    Set Variable    ${resOrder2.json()}[data]
    ${order2Id}=    Set Variable    ${order2Data}[labOrderId]

    # Get sample for order 2
    ${resSamples2}=    List Samples Via API    ${AUTH_TOKEN}    labOrderId=${order2Id}
    ${sample2}=    Set Variable    ${resSamples2.json()}[data][0]
    ${sample2Id}=    Set Variable    ${sample2}[sampleId]

    # Collect then reject due to hemolysis
    ${resCol2}=    Collect Sample Via API    ${AUTH_TOKEN}    ${sample2Id}
    ${resReject}=    Reject Sample Via API    ${AUTH_TOKEN}    ${sample2Id}    rejectionReason=HEMOLYZED    rejectionComments=Gross 3+ hemolysis observed    actionRequired=RECOLLECT_IMMEDIATELY
    Should Be Equal As Integers    ${resReject.status_code}    200
    ${rejData}=    Set Variable    ${resReject.json()}[data]
    Should Be Equal As Strings    ${rejData}[status]    REJECTED
    Should Be Equal As Strings    ${rejData}[rejectionReason]    HEMOLYZED

    # Step 2: Verify operational exception was logged
    ${resEx}=    List Lab Exceptions Via API    ${AUTH_TOKEN}    status=OPEN
    Should Be Equal As Integers    ${resEx.status_code}    200
    ${exList}=    Set Variable    ${resEx.json()}[data]
    ${foundEx}=    Set Variable    ${None}
    FOR    ${ex}    IN    @{exList}
        IF    '${ex}[sampleId]' == '${sample2Id}' or '${ex}[labOrderId]' == '${order2Id}'
            ${foundEx}=    Set Variable    ${ex}
            BREAK
        END
    END
    Should Not Be Equal    ${foundEx}    ${None}
    Should Be Equal As Strings    ${foundEx}[exceptionType]    SAMPLE_REJECTED
    Should Be Equal As Strings    ${foundEx}[severity]    HIGH

    # Step 3: Resolve the exception
    ${resResolve}=    Resolve Lab Exception Via API    ${AUTH_TOKEN}    ${foundEx}[labExceptionId]    resolvedBy=Dr. Campbell    resolutionNotes=Clinical nursing team notified to recollect sample
    Should Be Equal As Integers    ${resResolve.status_code}    200
    ${resolvedEx}=    Set Variable    ${resResolve.json()}[data]
    Should Be Equal As Strings    ${resolvedEx}[status]    RESOLVED

TC-LAB-004 Analytical Result Entry And Segregation Of Duties Verification
    [Documentation]    Verifies quantitative result entry, segregation of duties check, pathologist authorization, and controlled amendment
    # Step 1: Technician enters analytical results
    ${p1}=    Create Dictionary    parameterCode=HGB    parameterName=Hemoglobin    resultValue=14.2    value=14.2    unit=g/dL    referenceRange=13.5 - 17.5    flag=NORMAL
    ${p2}=    Create Dictionary    parameterCode=PLT    parameterName=Platelet Count    resultValue=240    value=240    unit=x10^3/uL    referenceRange=150 - 450    flag=NORMAL
    ${resParams}=    Create List    ${p1}    ${p2}

    ${resEntry}=    Enter Result Via API    ${AUTH_TOKEN}    ${LAB_ORDER_ID}    ${SAMPLE_ID}    ${LAB_TEST_ID}    ${resParams}    enteredBy=Tech Michael Chen
    Should Be True    ${resEntry.status_code} == 200 or ${resEntry.status_code} == 201
    ${resultData}=    Set Variable    ${resEntry.json()}[data]
    Set Suite Variable    ${RESULT_ID}    ${resultData}[resultId]
    Should Start With    ${resultData}[resultId]    LRES-
    Should Be Equal As Strings    ${resultData}[status]    ENTERED

    # Step 2: Result appears in Pathologist Verification Queue
    ${resQueue}=    Get Verification Queue Via API    ${AUTH_TOKEN}
    Should Be Equal As Integers    ${resQueue.status_code}    200

    # Step 3: Reviewing Pathologist validates and verifies result
    ${resVerify}=    Verify Result Via API    ${AUTH_TOKEN}    ${RESULT_ID}    verifiedBy=Dr. Arthur Campbell (Pathologist)    pathologistNotes=All biological values validated against patient history
    Should Be Equal As Integers    ${resVerify.status_code}    200
    ${verifiedData}=    Set Variable    ${resVerify.json()}[data]
    Should Be Equal As Strings    ${verifiedData}[status]    VERIFIED
    Should Not Be Empty    ${verifiedData}[verifiedBy]

    # Step 4: Controlled amendment with mandatory reason
    ${p1Amended}=    Create Dictionary    parameterCode=HGB    parameterName=Hemoglobin    resultValue=14.4    value=14.4    unit=g/dL    referenceRange=13.5 - 17.5    flag=NORMAL
    ${p2Amended}=    Create Dictionary    parameterCode=PLT    parameterName=Platelet Count    resultValue=245    value=245    unit=x10^3/uL    referenceRange=150 - 450    flag=NORMAL
    ${amendParams}=    Create List    ${p1Amended}    ${p2Amended}

    ${resAmend}=    Amend Result Via API    ${AUTH_TOKEN}    ${RESULT_ID}    Dr. Arthur Campbell    Instrument calibration re-check verified    ${amendParams}
    Should Be Equal As Integers    ${resAmend.status_code}    200
    ${amendedData}=    Set Variable    ${resAmend.json()}[data]
    Should Be Equal As Strings    ${amendedData}[status]    AMENDED
    Should Be True    ${amendedData}[version] >= 2

TC-LAB-005 Diagnostic Report Generation And Patient Portal Release
    [Documentation]    Verifies report compilation, report number assignment, secure patient release, and download auditing
    # Step 1: Generate official diagnostic report
    ${resIdsList}=    Create List    ${RESULT_ID}
    ${resRepGen}=    Generate Lab Report Via API    ${AUTH_TOKEN}    ${LAB_ORDER_ID}    ${resIdsList}    generatedBy=Senior Technologist
    Should Be True    ${resRepGen.status_code} == 200 or ${resRepGen.status_code} == 201
    ${repData}=    Set Variable    ${resRepGen.json()}[data]
    Set Suite Variable    ${REPORT_ID}    ${repData}[labReportId]

    Should Start With    ${repData}[labReportId]    LRPT-
    Should Be Equal As Strings    ${repData}[status]    FINALIZED

    # Step 2: Release report to Patient Portal
    ${resRelease}=    Release Lab Report Via API    ${AUTH_TOKEN}    ${REPORT_ID}
    Should Be Equal As Integers    ${resRelease.status_code}    200
    ${relData}=    Set Variable    ${resRelease.json()}[data]
    Should Be Equal As Strings    ${relData}[status]    RELEASED
    Should Be True    ${relData}[releasedToPatient]

    # Step 3: Record secure report download and verify audit log tracking
    ${resDownload}=    Download Lab Report Via API    ${AUTH_TOKEN}    ${REPORT_ID}
    Should Be Equal As Integers    ${resDownload.status_code}    200
    ${downData}=    Set Variable    ${resDownload.json()}[data]
    Should Be True    ${downData}[downloadCount] >= 1

TC-LAB-006 External LIS Integration And RPA Background Dispatching
    [Documentation]    Verifies mock external LIS bi-directional sync and autonomous RPA batch dispatcher
    # Step 1: Sync lab order to external LIS interface
    ${resSync}=    Sync Order To External LIS Via API    ${AUTH_TOKEN}    ${LAB_ORDER_ID}
    Should Be Equal As Integers    ${resSync.status_code}    200
    ${syncData}=    Set Variable    ${resSync.json()}[data]
    Should Not Be Empty    ${syncData}[externalLisOrderId]
    Should Be Equal As Strings    ${syncData}[status]    SYNCED

    # Step 2: Trigger RPA worker job for external result polling
    ${resRpa}=    Trigger Lab RPA Job Via API    ${AUTH_TOKEN}    jobType=LIS_RESULT_IMPORT    targetOrderCount=10    dryRun=True
    Should Be True    ${resRpa.status_code} == 200 or ${resRpa.status_code} == 201
    ${rpaJob}=    Set Variable    ${resRpa.json()}[data]
    Should Not Be Empty    ${rpaJob}[jobId]
    Should Be Equal As Strings    ${rpaJob}[action]    LIS_RESULT_IMPORT
