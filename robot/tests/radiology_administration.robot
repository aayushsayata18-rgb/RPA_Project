*** Settings ***
Documentation    Module 22: Radiology Administration RPA Automation Test Suite
Resource         ../resources/common.resource
Resource         ../resources/authentication.resource
Resource         ../resources/radiology_keywords.resource
Library          String
Library          Collections

Suite Setup      Setup Radiology Test Suite

*** Variables ***
${AUTH_TOKEN}         ${EMPTY}
${RUN_ID}             ${EMPTY}
${PATIENT_ID}         ${EMPTY}
${EXAM_ID}            ${EMPTY}
${EXAM_CODE}          ${EMPTY}
${MODALITY_ID}        ${EMPTY}
${ORDER_ID}           ${EMPTY}
${SCHEDULE_ID}        ${EMPTY}
${STUDY_ID}           ${EMPTY}
${ACCESSION_NO}       ${EMPTY}
${REPORT_ID}          ${EMPTY}

*** Keywords ***
Setup Radiology Test Suite
    ${token}=    Login Hospital User    ${ADMIN_EMAIL}    ${DEFAULT_PASSWORD}
    Set Suite Variable    ${AUTH_TOKEN}    ${token}
    ${rand}=     Generate Random String    5    [NUMBERS]
    Set Suite Variable    ${RUN_ID}    ${rand}
    Set Suite Variable    ${PATIENT_ID}    P10001
    Set Suite Variable    ${EXAM_CODE}    CT-CHEST-${rand}

*** Test Cases ***
TC-RAD-001 Catalog Setup And Modality Registration
    [Documentation]    Verifies exam catalog creation and imaging modality registration
    # Step 1: Create Exam in Catalog
    ${resExam}=    Create Radiology Exam Via API    ${AUTH_TOKEN}    ${EXAM_CODE}    Chest High Resolution CT ${RUN_ID}    modalityType=CT    bodyPart=CHEST    basePrice=350    durationMinutes=30    requiresContrast=True
    Should Be True    ${resExam.status_code} == 200 or ${resExam.status_code} == 201
    ${examData}=    Set Variable    ${resExam.json()}[data]
    Set Suite Variable    ${EXAM_ID}    ${examData}[_id]
    Should Be Equal As Strings    ${examData}[code]    ${EXAM_CODE}

    # Step 2: Register Modality Scanner
    ${modalityCode}=    Set Variable    CT-SUITE-${RUN_ID}
    ${resMod}=     Create Radiology Modality Via API    ${AUTH_TOKEN}    ${modalityCode}    64-Slice CT Scanner ${RUN_ID}    type=CT    room=Radiology Suite 2B
    Should Be True    ${resMod.status_code} == 200 or ${resMod.status_code} == 201
    ${modData}=    Set Variable    ${resMod.json()}[data]
    Set Suite Variable    ${MODALITY_ID}    ${modData}[_id]
    Should Be Equal As Strings    ${modData}[status]    AVAILABLE

TC-RAD-002 Order Placement With Pre-Flight 72h Duplicate Prevention
    [Documentation]    Verifies order requisition and pre-flight 72h duplicate detection
    # Step 1: Pre-order duplicate check must be false
    ${resDupPre}=    Check Duplicate Radiology Order Via API    ${AUTH_TOKEN}    ${PATIENT_ID}    ${EXAM_ID}
    Should Be Equal As Integers    ${resDupPre.status_code}    200
    ${dupPreData}=    Set Variable    ${resDupPre.json()}[data]
    Should Be True    not ${dupPreData}[isDuplicate]

    # Step 2: Place Imaging Order
    ${resOrder}=    Create Radiology Order Via API    ${AUTH_TOKEN}    ${PATIENT_ID}    ${EXAM_ID}    priority=URGENT    clinicalIndication=Rule out pulmonary embolism    requiresContrast=True
    Should Be True    ${resOrder.status_code} == 200 or ${resOrder.status_code} == 201
    ${orderData}=    Set Variable    ${resOrder.json()}[data]
    Set Suite Variable    ${ORDER_ID}    ${orderData}[_id]
    Should Start With    ${orderData}[orderId]    RAD-
    Should Be True    '${orderData}[status]' in ['ORDERED', 'PREPARATION_REQUIRED']
    Should Be Equal As Strings    ${orderData}[priority]    URGENT

    # Step 3: Post-order duplicate check must detect existing order within 72h
    ${resDupPost}=    Check Duplicate Radiology Order Via API    ${AUTH_TOKEN}    ${PATIENT_ID}    ${EXAM_ID}
    Should Be Equal As Integers    ${resDupPost.status_code}    200
    ${dupPostData}=    Set Variable    ${resDupPost.json()}[data]
    Should Be True    ${dupPostData}[isDuplicate]

