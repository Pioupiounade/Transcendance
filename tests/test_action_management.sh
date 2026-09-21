#!/bin/bash

BASE_URL="http://localhost:3000"

STAMP=$(date +%s)
EMAIL_A="action.a.${STAMP}@example.com"
EMAIL_B="action.b.${STAMP}@example.com"
EMAIL_C="action.c.${STAMP}@example.com"
EMAIL_D="action.d.${STAMP}@example.com"
PASSWORD="Password123!"

SCHEDULED_AT="2027-06-15T18:00:00.000Z"

register_user() {
  local email="$1"
  curl -s -X POST "$BASE_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$email\", \"password\": \"$PASSWORD\"}"
}

login_user() {
  local email="$1"
  curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$email\", \"password\": \"$PASSWORD\"}"
}

echo "=========================================="
echo " 1. REGISTER USER A (CREATEUR)"
echo "=========================================="
REGISTER_A=$(register_user "$EMAIL_A")
echo "$REGISTER_A" | jq .
echo -e "\n"

echo "=========================================="
echo " 2. REGISTER USER B (PARTICIPANT)"
echo "=========================================="
REGISTER_B=$(register_user "$EMAIL_B")
echo "$REGISTER_B" | jq .
echo -e "\n"

echo "=========================================="
echo " 3. REGISTER USER C (PARTICIPANT)"
echo "=========================================="
REGISTER_C=$(register_user "$EMAIL_C")
echo "$REGISTER_C" | jq .
echo -e "\n"

echo "=========================================="
echo " 4. REGISTER USER D (PARTICIPANT)"
echo "=========================================="
REGISTER_D=$(register_user "$EMAIL_D")
echo "$REGISTER_D" | jq .
echo -e "\n"

echo "=========================================="
echo " 5. LOGIN DES 4 USERS"
echo "=========================================="
LOGIN_A=$(login_user "$EMAIL_A")
LOGIN_B=$(login_user "$EMAIL_B")
LOGIN_C=$(login_user "$EMAIL_C")
LOGIN_D=$(login_user "$EMAIL_D")

TOKEN_A=$(echo "$LOGIN_A" | jq -r '.access_token')
TOKEN_B=$(echo "$LOGIN_B" | jq -r '.access_token')
TOKEN_C=$(echo "$LOGIN_C" | jq -r '.access_token')
TOKEN_D=$(echo "$LOGIN_D" | jq -r '.access_token')

echo "USER A:"
echo "$LOGIN_A" | jq .
echo "USER B:"
echo "$LOGIN_B" | jq .
echo "USER C:"
echo "$LOGIN_C" | jq .
echo "USER D:"
echo "$LOGIN_D" | jq .
echo -e "\n"

echo "=========================================="
echo " 6. USER A CREE UNE ACTION PERSONNELLE"
echo "=========================================="
CREATE_RES=$(curl -s -X POST "$BASE_URL/actions" \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Nettoyage du parc\",
    \"description\": \"Ramassage collectif des déchets dans le parc du quartier.\",
    \"location\": [48.8566, 2.3522],
    \"category\": \"ENVIRONMENT\",
    \"imagesList\": [\"https://example.com/park.jpg\"],
    \"scheduled_at\": \"$SCHEDULED_AT\"
  }")

echo "$CREATE_RES" | jq .
ACTION_ID=$(echo "$CREATE_RES" | jq -r '.action_id')
echo "ACTION ID = $ACTION_ID"
echo -e "\n"

echo "=========================================="
echo " 7. VERIFIER QUE L'ACTION EST PENDING"
echo "=========================================="
curl -s -X GET "$BASE_URL/actions/$ACTION_ID" | jq .
echo -e "\n"

echo "=========================================="
echo " 8. USER B ESSAIE DE MODIFIER L'ACTION"
echo " Doit échouer 403"
echo "=========================================="
curl -i -X PATCH "$BASE_URL/actions/$ACTION_ID" \
  -H "Authorization: Bearer $TOKEN_B" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Modification interdite"
  }'
echo -e "\n"

