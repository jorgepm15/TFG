#!/bin/bash
echo "🔓 Testing Race Condition en VulnBank (Docker)..."

# Reset inicial
curl -X POST http://localhost:3001/api/reset

echo "Balance inicial user1:"
curl http://localhost:3001/api/balance/user1

echo -e "\n🚀 Enviando 5 transferencias concurrentes..."

for i in {1..5}; do
  curl -X POST http://localhost:3001/api/transfer \
    -H "Content-Type: application/json" \
    -d '{"fromAccount":"user1","toAccount":"user2","amount":300}' &
done

wait
echo -e "\n\nBalance final user1:"
curl http://localhost:3001/api/balance/user1