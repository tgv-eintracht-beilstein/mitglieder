#!/bin/bash
# Apply TGV branding to Cognito managed login styles
# Run after: sam deploy
# Requires: aws cli, jq

set -euo pipefail

REGION="eu-central-1"
USER_POOL_ID="eu-central-1_vJEWudU5g"

# Get client IDs from stack outputs
STACK="mitglieder-app"
LOCAL_CLIENT=$(aws cloudformation describe-stacks --stack-name "$STACK" --region "$REGION" --query "Stacks[0].Outputs[?OutputKey=='LocalhostClientId'].OutputValue" --output text)
PROD_CLIENT=$(aws cloudformation describe-stacks --stack-name "$STACK" --region "$REGION" --query "Stacks[0].Outputs[?OutputKey=='ProductionClientId'].OutputValue" --output text)

SETTINGS='{
  "categories": {
    "auth": {
      "authMethodOrder": [[{"display":"INPUT","type":"USERNAME_PASSWORD"}]],
      "federation": {"interfaceStyle":"BUTTON_LIST","order":[]}
    },
    "form": {
      "displayGraphics": true,
      "instructions": {"enabled": false},
      "languageSelector": {"enabled": false},
      "location": {"horizontal":"CENTER","vertical":"CENTER"},
      "sessionTimerDisplay": "NONE"
    },
    "global": {
      "colorSchemeMode": "LIGHT",
      "pageFooter": {"enabled": true},
      "pageHeader": {"enabled": true},
      "spacingDensity": "REGULAR"
    },
    "signUp": {"acceptanceElements": [{"enforcement":"NONE","textKey":"en"}]}
  },
  "componentClasses": {
    "buttons": {"borderRadius": 9999},
    "focusState": {"lightMode": {"borderColor": "b11217ff"}},
    "input": {"borderRadius": 8, "lightMode": {"defaults": {"backgroundColor":"ffffffff","borderColor":"d1d5dbff"}}},
    "link": {"lightMode": {"defaults": {"textColor":"b11217ff"}, "hover": {"textColor":"8f0f13ff"}}},
    "optionControls": {"lightMode": {"selected": {"backgroundColor":"b11217ff","foregroundColor":"ffffffff"}}}
  },
  "components": {
    "form": {"borderRadius": 12, "lightMode": {"backgroundColor":"ffffffff"}, "logo": {"enabled":true,"formInclusion":"IN","location":"CENTER","position":"TOP"}},
    "pageBackground": {"lightMode": {"color":"f6f7f9ff"}, "image": {"enabled": false}},
    "pageFooter": {"lightMode": {"background": {"color":"1f1f1fff"}, "borderColor":"1f1f1fff"}},
    "pageHeader": {"lightMode": {"background": {"color":"8f0f13ff"}, "borderColor":"6b0a0eff"}, "logo": {"enabled":true,"location":"CENTER"}},
    "primaryButton": {"lightMode": {"defaults": {"backgroundColor":"b11217ff","textColor":"ffffffff"}, "hover": {"backgroundColor":"8f0f13ff","textColor":"ffffffff"}, "active": {"backgroundColor":"8f0f13ff","textColor":"ffffffff"}}},
    "secondaryButton": {"lightMode": {"defaults": {"backgroundColor":"ffffffff","borderColor":"b11217ff","textColor":"b11217ff"}, "hover": {"backgroundColor":"fef2f2ff","borderColor":"8f0f13ff","textColor":"8f0f13ff"}}}
  }
}'

for CLIENT_ID in "$LOCAL_CLIENT" "$PROD_CLIENT"; do
  echo "Applying branding to client: $CLIENT_ID"
  
  # Get existing branding ID
  BRANDING_ID=$(aws cognito-idp describe-managed-login-branding-by-client \
    --user-pool-id "$USER_POOL_ID" \
    --client-id "$CLIENT_ID" \
    --region "$REGION" \
    --query "ManagedLoginBranding.ManagedLoginBrandingId" \
    --output text 2>/dev/null || echo "")

  if [ -n "$BRANDING_ID" ] && [ "$BRANDING_ID" != "None" ]; then
    aws cognito-idp update-managed-login-branding \
      --managed-login-branding-id "$BRANDING_ID" \
      --user-pool-id "$USER_POOL_ID" \
      --settings "$SETTINGS" \
      --region "$REGION" \
      --no-cli-pager
    echo "  Updated branding: $BRANDING_ID"
  else
    aws cognito-idp create-managed-login-branding \
      --user-pool-id "$USER_POOL_ID" \
      --client-id "$CLIENT_ID" \
      --settings "$SETTINGS" \
      --region "$REGION" \
      --no-cli-pager
    echo "  Created new branding"
  fi
done

echo "Done. Upload the TGV logo via the Cognito console branding editor."
