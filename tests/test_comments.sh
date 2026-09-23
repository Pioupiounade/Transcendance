#!/bin/bash

BASE_URL="http://localhost:3000"
RANDOM_SUFFIX=$(date +%s)
EMAIL="user_${RANDOM_SUFFIX}@example.com"
PASSWORD="Password123!"

echo "=========================================="
echo " 1. REGISTER (Création d'un utilisateur vierge)"
echo "=========================================="
REGISTER_RES=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")

echo "$REGISTER_RES" | jq .
echo -e "\n"

echo "=========================================="
echo " 2. LOGIN (Récupération de l'access_token)"
echo "=========================================="
LOGIN_RES=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")

ACCESS_TOKEN=$(echo "$LOGIN_RES" | jq -r '.access_token')

if [ "$ACCESS_TOKEN" = "null" ] || [ -z "$ACCESS_TOKEN" ]; then
  echo "Erreur : Impossible de récupérer l'access_token."
  exit 1
fi

echo "Access Token récupéré avec succès."
echo -e "\n"

echo "=========================================="
echo " 3. CRÉATION DU PROFIL (Avec location)"
echo "=========================================="
PROFILE_RES=$(curl -s -X POST "$BASE_URL/profiles" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"user_${RANDOM_SUFFIX}\",
    \"description\": \"Profil de test vierge\",
    \"location\": [2.3522, 48.8566]
  }")

echo "$PROFILE_RES" | jq .
echo -e "\n"

echo "=========================================="
echo " 4. CRÉATION D'UNE ACTION DE TEST"
echo "=========================================="
ACTION_RES=$(curl -s -X POST "$BASE_URL/actions" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Action Vierge de Test",
    "description": "Description pour tester les commentaires",
    "category": "ENVIRONMENT",
    "scheduled_at": "2026-10-01T12:00:00Z",
    "location": [2.3522, 48.8566]
  }')

echo "$ACTION_RES" | jq .
ACTION_ID=$(echo "$ACTION_RES" | jq -r '.action_id // .id')

if [ "$ACTION_ID" = "null" ] || [ -z "$ACTION_ID" ]; then
  echo "Erreur : Impossible de créer ou récupérer l'ID de l'action."
  exit 1
fi

echo "Action ID généré : $ACTION_ID"
echo -e "\n"

echo "=========================================="
echo " 5. POST /ACTIONS/:id/comments (Ajouter un commentaire)"
echo "=========================================="
COMMENT_RES=$(curl -s -X POST "$BASE_URL/actions/$ACTION_ID/comments" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Premier commentaire posté depuis le script indépendant !"}')

echo "$COMMENT_RES" | jq .
echo -e "\n"

echo "=========================================="
echo " 6. GET /ACTIONS/:id/comments (Récupérer les commentaires)"
echo "=========================================="
curl -s -X GET "$BASE_URL/actions/$ACTION_ID/comments" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .
echo -e "\n"