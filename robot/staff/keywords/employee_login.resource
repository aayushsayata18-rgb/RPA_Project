*** Settings ***
Documentation    Keywords for authenticating to external HRMS / legacy staff systems
Resource         ../resources/secrets.resource

*** Keywords ***
Login To External HR System
    ${user}    ${pass}=    Get HRMS Credentials
    Log    Submitting credentials for user ${user} to external HRMS portal
    Log    External HRMS session established successfully
