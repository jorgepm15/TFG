# Análisis y mitigación de vulnerabilidades en APIs y Servidores Concurrentes: Un enfoque práctico y teórico

**TFG - Universidad Autónoma de Madrid**  
**Autor:** Jorge Paniagua Moreno | **Fecha:** Julio 2025

## Descripción

Framework para detección de vulnerabilidades específicas de concurrencia en APIs, abordando un gap crítico en herramientas de análisis tradicionales.

**Vulnerabilidades analizadas:** Race Conditions, Global State Pollution, TOCTOU

## Instalación Rápida

```bash
# 1. Ejecutar APIs vulnerables
docker-compose up --build

# 2. Configurar detector (nueva terminal)
cd detector
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 3. Verificar instalación
curl http://localhost:3001/api/info
curl http://localhost:3002/api/info
curl http://localhost:3003/api/info
```

## Uso

### Tests Individuales

```bash
# Race Condition
./scripts/test_race.sh

# Global State Pollution
./scripts/test_pollution.sh

# TOCTOU
./scripts/test_toctou.sh
```

### Análisis Completo

```bash
cd detector
source venv/bin/activate
python vuln_detector.py
```

### Comparación y Reportes

```bash
# Comparar con herramientas tradicionales
./scripts/compare_simple.sh

# Generar reporte HTML
./scripts/generate_final_report.sh
```

## Resultados

| Herramienta | Detección | Efectividad |
|-------------|-----------|-------------|
| **Framework Desarrollado** | 3/3 vulnerabilidades | **100%** |
| curl, OWASP ZAP, Postman | 0/3 vulnerabilidades | **0%** |

### Evidencias Obtenidas

- **VulnBank:** Balance inconsistente por race condition (600 vs -1000 esperado)
- **VulnAuth:** Escalada de privilegios (user a admin permissions)
- **VulnShop:** Cupón aplicado 5 veces vs 1 permitido (67% descuento vs 20%)

## Arquitectura

```
├── vulnbank/          # API bancaria (Race Conditions)
├── vulnauth/          # API autenticación (State Pollution)
├── vulnshop/          # API e-commerce (TOCTOU)
├── detector/          # Framework de detección especializado
├── scripts/           # Tests y análisis automatizados
├── final_report/      # Reportes generados
└── comparison_results/ # Comparación con herramientas tradicionales
```

## APIs Vulnerables

| API | Puerto | Vulnerabilidad | Endpoint |
|-----|--------|----------------|----------|
| VulnBank | 3001 | Race Condition | `POST /api/transfer` |
| VulnAuth | 3002 | Global State Pollution | `POST /api/login` |
| VulnShop | 3003 | TOCTOU | `POST /api/apply-coupon` |

## Detector Especializado

**Características:**

- Análisis concurrente real (threading)
- Detección de ventanas temporales vulnerables
- Validación de consistencia de estado
- Performance: 7s análisis, menor 15% CPU, menor 50MB RAM

## Comandos Útiles

```bash
# Reset APIs
curl -X POST http://localhost:3001/api/reset
curl -X POST http://localhost:3002/api/reset
curl -X POST http://localhost:3003/api/reset

# Ver estados
curl http://localhost:3001/api/accounts
curl http://localhost:3003/api/orders

# Logs en tiempo real
docker-compose logs -f vulnbank

# Parar servicios
docker-compose down
```

## Contribución

Este TFG demuestra empíricamente que las herramientas tradicionales de seguridad API no detectan vulnerabilidades de concurrencia, validando la necesidad de enfoques especializados.

**Gap confirmado:** 100% detección framework especializado vs 0% herramientas tradicionales

---

**Aviso:** APIs contienen vulnerabilidades intencionadas para investigación. NO usar en producción.