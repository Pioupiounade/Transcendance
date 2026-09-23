#!/bin/bash

BASE_URL="http://localhost:3000"

STAMP=$(date +%s)
EMAIL_A="friend.a.${STAMP}@example.com"
EMAIL_B="friend.b.${STAMP}@example.com"
PASSWORD="Password123!"

echo "=========================================="
echo " 1. REGISTER USER A"
echo "=========================================="
REGISTER_A=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL_A\", \"password\": \"$PASSWORD\"}")

echo "$REGISTER_A" | jq .
echo -e "\n"

echo "=========================================="
echo " 2. REGISTER USER B"
echo "=========================================="
REGISTER_B=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL_B\", \"password\": \"$PASSWORD\"}")

echo "$REGISTER_B" | jq .
echo -e "\n"

echo "=========================================="
echo " 3. LOGIN USER A"
echo "=========================================="
LOGIN_A=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL_A\", \"password\": \"$PASSWORD\"}")

echo "$LOGIN_A" | jq .
TOKEN_A=$(echo "$LOGIN_A" | jq -r '.access_token')
echo -e "\n"

echo "=========================================="
echo " 4. LOGIN USER B"
echo "=========================================="
LOGIN_B=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL_B\", \"password\": \"$PASSWORD\"}")

echo "$LOGIN_B" | jq .
TOKEN_B=$(echo "$LOGIN_B" | jq -r '.access_token')
echo -e "\n"

echo "=========================================="
echo " 5. GET USER IDS"
echo "=========================================="
ME_A=$(curl -s -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN_A")

ME_B=$(curl -s -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN_B")

USER_A_ID=$(echo "$ME_A" | jq -r '.user_id // .id')
USER_B_ID=$(echo "$ME_B" | jq -r '.user_id // .id')

echo "USER A ID = $USER_A_ID"
echo "USER B ID = $USER_B_ID"
echo -e "\n"

echo "=========================================="
echo " 6. A ENVOIE UNE DEMANDE A B"
echo "=========================================="
SEND_RES=$(curl -s -X PATCH "$BASE_URL/friend-requests/me/send" \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d "{\"addressee_id\": \"$USER_B_ID\"}")

echo "$SEND_RES" | jq .

REQUEST_ID=$(echo "$SEND_RES" | jq -r '.friend_request_id')
echo "REQUEST ID = $REQUEST_ID"
echo -e "\n"

echo "=========================================="
echo " 7. A RENVOIE LA MEME DEMANDE"
echo " Doit échouer 400"
echo "=========================================="
curl -i -X PATCH "$BASE_URL/friend-requests/me/send" \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d "{\"addressee_id\": \"$USER_B_ID\"}"
echo -e "\n"

echo "=========================================="
echo " 8. A VOIT SES DEMANDES ENVOYEES"
echo "=========================================="
curl -s -X GET "$BASE_URL/friend-requests/sentRequests" \
  -H "Authorization: Bearer $TOKEN_A" | jq .
echo -e "\n"

echo "=========================================="
echo " 9. B VOIT SES DEMANDES RECUES"
echo "=========================================="
curl -s -X GET "$BASE_URL/friend-requests/receivedRequests" \
  -H "Authorization: Bearer $TOKEN_B" | jq .
echo -e "\n"

echo "=========================================="
echo " 10. A ESSAIE D'ACCEPTER SA PROPRE DEMANDE"
echo " Doit échouer 403"
echo "=========================================="
curl -i -X PATCH "$BASE_URL/friend-requests/$REQUEST_ID/accept" \
  -H "Authorization: Bearer $TOKEN_A"
echo -e "\n"

echo "=========================================="
echo " 11. B ACCEPTE LA DEMANDE"
echo "=========================================="
curl -s -X PATCH "$BASE_URL/friend-requests/$REQUEST_ID/accept" \
  -H "Authorization: Bearer $TOKEN_B" | jq .
echo -e "\n"

echo "=========================================="
echo " 12. A VOIT B DANS SES AMIS"
echo "=========================================="
curl -s -X GET "$BASE_URL/friendships/me" \
  -H "Authorization: Bearer $TOKEN_A" | jq .
echo -e "\n"

echo "=========================================="
echo " 13. A ESSAIE DE RENVOYER UNE DEMANDE"
echo " Doit échouer car amitié ACTIVE"
echo "=========================================="
curl -i -X PATCH "$BASE_URL/friend-requests/me/send" \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d "{\"addressee_id\": \"$USER_B_ID\"}"
echo -e "\n"

echo "=========================================="
echo " 14. A BLOQUE B"
echo "=========================================="
curl -s -X PATCH "$BASE_URL/friendships/$USER_B_ID/block" \
  -H "Authorization: Bearer $TOKEN_A" | jq .
echo -e "\n"

echo "=========================================="
echo " 15. B ESSAIE DE DEBLOQUER"
echo " Doit échouer 403"
echo "=========================================="
curl -i -X PATCH "$BASE_URL/friendships/$USER_A_ID/unblock" \
  -H "Authorization: Bearer $TOKEN_B"
echo -e "\n"

echo "=========================================="
echo " 16. A DEBLOQUE B"
echo "=========================================="
curl -s -X PATCH "$BASE_URL/friendships/$USER_B_ID/unblock" \
  -H "Authorization: Bearer $TOKEN_A" | jq .
echo -e "\n"

echo "=========================================="
echo " 17. A SUPPRIME B DE SES AMIS"
echo "=========================================="
curl -s -X DELETE "$BASE_URL/friendships/$USER_B_ID" \
  -H "Authorization: Bearer $TOKEN_A" | jq .
echo -e "\n"

echo "=========================================="
echo " 18. A VERIFIE QUE B N'EST PLUS AMI"
echo "=========================================="
curl -s -X GET "$BASE_URL/friendships/me" \
  -H "Authorization: Bearer $TOKEN_A" | jq .
echo -e "\n"

echo "=========================================="
echo " 19. A ESSAIE DE S'AJOUTER LUI-MEME"
echo " Doit échouer 400"
echo "=========================================="
curl -i -X PATCH "$BASE_URL/friend-requests/me/send" \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d "{\"addressee_id\": \"$USER_A_ID\"}"
echo -e "\n"

echo "=========================================="
echo " 20. TEST DU REJET"
echo "=========================================="

SEND_RES_2=$(curl -s -X PATCH "$BASE_URL/friend-requests/me/send" \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d "{\"addressee_id\": \"$USER_B_ID\"}")

echo "$SEND_RES_2" | jq .

REQUEST_ID_2=$(echo "$SEND_RES_2" | jq -r '.friend_request_id')

echo "B rejette la demande $REQUEST_ID_2"

curl -s -X PATCH "$BASE_URL/friend-requests/$REQUEST_ID_2/reject" \
  -H "Authorization: Bearer $TOKEN_B" | jq .


echo "=========================================="
echo " 21. CREER UNE AMITIE ACTIVE QUI RESTE EN BASE"
echo "=========================================="

EMAIL_C="friend.c.${STAMP}@example.com"

REGISTER_C=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL_C\", \"password\": \"$PASSWORD\"}")

echo "$REGISTER_C" | jq .

LOGIN_C=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL_C\", \"password\": \"$PASSWORD\"}")

