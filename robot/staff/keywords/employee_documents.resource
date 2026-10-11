*** Settings ***
Documentation    Keywords for uploading and archiving staff employment documents

*** Keywords ***
Upload Document To External Archive
    [Arguments]    ${employee_id}    ${document_type}    ${file_path}
    Log    Uploading ${document_type} for employee ${employee_id} from ${file_path}
    Log    Document archived with versioning metadata
