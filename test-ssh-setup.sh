#!/bin/bash

# Test SSH Auto-Setup endpoint
# This tests with a real Proxmox host

API_URL="http://localhost:3003"
HOST="${1:-your-proxmox-host}"
SSH_USER="${2:-root}"
SSH_PASSWORD="${3:-password}"
TOKEN_NAME="${4:-dashv_auto}"

echo "Testing SSH Auto-Setup..."
echo "API URL: $API_URL"
echo "Host: $HOST"
echo "SSH User: $SSH_USER"
echo "Token Name: $TOKEN_NAME"
echo ""

curl -X POST "$API_URL/api/proxmox/auto-setup" \
  -H "Content-Type: application/json" \
  -d "{
    \"host\": \"$HOST\",
    \"sshUser\": \"$SSH_USER\",
    \"sshPassword\": \"$SSH_PASSWORD\",
    \"tokenName\": \"$TOKEN_NAME\"
  }" | jq .

echo ""
echo "Check backend logs with: docker compose logs backend --tail=50"
