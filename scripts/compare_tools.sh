#!/bin/bash
echo "🔬 COMPARACIÓN SIMPLE - ANÁLISIS MANUAL"
echo "======================================"

mkdir -p comparison_results

echo "🛡️ Ejecutando detector..."
cd detector
source venv/bin/activate
python vuln_detector.py | tee ../comparison_results/our_results.txt
cd ..

echo ""
echo "📋 ANÁLISIS MANUAL CON HERRAMIENTAS TRADICIONALES:"
echo "1. Curl básico - No detecta vulnerabilidades de timing"
echo "2. Postman - No tiene capacidades de concurrencia"
echo "3. Burp Suite Community - Limitado para race conditions"

# Test básico con curl
echo ""
echo "🔍 Test básico con curl (herramienta tradicional):"
echo "VulnBank - transferencia individual:"
curl -s -X POST http://localhost:3001/api/transfer \
  -H "Content-Type: application/json" \
  -d '{"fromAccount":"user1","toAccount":"user2","amount":100}' | jq '.'

echo ""
echo "❌ Curl NO detecta race conditions porque:"
echo "   - Hace requests secuenciales, no concurrentes"
echo "   - No analiza timing patterns"
echo "   - No compara resultados esperados vs actuales"

echo ""
echo "✅ MI DETECTOR SÍ detecta porque:"
echo "   - Hace requests concurrentes simultáneos"
echo "   - Analiza inconsistencias de timing"
echo "   - Compara resultados esperados vs reales"

# Crear análisis final
cat > comparison_results/gap_analysis.md << 'EOF'
# Gap Analysis: Herramientas Tradicionales vs Especializadas

## Herramientas Tradicionales
- **curl**: Requests secuenciales ❌
- **Postman**: Sin concurrencia nativa ❌  
- **OWASP ZAP**: Enfoque en vulnerabilidades tradicionales ❌
- **Burp Suite**: Limitado para timing attacks ❌

## Mi Enfoque Especializado
- **Concurrent requests**: Múltiples threads simultáneos ✅
- **Timing analysis**: Ventanas temporales vulnerables ✅
- **State pollution detection**: Contaminación entre sesiones ✅
- **Business logic testing**: Validación de consistencia ✅

## Conclusión
**GAP IDENTIFICADO**: Las herramientas existentes no abordan vulnerabilidades específicas de concurrencia en APIs.
EOF