*** Settings ***
Documentation    Admission Processing & Bed Allocation Domain Keywords
Resource         ../resources/common.resource
Resource         ../resources/admission_keywords.resource
Resource         ../resources/bed_keywords.resource

*** Keywords ***
Process Complete Admission Flow
    [Arguments]    ${token}    ${patientId}    ${visitId}    ${clinicalRef}    ${bedCategory}=GENERAL_WARD
    ${req}=        Submit Admission Request    ${token}    ${patientId}    ${visitId}    ${clinicalRef}    clinicalCategory=${bedCategory}
    ${reqData}=    Set Variable    ${req.json()}[data]
    ${reqId}=      Set Variable    ${reqData}[admissionRequestId]

    # Approve
    ${appResp}=    Approve Admission Request By ID    ${token}    ${reqId}
    Should Be Equal As Integers    ${appResp.status_code}    200

    # Search Bed
    ${bedSearch}=  Find Suitable Beds For Admission    ${token}    ${bedCategory}    ${bedCategory}
    ${bedsList}=   Set Variable    ${bedSearch}[availableBeds]
    ${firstBed}=   Set Variable    ${bedsList}[0]
    ${bedId}=      Set Variable    ${firstBed}[bedId]

    # Assign Bed
    ${assignResp}= Assign Bed To Request    ${token}    ${reqId}    ${bedId}
    Should Be Equal As Integers    ${assignResp.status_code}    200

    # Complete Admission
    ${compResp}=   Complete Inpatient Admission    ${token}    ${reqId}
    Should Be Equal As Integers    ${compResp.status_code}    201
    ${admission}=  Set Variable    ${compResp.json()}[data]
    RETURN         ${admission}
