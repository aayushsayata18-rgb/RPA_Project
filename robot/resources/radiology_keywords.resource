*** Settings ***
Documentation    Module 22: Radiology Administration RPA Automation Keywords
Resource         common.resource
Library          RequestsLibrary
Library          Collections

*** Keywords ***
# --- EXAM & MODALITY CATALOG KEYWORDS ---

Create Radiology Exam Via API
    [Arguments]    ${token}    ${code}    ${name}    ${modalityType}=XRAY    ${bodyPart}=CHEST    ${basePrice}=150    ${durationMinutes}=15    ${requiresContrast}=False    ${preparationInstructions}=Remove metal objects
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    code=${code}
    ...    name=${name}
    ...    modalityType=${modalityType}
    ...    bodyPart=${bodyPart}
    ...    basePrice=${basePrice}
    ...    durationMinutes=${durationMinutes}
    ...    requiresContrast=${requiresContrast}
    ...    preparationInstructions=${preparationInstructions}
    ${response}=   POST    ${BASE_URL}/radiology/exams    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

List Radiology Exams Via API
    [Arguments]    ${token}    ${modalityType}=${EMPTY}    ${search}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${params}=     Create Dictionary
    IF    '${modalityType}' != '${EMPTY}'    Set To Dictionary    ${params}    modalityType=${modalityType}
    IF    '${search}' != '${EMPTY}'          Set To Dictionary    ${params}    search=${search}
    ${response}=   GET    ${BASE_URL}/radiology/exams    params=${params}    headers=${headers}    expected_status=any
    RETURN         ${response}

Create Radiology Modality Via API
    [Arguments]    ${token}    ${modalityId}    ${name}    ${type}=X_RAY    ${room}=Room 101    ${status}=AVAILABLE
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    modalityId=${modalityId}
    ...    name=${name}
    ...    type=${type}
    ...    room=${room}
    ...    status=${status}
    ${response}=   POST    ${BASE_URL}/radiology/modalities    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

List Radiology Modalities Via API
    [Arguments]    ${token}    ${type}=${EMPTY}    ${status}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${params}=     Create Dictionary
    IF    '${type}' != '${EMPTY}'      Set To Dictionary    ${params}    type=${type}
    IF    '${status}' != '${EMPTY}'    Set To Dictionary    ${params}    status=${status}
    ${response}=   GET    ${BASE_URL}/radiology/modalities    params=${params}    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- RADIOLOGY ORDER KEYWORDS ---

