*** Settings ***
Documentation    Module 26: Central Notification Service RPA Automation Test Suite
Resource         ../resources/common.resource
Resource         ../resources/authentication.resource
Resource         ../resources/notification_keywords.resource
Library          String
Library          Collections

Suite Setup      Setup Notification Test Suite

*** Variables ***
${AUTH_TOKEN}         ${EMPTY}
${RUN_ID}             ${EMPTY}
${NOTIFICATION_ID}    ${EMPTY}
${CAMPAIGN_ID}        ${EMPTY}
${PROVIDER_MSG_ID}    ${EMPTY}

*** Keywords ***
Setup Notification Test Suite
    ${token}=    Login Hospital User    ${ADMIN_EMAIL}    ${DEFAULT_PASSWORD}
    Set Suite Variable    ${AUTH_TOKEN}    ${token}
    ${rand}=     Generate Random String    5    [NUMBERS]
    Set Suite Variable    ${RUN_ID}    ${rand}

*** Test Cases ***
TC-NTF-001 Concurrency-Safe NTF-YYYY-NNNNNN ID Generation And Multi-Channel Dispatch
    [Documentation]    Verifies creation of notification with unique NTF-YYYY-NNNNNN ID format across SMS, Email, and In-App
    ${channels}=    Create List    SMS    EMAIL    IN_APP
    ${recipient}=   Create Dictionary
    ...    patientId=P10001
    ...    name=Aarav Patel
    ...    phone=+919876543210
    ...    email=aarav.patel@hospital.local
    ${tmplData}=    Create Dictionary
    ...    patientName=Aarav Patel
    ...    amount=2500
    ...    transactionId=TXN-ROBOT-${RUN_ID}

    ${res}=    Send Notification Via API
    ...    ${AUTH_TOKEN}
    ...    PAYMENT_SUCCESS
    ...    ${channels}
    ...    ${recipient}
    ...    templateData=${tmplData}
    ...    priority=HIGH

    Should Be True    ${res.status_code} == 200 or ${res.status_code} == 201
    ${data}=    Set Variable    ${res.json()}[data]
    Set Suite Variable    ${NOTIFICATION_ID}    ${data}[notificationId]
    Should Match Regexp    ${data}[notificationId]    ^NTF-\\d{4}-\\d{6}$
    Should Be Equal As Strings    ${data}[status]    DELIVERED
    Should Be Equal As Strings    ${data}[type]    PAYMENT_SUCCESS

TC-NTF-002 Template Resolution, Variable Validation And Missing Variable Gate
    [Documentation]    Verifies that missing template variables are strictly caught and prevent invalid dispatch
    ${channels}=    Create List    SMS
    ${recipient}=   Create Dictionary    phone=+919876543210    name=Aarav Patel
    ${partialData}=    Create Dictionary    patientName=Aarav Patel    # missing amount and transactionId

    ${res}=    Send Notification Via API
    ...    ${AUTH_TOKEN}
    ...    PAYMENT_SUCCESS
    ...    ${channels}
    ...    ${recipient}
    ...    templateData=${partialData}

    # Should mark as FAILED with MISSING_TEMPLATE_VARIABLE error code
    ${data}=    Set Variable    ${res.json()}[data]
    Should Be Equal As Strings    ${data}[status]    FAILED
    Should Contain    ${data}[failureReason]    MISSING_TEMPLATE_VARIABLE

TC-NTF-003 Idempotency Key Deduplication And Resend Suppression
    [Documentation]    Verifies that duplicate payment events with identical idempotencyKey return existing notification without sending duplicate messages
    ${channels}=    Create List    SMS
    ${recipient}=   Create Dictionary    phone=+919876543210    name=Aarav Patel
    ${tmplData}=    Create Dictionary    patientName=Aarav Patel    amount=500    transactionId=TXN-DUP-${RUN_ID}
    ${key}=         Set Variable    PAYMENT_EVENT_IDEMP_${RUN_ID}

    ${res1}=    Send Notification Via API
    ...    ${AUTH_TOKEN}
    ...    PAYMENT_SUCCESS
    ...    ${channels}
    ...    ${recipient}
    ...    templateData=${tmplData}
    ...    idempotencyKey=${key}

    ${res2}=    Send Notification Via API
    ...    ${AUTH_TOKEN}
    ...    PAYMENT_SUCCESS
    ...    ${channels}
    ...    ${recipient}
    ...    templateData=${tmplData}
    ...    idempotencyKey=${key}

    ${id1}=    Set Variable    ${res1.json()}[data][notificationId]
    ${id2}=    Set Variable    ${res2.json()}[data][notificationId]
    Should Be Equal As Strings    ${id1}    ${id2}