echo "=========================================="
echo " 9. USER A MODIFIE SON ACTION"
echo "=========================================="
UPDATE_RES=$(curl -s -X PATCH "$BASE_URL/actions/$ACTION_ID" \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Nettoyage participatif du parc",
    "description": "Ramassage collectif des déchets et tri sur place.",
    "location": [48.857, 2.353],
    "category": "ENVIRONMENT",
    "imagesList": [
      "https://example.com/park.jpg",
      "https://example.com/recycling.jpg"
    ]
  }')

echo "$UPDATE_RES" | jq .
echo -e "\n"

echo "=========================================="
echo " 10. CREATION AVEC ORGANISATION INEXISTANTE"
echo " Doit échouer 404"
echo "=========================================="
curl -i -X POST "$BASE_URL/actions" \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Action organisation invalide\",
    \"description\": \"Cette création doit être refusée.\",
    \"location\": [48.8566, 2.3522],
    \"organization_id\": 999999999,
    \"category\": \"SOCIAL\",
    \"imagesList\": [],
    \"scheduled_at\": \"$SCHEDULED_AT\"
  }"
echo -e "\n"

echo "=========================================="
echo " 11. USER B ESSAIE D'ANNULER L'ACTION"
echo " Doit échouer 403"
echo "=========================================="
curl -i -X PATCH "$BASE_URL/actions/$ACTION_ID/cancel" \
  -H "Authorization: Bearer $TOKEN_B"
echo -e "\n"

echo "=========================================="
echo " 12. USER A ANNULE SON ACTION"
echo " Soft delete => statut CANCELLED"
echo "=========================================="
CANCEL_RES=$(curl -s -X PATCH "$BASE_URL/actions/$ACTION_ID/cancel" \
  -H "Authorization: Bearer $TOKEN_A")

echo "$CANCEL_RES" | jq .
echo -e "\n"

echo "=========================================="
echo " 13. VERIFIER QUE L'ACTION RESTE EN BASE"
echo " ET QUE SON STATUT EST CANCELLED"
echo "=========================================="
curl -s -X GET "$BASE_URL/actions/$ACTION_ID" | jq .
echo -e "\n"

echo "=========================================="
echo " 14. USER A ESSAIE DE MODIFIER L'ACTION CANCELLED"
echo " Doit échouer 400"
echo "=========================================="
curl -i -X PATCH "$BASE_URL/actions/$ACTION_ID" \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Cette modification doit être refusée"
  }'
echo -e "\n"

echo "=========================================="
echo " 15. USER A ESSAIE D'ANNULER UNE DEUXIEME FOIS"
echo " Doit échouer 400"
echo "=========================================="
curl -i -X PATCH "$BASE_URL/actions/$ACTION_ID/cancel" \
  -H "Authorization: Bearer $TOKEN_A"
echo -e "\n"

echo "=========================================="
echo " 16. LISTE DES ACTIONS CANCELLED"
echo " L'action test doit apparaître"
echo "=========================================="
curl -s -X GET "$BASE_URL/actions?status=CANCELLED" | jq .
echo -e "\n"

echo "=========================================="
echo " 17. CREER UNE ACTION POUR LE FLUX"
echo " PENDING -> APPROVED -> COMPLETED"
echo "=========================================="
CREATE_COMPLETE_RES=$(curl -s -X POST "$BASE_URL/actions" \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Collecte solidaire terminée\",
    \"description\": \"Action créée pour tester le minimum de 3 participants, le flux complet et les points.\",
    \"location\": [48.8566, 2.3522],
    \"category\": \"SOCIAL\",
    \"imagesList\": [],
    \"scheduled_at\": \"$SCHEDULED_AT\"
  }")

echo "$CREATE_COMPLETE_RES" | jq .
COMPLETED_ACTION_ID=$(echo "$CREATE_COMPLETE_RES" | jq -r '.action_id')
echo "COMPLETED ACTION ID = $COMPLETED_ACTION_ID"
echo -e "\n"

echo "=========================================="
echo " 18. USER B REJOINT L'ACTION"
echo "=========================================="
curl -s -X POST "$BASE_URL/participations/$COMPLETED_ACTION_ID" \
  -H "Authorization: Bearer $TOKEN_B" | jq .
echo -e "\n"

