*** Settings ***
Documentation    High-level composite Discharge processing keywords for RPA workflows
Resource         ../resources/discharge_keywords.resource
Resource         ../resources/billing_keywords.resource
Resource         ../resources/payment_keywords.resource
Resource         ../resources/bed_keywords.resource

*** Keywords ***
Process Routine Discharge For Patient
    [Arguments]    ${token}    ${admissionId}    ${patientId}    ${doctorId}
    # 1. Doctor submits clinical request
    ${reqRes}=    Create Clinical Discharge Request    ${token}    ${admissionId}    ${patientId}    ${doctorId}
    Should Be True    ${reqRes.status_code} == 201 or ${reqRes.status_code} == 200
    ${reqId}=     Set Variable    ${reqRes.json()}[data][dischargeRequestId]

    # 2. Staff initiates discharge workflow
    ${initRes}=   Initiate Discharge Workflow    ${token}    ${admissionId}    dischargeRequestId=${reqId}
    Should Be True    ${initRes.status_code} == 201 or ${initRes.status_code} == 200
    ${dischargeId}=    Set Variable    ${initRes.json()}[data][dischargeId]

    # 3. Check and resolve checklist
    ${chkRes}=    Get Discharge Checklist    ${token}    ${dischargeId}
    Should Be Equal As Integers    ${chkRes.status_code}    200

    # 4. Finalize billing
    ${billRes}=   Finalize Discharge Billing    ${token}    ${dischargeId}
    Should Be Equal As Integers    ${billRes.status_code}    200
    ${invoiceNum}=    Set Variable    ${billRes.json()}[data][invoice][invoiceNumber]
    ${netPayable}=    Set Variable    ${billRes.json()}[data][invoice][netPayable]

    # 5. Settle invoice if balance > 0
    IF    ${netPayable} > 0
        ${payRes}=    Record Counter Payment    ${token}    ${invoiceNum}    ${netPayable}    COUNTER_CASH
        Should Be Equal As Integers    ${payRes.status_code}    200
    END

    # 6. Release bed
    ${bedRes}=    Release Bed For Discharge    ${token}    ${dischargeId}
    Should Be Equal As Integers    ${bedRes.status_code}    200

    # 7. Complete discharge
    ${compRes}=   Complete Discharge Process    ${token}    ${dischargeId}
    Should Be Equal As Integers    ${compRes.status_code}    200

    RETURN    ${dischargeId}
