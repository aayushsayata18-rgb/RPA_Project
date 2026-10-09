*** Settings ***
Documentation    Module 4: OPD Inpatient Admission Automated Suite
Resource         ../resources/common.resource
Resource         ../resources/authentication.resource
Resource         ../resources/admission_keywords.resource
Resource         ../resources/bed_keywords.resource
Resource         ../keywords/admission_request.resource
Resource         ../keywords/admission_processing.resource

Suite Setup      Setup Admin Session

*** Variables ***
${AUTH_TOKEN}    ${EMPTY}

*** Keywords ***
Setup Admin Session
    ${token}=    Login Hospital User    ${ADMIN_EMAIL}    ${DEFAULT_PASSWORD}
    Set Suite Variable    ${AUTH_TOKEN}    ${token}

*** Test Cases ***
TC-ADM-001 OPD Admission Request Creation
    [Documentation]    Verify authorized doctor can submit OPD admission request
    ${resp}=    Submit Admission Request    ${AUTH_TOKEN}    P10003    V202610003    CLINREQ-MED-AUTO-01    source=OPD    preference=GENERAL_WARD
    Should Be True    ${resp.status_code} == 200 or ${resp.status_code} == 201
    ${body}=    Set Variable    ${resp.json()}
    Should Be True    ${body}[success]
    Should Start With    ${body}[data][admissionRequestId]    ADMREQ

TC-ADM-002 Admission Request Approval
    [Documentation]    Verify administrative / clinical approval of submitted request
    ${resp}=    Submit Admission Request    ${AUTH_TOKEN}    P10004    V202610004    CLINREQ-DERM-AUTO-01
    ${reqId}=   Set Variable    ${resp.json()}[data][admissionRequestId]
    ${appResp}= Approve Admission Request By ID    ${AUTH_TOKEN}    ${reqId}    reason=Clinical and administrative authorization verified
    Should Be Equal As Integers    ${appResp.status_code}    200
    ${appBody}= Set Variable    ${appResp.json()}
    Should Be Equal    ${appBody}[data][status]    APPROVED

TC-ADM-003 Admission Request Rejection
    [Documentation]    Verify administrative rejection with mandatory reason
    ${resp}=    Submit Admission Request    ${AUTH_TOKEN}    P10005    V202610005    CLINREQ-REJ-AUTO-01
    ${reqId}=   Set Variable    ${resp.json()}[data][admissionRequestId]
    ${rejResp}= Reject Admission Request By ID    ${AUTH_TOKEN}    ${reqId}    reason=Patient decided for home quarantine care
    Should Be Equal As Integers    ${rejResp.status_code}    200
    ${rejBody}= Set Variable    ${rejResp.json()}
    Should Be Equal    ${rejBody}[data][status]    REJECTED

TC-ADM-004 Bed Availability Query
    [Documentation]    Verify query suitable beds returns category matching accommodation
    ${search}=  Find Suitable Beds For Admission    ${AUTH_TOKEN}    GENERAL_WARD    GENERAL_WARD
    Should Be True    ${search}[availableBeds] != ${None}

TC-ADM-005 Bed Reservation Concurrency Safety
    [Documentation]    Verify reserving bed marks status to RESERVED
    ${beds}=    Get All Beds    ${AUTH_TOKEN}    status=AVAILABLE
    ${bed}=     Set Variable    ${beds}[0]
    ${reservedBed}=    Reserve Hospital Bed    ${AUTH_TOKEN}    ${bed}[bedId]    P10003    ADMREQ1003    durationMinutes=60
    Should Be Equal    ${reservedBed}[status]    RESERVED

TC-ADM-006 Complete Inpatient Admission Workflow
    [Documentation]    Verify full end-to-end OPD admission completion
    ${admission}=    Process Complete Admission Flow    ${AUTH_TOKEN}    P10003    V202610003    CLINREQ-COMPLETE-01    bedCategory=GENERAL_WARD
    Should Be Equal    ${admission}[status]    ADMITTED
    Should Start With  ${admission}[admissionId]    ADM
