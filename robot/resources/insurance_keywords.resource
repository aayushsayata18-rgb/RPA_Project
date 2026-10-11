*** Settings ***
Documentation    Insurance Policy Verification Keywords for Module 9
Resource         common.resource

*** Keywords ***
Create Insurance Policy
    [Arguments]    ${token}    ${patientId}    ${providerName}    ${policyNumber}    ${policyHolderName}    ${memberId}=${EMPTY}    ${isPrimary}=${TRUE}    ${planName}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    patientId=${patientId}
    ...    providerName=${providerName}
    ...    policyNumber=${policyNumber}
    ...    policyHolderName=${policyHolderName}
    ...    memberId=${memberId}
    ...    isPrimary=${isPrimary}
    ...    planName=${planName}
    ${response}=   POST    ${BASE_URL}/insurance/policies    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Check Duplicate Insurance Policy
    [Arguments]    ${token}    ${patientId}    ${providerName}    ${policyNumber}    ${memberId}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    patientId=${patientId}
    ...    providerName=${providerName}
    ...    policyNumber=${policyNumber}
    ...    memberId=${memberId}
    ${response}=   POST    ${BASE_URL}/insurance/policies/check-duplicate    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Patient Insurance Policies
    [Arguments]    ${token}    ${patientId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   GET    ${BASE_URL}/insurance/patients/${patientId}/policies    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Active Policy For Billing
    [Arguments]    ${token}    ${patientId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   GET    ${BASE_URL}/insurance/patients/${patientId}/active    headers=${headers}    expected_status=any
    RETURN         ${response}

Request Policy Verification
    [Arguments]    ${token}    ${policyId}    ${source}=API    ${integrationPreference}=API
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    source=${source}    integrationPreference=${integrationPreference}
    ${response}=   POST    ${BASE_URL}/insurance/policies/${policyId}/verify    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Verification Dossier
    [Arguments]    ${token}    ${verificationId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   GET    ${BASE_URL}/insurance/verifications/${verificationId}    headers=${headers}    expected_status=any
    RETURN         ${response}

Retry Verification
    [Arguments]    ${token}    ${verificationId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   POST    ${BASE_URL}/insurance/verifications/${verificationId}/retry    headers=${headers}    expected_status=any
    RETURN         ${response}

Record Manual Verification
    [Arguments]    ${token}    ${verificationId}    ${eligibilityStatus}=ELIGIBLE    ${policyStatus}=ACTIVE    ${notes}=Verified manually
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    eligibilityStatus=${eligibilityStatus}
    ...    policyStatus=${policyStatus}
    ...    notes=${notes}
    ...    referenceNumber=MANUAL-TEST-REF
    ${response}=   POST    ${BASE_URL}/insurance/verifications/${verificationId}/manual    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Insurance Exceptions
    [Arguments]    ${token}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   GET    ${BASE_URL}/insurance/exceptions    headers=${headers}    expected_status=any
    RETURN         ${response}

Resolve Insurance Exception
    [Arguments]    ${token}    ${exceptionId}    ${decision}    ${confirmedStatus}=VERIFIED    ${notes}=Resolved
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    decision=${decision}
    ...    confirmedStatus=${confirmedStatus}
    ...    notes=${notes}
    ${response}=   POST    ${BASE_URL}/insurance/exceptions/${exceptionId}/resolve    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Upload Verification Evidence
    [Arguments]    ${token}    ${verificationId}    ${patientId}    ${policyId}    ${fileName}=evidence.pdf
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    patientId=${patientId}
    ...    policyId=${policyId}
    ...    verificationId=${verificationId}
    ...    documentType=PORTAL_SCREENSHOT
    ...    fileName=${fileName}
    ...    storageKey=insurance/evidence/${fileName}
    ...    fileUrl=/uploads/evidence/${fileName}
    ${response}=   POST    ${BASE_URL}/insurance/verifications/${verificationId}/evidence    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Insurance Statistics
    [Arguments]    ${token}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   GET    ${BASE_URL}/insurance/dashboard/stats    headers=${headers}    expected_status=any
    RETURN         ${response}
