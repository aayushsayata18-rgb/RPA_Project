*** Settings ***
Documentation    Module 20: Vendor Management RPA Automation Keywords
Resource         common.resource
Library          RequestsLibrary
Library          Collections

*** Keywords ***
# --- VENDOR MASTER KEYWORDS ---

Create Vendor Via API
    [Arguments]    ${token}    ${legalName}    ${taxId}    ${categories}=PHARMACEUTICALS    ${tradeName}=${EMPTY}    ${paymentTerms}=NET_30    ${currency}=INR    ${riskTier}=MEDIUM
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${catList}=    Create List    ${categories}
    ${payload}=    Create Dictionary
    ...    legalName=${legalName}
    ...    taxId=${taxId}
    ...    categories=${catList}
    ...    tradeName=${tradeName}
    ...    paymentTerms=${paymentTerms}
    ...    currency=${currency}
    ...    riskTier=${riskTier}
    ${response}=   POST    ${BASE_URL}/vendors    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Vendor By Id Via API
    [Arguments]    ${token}    ${vendorId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   GET    ${BASE_URL}/vendors/${vendorId}    headers=${headers}    expected_status=any
    RETURN         ${response}

List Vendors Via API
    [Arguments]    ${token}    ${status}=${EMPTY}    ${search}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${params}=     Create Dictionary
    IF    '${status}' != '${EMPTY}'    Set To Dictionary    ${params}    status=${status}
    IF    '${search}' != '${EMPTY}'    Set To Dictionary    ${params}    search=${search}
    ${response}=   GET    ${BASE_URL}/vendors    params=${params}    headers=${headers}    expected_status=any
    RETURN         ${response}

Check Vendor Duplicate Via API
    [Arguments]    ${token}    ${legalName}    ${taxId}    ${regNo}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    legalName=${legalName}
    ...    taxId=${taxId}
    ...    registrationNumber=${regNo}
    ${response}=   POST    ${BASE_URL}/vendors/check-duplicate    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Update Vendor Status Via API
    [Arguments]    ${token}    ${vendorId}    ${status}    ${reason}=Audited status transition
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    status=${status}    reason=${reason}
    ${response}=   PATCH    ${BASE_URL}/vendors/${vendorId}/status    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- CONTACT KEYWORDS ---

Add Vendor Contact Via API
    [Arguments]    ${token}    ${vendorId}    ${name}    ${email}    ${phone}    ${designation}=Commercial Lead    ${isPrimary}=True
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    name=${name}
    ...    email=${email}
    ...    phone=${phone}
    ...    designation=${designation}
    ...    isPrimary=${isPrimary}
    ${response}=   POST    ${BASE_URL}/vendors/${vendorId}/contacts    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- DOCUMENT & COMPLIANCE KEYWORDS ---

Upload Vendor Document Via API
    [Arguments]    ${token}    ${vendorId}    ${docType}    ${title}    ${docNumber}    ${expiryDate}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    documentType=${docType}
    ...    title=${title}
    ...    documentNumber=${docNumber}
    ...    fileReference=s3://hospital-docs/test-${docNumber}.pdf
    IF    '${expiryDate}' != '${EMPTY}'    Set To Dictionary    ${payload}    expiryDate=${expiryDate}
    ${response}=   POST    ${BASE_URL}/vendors/${vendorId}/documents    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Verify Vendor Document Via API
    [Arguments]    ${token}    ${vendorId}    ${docId}    ${notes}=Approved compliance verification
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    notes=${notes}
    ${response}=   POST    ${BASE_URL}/vendors/${vendorId}/documents/${docId}/verify    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Check Vendor Document Expiry Via API
    [Arguments]    ${token}    ${warningDays}=30
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${params}=     Create Dictionary    warningDays=${warningDays}
    ${response}=   GET    ${BASE_URL}/vendors/documents/check-expiry    params=${params}    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- CONTRACT KEYWORDS ---

Create Vendor Contract Via API
    [Arguments]    ${token}    ${vendorId}    ${title}    ${contractType}=RATE_CONTRACT    ${value}=500000    ${renewalDays}=30
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    title=${title}
    ...    contractType=${contractType}
    ...    startDate=2026-01-01T00:00:00.000Z
    ...    endDate=2026-11-15T00:00:00.000Z
    ...    value=${value}
    ...    currency=INR
    ...    renewalNoticeDays=${renewalDays}
    ...    scope=Hospital pharmaceutical supplies
    ${response}=   POST    ${BASE_URL}/vendors/${vendorId}/contracts    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Approve Vendor Contract Via API
    [Arguments]    ${token}    ${vendorId}    ${contractId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${response}=   POST    ${BASE_URL}/vendors/${vendorId}/contracts/${contractId}/approve    headers=${headers}    expected_status=any
    RETURN         ${response}

Check Expiring Contracts Via API
    [Arguments]    ${token}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   GET    ${BASE_URL}/vendors/contracts/check-expiring    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- PERFORMANCE & ISSUES KEYWORDS ---

Get Vendor Performance Via API
    [Arguments]    ${token}    ${vendorId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   GET    ${BASE_URL}/vendors/${vendorId}/performance    headers=${headers}    expected_status=any
    RETURN         ${response}

Report Vendor Issue Via API
    [Arguments]    ${token}    ${vendorId}    ${title}    ${category}=Late Delivery    ${severity}=MEDIUM    ${desc}=Defect
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    title=${title}
    ...    category=${category}
    ...    severity=${severity}
    ...    description=${desc}
    ${response}=   POST    ${BASE_URL}/vendors/${vendorId}/issues    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Respond To Vendor Issue Via API
    [Arguments]    ${token}    ${issueId}    ${responseText}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    response=${responseText}
    ${response}=   POST    ${BASE_URL}/vendors/issues/${issueId}/respond    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Resolve Vendor Issue Via API
    [Arguments]    ${token}    ${vendorId}    ${issueId}    ${resolution}    ${preventiveAction}=CAPA implemented
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    resolution=${resolution}    preventiveAction=${preventiveAction}
    ${response}=   POST    ${BASE_URL}/vendors/${vendorId}/issues/${issueId}/resolve    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}
