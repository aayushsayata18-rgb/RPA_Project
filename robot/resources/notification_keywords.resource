*** Settings ***
Documentation    Module 26: Notification Service & Central Communications RPA Automation Keywords
Resource         common.resource
Library          RequestsLibrary
Library          Collections

*** Keywords ***
# --- DISPATCH & RETRY KEYWORDS ---

Send Notification Via API
    [Arguments]    ${token}    ${type}    ${channels}    ${recipient}    ${templateData}=${None}    ${idempotencyKey}=${EMPTY}    ${scheduledAt}=${EMPTY}    ${priority}=NORMAL
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    type=${type}
    ...    channels=${channels}
    ...    recipient=${recipient}
    ...    priority=${priority}
    IF    ${templateData} != ${None}
        Set To Dictionary    ${payload}    templateData=${templateData}
    END
    IF    '${idempotencyKey}' != '${EMPTY}'
        Set To Dictionary    ${payload}    idempotencyKey=${idempotencyKey}
    END
    IF    '${scheduledAt}' != '${EMPTY}'
        Set To Dictionary    ${payload}    scheduledAt=${scheduledAt}
    END
    ${response}=   POST    ${BASE_URL}/notifications    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Notification Detail Via API
    [Arguments]    ${token}    ${notificationId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   GET    ${BASE_URL}/notifications/${notificationId}    headers=${headers}    expected_status=any
    RETURN         ${response}

List Notifications Via API
    [Arguments]    ${token}    ${status}=${EMPTY}    ${channel}=${EMPTY}    ${type}=${EMPTY}    ${search}=${EMPTY}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${params}=     Create Dictionary
    IF    '${status}' != '${EMPTY}'     Set To Dictionary    ${params}    status=${status}
    IF    '${channel}' != '${EMPTY}'    Set To Dictionary    ${params}    channel=${channel}
    IF    '${type}' != '${EMPTY}'       Set To Dictionary    ${params}    type=${type}
    IF    '${search}' != '${EMPTY}'     Set To Dictionary    ${params}    search=${search}
    ${response}=   GET    ${BASE_URL}/notifications    params=${params}    headers=${headers}    expected_status=any
    RETURN         ${response}

Retry Notification Via API
    [Arguments]    ${token}    ${notificationId}    ${force}=${True}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    force=${force}
    ${response}=   POST    ${BASE_URL}/notifications/${notificationId}/retry    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Cancel Scheduled Notification Via API
    [Arguments]    ${token}    ${notificationId}    ${reason}=Operator cancelled
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    reason=${reason}
    ${response}=   POST    ${BASE_URL}/notifications/${notificationId}/cancel    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get Dashboard Metrics Via API
    [Arguments]    ${token}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   GET    ${BASE_URL}/notifications/dashboard    headers=${headers}    expected_status=any
    RETURN         ${response}

Trigger Status Reconciliation Via API
    [Arguments]    ${token}    ${limit}=50
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary    limit=${limit}
    ${response}=   POST    ${BASE_URL}/notifications/reconcile    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- TEMPLATE ENGINE KEYWORDS ---

Create Template Via API
    [Arguments]    ${token}    ${templateCode}    ${name}    ${type}    ${subject}    ${body}    ${variables}    ${channel}=ALL    ${approvalRequired}=${False}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    templateCode=${templateCode}
    ...    name=${name}
    ...    type=${type}
    ...    subject=${subject}
    ...    body=${body}
    ...    variables=${variables}
    ...    channel=${channel}
    ...    approvalRequired=${approvalRequired}
    ${response}=   POST    ${BASE_URL}/notifications/templates    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Approve Template Via API
    [Arguments]    ${token}    ${templateId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   POST    ${BASE_URL}/notifications/templates/${templateId}/approve    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- CAMPAIGN KEYWORDS ---

Create Campaign Via API
    [Arguments]    ${token}    ${name}    ${targetGroup}    ${subject}    ${body}    ${channels}    ${approvalRequired}=${True}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${audience}=   Create Dictionary    targetGroup=${targetGroup}
    ${payload}=    Create Dictionary
    ...    name=${name}
    ...    audienceDefinition=${audience}
    ...    customSubject=${subject}
    ...    customBody=${body}
    ...    channels=${channels}
    ...    approvalRequired=${approvalRequired}
    ${response}=   POST    ${BASE_URL}/notifications/campaigns    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Approve Campaign Via API
    [Arguments]    ${token}    ${campaignId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   POST    ${BASE_URL}/notifications/campaigns/${campaignId}/approve    headers=${headers}    expected_status=any
    RETURN         ${response}

Execute Campaign Via API
    [Arguments]    ${token}    ${campaignId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   POST    ${BASE_URL}/notifications/campaigns/${campaignId}/execute    headers=${headers}    expected_status=any
    RETURN         ${response}

# --- WEBHOOK & IN-APP KEYWORDS ---

Send Provider Webhook Callback
    [Arguments]    ${provider}    ${providerMessageId}    ${status}=DELIVERED
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${payload}=    Create Dictionary
    ...    providerMessageId=${providerMessageId}
    ...    status=${status}
    ${response}=   POST    ${BASE_URL}/notifications/webhooks/${provider}    json=${payload}    headers=${headers}    expected_status=any
    RETURN         ${response}

Get My InApp Notifications Via API
    [Arguments]    ${token}    ${unreadOnly}=${False}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${params}=     Create Dictionary    unreadOnly=${unreadOnly}
    ${response}=   GET    ${BASE_URL}/notifications/my    params=${params}    headers=${headers}    expected_status=any
    RETURN         ${response}

Mark Notification As Read Via API
    [Arguments]    ${token}    ${notificationId}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${response}=   POST    ${BASE_URL}/notifications/${notificationId}/read    headers=${headers}    expected_status=any
    RETURN         ${response}
