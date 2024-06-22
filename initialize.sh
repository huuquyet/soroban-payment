#!/bin/bash

set -e

NETWORK=$1

SOROBAN_RPC_HOST=$2

USER="YOUR_PUBLIC_KEY" # your freighter public key

if [[ -d "./.soroban/contracts" ]]; then
  echo "Found existing '.soroban/contracts' directory; already initialized."
  exit 0
fi

if type soroban >/dev/null; then
  echo "Using soroban cli"
else
  echo "Soroban not found, install soroban cli"
  cargo install --locked soroban-cli --debug --features opt
fi

if [[ $SOROBAN_RPC_HOST != "" ]]; then
  SOROBAN_RPC_URL=$SOROBAN_RPC_HOST
elif [[ $NETWORK == "futurenet" ]]; then
  SOROBAN_RPC_URL="https://rpc-futurenet.stellar.org"
elif [[ $NETWORK == "testnet" ]]; then
  SOROBAN_RPC_URL="https://soroban-testnet.stellar.org"
else
  # assumes standalone on quickstart, which has the soroban/rpc path
  SOROBAN_RPC_URL="http://localhost:8000/soroban/rpc"
fi

case $NETWORK in
futurenet)
  echo "Using Futurenet network with RPC URL: $SOROBAN_RPC_URL"
  SOROBAN_NETWORK_PASSPHRASE="Test SDF Future Network ; October 2022"
  ;;
testnet)
  echo "Using Testnet network with RPC URL: $SOROBAN_RPC_URL"
  SOROBAN_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
  ;;
standalone)
  echo "Using standalone network with RPC URL: $SOROBAN_RPC_URL"
  SOROBAN_NETWORK_PASSPHRASE="Standalone Network ; February 2017"
  ;;
*)
  echo "Usage: $0 standalone|futurenet|testnet [rpc-host]"
  exit 1
  ;;
esac

echo "Add the $NETWORK network to cli client"
soroban network add \
  --rpc-url $SOROBAN_RPC_URL \
  --network-passphrase "$SOROBAN_NETWORK_PASSPHRASE" $NETWORK

# echo "Add $NETWORK to shared config"
# echo "{ \"network\": \"$NETWORK\", \"rpcUrl\": \"$SOROBAN_RPC_URL\", \"networkPassphrase\": \"$SOROBAN_NETWORK_PASSPHRASE\" }" > ./src/shared/config.json

if !(soroban keys ls | grep token-admin 2>&1 >/dev/null); then
  echo "Create the token-admin identity"
  soroban keys generate --global token-admin --network $NETWORK
fi

# This will fail if the account already exists, but it'll still be fine.
echo "Fund token-admin & user account from friendbot"
soroban keys fund --global token-admin --network $NETWORK
soroban keys fund --global $USER --network $NETWORK

ARGS="--network $NETWORK --source token-admin"

TOKEN_WASM="./target/wasm32-unknown-unknown/release/soroban_token_contract.wasm"
TOKEN_OPTIMIZED="./target/wasm32-unknown-unknown/release/soroban_token_contract.optimized.wasm"

# Compiles the smart contracts and stores WASM files in ./target/wasm32-unknown-unknown/release
echo "Build contracts"
soroban contract build
echo "Optimizing contracts"
soroban contract optimize --wasm $TOKEN_WASM

# Deploys the contracts and stores the contract IDs in .soroban

# The Demo Token contract is a Soroban token
echo "Deploy the Demo TOKEN contract"
TOKEN_ID="$(
  soroban contract deploy $ARGS \
    --wasm $TOKEN_OPTIMIZED
)"
echo "Contract deployed succesfully with ID: $TOKEN_ID"

# Initialize the contracts
echo "Initialize the Demo TOKEN contract"
soroban contract invoke \
  $ARGS \
  --id $TOKEN_ID \
  -- \
  initialize \
  --symbol DT \
  --decimal 7 \
  --name "Demo Token" \
  --admin token-admin

# Minting the Demo Token to user
echo "Minting the Demo TOKEN to user"
soroban contract invoke \
  $ARGS \
  --id $TOKEN_ID \
  -- \
  mint \
  --to $USER \
  --amount 1000000000

echo "Generate bindings contracts"
soroban contract bindings typescript \
  --network $NETWORK \
  --id $TOKEN_ID \
  --wasm $TOKEN_OPTIMIZED \
  --output-dir ./.soroban/contracts/token \
  --overwrite

echo "Done"
