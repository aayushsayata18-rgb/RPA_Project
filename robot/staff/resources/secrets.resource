*** Settings ***
Documentation    Secure Credential Retrieval for Legacy Staff/HR Systems

*** Variables ***
${DEFAULT_HRMS_USER}    hrms_admin
${DEFAULT_HRMS_PASS}    HrmsAdmin@2026

*** Keywords ***
Get HRMS Credentials
    RETURN    ${DEFAULT_HRMS_USER}    ${DEFAULT_HRMS_PASS}
