*** Settings ***
Documentation    Module 21: Laboratory Administration RPA Automation Keywords
Resource         common.resource
Library          RequestsLibrary
Library          Collections

*** Keywords ***
# --- TEST CATALOG KEYWORDS ---

Create Lab Test Via API
    [Arguments]    ${token}    ${code}    ${name}    ${category}=HEMATOLOGY    ${specimenType}=WHOLE_BLOOD    ${containerType}=EDTA_TUBE_LAVENDER    ${priceReference}=45    ${turnaroundTimeMinutes}=60    ${parameters}=${None}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    code=${code}
    ...    name=${name}
    ...    category=${category}
    ...    specimenType=${specimenType}
    ...    containerType=${containerType}
    ...    priceReference=${priceReference}
    ...    turnaroundTimeMinutes=${turnaroundTimeMinutes}
    IF    ${parameters} != ${None}
        Set To Dictionary    ${payload}    parameters=${parameters}
    END
    ${response}=   POST    ${BASE_URL}/laboratory/tests    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

List Lab Tests Via API
    [Arguments]    ${token}    ${category}=${EMPTY}    ${status}=${EMPTY}    ${query}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${params}=     Create Dictionary
    IF    '${category}' != '${EMPTY}'    Set To Dictionary    ${params}    category=${category}
    IF    '${status}' != '${EMPTY}'      Set To Dictionary    ${params}    status=${status}
    IF    '${query}' != '${EMPTY}'       Set To Dictionary    ${params}    query=${query}
    ${response}=   GET    ${BASE_URL}/laboratory/tests    params=${params}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Lab Test By Id Via API
    [Arguments]    ${token}    ${testId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   GET    ${BASE_URL}/laboratory/tests/${testId}    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- LAB ORDER KEYWORDS ---

Create Lab Order Via API
    [Arguments]    ${token}    ${patientId}    ${patientName}    ${items}    ${doctorId}=DOC-01    ${doctorName}=Dr. Sarah Jenkins    ${priority}=ROUTINE    ${orderType}=OUTPATIENT    ${clinicalNotes}=Diagnostic test requisition    ${allowDuplicateOverride}=False
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    patientId=${patientId}
    ...    patientName=${patientName}
    ...    doctorId=${doctorId}
    ...    doctorName=${doctorName}
    ...    priority=${priority}
    ...    orderType=${orderType}
    ...    clinicalNotes=${clinicalNotes}
    ...    items=${items}
    ...    allowDuplicateOverride=${allowDuplicateOverride}
    ${response}=   POST    ${BASE_URL}/laboratory/orders    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Check Duplicate Lab Order Via API
    [Arguments]    ${token}    ${patientId}    ${testIds}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    patientId=${patientId}
    ...    testIds=${testIds}
    ${response}=   POST    ${BASE_URL}/laboratory/orders/check-duplicate    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Lab Order By Id Via API
    [Arguments]    ${token}    ${orderId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   GET    ${BASE_URL}/laboratory/orders/${orderId}    headers=${headers}    expected_status=any
    RETURN         ${response}

List Lab Orders Via API
    [Arguments]    ${token}    ${status}=${EMPTY}    ${priority}=${EMPTY}    ${patientId}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${params}=     Create Dictionary
    IF    '${status}' != '${EMPTY}'       Set To Dictionary    ${params}    status=${status}
    IF    '${priority}' != '${EMPTY}'     Set To Dictionary    ${params}    priority=${priority}
    IF    '${patientId}' != '${EMPTY}'    Set To Dictionary    ${params}    patientId=${patientId}
    ${response}=   GET    ${BASE_URL}/laboratory/orders    params=${params}    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- SAMPLE COLLECTION & BENCH RECEPTION ---

List Samples Via API
    [Arguments]    ${token}    ${labOrderId}=${EMPTY}    ${status}=${EMPTY}    ${search}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${params}=     Create Dictionary
    IF    '${labOrderId}' != '${EMPTY}'    Set To Dictionary    ${params}    labOrderId=${labOrderId}
    IF    '${status}' != '${EMPTY}'        Set To Dictionary    ${params}    status=${status}
    IF    '${search}' != '${EMPTY}'        Set To Dictionary    ${params}    search=${search}
    ${response}=   GET    ${BASE_URL}/laboratory/samples    params=${params}    headers=${headers}    expected_status=any
    RETURN         ${response}

Collect Sample Via API
    [Arguments]    ${token}    ${sampleId}    ${collectedBy}=Nurse Clara Vance    ${collectionSite}=Left Antecubital Fossa    ${notes}=Routine phlebotomy
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    collectedBy=${collectedBy}
    ...    collectionSite=${collectionSite}
    ...    notes=${notes}
    ${response}=   POST    ${BASE_URL}/laboratory/collections/${sampleId}/collect    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Receive Sample Via API
    [Arguments]    ${token}    ${sampleId}    ${receivedBy}=Tech Michael Chen    ${storageLocation}=RACK-A-01    ${temperatureCondition}=REFRIGERATED_4C
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    receivedBy=${receivedBy}
    ...    storageLocation=${storageLocation}
    ...    temperatureCondition=${temperatureCondition}
    ${response}=   POST    ${BASE_URL}/laboratory/samples/${sampleId}/receive    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Accept Sample Via API
    [Arguments]    ${token}    ${sampleId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   POST    ${BASE_URL}/laboratory/samples/${sampleId}/accept    headers=${headers}    expected_status=any
    RETURN         ${response}

Reject Sample Via API
    [Arguments]    ${token}    ${sampleId}    ${rejectionReason}=HEMOLYZED    ${rejectionComments}=3+ gross hemolysis    ${actionRequired}=RECOLLECT_IMMEDIATELY    ${rejectedBy}=Tech Michael Chen
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    rejectionReason=${rejectionReason}
    ...    rejectionComments=${rejectionComments}
    ...    actionRequired=${actionRequired}
    ...    rejectedBy=${rejectedBy}
    ${response}=   POST    ${BASE_URL}/laboratory/samples/${sampleId}/reject    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- RESULT ENTRY & VERIFICATION ---

Enter Result Via API
    [Arguments]    ${token}    ${labOrderId}    ${sampleId}    ${labTestId}    ${parameters}    ${enteredBy}=Tech Michael Chen    ${technicianId}=STF-TECH-01    ${status}=ENTERED    ${methodology}=Automated Photometric Analysis
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    labOrderId=${labOrderId}
    ...    sampleId=${sampleId}
    ...    labTestId=${labTestId}
    ...    parameters=${parameters}
    ...    enteredBy=${enteredBy}
    ...    technicianId=${technicianId}
    ...    status=${status}
    ...    methodology=${methodology}
    ${response}=   POST    ${BASE_URL}/laboratory/results    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Verification Queue Via API
    [Arguments]    ${token}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   GET    ${BASE_URL}/laboratory/results/verification-queue    headers=${headers}    expected_status=any
    RETURN         ${response}

Verify Result Via API
    [Arguments]    ${token}    ${resultId}    ${verifiedBy}=Dr. Arthur Campbell    ${pathologistId}=DOC-PATH-01    ${pathologistNotes}=Clinical findings verified
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    verifiedBy=${verifiedBy}
    ...    pathologistId=${pathologistId}
    ...    pathologistNotes=${pathologistNotes}
    ${response}=   POST    ${BASE_URL}/laboratory/results/${resultId}/verify    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Amend Result Via API
    [Arguments]    ${token}    ${resultId}    ${amendedBy}    ${amendmentReason}    ${parameters}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    amendedBy=${amendedBy}
    ...    amendmentReason=${amendmentReason}
    ...    parameters=${parameters}
    ${response}=   POST    ${BASE_URL}/laboratory/results/${resultId}/amend    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- REPORTING & DOWNLOAD AUDIT ---

Generate Lab Report Via API
    [Arguments]    ${token}    ${labOrderId}    ${resultIds}    ${generatedBy}=Lab Technician
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    orderId=${labOrderId}
    ...    labOrderId=${labOrderId}
    ...    resultIds=${resultIds}
    ...    generatedBy=${generatedBy}
    ${response}=   POST    ${BASE_URL}/laboratory/reports/generate    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Release Lab Report Via API
    [Arguments]    ${token}    ${reportId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   POST    ${BASE_URL}/laboratory/reports/${reportId}/release    headers=${headers}    expected_status=any
    RETURN         ${response}

Download Lab Report Via API
    [Arguments]    ${token}    ${reportId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   POST    ${BASE_URL}/laboratory/reports/${reportId}/download    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- EXCEPTIONS & INTEGRATIONS ---

List Lab Exceptions Via API
    [Arguments]    ${token}    ${status}=${EMPTY}    ${severity}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${params}=     Create Dictionary
    IF    '${status}' != '${EMPTY}'      Set To Dictionary    ${params}    status=${status}
    IF    '${severity}' != '${EMPTY}'    Set To Dictionary    ${params}    severity=${severity}
    ${response}=   GET    ${BASE_URL}/laboratory/exceptions    params=${params}    headers=${headers}    expected_status=any
    RETURN         ${response}

Resolve Lab Exception Via API
    [Arguments]    ${token}    ${exceptionId}    ${resolvedBy}=Dr. Arthur Campbell    ${resolutionNotes}=Recollected and verified    ${correctiveActionTaken}=PATIENT_RECOLLECTED
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    resolvedBy=${resolvedBy}
    ...    resolutionNotes=${resolutionNotes}
    ...    correctiveActionTaken=${correctiveActionTaken}
    ${response}=   POST    ${BASE_URL}/laboratory/exceptions/${exceptionId}/resolve    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Sync Order To External LIS Via API
    [Arguments]    ${token}    ${labOrderId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    orderId=${labOrderId}
    ...    labOrderId=${labOrderId}
    ...    orderIdentifier=${labOrderId}
    ${response}=   POST    ${BASE_URL}/laboratory/integrations/sync-order    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Fetch Results From External LIS Via API
    [Arguments]    ${token}    ${externalOrderId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    externalOrderId=${externalOrderId}
    ${response}=   POST    ${BASE_URL}/laboratory/integrations/fetch-results    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Trigger Lab RPA Job Via API
    [Arguments]    ${token}    ${jobType}=LIS_RESULT_IMPORT    ${targetOrderCount}=5    ${dryRun}=False
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    jobType=${jobType}
    ...    targetOrderCount=${targetOrderCount}
    ...    dryRun=${dryRun}
    ${response}=   POST    ${BASE_URL}/laboratory/rpa/trigger    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}
