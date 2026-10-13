#!/bin/bash
set -e

BASE_URL="http://localhost:3000"

# Génération d'e-mails uniques pour chaque test run
EMAIL1="user1_$(date +%s)@example.com"
EMAIL2="user2_$(date +%s)@example.com"
EMAIL3="user3_$(date +%s)@example.com"
PASSWORD="Password123!"

echo "=========================================="
echo " 0. SETUP: Inscription & Connexion"
echo "=========================================="
curl -s -X POST "$BASE_URL/auth/register" -H "Content-Type: application/json" -d "{\"email\": \"$EMAIL1\", \"password\": \"$PASSWORD\"}" > /dev/null
curl -s -X POST "$BASE_URL/auth/register" -H "Content-Type: application/json" -d "{\"email\": \"$EMAIL2\", \"password\": \"$PASSWORD\"}" > /dev/null
curl -s -X POST "$BASE_URL/auth/register" -H "Content-Type: application/json" -d "{\"email\": \"$EMAIL3\", \"password\": \"$PASSWORD\"}" > /dev/null

# Connexion User 1
LOGIN1=$(curl -s -X POST "$BASE_URL/auth/login" -H "Content-Type: application/json" -d "{\"email\": \"$EMAIL1\", \"password\": \"$PASSWORD\"}")
TOKEN1=$(echo "$LOGIN1" | jq -r '.access_token')
ID1=$(curl -s -X GET "$BASE_URL/auth/me" -H "Authorization: Bearer $TOKEN1" | jq -r '.id // .user_id')

# Connexion User 2
LOGIN2=$(curl -s -X POST "$BASE_URL/auth/login" -H "Content-Type: application/json" -d "{\"email\": \"$EMAIL2\", \"password\": \"$PASSWORD\"}")
TOKEN2=$(echo "$LOGIN2" | jq -r '.access_token')
ID2=$(curl -s -X GET "$BASE_URL/auth/me" -H "Authorization: Bearer $TOKEN2" | jq -r '.id // .user_id')

# Connexion User 3 (Restera non-ami)
LOGIN3=$(curl -s -X POST "$BASE_URL/auth/login" -H "Content-Type: application/json" -d "{\"email\": \"$EMAIL3\", \"password\": \"$PASSWORD\"}")
TOKEN3=$(echo "$LOGIN3" | jq -r '.access_token')
ID3=$(curl -s -X GET "$BASE_URL/auth/me" -H "Authorization: Bearer $TOKEN3" | jq -r '.id // .user_id')

echo "User 1 ID: $ID1"
echo "User 2 ID: $ID2"
echo "User 3 ID: $ID3 (Non-ami)"
echo -e "\n"

echo "=========================================="
echo " 0.1 ÉTABLISSEMENT DE LA DEMANDE D'AMITIÉ"
echo "=========================================="
# Envoi de la demande d'ami avec le bon champ addressee_id
curl -s -X PATCH "$BASE_URL/friend-requests/me/send" \
  -H "Authorization: Bearer $TOKEN1" \
  -H "Content-Type: application/json" \
  -d "{\"addressee_id\": \"$ID2\"}" > /dev/null

echo "--- DEBUG REQUÊTES REÇUES PAR USER 2 ---"
REQ_JSON=$(curl -s -X GET "$BASE_URL/friend-requests/receivedRequests" \
  -H "Authorization: Bearer $TOKEN2")
echo "$REQ_JSON" | jq .

# Récupération de l'ID de la requête d'ami
REQ_ID=$(echo "$REQ_JSON" | jq -r '.[0].id // .[0].request_id // .[0].friend_request_id')
echo "ID extrait de la requête : $REQ_ID"

# Acceptation de la demande par User 2
curl -s -X PATCH "$BASE_URL/friend-requests/$REQ_ID/accept" \
  -H "Authorization: Bearer $TOKEN2" > /dev/null
echo "Amitié acceptée avec succès entre User 1 et User 2 !"
echo -e "\n"

echo "=========================================="
echo " 1. TEST ERREUR 403 : Message à un non-ami (User 3)"
echo "=========================================="
curl -s -i -X POST "$BASE_URL/direct-messages/$ID3" \
  -H "Authorization: Bearer $TOKEN1" \
  -H "Content-Type: application/json" \
  -d '{"content": "Ceci doit échouer car pas amis"}'
echo -e "\n"

echo "=========================================="
echo " 2. TEST ERREUR 400 : DTO Validation (Message > 280 caractères)"
echo "=========================================="
LONG_MSG=$(printf 'a%.0s' {1..281})
curl -s -i -X POST "$BASE_URL/direct-messages/$ID2" \
  -H "Authorization: Bearer $TOKEN1" \
  -H "Content-Type: application/json" \
  -d "{\"content\": \"$LONG_MSG\"}"
echo -e "\n"

echo "=========================================="
echo " 3. TEST SUCCÈS 201 : Envoi d'un message valide (User 1 -> User 2)"
echo "=========================================="
curl -s -X POST "$BASE_URL/direct-messages/$ID2" \
  -H "Authorization: Bearer $TOKEN1" \
  -H "Content-Type: application/json" \
  -d '{"content": "Salut User 2, premier message direct fonctionnel !"}' | jq .
echo -e "\n"

echo "=========================================="
echo " 4. TEST SUCCÈS 200 : Récupération & Marquage lu (User 2 lit les messages)"
echo "=========================================="
curl -s -X GET "$BASE_URL/direct-messages/$ID1" \
  -H "Authorization: Bearer $TOKEN2" | jq .
echo -e "\n"

echo "=========================================="
echo " 5. TEST NOTIFICATION : Vérifier que User 2 a reçu la notif NEW_MESSAGE"
echo "=========================================="
curl -s -X GET "$BASE_URL/notifications/me" \
  -H "Authorization: Bearer $TOKEN2" | jq .
echo -e "\n"

echo "=========================================="
echo " TOUS LES TESTS SONT TERMINÉS !"
echo "=========================================="