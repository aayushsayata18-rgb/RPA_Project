*** Settings ***
Documentation    Module 24: Housekeeping Management RPA Automation Keywords
Resource         common.resource
Library          RequestsLibrary
Library          Collections

*** Keywords ***
# --- AREA KEYWORDS ---

Create Housekeeping Area Via API
    [Arguments]    ${token}    ${areaCode}    ${name}    ${areaType}=PATIENT_ROOM    ${cleaningFrequency}=DAILY    ${status}=AVAILABLE
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    areaCode=${areaCode}
    ...    name=${name}
    ...    areaType=${areaType}
    ...    cleaningFrequency=${cleaningFrequency}
    ...    status=${status}
    ${response}=   POST    ${BASE_URL}/housekeeping/areas    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

List Housekeeping Areas Via API
    [Arguments]    ${token}    ${areaType}=${EMPTY}    ${status}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${params}=     Create Dictionary
    IF    '${areaType}' != '${EMPTY}'    Set To Dictionary    ${params}    areaType=${areaType}
    IF    '${status}' != '${EMPTY}'      Set To Dictionary    ${params}    status=${status}
    ${response}=   GET    ${BASE_URL}/housekeeping/areas    params=${params}    headers=${headers}    expected_status=any
    RETURN         ${response}

Update Housekeeping Area Status Via API
    [Arguments]    ${token}    ${areaId}    ${status}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    status=${status}
    ${response}=   PATCH    ${BASE_URL}/housekeeping/areas/${areaId}/status    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- CHECKLIST KEYWORDS ---

Create Housekeeping Checklist Via API
    [Arguments]    ${token}    ${checklistCode}    ${title}    ${applicableAreaType}=PATIENT_ROOM    ${taskType}=DISCHARGE_TURNOVER
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${item1}=      Create Dictionary    itemCode=CHK-1    label=Strip linens    mandatory=True
    ${item2}=      Create Dictionary    itemCode=CHK-2    label=Sanitize surfaces    mandatory=True
    ${items}=      Create List    ${item1}    ${item2}
    ${payload}=    Create Dictionary
    ...    checklistCode=${checklistCode}
    ...    title=${title}
    ...    applicableAreaType=${applicableAreaType}
    ...    taskType=${taskType}
    ...    items=${items}
    ${response}=   POST    ${BASE_URL}/housekeeping/checklists    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- SCHEDULE KEYWORDS ---

Create Housekeeping Schedule Via API
    [Arguments]    ${token}    ${scheduleCode}    ${title}    ${areaId}    ${frequency}=DAILY    ${shiftType}=MORNING    ${priority}=ROUTINE
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    scheduleCode=${scheduleCode}
    ...    title=${title}
    ...    areaId=${areaId}
    ...    frequency=${frequency}
    ...    shiftType=${shiftType}
    ...    priority=${priority}
    ${response}=   POST    ${BASE_URL}/housekeeping/schedules    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- TASK KEYWORDS ---

Create Housekeeping Task Via API
    [Arguments]    ${token}    ${areaId}    ${taskType}=ROUTINE_CLEANING    ${priority}=ROUTINE    ${description}=General Cleaning
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    areaId=${areaId}
    ...    taskType=${taskType}
    ...    priority=${priority}
    ...    description=${description}
    ${response}=   POST    ${BASE_URL}/housekeeping/tasks    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Start Housekeeping Task Via API
    [Arguments]    ${token}    ${taskId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   POST    ${BASE_URL}/housekeeping/tasks/${taskId}/start    headers=${headers}    expected_status=any
    RETURN         ${response}

Complete Housekeeping Task Via API
    [Arguments]    ${token}    ${taskId}    ${completionNotes}=Cleaning completed
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    completionNotes=${completionNotes}
    ${response}=   POST    ${BASE_URL}/housekeeping/tasks/${taskId}/complete    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Close Housekeeping Task Via API
    [Arguments]    ${token}    ${taskId}    ${closingNotes}=Task closed
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    closingNotes=${closingNotes}
    ${response}=   POST    ${BASE_URL}/housekeeping/tasks/${taskId}/close    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- BED TURNOVER KEYWORDS ---

Trigger Room Turnover Via API
    [Arguments]    ${token}    ${bedId}    ${bedNumber}    ${priority}=STAT    ${notes}=Discharge turnover
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    bedId=${bedId}
    ...    bedNumber=${bedNumber}
    ...    priority=${priority}
    ...    notes=${notes}
    ${response}=   POST    ${BASE_URL}/housekeeping/tasks/turnover    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Turnover Board Via API
    [Arguments]    ${token}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   GET    ${BASE_URL}/housekeeping/tasks/turnover/board    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- INSPECTION KEYWORDS ---

Perform Housekeeping Inspection Via API
    [Arguments]    ${token}    ${taskId}    ${score}=95    ${passed}=True    ${findings}=Sanitation passed
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    taskId=${taskId}
    ...    score=${score}
    ...    passed=${passed}
    ...    findings=${findings}
    ${response}=   POST    ${BASE_URL}/housekeeping/inspections    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- SUPPLIES KEYWORDS ---

Request Housekeeping Supplies Via API
    [Arguments]    ${token}    ${itemName}=Disinfectant Tabs    ${quantityRequested}=5    ${unit}=BOX
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${item1}=      Create Dictionary    itemName=${itemName}    quantityRequested=${quantityRequested}    unit=${unit}
    ${items}=      Create List    ${item1}
    ${payload}=    Create Dictionary    items=${items}    shiftType=MORNING
    ${response}=   POST    ${BASE_URL}/housekeeping/supplies/request    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Approve Housekeeping Supplies Via API
    [Arguments]    ${token}    ${supplyId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    approvalNotes=Approved
    ${response}=   POST    ${BASE_URL}/housekeeping/supplies/${supplyId}/approve    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- EXCEPTION KEYWORDS ---

Create Housekeeping Exception Via API
    [Arguments]    ${token}    ${exceptionType}=BIOHAZARD_SPILL    ${severity}=HIGH    ${description}=Spill in hallway
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    exceptionType=${exceptionType}
    ...    severity=${severity}
    ...    description=${description}
    ${response}=   POST    ${BASE_URL}/housekeeping/exceptions    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Resolve Housekeeping Exception Via API
    [Arguments]    ${token}    ${exceptionId}    ${resolutionNotes}=Cleaned and resolved
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    resolutionNotes=${resolutionNotes}
    ${response}=   POST    ${BASE_URL}/housekeeping/exceptions/${exceptionId}/resolve    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- RPA KEYWORDS ---

Trigger Housekeeping RPA Sync Via API
    [Arguments]    ${token}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   POST    ${BASE_URL}/housekeeping/rpa/sync-turnovers    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Housekeeping Dashboard Metrics Via API
    [Arguments]    ${token}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   GET    ${BASE_URL}/housekeeping/analytics/dashboard    headers=${headers}    expected_status=any
    RETURN         ${response}
