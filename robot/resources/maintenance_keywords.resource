*** Settings ***
Documentation    Module 23: Maintenance Management RPA Automation Keywords
Resource         common.resource
Library          RequestsLibrary
Library          Collections

*** Keywords ***
# --- ASSET MASTER KEYWORDS ---

Create Asset Category Via API
    [Arguments]    ${token}    ${categoryCode}    ${name}    ${riskClassification}=MEDIUM    ${calibrationRequired}=${False}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    categoryCode=${categoryCode}
    ...    name=${name}
    ...    riskClassification=${riskClassification}
    ...    calibrationRequired=${calibrationRequired}
    ${response}=   POST    ${BASE_URL}/maintenance/asset-categories    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

List Asset Categories Via API
    [Arguments]    ${token}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   GET    ${BASE_URL}/maintenance/asset-categories    headers=${headers}    expected_status=any
    RETURN         ${response}

Create Asset Via API
    [Arguments]    ${token}    ${name}    ${serialNumber}    ${model}=Standard Model    ${manufacturer}=BioTech Corp    ${criticality}=HIGH    ${riskClassification}=MEDIUM    ${departmentId}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    name=${name}
    ...    serialNumber=${serialNumber}
    ...    model=${model}
    ...    manufacturer=${manufacturer}
    ...    criticality=${criticality}
    ...    riskClassification=${riskClassification}
    IF    '${departmentId}' != '${EMPTY}'    Set To Dictionary    ${payload}    departmentId=${departmentId}
    ${response}=   POST    ${BASE_URL}/maintenance/assets    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Asset By Id Via API
    [Arguments]    ${token}    ${assetId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   GET    ${BASE_URL}/maintenance/assets/${assetId}    headers=${headers}    expected_status=any
    RETURN         ${response}

List Assets Via API
    [Arguments]    ${token}    ${status}=${EMPTY}    ${criticality}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${params}=     Create Dictionary
    IF    '${status}' != '${EMPTY}'         Set To Dictionary    ${params}    status=${status}
    IF    '${criticality}' != '${EMPTY}'    Set To Dictionary    ${params}    criticality=${criticality}
    ${response}=   GET    ${BASE_URL}/maintenance/assets    params=${params}    headers=${headers}    expected_status=any
    RETURN         ${response}

Update Asset Status Via API
    [Arguments]    ${token}    ${assetId}    ${status}    ${reason}=Routine status update
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    status=${status}    reason=${reason}
    ${response}=   PATCH    ${BASE_URL}/maintenance/assets/${assetId}/status    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- MAINTENANCE REQUEST KEYWORDS ---

Create Maintenance Request Via API
    [Arguments]    ${token}    ${assetId}    ${title}    ${description}    ${priority}=MEDIUM    ${requestType}=BREAKDOWN
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    assetId=${assetId}
    ...    title=${title}
    ...    description=${description}
    ...    priority=${priority}
    ...    requestType=${requestType}
    ${response}=   POST    ${BASE_URL}/maintenance/requests    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Triage Maintenance Request Via API
    [Arguments]    ${token}    ${requestId}    ${status}=APPROVED    ${priority}=HIGH    ${triageNotes}=Triaged by supervisor
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    status=${status}
    ...    priority=${priority}
    ...    triageNotes=${triageNotes}
    ${response}=   POST    ${BASE_URL}/maintenance/requests/${requestId}/triage    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Convert Request To Work Order Via API
    [Arguments]    ${token}    ${requestId}    ${workOrderType}=CORRECTIVE    ${priority}=HIGH
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    workOrderType=${workOrderType}
    ...    priority=${priority}
    ${response}=   POST    ${BASE_URL}/maintenance/requests/${requestId}/convert    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

List Maintenance Requests Via API
    [Arguments]    ${token}    ${status}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${params}=     Create Dictionary
    IF    '${status}' != '${EMPTY}'    Set To Dictionary    ${params}    status=${status}
    ${response}=   GET    ${BASE_URL}/maintenance/requests    params=${params}    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- MAINTENANCE WORK ORDER KEYWORDS ---

Create Work Order Via API
    [Arguments]    ${token}    ${assetId}    ${title}    ${description}    ${workOrderType}=CORRECTIVE    ${priority}=HIGH
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    assetId=${assetId}
    ...    title=${title}
    ...    description=${description}
    ...    workOrderType=${workOrderType}
    ...    priority=${priority}
    ${response}=   POST    ${BASE_URL}/maintenance/work-orders    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Assign Work Order Via API
    [Arguments]    ${token}    ${workOrderId}    ${leadTechnicianId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    leadTechnicianId=${leadTechnicianId}
    ${response}=   POST    ${BASE_URL}/maintenance/work-orders/${workOrderId}/assign    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Schedule Work Order Via API
    [Arguments]    ${token}    ${workOrderId}    ${scheduledStartDate}    ${scheduledEndDate}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    scheduledStartDate=${scheduledStartDate}
    ...    scheduledEndDate=${scheduledEndDate}
    ${response}=   POST    ${BASE_URL}/maintenance/work-orders/${workOrderId}/schedule    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Start Work Order Via API
    [Arguments]    ${token}    ${workOrderId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   POST    ${BASE_URL}/maintenance/work-orders/${workOrderId}/start    headers=${headers}    expected_status=any
    RETURN         ${response}

Hold Work Order Via API
    [Arguments]    ${token}    ${workOrderId}    ${holdReason}=Awaiting replacement component
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    holdReason=${holdReason}
    ${response}=   POST    ${BASE_URL}/maintenance/work-orders/${workOrderId}/hold    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Resume Work Order Via API
    [Arguments]    ${token}    ${workOrderId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   POST    ${BASE_URL}/maintenance/work-orders/${workOrderId}/resume    headers=${headers}    expected_status=any
    RETURN         ${response}

Complete Work Order Via API
    [Arguments]    ${token}    ${workOrderId}    ${completionSummary}=Repairs executed successfully    ${actualDurationMinutes}=60
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    completionSummary=${completionSummary}
    ...    actualDurationMinutes=${actualDurationMinutes}
    ${response}=   POST    ${BASE_URL}/maintenance/work-orders/${workOrderId}/complete    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Verify Work Order Via API
    [Arguments]    ${token}    ${workOrderId}    ${verified}=${True}    ${verificationNotes}=Supervisor QA inspection passed
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    verified=${verified}
    ...    verificationNotes=${verificationNotes}
    ${response}=   POST    ${BASE_URL}/maintenance/work-orders/${workOrderId}/verify    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Close Work Order Via API
    [Arguments]    ${token}    ${workOrderId}    ${assetReturnStatus}=ACTIVE    ${closingNotes}=Work order fully signed off and closed
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    assetReturnStatus=${assetReturnStatus}
    ...    closingNotes=${closingNotes}
    ${response}=   POST    ${BASE_URL}/maintenance/work-orders/${workOrderId}/close    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Reopen Work Order Via API
    [Arguments]    ${token}    ${workOrderId}    ${reason}=Recurring anomaly detected
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    reason=${reason}
    ${response}=   POST    ${BASE_URL}/maintenance/work-orders/${workOrderId}/reopen    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

List Work Orders Via API
    [Arguments]    ${token}    ${status}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${params}=     Create Dictionary
    IF    '${status}' != '${EMPTY}'    Set To Dictionary    ${params}    status=${status}
    ${response}=   GET    ${BASE_URL}/maintenance/work-orders    params=${params}    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- PREVENTIVE MAINTENANCE KEYWORDS ---

Create PM Plan Via API
    [Arguments]    ${token}    ${assetId}    ${title}    ${frequency}=MONTHLY    ${intervalDays}=30
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    assetId=${assetId}
    ...    title=${title}
    ...    frequencyType=${frequency}
    ...    intervalValue=1
    ...    maintenanceType=PREVENTIVE
    ...    nextDueDate=2026-11-01
    ${response}=   POST    ${BASE_URL}/maintenance/preventive-plans    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

List PM Plans Via API
    [Arguments]    ${token}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   GET    ${BASE_URL}/maintenance/preventive-plans    headers=${headers}    expected_status=any
    RETURN         ${response}

Generate Due PM Work Orders Via API
    [Arguments]    ${token}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   POST    ${BASE_URL}/maintenance/preventive-plans/generate-due    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- CHECKLIST KEYWORDS ---

Create Maintenance Checklist Via API
    [Arguments]    ${token}    ${checklistCode}    ${title}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${item1}=      Create Dictionary    itemId=CHK-1    description=Verify electrical grounding    required=${True}    responseType=PASS_FAIL
    ${item2}=      Create Dictionary    itemId=CHK-2    description=Check hydraulic pressure valves    required=${True}    responseType=PASS_FAIL
    ${items}=      Create List    ${item1}    ${item2}
    ${payload}=    Create Dictionary
    ...    checklistId=${checklistCode}
    ...    name=${title}
    ...    category=BIOMEDICAL
    ...    items=${items}
    ${response}=   POST    ${BASE_URL}/maintenance/checklists    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

List Maintenance Checklists Via API
    [Arguments]    ${token}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   GET    ${BASE_URL}/maintenance/checklists    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- SPARE PARTS KEYWORDS ---

Create Part Request Via API
    [Arguments]    ${token}    ${workOrderId}    ${partName}    ${quantityRequested}=1    ${unitCost}=150
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    workOrderId=${workOrderId}
    ...    partName=${partName}
    ...    quantityRequested=${quantityRequested}
    ...    unitCost=${unitCost}
    ${response}=   POST    ${BASE_URL}/maintenance/part-requests    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Approve Part Request Via API
    [Arguments]    ${token}    ${requestId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   POST    ${BASE_URL}/maintenance/part-requests/${requestId}/approve    headers=${headers}    expected_status=any
    RETURN         ${response}

Issue Part Request Via API
    [Arguments]    ${token}    ${requestId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   POST    ${BASE_URL}/maintenance/part-requests/${requestId}/issue    headers=${headers}    expected_status=any
    RETURN         ${response}

List Part Requests Via API
    [Arguments]    ${token}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   GET    ${BASE_URL}/maintenance/part-requests    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- SERVICE CONTRACTS (AMC/CMC) KEYWORDS ---

Create Service Contract Via API
    [Arguments]    ${token}    ${contractNumber}    ${title}    ${contractType}=AMC    ${annualCost}=12000    ${vendorId}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    contractNumber=${contractNumber}
    ...    contractType=${contractType}
    ...    startDate=2026-01-01
    ...    endDate=2026-12-31
    ...    cost=${annualCost}
    ...    serviceFrequency=QUARTERLY
    ...    status=ACTIVE
    IF    '${vendorId}' != '${EMPTY}'    Set To Dictionary    ${payload}    vendorId=${vendorId}
    ${response}=   POST    ${BASE_URL}/maintenance/contracts    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

List Service Contracts Via API
    [Arguments]    ${token}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   GET    ${BASE_URL}/maintenance/contracts    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- BIOMEDICAL CALIBRATION KEYWORDS ---

Create Calibration Record Via API
    [Arguments]    ${token}    ${assetId}    ${certificateNumber}    ${result}=PASS    ${measuredAccuracy}=99.8
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    assetId=${assetId}
    ...    certificateNumber=${certificateNumber}
    ...    calibrationDate=2026-03-01
    ...    dueDate=2027-03-01
    ...    result=${result}
    ...    performedByName=Apex Biomedical Calibration Lab
    ${response}=   POST    ${BASE_URL}/maintenance/calibrations    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

List Calibration Records Via API
    [Arguments]    ${token}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   GET    ${BASE_URL}/maintenance/calibrations    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- EXCEPTIONS & ANALYTICS KEYWORDS ---

Create Maintenance Exception Via API
    [Arguments]    ${token}    ${title}    ${severity}=HIGH    ${exceptionType}=EQUIPMENT_DOWNTIME_BREACH
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    title=${title}
    ...    description=Automated exception test incident
    ...    severity=${severity}
    ...    exceptionType=${exceptionType}
    ${response}=   POST    ${BASE_URL}/maintenance/exceptions    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Resolve Maintenance Exception Via API
    [Arguments]    ${token}    ${exceptionId}    ${resolutionNotes}=Resolved via corrective action
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    resolutionNotes=${resolutionNotes}
    ${response}=   POST    ${BASE_URL}/maintenance/exceptions/${exceptionId}/resolve    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Maintenance Dashboard Metrics Via API
    [Arguments]    ${token}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   GET    ${BASE_URL}/maintenance/analytics/dashboard    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Maintenance MTTR MTBF Via API
    [Arguments]    ${token}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   GET    ${BASE_URL}/maintenance/analytics/mttr-mtbf    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- RPA INTEGRATION KEYWORDS ---

Export CMMS Data Via RPA API
    [Arguments]    ${token}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   POST    ${BASE_URL}/maintenance/rpa/export-cmms    headers=${headers}    expected_status=any
    RETURN         ${response}

Trigger PM Dispatch Via RPA API
    [Arguments]    ${token}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   POST    ${BASE_URL}/maintenance/rpa/trigger-pm-dispatch    headers=${headers}    expected_status=any
    RETURN         ${response}