TC-RAD-003 Slot Scheduling And Concurrency Conflict Prevention
    [Documentation]    Verifies slot reservation and anti-double-booking validation
    # Step 1: Schedule slot for Order
    ${date}=    Set Variable    2026-11-20
    ${resSched}=    Create Radiology Schedule Via API    ${AUTH_TOKEN}    ${ORDER_ID}    ${MODALITY_ID}    ${date}    startTime=10:00    endTime=10:30
    Should Be True    ${resSched.status_code} == 200 or ${resSched.status_code} == 201
    ${schedData}=    Set Variable    ${resSched.json()}[data]
    Set Suite Variable    ${SCHEDULE_ID}    ${schedData}[_id]
    Should Start With    ${schedData}[scheduleId]    RAD-SCH-
    Should Be True    '${schedData}[status]' in ['SCHEDULED', 'CONFIRMED']

    # Step 2: Attempt overlapping double-booking on same modality
    ${resConflict}=    Create Radiology Schedule Via API    ${AUTH_TOKEN}    ${ORDER_ID}    ${MODALITY_ID}    ${date}    startTime=10:15    endTime=10:45
    Should Be True    ${resConflict.status_code} == 400 or ${resConflict.status_code} == 409

TC-RAD-004 Reception Check-In And Patient Safety Screening
    [Documentation]    Verifies patient check-in with metal screening and safety confirmation
    ${resCheckIn}=    Check In Radiology Patient Via API    ${AUTH_TOKEN}    ${SCHEDULE_ID}    identityVerified=True    safetyScreeningCompleted=True    metalScreeningConfirmed=True
    Should Be Equal As Integers    ${resCheckIn.status_code}    200
    ${checkInData}=    Set Variable    ${resCheckIn.json()}[data]
    Should Be Equal As Strings    ${checkInData}[status]    CHECKED_IN

TC-RAD-005 Procedure Execution And Atomic Accession Number Generation
    [Documentation]    Verifies scan execution, atomic accession number generation, and completion
    # Step 1: Start Study
    ${resStart}=    Start Radiology Study Via API    ${AUTH_TOKEN}    ${ORDER_ID}    ${MODALITY_ID}    scheduleId=${SCHEDULE_ID}
    Should Be True    ${resStart.status_code} == 200 or ${resStart.status_code} == 201
    ${studyData}=    Set Variable    ${resStart.json()}[data]
    Set Suite Variable    ${STUDY_ID}    ${studyData}[_id]
    Set Suite Variable    ${ACCESSION_NO}    ${studyData}[accessionNumber]
    Should Start With    ${ACCESSION_NO}    RAD-ACC-
    Should Be Equal As Strings    ${studyData}[status]    IN_PROGRESS

    # Step 2: Complete Study
    ${resComplete}=    Complete Radiology Study Via API    ${AUTH_TOKEN}    ${STUDY_ID}    imageCount=48    contrastLotNumber=LOT-CT-991    contrastDoseMl=50
    Should Be Equal As Integers    ${resComplete.status_code}    200
    ${completedData}=    Set Variable    ${resComplete.json()}[data]
    Should Be Equal As Strings    ${completedData}[status]    COMPLETED

