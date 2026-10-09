*** Settings ***
Documentation    Module 07 Patient Records RPA Keywords & Resource Layer
Resource         common.resource
Resource         authentication.resource

*** Keywords ***
Get Patient Summary Record
    [Arguments]    ${token}    ${patientId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   GET    ${BASE_URL}/patients/${patientId}/records/summary    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Patient Longitudinal Timeline
    [Arguments]    ${token}    ${patientId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   GET    ${BASE_URL}/patients/${patientId}/timeline    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Patient Documents Library
    [Arguments]    ${token}    ${patientId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   GET    ${BASE_URL}/patients/${patientId}/documents    headers=${headers}    expected_status=any
    RETURN         ${response}

Download Patient Document With Token
    [Arguments]    ${token}    ${documentId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   GET    ${BASE_URL}/patient-records/documents/${documentId}/download    headers=${headers}    expected_status=any
    RETURN         ${response}

Update Patient Profile With Audit
    [Arguments]    ${token}    ${patientId}    ${updates}    ${reason}
    ${payload}=    Create Dictionary    updates=${updates}    reason=${reason}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   PATCH    ${BASE_URL}/patients/${patientId}/profile    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Trigger RPA Legacy Record Sync
    [Arguments]    ${token}    ${patientId}    ${syncPayload}
    ${body}=       Create Dictionary    patientId=${patientId}    syncPayload=${syncPayload}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   POST    ${BASE_URL}/patient-records/sync    json=${body}    headers=${headers}    expected_status=any
    RETURN         ${response}

Import Legacy Document With RPA
    [Arguments]    ${token}    ${patientId}    ${title}    ${docType}    ${sourceId}    ${checksum}
    ${body}=       Create Dictionary    patientId=${patientId}    title=${title}    documentType=${docType}    sourceDocumentId=${sourceId}    checksum=${checksum}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   POST    ${BASE_URL}/patient-records/import-document    json=${body}    headers=${headers}    expected_status=any
    RETURN         ${response}

Reconcile Patient References
    [Arguments]    ${token}    ${patientId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   GET    ${BASE_URL}/patient-records/${patientId}/reconcile    headers=${headers}    expected_status=any
    RETURN         ${response}
