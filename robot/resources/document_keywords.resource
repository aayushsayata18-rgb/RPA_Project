*** Settings ***
Documentation    Module 27: Document Generation & Management RPA Automation Keywords
Resource         common.resource
Library          RequestsLibrary
Library          Collections
Library          OperatingSystem

*** Keywords ***
# --- GENERATION & LIFECYCLE KEYWORDS ---

Generate Document Via API
    [Arguments]    ${token}    ${documentType}    ${data}    ${patientId}=${EMPTY}    ${patientName}=${EMPTY}    ${autoRelease}=${True}    ${idempotencyKey}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    documentType=${documentType}
    ...    data=${data}
    ...    autoRelease=${autoRelease}
    IF    '${patientId}' != '${EMPTY}'
        Set To Dictionary    ${payload}    patientId=${patientId}
    END
    IF    '${patientName}' != '${EMPTY}'
        Set To Dictionary    ${payload}    patientName=${patientName}
    END
    IF    '${idempotencyKey}' != '${EMPTY}'
        Set To Dictionary    ${payload}    idempotencyKey=${idempotencyKey}
    END
    ${response}=   POST    ${BASE_URL}/documents/generate    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Document Detail Via API
    [Arguments]    ${token}    ${documentId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   GET    ${BASE_URL}/documents/${documentId}    headers=${headers}    expected_status=any
    RETURN         ${response}

Download Document File Via API
    [Arguments]    ${token}    ${documentId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   GET    ${BASE_URL}/documents/${documentId}/download    headers=${headers}    expected_status=any
    RETURN         ${response}

Approve Document Via API
    [Arguments]    ${token}    ${documentId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   POST    ${BASE_URL}/documents/${documentId}/approve    headers=${headers}    expected_status=any
    RETURN         ${response}

Release Document Via API
    [Arguments]    ${token}    ${documentId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   POST    ${BASE_URL}/documents/${documentId}/release    headers=${headers}    expected_status=any
    RETURN         ${response}

Regenerate Document Via API
    [Arguments]    ${token}    ${documentId}    ${updatedData}=${None}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    IF    ${updatedData} != ${None}
        Set To Dictionary    ${payload}    updatedData=${updatedData}
    END
    ${response}=   POST    ${BASE_URL}/documents/${documentId}/regenerate    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Cancel Document Via API
    [Arguments]    ${token}    ${documentId}    ${reason}=Operational cancellation
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    reason=${reason}
    ${response}=   POST    ${BASE_URL}/documents/${documentId}/cancel    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Upload Document Attachment Via API
    [Arguments]    ${token}    ${fileName}    ${fileContent}    ${documentType}    ${category}=OPERATIONS    ${patientId}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    fileName=${fileName}
    ...    fileContent=${fileContent}
    ...    documentType=${documentType}
    ...    category=${category}
    IF    '${patientId}' != '${EMPTY}'
        Set To Dictionary    ${payload}    patientId=${patientId}
    END
    ${response}=   POST    ${BASE_URL}/documents/upload    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

List Documents Via API
    [Arguments]    ${token}    ${status}=${EMPTY}    ${category}=${EMPTY}    ${documentType}=${EMPTY}    ${search}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${params}=     Create Dictionary
    IF    '${status}' != '${EMPTY}'          Set To Dictionary    ${params}    status=${status}
    IF    '${category}' != '${EMPTY}'        Set To Dictionary    ${params}    category=${category}
    IF    '${documentType}' != '${EMPTY}'    Set To Dictionary    ${params}    documentType=${documentType}
    IF    '${search}' != '${EMPTY}'          Set To Dictionary    ${params}    search=${search}
    ${response}=   GET    ${BASE_URL}/documents    params=${params}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Document Version History Via API
    [Arguments]    ${token}    ${documentId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   GET    ${BASE_URL}/documents/${documentId}/versions    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- DOCUMENT PACKAGE KEYWORDS ---

Create Document Package Via API
    [Arguments]    ${token}    ${title}    ${packageType}    ${documentIds}    ${patientId}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    title=${title}
    ...    packageType=${packageType}
    ...    documentIds=${documentIds}
    IF    '${patientId}' != '${EMPTY}'
        Set To Dictionary    ${payload}    patientId=${patientId}
    END
    ${response}=   POST    ${BASE_URL}/document-packages    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Download Document Package Via API
    [Arguments]    ${token}    ${packageId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   GET    ${BASE_URL}/document-packages/${packageId}/download    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- MAINTENANCE & STATS KEYWORDS ---

Get Document Analytics Stats Via API
    [Arguments]    ${token}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   GET    ${BASE_URL}/documents/reports/stats    headers=${headers}    expected_status=any
    RETURN         ${response}

Trigger Document Integrity Check Via API
    [Arguments]    ${token}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   POST    ${BASE_URL}/documents/maintenance/integrity-check    headers=${headers}    expected_status=any
    RETURN         ${response}

Trigger Document Retention Run Via API
    [Arguments]    ${token}    ${archiveAfterDays}=365
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    archiveAfterDays=${archiveAfterDays}
    ${response}=   POST    ${BASE_URL}/documents/maintenance/retention-job    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}
