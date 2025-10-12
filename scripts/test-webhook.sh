#!/bin/bash

echo "=== TESTANDO WEBHOOK COM DADOS REAIS ==="
echo

curl -X POST http://localhost:3000/api/test-webhook \
  -H "Content-Type: application/json" \
  -d '{"userId": "3f0e0184-c0a7-487e-b611-72890b39dcce"}'

echo
echo "=== TESTE CONCLUÍDO ==="
