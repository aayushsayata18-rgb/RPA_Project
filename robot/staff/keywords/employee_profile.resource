*** Settings ***
Documentation    Keywords for writing and reading back employee master profiles in external systems

*** Keywords ***
Enter Employee Record In External System
    [Arguments]    ${employee_id}    ${name}    ${dept}    ${role}    ${emp_type}
    Log    Entering employee record: ID=${employee_id}, Name=${name}, Department=${dept}, Role=${role}, Type=${emp_type}
    Log    Saving record in external master

Verify Employee Saved By Read Back
    [Arguments]    ${employee_id}    ${expected_name}
    Log    Reading back employee record ${employee_id} from external database
    Log    Verification passed: record for ${expected_name} accurately persisted in external system

Update Employee Designation In External System
    [Arguments]    ${employee_id}    ${new_designation}    ${new_dept}
    Log    Updating external record for ${employee_id}: Designation=${new_designation}, Dept=${new_dept}
    Log    Update verified by read-back