echo "=========================================="
echo " 19. USER C REJOINT L'ACTION"
echo "=========================================="
curl -s -X POST "$BASE_URL/participations/$COMPLETED_ACTION_ID" \
  -H "Authorization: Bearer $TOKEN_C" | jq .
echo -e "\n"

echo "=========================================="
echo " 20. VOIR LES PARTICIPANTS"
echo " Il doit y avoir B + C = 2 participants"
echo "=========================================="
curl -s -X GET "$BASE_URL/participations/action/$COMPLETED_ACTION_ID" | jq .
echo -e "\n"

echo "=========================================="
echo " 21. USER A ESSAIE D'APPROUVER AVEC 2 PARTICIPANTS"
echo " Doit échouer 400"
echo "=========================================="
curl -i -X PATCH "$BASE_URL/actions/$COMPLETED_ACTION_ID/approve" \
  -H "Authorization: Bearer $TOKEN_A"
echo -e "\n"

echo "=========================================="
echo " 22. VERIFIER QUE L'ACTION EST TOUJOURS PENDING"
echo "=========================================="
curl -s -X GET "$BASE_URL/actions/$COMPLETED_ACTION_ID" | jq .
echo -e "\n"

echo "=========================================="
echo " 23. USER D REJOINT L'ACTION"
echo " On atteint 3 participants"
echo "=========================================="
curl -s -X POST "$BASE_URL/participations/$COMPLETED_ACTION_ID" \
  -H "Authorization: Bearer $TOKEN_D" | jq .
echo -e "\n"

echo "=========================================="
echo " 24. VOIR LES 3 PARTICIPANTS"
echo " B + C + D doivent rester visibles en base"
echo "=========================================="
curl -s -X GET "$BASE_URL/participations/action/$COMPLETED_ACTION_ID" | jq .
echo -e "\n"

echo "=========================================="
echo " 25. POINTS AVANT APPROBATION / COMPLETION"
echo "=========================================="
A_BEFORE_RES=$(curl -s -X GET "$BASE_URL/auth/me" -H "Authorization: Bearer $TOKEN_A")
B_BEFORE_RES=$(curl -s -X GET "$BASE_URL/auth/me" -H "Authorization: Bearer $TOKEN_B")
C_BEFORE_RES=$(curl -s -X GET "$BASE_URL/auth/me" -H "Authorization: Bearer $TOKEN_C")
D_BEFORE_RES=$(curl -s -X GET "$BASE_URL/auth/me" -H "Authorization: Bearer $TOKEN_D")

A_BEFORE=$(echo "$A_BEFORE_RES" | jq -r '.points')
B_BEFORE=$(echo "$B_BEFORE_RES" | jq -r '.points')
C_BEFORE=$(echo "$C_BEFORE_RES" | jq -r '.points')
D_BEFORE=$(echo "$D_BEFORE_RES" | jq -r '.points')

echo "A (créateur)    : $A_BEFORE"
echo "B (participant) : $B_BEFORE"
echo "C (participant) : $C_BEFORE"
echo "D (participant) : $D_BEFORE"
echo -e "\n"

echo "=========================================="
echo " 26. USER A APPROUVE AVEC 3 PARTICIPANTS"
echo " Doit réussir"
echo "=========================================="
APPROVE_RES=$(curl -s -X PATCH "$BASE_URL/actions/$COMPLETED_ACTION_ID/approve" \
  -H "Authorization: Bearer $TOKEN_A")

echo "$APPROVE_RES" | jq .
echo -e "\n"

echo "=========================================="
echo " 27. VERIFIER LE STATUT APPROVED"
echo "=========================================="
curl -s -X GET "$BASE_URL/actions/$COMPLETED_ACTION_ID" | jq .
echo -e "\n"

echo "=========================================="
echo " 28. USER A COMPLETE SON ACTION"
echo " Les 3 participants sont toujours présents"
echo "=========================================="
COMPLETE_RES=$(curl -s -X PATCH "$BASE_URL/actions/$COMPLETED_ACTION_ID/complete" \
  -H "Authorization: Bearer $TOKEN_A")

echo "$COMPLETE_RES" | jq .
echo -e "\n"

