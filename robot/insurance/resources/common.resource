*** Settings ***
Documentation    Common Settings & Variables for Insurance Automation Module
Library          Collections
Library          String
Library          OperatingSystem

*** Variables ***
${BASE_URL}                http://localhost:5000/api
${INSURER_PORTAL_URL}      https://mock-insurer-portal.local
${TIMEOUT}                 10s
