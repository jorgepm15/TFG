#!/bin/bash
echo "🛡️ TFG Vulnerability Detector"
echo "============================="

# Check if APIs are running
echo "🔍 Checking API availability..."

for port in 3001 3002 3003; do
    if curl -s http://localhost:$port/api/info > /dev/null; then
        echo "✅ API on port $port is running"
    else
        echo "❌ API on port $port is not accessible"
        echo "Please ensure Docker containers are running: docker-compose up"
        exit 1
    fi
done

echo ""
echo "🚀 Starting vulnerability detection..."
python3 vuln_detector.py

echo ""
echo "📊 Scan completed! Check vulnerability_report.json for details."