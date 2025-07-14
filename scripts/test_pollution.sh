#!/bin/bash
echo "🔓 Testing Global State Pollution en VulnAuth (Docker)..."

# Reset inicial
curl -X POST http://localhost:3002/api/reset

echo -e "\n📊 Estado inicial:"
curl http://localhost:3002/api/info

echo -e "\n\n🚀 Test 1: Login concurrente admin y user1..."

# Login admin y user1 casi simultáneamente
curl -X POST http://localhost:3002/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' &

sleep 0.05  # 50ms delay

curl -X POST http://localhost:3002/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user1","password":"user123"}' &

wait

echo -e "\n\n📋 Perfil actual (debería ser admin, pero puede ser user1):"
curl http://localhost:3002/api/profile

echo -e "\n\n🔑 Acceso admin (puede fallar si user1 contaminó el estado):"
curl http://localhost:3002/api/admin/users

echo -e "\n\n🔄 Test 2: Múltiples logins rápidos..."
curl -X POST http://localhost:3002/api/reset

for user in "admin" "user1" "user2" "admin"; do
  curl -X POST http://localhost:3002/api/login \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"$user\",\"password\":\"$([ $user = 'admin' ] && echo 'admin123' || echo 'user123')\"}" &
  sleep 0.02
done

wait

echo -e "\n\n📋 Estado final:"
curl http://localhost:3002/api/profile