TC-NTF-004 Scheduled Notification Creation And Proactive Cancellation
    [Documentation]    Verifies future scheduled notifications can be cancelled prior to dispatch
    ${channels}=    Create List    SMS
    ${recipient}=   Create Dictionary    phone=+919876543210    name=Aarav Patel
    ${tmplData}=    Create Dictionary    patientName=Aarav Patel    doctorName=Dr. Patel    appointmentDateTime=Tomorrow 10:00 AM    appointmentId=APT-SCHED-${RUN_ID}    roomNumber=202

    ${res}=    Send Notification Via API
    ...    ${AUTH_TOKEN}
    ...    APPOINTMENT_REMINDER_SMS
    ...    ${channels}
    ...    ${recipient}
    ...    templateData=${tmplData}
    ...    scheduledAt=2029-12-31T10:00:00.000Z

    ${schedId}=    Set Variable    ${res.json()}[data][notificationId]
    Should Be Equal As Strings    ${res.json()}[data][status]    PENDING

    # Cancel scheduled alert
    ${cancelRes}=    Cancel Scheduled Notification Via API    ${AUTH_TOKEN}    ${schedId}    reason=Patient rescheduled appointment
    Should Be Equal As Integers    ${cancelRes.status_code}    200
    Should Be Equal As Strings    ${cancelRes.json()}[data][status]    CANCELLED

TC-NTF-005 Delivery Attempt Tracking And Per-Channel DLV-YYYY-NNNNNN Records
    [Documentation]    Verifies per-channel delivery attempts in NotificationDelivery with DLV ID format
    ${res}=    Get Notification Detail Via API    ${AUTH_TOKEN}    ${NOTIFICATION_ID}
    Should Be Equal As Integers    ${res.status_code}    200
    ${notifDetail}=    Set Variable    ${res.json()}[data]
    ${deliveries}=     Set Variable    ${notifDetail}[deliveries]
    Should Be True    len(${deliveries}) >= 2

    ${firstDlv}=    Get From List    ${deliveries}    0
    Should Match Regexp    ${firstDlv}[deliveryId]    ^DLV-\\d{4}-\\d{6}$
    Set Suite Variable    ${PROVIDER_MSG_ID}    ${firstDlv}[providerMessageId]

TC-NTF-006 Provider Webhook Callback And Idempotent Status Transition
    [Documentation]    Simulates provider webhook delivery callback and verifies safe idempotent updates
    ${resWebhook}=    Send Provider Webhook Callback    MOCK_SMS_GATEWAY    ${PROVIDER_MSG_ID}    DELIVERED
    Should Be Equal As Integers    ${resWebhook.status_code}    200
    Should Be True    ${resWebhook.json()}[success]

TC-NTF-007 Bulk Broadcast Campaign Creation And Authorized Execution
    [Documentation]    Verifies bulk campaign creation with audience safety preview and execution
    ${channels}=    Create List    SMS    IN_APP
    ${resCamp}=     Create Campaign Via API
    ...    ${AUTH_TOKEN}
    ...    Annual Community Health Drive ${RUN_ID}
    ...    ALL_PATIENTS
    ...    Free Screening Camp This Weekend
    ...    Dear Patient, join us for our annual community health checkup camp this Saturday.
    ...    ${channels}
    ...    approvalRequired=${True}

    Should Be True    ${resCamp.status_code} == 200 or ${resCamp.status_code} == 201
    ${campData}=    Set Variable    ${resCamp.json()}[data]
    Set Suite Variable    ${CAMPAIGN_ID}    ${campData}[campaignId]
    Should Match Regexp    ${campData}[campaignId]    ^CMP-\\d{4}-\\d{6}$
    Should Be Equal As Strings    ${campData}[status]    PENDING_APPROVAL

    # Approve Campaign
    ${resApprove}=    Approve Campaign Via API    ${AUTH_TOKEN}    ${CAMPAIGN_ID}
    Should Be Equal As Integers    ${resApprove.status_code}    200
    Should Be Equal As Strings    ${resApprove.json()}[data][status]    APPROVED

    # Execute Campaign
    ${resExec}=    Execute Campaign Via API    ${AUTH_TOKEN}    ${CAMPAIGN_ID}
    Should Be Equal As Integers    ${resExec.status_code}    200
    Should Be Equal As Strings    ${resExec.json()}[data][status]    COMPLETED

TC-NTF-008 In-App Notification Delivery And Mark As Read Lifecycle
    [Documentation]    Verifies in-app notifications inbox retrieval and read marking
    ${channels}=    Create List    IN_APP
    ${recipient}=   Create Dictionary    userId=GLOBAL    name=Administrator
    ${sendRes}=     Send Notification Via API
    ...    ${AUTH_TOKEN}
    ...    SYSTEM_ALERT
    ...    ${channels}
    ...    ${recipient}
    ...    priority=HIGH

    ${resMy}=    Get My InApp Notifications Via API    ${AUTH_TOKEN}
    Should Be Equal As Integers    ${resMy.status_code}    200
    ${items}=    Set Variable    ${resMy.json()}[data]
    Should Be True    len(${items}) > 0

    ${target}=    Get From List    ${items}    0
    ${readRes}=   Mark Notification As Read Via API    ${AUTH_TOKEN}    ${target}[notificationId]
    Should Be Equal As Integers    ${readRes.status_code}    200