echo "=========================================="
echo " 29. VERIFIER QUE L'ACTION RESTE EN BASE"
echo " ET QUE SON STATUT EST COMPLETED"
echo "=========================================="
curl -s -X GET "$BASE_URL/actions/$COMPLETED_ACTION_ID" | jq .
echo -e "\n"

echo "=========================================="
echo " 30. VERIFIER QUE LES PARTICIPATIONS"
echo " RESTENT EN BASE APRES COMPLETION"
echo "=========================================="
curl -s -X GET "$BASE_URL/participations/action/$COMPLETED_ACTION_ID" | jq .
echo -e "\n"

echo "=========================================="
echo " 31. POINTS APRES COMPLETION"
echo "=========================================="
A_AFTER_RES=$(curl -s -X GET "$BASE_URL/auth/me" -H "Authorization: Bearer $TOKEN_A")
B_AFTER_RES=$(curl -s -X GET "$BASE_URL/auth/me" -H "Authorization: Bearer $TOKEN_B")
C_AFTER_RES=$(curl -s -X GET "$BASE_URL/auth/me" -H "Authorization: Bearer $TOKEN_C")
D_AFTER_RES=$(curl -s -X GET "$BASE_URL/auth/me" -H "Authorization: Bearer $TOKEN_D")

A_AFTER=$(echo "$A_AFTER_RES" | jq -r '.points')
B_AFTER=$(echo "$B_AFTER_RES" | jq -r '.points')
C_AFTER=$(echo "$C_AFTER_RES" | jq -r '.points')
D_AFTER=$(echo "$D_AFTER_RES" | jq -r '.points')

echo "A : $A_BEFORE -> $A_AFTER"
echo "B : $B_BEFORE -> $B_AFTER"
echo "C : $C_BEFORE -> $C_AFTER"
echo "D : $D_BEFORE -> $D_AFTER"

if [[ "$A_BEFORE" =~ ^-?[0-9]+$ && "$A_AFTER" =~ ^-?[0-9]+$ ]]; then
  echo "Gain A = $((A_AFTER - A_BEFORE)) point(s)"
fi

if [[ "$B_BEFORE" =~ ^-?[0-9]+$ && "$B_AFTER" =~ ^-?[0-9]+$ ]]; then
  echo "Gain B = $((B_AFTER - B_BEFORE)) point(s)"
fi

if [[ "$C_BEFORE" =~ ^-?[0-9]+$ && "$C_AFTER" =~ ^-?[0-9]+$ ]]; then
  echo "Gain C = $((C_AFTER - C_BEFORE)) point(s)"
fi

if [[ "$D_BEFORE" =~ ^-?[0-9]+$ && "$D_AFTER" =~ ^-?[0-9]+$ ]]; then
  echo "Gain D = $((D_AFTER - D_BEFORE)) point(s)"
fi

echo -e "\n"

echo "=========================================="
echo " 32. ACTION COMPLETED NON MODIFIABLE"
echo " Doit échouer 400"
echo "=========================================="
curl -i -X PATCH "$BASE_URL/actions/$COMPLETED_ACTION_ID" \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Cette action terminée ne doit plus être modifiable"
  }'
echo -e "\n"

echo "=========================================="
echo " 33. LISTE DES ACTIONS COMPLETED"
echo " L'action test doit apparaître"
echo "=========================================="
curl -s -X GET "$BASE_URL/actions?status=COMPLETED" | jq .
echo -e "\n"

echo "=========================================="
echo " TESTS ACTION MANAGEMENT TERMINES"
echo "=========================================="
echo "Action CANCELLED conservée en base : $ACTION_ID"
echo "Action COMPLETED conservée en base : $COMPLETED_ACTION_ID"
echo
echo "Participants attendus sur l'action COMPLETED :"
echo "  - USER B"
echo "  - USER C"
echo "  - USER D"
echo
echo "Statuts finaux attendus :"
echo "  - $ACTION_ID -> CANCELLED"
echo "  - $COMPLETED_ACTION_ID -> COMPLETED"
echo
echo "Points :"
echo "  A : $A_BEFORE -> $A_AFTER"
echo "  B : $B_BEFORE -> $B_AFTER"
echo "  C : $C_BEFORE -> $C_AFTER"
echo "  D : $D_BEFORE -> $D_AFTER"
echo "=========================================="