Create Radiology Order Via API
    [Arguments]    ${token}    ${patientId}    ${examId}    ${priority}=ROUTINE    ${clinicalIndication}=Evaluation for diagnostic imaging    ${requiresContrast}=False    ${contraindications}=None    ${allergiesNoted}=None    ${fastingRequired}=False
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    patientId=${patientId}
    ...    examId=${examId}
    ...    priority=${priority}
    ...    clinicalIndication=${clinicalIndication}
    ...    requiresContrast=${requiresContrast}
    ...    contraindications=${contraindications}
    ...    allergiesNoted=${allergiesNoted}
    ...    fastingRequired=${fastingRequired}
    ${response}=   POST    ${BASE_URL}/radiology/orders    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Check Duplicate Radiology Order Via API
    [Arguments]    ${token}    ${patientId}    ${examId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    patientId=${patientId}
    ...    examId=${examId}
    ${response}=   POST    ${BASE_URL}/radiology/orders/check-duplicate    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

List Radiology Orders Via API
    [Arguments]    ${token}    ${status}=${EMPTY}    ${priority}=${EMPTY}    ${patientId}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${params}=     Create Dictionary
    IF    '${status}' != '${EMPTY}'       Set To Dictionary    ${params}    status=${status}
    IF    '${priority}' != '${EMPTY}'     Set To Dictionary    ${params}    priority=${priority}
    IF    '${patientId}' != '${EMPTY}'    Set To Dictionary    ${params}    patientId=${patientId}
    ${response}=   GET    ${BASE_URL}/radiology/orders    params=${params}    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- SCHEDULING & RECEPTION CHECK-IN ---

Create Radiology Schedule Via API
    [Arguments]    ${token}    ${orderId}    ${modalityId}    ${scheduledDate}    ${startTime}=09:00    ${endTime}=09:30    ${prepInstructions}=Standard Prep
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    orderId=${orderId}
    ...    modalityId=${modalityId}
    ...    scheduledDate=${scheduledDate}
    ...    startTime=${startTime}
    ...    endTime=${endTime}
    ...    prepInstructions=${prepInstructions}
    ${response}=   POST    ${BASE_URL}/radiology/schedules    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

List Radiology Schedules Via API
    [Arguments]    ${token}    ${status}=${EMPTY}    ${modalityId}=${EMPTY}    ${scheduledDate}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${params}=     Create Dictionary
    IF    '${status}' != '${EMPTY}'           Set To Dictionary    ${params}    status=${status}
    IF    '${modalityId}' != '${EMPTY}'       Set To Dictionary    ${params}    modalityId=${modalityId}
    IF    '${scheduledDate}' != '${EMPTY}'    Set To Dictionary    ${params}    scheduledDate=${scheduledDate}
    ${response}=   GET    ${BASE_URL}/radiology/schedules    params=${params}    headers=${headers}    expected_status=any
    RETURN         ${response}

Check In Radiology Patient Via API
    [Arguments]    ${token}    ${scheduleId}    ${identityVerified}=True    ${safetyScreeningCompleted}=True    ${pregnancyStatus}=NOT_APPLICABLE    ${renalFunctionNoted}=Normal    ${metalScreeningConfirmed}=True    ${notes}=Arrived on time
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    identityVerified=${identityVerified}
    ...    safetyScreeningCompleted=${safetyScreeningCompleted}
    ...    pregnancyStatus=${pregnancyStatus}
    ...    renalFunctionNoted=${renalFunctionNoted}
    ...    metalScreeningConfirmed=${metalScreeningConfirmed}
    ...    notes=${notes}
    ${response}=   POST    ${BASE_URL}/radiology/schedules/${scheduleId}/check-in    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- STUDY EXECUTION & ATOMIC ACCESSION NUMBER GENERATION ---

Start Radiology Study Via API
    [Arguments]    ${token}    ${orderId}    ${modalityId}    ${scheduleId}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    orderId=${orderId}
    ...    modalityId=${modalityId}
    IF    '${scheduleId}' != '${EMPTY}'    Set To Dictionary    ${payload}    scheduleId=${scheduleId}
    ${response}=   POST    ${BASE_URL}/radiology/studies/start    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Complete Radiology Study Via API
    [Arguments]    ${token}    ${studyId}    ${imageCount}=12    ${contrastLotNumber}=${EMPTY}    ${contrastDoseMl}=0    ${technicianNotes}=Scan completed without adverse reactions
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    imageCount=${imageCount}
    ...    contrastLotNumber=${contrastLotNumber}
    ...    contrastDoseMl=${contrastDoseMl}
    ...    technicianNotes=${technicianNotes}
    ${response}=   POST    ${BASE_URL}/radiology/studies/${studyId}/complete    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

List Radiology Studies Via API
    [Arguments]    ${token}    ${status}=${EMPTY}    ${modalityType}=${EMPTY}    ${accessionNumber}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${params}=     Create Dictionary
    IF    '${status}' != '${EMPTY}'             Set To Dictionary    ${params}    status=${status}
    IF    '${modalityType}' != '${EMPTY}'       Set To Dictionary    ${params}    modalityType=${modalityType}
    IF    '${accessionNumber}' != '${EMPTY}'    Set To Dictionary    ${params}    accessionNumber=${accessionNumber}
    ${response}=   GET    ${BASE_URL}/radiology/studies    params=${params}    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- REPORTING, VERIFICATION & AMENDMENTS ---

Draft Radiology Report Via API
    [Arguments]    ${token}    ${studyId}    ${findings}=No acute abnormalities detected    ${impression}=Normal study
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    studyId=${studyId}
    ...    findings=${findings}
    ...    impression=${impression}
    ${response}=   POST    ${BASE_URL}/radiology/reports/draft    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Verify Radiology Report Via API
    [Arguments]    ${token}    ${reportId}    ${findings}=Verified clear imaging findings    ${impression}=Normal exam confirmed    ${isCritical}=False
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    findings=${findings}
    ...    impression=${impression}
    ...    isCritical=${isCritical}
    ${response}=   POST    ${BASE_URL}/radiology/reports/${reportId}/verify    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Release Radiology Report Via API
    [Arguments]    ${token}    ${reportId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   POST    ${BASE_URL}/radiology/reports/${reportId}/release    headers=${headers}    expected_status=any
    RETURN         ${response}

Amend Radiology Report Via API
    [Arguments]    ${token}    ${reportId}    ${amendmentReason}=Additional comparison with prior study    ${findings}=Updated findings with historical comparison    ${impression}=Stable interval findings
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    amendmentReason=${amendmentReason}
    ...    findings=${findings}
    ...    impression=${impression}
    ${response}=   POST    ${BASE_URL}/radiology/reports/${reportId}/amend    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

List Radiology Reports Via API
    [Arguments]    ${token}    ${status}=${EMPTY}    ${accessionNumber}=${EMPTY}    ${patientId}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${params}=     Create Dictionary
    IF    '${status}' != '${EMPTY}'             Set To Dictionary    ${params}    status=${status}
    IF    '${accessionNumber}' != '${EMPTY}'    Set To Dictionary    ${params}    accessionNumber=${accessionNumber}
    IF    '${patientId}' != '${EMPTY}'          Set To Dictionary    ${params}    patientId=${patientId}
    ${response}=   GET    ${BASE_URL}/radiology/reports    params=${params}    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- INTEGRATIONS, RPA & EXCEPTIONS ---

Sync Worklist With External RIS Via API
    [Arguments]    ${token}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   POST    ${BASE_URL}/radiology/integrations/ris/sync-worklist    json={}    headers=${headers}    expected_status=any
    RETURN         ${response}

Mock PACS Study Via API
    [Arguments]    ${token}    ${accessionNumber}    ${seriesCount}=2    ${instanceCount}=12
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    accessionNumber=${accessionNumber}
    ...    seriesCount=${seriesCount}
    ...    instanceCount=${instanceCount}
    ${response}=   POST    ${BASE_URL}/radiology/integrations/pacs/mock-study    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Trigger Radiology RPA Job Via API
    [Arguments]    ${token}    ${jobType}=RIS_ORDER_SYNC    ${dryRun}=False
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    jobType=${jobType}
    ...    dryRun=${dryRun}
    ${response}=   POST    ${BASE_URL}/radiology/analytics/rpa-jobs/trigger    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

List Radiology Exceptions Via API
    [Arguments]    ${token}    ${status}=${EMPTY}    ${severity}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${params}=     Create Dictionary
    IF    '${status}' != '${EMPTY}'      Set To Dictionary    ${params}    status=${status}
    IF    '${severity}' != '${EMPTY}'    Set To Dictionary    ${params}    severity=${severity}
    ${response}=   GET    ${BASE_URL}/radiology/exceptions    params=${params}    headers=${headers}    expected_status=any
    RETURN         ${response}

Resolve Radiology Exception Via API
    [Arguments]    ${token}    ${exceptionId}    ${resolutionNotes}=Resolved by coordinator review
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    resolutionNotes=${resolutionNotes}
    ${response}=   POST    ${BASE_URL}/radiology/exceptions/${exceptionId}/resolve    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}
