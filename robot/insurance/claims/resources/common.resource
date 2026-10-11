*** Settings ***
Documentation    Common Settings & Variables for Insurance Claims RPA Automation (10_INSURANCE_CLAIMS.md Section 29)
Library          Collections
Library          String
Library          OperatingSystem

*** Variables ***
${BASE_URL}                http://localhost:5000/api
${INSURER_PORTAL_URL}      https://mock-insurer-portal.local/claims
${TIMEOUT}                 15s
