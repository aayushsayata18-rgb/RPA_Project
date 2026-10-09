*** Settings ***
Documentation    Discharge Processing & Orchestration Keywords for Module 6
Resource         common.resource

*** Keywords ***
Create Clinical Discharge Request
    [Arguments]    ${token}    ${admissionId}    ${patientId}    ${doctorId}    ${dischargeType}=ROUTINE    ${clinicalSummary}=Patient recovered and cleared for discharge
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    admissionId=${admissionId}
    ...    patientId=${patientId}
    ...    doctorId=${doctorId}
    ...    dischargeType=${dischargeType}
    ...    clinicalSummary=${clinicalSummary}
    ${response}=   POST    ${BASE_URL}/discharge-requests    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get All Discharge Requests
    [Arguments]    ${token}    ${status}=${EMPTY}    ${doctorId}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${params}=     Create Dictionary
    IF    '${status}' != '${EMPTY}'
        Set To Dictionary    ${params}    status=${status}
    END
    IF    '${doctorId}' != '${EMPTY}'
        Set To Dictionary    ${params}    doctorId=${doctorId}
    END
    ${response}=   GET    ${BASE_URL}/discharge-requests    params=${params}    headers=${headers}    expected_status=any
    RETURN         ${response}

Initiate Discharge Workflow
    [Arguments]    ${token}    ${admissionId}    ${dischargeRequestId}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    admissionId=${admissionId}
    IF    '${dischargeRequestId}' != '${EMPTY}'
        Set To Dictionary    ${payload}    dischargeRequestId=${dischargeRequestId}
    END
    ${response}=   POST    ${BASE_URL}/discharges    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get All Discharges
    [Arguments]    ${token}    ${status}=${EMPTY}    ${patientId}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${params}=     Create Dictionary
    IF    '${status}' != '${EMPTY}'
        Set To Dictionary    ${params}    status=${status}
    END
    IF    '${patientId}' != '${EMPTY}'
        Set To Dictionary    ${params}    patientId=${patientId}
    END
    ${response}=   GET    ${BASE_URL}/discharges    params=${params}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Discharge Details
    [Arguments]    ${token}    ${dischargeId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   GET    ${BASE_URL}/discharges/${dischargeId}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Discharge Checklist
    [Arguments]    ${token}    ${dischargeId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   GET    ${BASE_URL}/discharges/${dischargeId}/checklist    headers=${headers}    expected_status=any
    RETURN         ${response}

Update Discharge Checklist Items
    [Arguments]    ${token}    ${dischargeId}    ${itemsDict}    ${notes}=Checklist updated by staff
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    items=${itemsDict}    notes=${notes}
    ${response}=   PUT    ${BASE_URL}/discharges/${dischargeId}/checklist    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Check Pending Services For Discharge
    [Arguments]    ${token}    ${dischargeId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   GET    ${BASE_URL}/discharges/${dischargeId}/pending-services    headers=${headers}    expected_status=any
    RETURN         ${response}

Finalize Discharge Billing
    [Arguments]    ${token}    ${dischargeId}    ${discountAmount}=0
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    discountAmount=${discountAmount}
    ${response}=   POST    ${BASE_URL}/discharges/${dischargeId}/finalize-billing    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Verify Discharge Insurance
    [Arguments]    ${token}    ${dischargeId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   POST    ${BASE_URL}/discharges/${dischargeId}/verify-insurance    json=@{EMPTY}    headers=${headers}    expected_status=any
    RETURN         ${response}

Release Bed For Discharge
    [Arguments]    ${token}    ${dischargeId}    ${notes}=Bed vacated for cleaning
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    notes=${notes}
    ${response}=   POST    ${BASE_URL}/discharges/${dischargeId}/release-bed    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Complete Discharge Process
    [Arguments]    ${token}    ${dischargeId}    ${summary}=Patient successfully discharged
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    summary=${summary}
    ${response}=   POST    ${BASE_URL}/discharges/${dischargeId}/complete    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Cancel Discharge Process
    [Arguments]    ${token}    ${dischargeId}    ${reason}=Discharge cancelled by physician
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    reason=${reason}
    ${response}=   POST    ${BASE_URL}/discharges/${dischargeId}/cancel    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Discharge Audit History
    [Arguments]    ${token}    ${dischargeId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   GET    ${BASE_URL}/discharges/${dischargeId}/history    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Discharge Document
    [Arguments]    ${token}    ${dischargeId}    ${docType}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   GET    ${BASE_URL}/discharges/${dischargeId}/documents/${docType}    headers=${headers}    expected_status=any
    RETURN         ${response}

Submit Billing Dispute
    [Arguments]    ${token}    ${dischargeId}    ${chargeId}    ${reason}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    chargeId=${chargeId}    reason=${reason}
    ${response}=   POST    ${BASE_URL}/discharges/${dischargeId}/dispute    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}
