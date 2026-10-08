*** Settings ***
Documentation    Common global variables and configuration for Hospital RPA automation
Library          RequestsLibrary
Library          Collections
Library          OperatingSystem

*** Variables ***
${BASE_URL}          http://localhost:5000/api
${ADMIN_EMAIL}       admin@hospital.com
${DEFAULT_PASSWORD}  Password@123
${TIMEOUT}           10s
