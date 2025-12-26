# Experiment 03 - Sanitized Clone of Experiment 04

⚠️ **IMPORTANT: This is a sanitized copy of experiment_04**

All sensitive information has been removed including:
- Azure subscription IDs → `AZURE-SUBSCRIPTION-ID`
- Resource group names → `AZURE-RESOURCE-GROUP`
- Function app names → `AZURE-FUNCTION-APP-NAME`
- Deployment endpoints → `https://YOUR-FUNCTION-APP.azurewebsites.net`

## What This Contains

This is an **exact copy** of experiment_04 (production implementation) with all Azure-specific identifiers replaced with placeholders.

Use this as:
- **Reference template** for new deployments
- **Learning resource** without exposing production endpoints
- **Base for new experiments** without sensitive data

## To Deploy Your Own

1. Replace placeholders with your values:
   - `AZURE-SUBSCRIPTION-ID` → Your Azure subscription ID
   - `AZURE-RESOURCE-GROUP` → Your resource group name
   - `AZURE-FUNCTION-APP-NAME` → Your function app name
   - `YOUR-FUNCTION-APP` → Your chosen function app name

2. Follow deployment instructions in the main README.md

3. Update `mcp-server/.env` or Azure environment variables

## Original Source

This experiment is a sanitized copy of:
- **Source:** `/workspaces/XPR/agentic_dev/experiment_04/`
- **Cloned:** December 26, 2025
- **Status:** Sanitized for public sharing/reference

## Documentation

All documentation files are preserved with placeholders. Simply search and replace the placeholders with your actual Azure resource names.

---

**Note:** For the actual production deployment with live endpoints, see `experiment_04/`
