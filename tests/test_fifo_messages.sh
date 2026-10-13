#!/bin/bash
set -e

BASE_URL="http://localhost:3000"

EMAIL1="fifo_user1_$(date +%s)@example.com"
EMAIL2="fifo_user2_$(date +%s)@example.com"
PASSWORD="Password123!"

echo "=========================================="
echo " 0. SETUP: Inscription & Connexion"
echo "=========================================="
curl -s -X POST "$BASE_URL/auth/register" -H "Content-Type: application/json" -d "{\"email\": \"$EMAIL1\", \"password\": \"$PASSWORD\"}" > /dev/null
curl -s -X POST "$BASE_URL/auth/register" -H "Content-Type: application/json" -d "{\"email\": \"$EMAIL2\", \"password\": \"$PASSWORD\"}" > /dev/null

# Connexion User 1
LOGIN1=$(curl -s -X POST "$BASE_URL/auth/login" -H "Content-Type: application/json" -d "{\"email\": \"$EMAIL1\", \"password\": \"$PASSWORD\"}")
TOKEN1=$(echo "$LOGIN1" | jq -r '.access_token')
ID1=$(curl -s -X GET "$BASE_URL/auth/me" -H "Authorization: Bearer $TOKEN1" | jq -r '.id // .user_id')

# Connexion User 2
LOGIN2=$(curl -s -X POST "$BASE_URL/auth/login" -H "Content-Type: application/json" -d "{\"email\": \"$EMAIL2\", \"password\": \"$PASSWORD\"}")
TOKEN2=$(echo "$LOGIN2" | jq -r '.access_token')
ID2=$(curl -s -X GET "$BASE_URL/auth/me" -H "Authorization: Bearer $TOKEN2" | jq -r '.id // .user_id')

echo "User 1 ID: $ID1"
echo "User 2 ID: $ID2"

echo "=========================================="
echo " 0.1 ÉTABLISSEMENT DE L'AMITIÉ"
echo "=========================================="
curl -s -X PATCH "$BASE_URL/friend-requests/me/send" \
  -H "Authorization: Bearer $TOKEN1" \
  -H "Content-Type: application/json" \
  -d "{\"addressee_id\": \"$ID2\"}" > /dev/null

REQ_JSON=$(curl -s -X GET "$BASE_URL/friend-requests/receivedRequests" \
  -H "Authorization: Bearer $TOKEN2")
REQ_ID=$(echo "$REQ_JSON" | jq -r '.[0].id // .[0].request_id // .[0].friend_request_id')

curl -s -X PATCH "$BASE_URL/friend-requests/$REQ_ID/accept" \
  -H "Authorization: Bearer $TOKEN2" > /dev/null
echo "Amitié établie entre User 1 et User 2 !"
echo -e "\n"

echo "=========================================="
echo " 1. SPAM DE 260 MESSAGES (Test rotation FIFO)"
echo "=========================================="
echo "Envoi de 260 messages en cours (patientez quelques secondes)..."
for ((i=1; i<=260; i++)); do
  curl -s -X POST "$BASE_URL/direct-messages/$ID2" \
    -H "Authorization: Bearer $TOKEN1" \
    -H "Content-Type: application/json" \
    -d "{\"content\": \"Message spam numéro $i\"}" > /dev/null
  
  # Affichage d'un petit retour visuel tous les 50 messages
  if (( i % 50 == 0 )); then
    echo "$i messages envoyés..."
  fi
done
echo "Spam terminé ! Tous les messages ont été envoyés."
echo -e "\n"

echo "=========================================="
echo " 2. VÉRIFICATION DU PLAFOND (Doit être exactement 256)"
echo "=========================================="
MESSAGES_JSON=$(curl -s -X GET "$BASE_URL/direct-messages/$ID1" \
  -H "Authorization: Bearer $TOKEN2")

TOTAL_COUNT=$(echo "$MESSAGES_JSON" | jq length)
echo "Nombre total de messages récupérés dans l'historique : $TOTAL_COUNT"

if [ "$TOTAL_COUNT" -eq 256 ]; then
  echo "SUCCÈS : Le mécanisme FIFO a bien plafonné l'historique à 256 messages !"
else
  echo "ÉCHEC : Le nombre de messages est de $TOTAL_COUNT (attendu : 256)"
fi
echo -e "\n"

echo "=========================================="
echo " 3. VÉRIFICATION DES BORNES (Le premier doit être le #5)"
echo "=========================================="
# Si 260 messages ont été envoyés et que seuls les 256 derniers sont gardés, 
# le premier message de la liste doit être le numéro 5.
FIRST_MSG=$(echo "$MESSAGES_JSON" | jq -r '.[0].content')
LAST_MSG=$(echo "$MESSAGES_JSON" | jq -r '.[255].content')

echo "Premier message de la liste : '$FIRST_MSG'"
echo "Dernier message de la liste  : '$LAST_MSG'"

echo "=========================================="
echo " TEST FIFO TERMINÉ !"
echo "=========================================="