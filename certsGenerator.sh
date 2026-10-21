#!/bin/bash
set -e

CERTS_DIR="nginx/certs"
PLAYER_DIR="to_player"

mkdir -p "$CERTS_DIR" "$PLAYER_DIR"


openssl genrsa -out $CERTS_DIR/ca.key 4096
openssl req -x509 -new -nodes -key $CERTS_DIR/ca.key -sha256 -days 3650 \
  -out $CERTS_DIR/ca.crt \
  -subj "/C=US/ST=CTF/L=Mecheland/O=MecheCTF/OU=CA/CN=PaymentCTF-CA"


openssl genrsa -out $CERTS_DIR/server.key 4096
openssl req -new -key $CERTS_DIR/server.key -out $CERTS_DIR/server.csr \
  -subj "/C=US/ST=CTF/L=Mecheland/O=MecheCTF/OU=Server/CN=shop.lamechedelospayments.org"
openssl x509 -req -in $CERTS_DIR/server.csr -CA $CERTS_DIR/ca.crt \
  -CAkey $CERTS_DIR/ca.key -CAcreateserial \
  -out $CERTS_DIR/server.crt -days 3650 -sha256


openssl genrsa -out $CERTS_DIR/client.key 4096
openssl req -new -key $CERTS_DIR/client.key -out $CERTS_DIR/client.csr \
  -subj "/C=US/ST=CTF/L=Mecheland/O=MecheCTF/OU=Client/CN=player"
openssl x509 -req -in $CERTS_DIR/client.csr -CA $CERTS_DIR/ca.crt \
  -CAkey $CERTS_DIR/ca.key -CAcreateserial \
  -out $CERTS_DIR/client.crt -days 3650 -sha256

cp $CERTS_DIR/ca.crt $PLAYER_DIR/
cp $CERTS_DIR/ca.key $PLAYER_DIR/

# 5. Generar PEM para el jugador
cat $CERTS_DIR/client.crt $CERTS_DIR/client.key > $PLAYER_DIR/client.pem

echo "[*] Archivos del jugador generados en $PLAYER_DIR:"
echo "    - ca.crt"
echo "    - ca.key"
echo "    - client.pem (listo para generar .pfx)"