TOKEN_C=$(echo "$LOGIN_C" | jq -r '.access_token')

ME_C=$(curl -s -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN_C")

USER_C_ID=$(echo "$ME_C" | jq -r '.user_id // .id')

echo "USER C ID = $USER_C_ID"

SEND_RES_3=$(curl -s -X PATCH "$BASE_URL/friend-requests/me/send" \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d "{\"addressee_id\": \"$USER_C_ID\"}")

echo "$SEND_RES_3" | jq .

REQUEST_ID_3=$(echo "$SEND_RES_3" | jq -r '.friend_request_id')

curl -s -X PATCH "$BASE_URL/friend-requests/$REQUEST_ID_3/accept" \
  -H "Authorization: Bearer $TOKEN_C" | jq .

echo "Amitié A <-> C laissée ACTIVE en base."
echo -e "\n"

echo "=========================================="
echo " 22. CREER UNE AMITIE BLOCKED QUI RESTE EN BASE"
echo "=========================================="

EMAIL_D="friend.d.${STAMP}@example.com"

REGISTER_D=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL_D\", \"password\": \"$PASSWORD\"}")

echo "$REGISTER_D" | jq .

LOGIN_D=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL_D\", \"password\": \"$PASSWORD\"}")

TOKEN_D=$(echo "$LOGIN_D" | jq -r '.access_token')

ME_D=$(curl -s -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN_D")

USER_D_ID=$(echo "$ME_D" | jq -r '.user_id // .id')

echo "USER D ID = $USER_D_ID"

SEND_RES_4=$(curl -s -X PATCH "$BASE_URL/friend-requests/me/send" \
  -H "Authorization: Bearer $TOKEN_B" \
  -H "Content-Type: application/json" \
  -d "{\"addressee_id\": \"$USER_D_ID\"}")

echo "$SEND_RES_4" | jq .

REQUEST_ID_4=$(echo "$SEND_RES_4" | jq -r '.friend_request_id')

curl -s -X PATCH "$BASE_URL/friend-requests/$REQUEST_ID_4/accept" \
  -H "Authorization: Bearer $TOKEN_D" | jq .

curl -s -X PATCH "$BASE_URL/friendships/$USER_D_ID/block" \
  -H "Authorization: Bearer $TOKEN_B" | jq .

echo "Amitié B <-> D laissée BLOCKED en base."
echo -e "\n"

echo "=========================================="
echo " ETAT FINAL ATTENDU DANS FRIENDSHIP"
echo "=========================================="
echo "ACTIVE  : user $USER_A_ID <-> user $USER_C_ID"
echo "BLOCKED : user $USER_B_ID <-> user $USER_D_ID"
echo
echo "Ces deux lignes ne sont PAS supprimées par le script."
echo "Tu peux les vérifier dans Prisma Studio."
echo "=========================================="

echo "=========================================="
echo " TESTS FRIEND MANAGEMENT TERMINES"
echo "=========================================="