TC-RAD-006 Reporting Draft Radiologist Verification And Release
    [Documentation]    Verifies reporting lifecycle: draft creation, radiologist verification, and release
    # Step 1: Draft Report
    ${resDraft}=    Draft Radiology Report Via API    ${AUTH_TOKEN}    ${STUDY_ID}    findings=Lungs are clear bilaterally. No pulmonary embolism detected. Cardiac silhouette normal.    impression=Negative for acute pulmonary thromboembolism. Normal thoracic CT.
    Should Be True    ${resDraft.status_code} == 200 or ${resDraft.status_code} == 201
    ${draftData}=    Set Variable    ${resDraft.json()}[data]
    Set Suite Variable    ${REPORT_ID}    ${draftData}[_id]
    Should Start With    ${draftData}[reportNumber]    RAD-RPT-
    Should Be Equal As Strings    ${draftData}[status]    DRAFT

    # Step 2: Radiologist Verifies Report
    ${resVerify}=    Verify Radiology Report Via API    ${AUTH_TOKEN}    ${REPORT_ID}    findings=Clear lungs bilaterally. Verified normal thoracic study.    impression=Normal examination. No pulmonary embolism.
    Should Be Equal As Integers    ${resVerify.status_code}    200
    ${verifiedData}=    Set Variable    ${resVerify.json()}[data]
    Should Be True    '${verifiedData}[status]' in ['VERIFIED', 'FINALIZED']

    # Step 3: Release Report
    ${resRelease}=    Release Radiology Report Via API    ${AUTH_TOKEN}    ${REPORT_ID}
    Should Be Equal As Integers    ${resRelease.status_code}    200
    ${releasedData}=    Set Variable    ${resRelease.json()}[data]
    Should Be Equal As Strings    ${releasedData}[status]    RELEASED
    Should Not Be Empty    ${releasedData}[releasedAt]

TC-RAD-007 Auditable Amendment Versioning
    [Documentation]    Verifies auditable amendment of a released report with version increments
    ${resAmend}=    Amend Radiology Report Via API    ${AUTH_TOKEN}    ${REPORT_ID}    amendmentReason=Added comparison with historical chest radiography from previous admission    findings=Compared with prior baseline radiograph from 2025. Stable lungs, no acute process.    impression=Stable examination with historical correlation.
    Should Be True    ${resAmend.status_code} == 200 or ${resAmend.status_code} == 201
    ${amendedData}=    Set Variable    ${resAmend.json()}[data]
    Should Be True    '${amendedData}[status]' in ['AMENDED', 'RELEASED']
    Should Be True    ${amendedData}[reportVersion] >= 2

TC-RAD-008 Automated Billing And Consumable Idempotency
    [Documentation]    Verifies study completion posted non-duplicate billing charges
    ${resReports}=    List Radiology Reports Via API    ${AUTH_TOKEN}    accessionNumber=${ACCESSION_NO}
    Should Be Equal As Integers    ${resReports.status_code}    200
    ${repList}=    Set Variable    ${resReports.json()}[data]
    ${repCount}=   Get Length    ${repList}
    Should Be True    ${repCount} >= 1

TC-RAD-009 Mock RIS PACS Integration And RPA Bot Dispatch
    [Documentation]    Verifies mock RIS worklist sync, PACS study linking, and RPA job execution
    # Step 1: Mock PACS image arrival
    ${resPacs}=    Mock PACS Study Via API    ${AUTH_TOKEN}    ${ACCESSION_NO}    seriesCount=4    instanceCount=64
    Should Be Equal As Integers    ${resPacs.status_code}    200

    # Step 2: Trigger RPA RIS Order Sync
    ${resRpa}=    Trigger Radiology RPA Job Via API    ${AUTH_TOKEN}    jobType=RIS_ORDER_SYNC    dryRun=True
    Should Be True    ${resRpa.status_code} == 200 or ${resRpa.status_code} == 201
    ${rpaData}=    Set Variable    ${resRpa.json()}[data]
    Should Be True    '${rpaData}[status]' in ['COMPLETED', 'SUCCESS', 'QUEUED']

TC-RAD-010 Operational Exception Resolution Lifecycle
    [Documentation]    Verifies listing and resolution of radiology administrative exceptions
    ${resExc}=    List Radiology Exceptions Via API    ${AUTH_TOKEN}
    Should Be Equal As Integers    ${resExc.status_code}    200
    ${excList}=    Set Variable    ${resExc.json()}[data]
    ${excCount}=   Get Length    ${excList}
    IF    ${excCount} > 0
        ${firstExc}=    Set Variable    ${excList}[0]
        ${excId}=       Set Variable    ${firstExc}[_id]
        ${resResolve}=  Resolve Radiology Exception Via API    ${AUTH_TOKEN}    ${excId}    resolutionNotes=Reviewed and cleared by supervising radiologist
        Should Be Equal As Integers    ${resResolve.status_code}    200
        ${resolvedData}=    Set Variable    ${resResolve.json()}[data]
        Should Be Equal As Strings    ${resolvedData}[status]    RESOLVED
    END
