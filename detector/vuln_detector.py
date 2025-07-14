#!/usr/bin/env python3
"""
Detector de Vulnerabilidades de Concurrencia en APIs
TFG - Jorge Paniagua Moreno
"""

import requests
import threading
import time
import json
import statistics
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
import sys

class VulnerabilityDetector:
    def __init__(self):
        self.results = {
            'timestamp': datetime.now().isoformat(),
            'vulnerabilities': [],
            'summary': {},
            'apis_tested': []
        }
        
    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")
        
    def test_race_condition(self, api_url):
        """Detecta race conditions mediante análisis de timing"""
        self.log("🔍 Testing Race Conditions...")
        
        # Reset API
        try:
            requests.post(f"{api_url}/api/reset", timeout=5)
        except:
            pass
            
        # Get initial balance
        try:
            initial = requests.get(f"{api_url}/api/balance/user1", timeout=5)
            initial_balance = initial.json().get('balance', 1000)
        except:
            initial_balance = 1000
            
        # Concurrent transfer requests
        results = []
        threads = []
        
        def make_transfer():
            try:
                start_time = time.time()
                response = requests.post(
                    f"{api_url}/api/transfer",
                    json={"fromAccount": "user1", "toAccount": "user2", "amount": 400},
                    timeout=10
                )
                end_time = time.time()
                
                results.append({
                    'status_code': response.status_code,
                    'response': response.json(),
                    'timing': end_time - start_time,
                    'timestamp': start_time
                })
            except Exception as e:
                results.append({'error': str(e)})
        
        # Launch 5 concurrent requests
        start = time.time()
        for _ in range(5):
            thread = threading.Thread(target=make_transfer)
            threads.append(thread)
            thread.start()
            
        for thread in threads:
            thread.join()
            
        # Check final balance
        try:
            final = requests.get(f"{api_url}/api/balance/user1", timeout=5)
            final_balance = final.json().get('balance', 0)
        except:
            final_balance = 0
            
        # Analysis
        successful_transfers = [r for r in results if r.get('status_code') == 200]
        expected_balance = initial_balance - (len(successful_transfers) * 400)
        
        vulnerability = {
            'type': 'Race Condition',
            'api': api_url,
            'severity': 'HIGH',
            'details': {
                'initial_balance': initial_balance,
                'final_balance': final_balance,
                'expected_balance': expected_balance,
                'successful_transfers': len(successful_transfers),
                'inconsistency': abs(final_balance - expected_balance) > 0,
                'concurrent_requests': len(results),
                'timing_window': max([r.get('timing', 0) for r in results if 'timing' in r])
            },
            'evidence': results
        }
        
        if vulnerability['details']['inconsistency'] or len(successful_transfers) > 1:
            vulnerability['found'] = True
            self.log(f"🚨 RACE CONDITION DETECTED! Balance inconsistency: {final_balance} vs expected {expected_balance}")
        else:
            vulnerability['found'] = False
            self.log("✅ No race condition detected")
            
        return vulnerability
        
    def test_global_state_pollution(self, api_url):
        """Detecta global state pollution mediante requests concurrentes"""
        self.log("🔍 Testing Global State Pollution...")
        
        # Reset API
        try:
            requests.post(f"{api_url}/api/reset", timeout=5)
        except:
            pass
            
        results = []
        
        def concurrent_login(username, password):
            try:
                # Login
                login_response = requests.post(
                    f"{api_url}/api/login",
                    json={"username": username, "password": password},
                    timeout=10
                )
                
                # Immediate profile check
                time.sleep(0.1)  # Small delay
                profile_response = requests.get(f"{api_url}/api/profile", timeout=5)
                
                results.append({
                    'username': username,
                    'login_response': login_response.json() if login_response.status_code == 200 else None,
                    'profile_response': profile_response.json() if profile_response.status_code == 200 else None,
                    'timestamp': time.time()
                })
            except Exception as e:
                results.append({'username': username, 'error': str(e)})
        
        # Concurrent admin and user login
        admin_thread = threading.Thread(target=concurrent_login, args=("admin", "admin123"))
        user_thread = threading.Thread(target=concurrent_login, args=("user1", "user123"))
        
        admin_thread.start()
        time.sleep(0.05)  # 50ms delay
        user_thread.start()
        
        admin_thread.join()
        user_thread.join()
        
        # Analysis
        pollution_detected = False
        evidence = []
        
        for result in results:
            if result.get('profile_response'):
                profile_user = result['profile_response'].get('profile', {}).get('username')
                expected_user = result.get('username')
                
                # Check for privilege escalation
                extra_perms = result['profile_response'].get('profile', {}).get('extraPermissions', [])
                
                if profile_user != expected_user:
                    pollution_detected = True
                    evidence.append(f"User {expected_user} got profile of {profile_user}")
                    
                if expected_user == 'user1' and extra_perms:
                    pollution_detected = True
                    evidence.append(f"User1 got admin permissions: {extra_perms}")
        
        vulnerability = {
            'type': 'Global State Pollution',
            'api': api_url,
            'severity': 'CRITICAL' if pollution_detected else 'LOW',
            'found': pollution_detected,
            'details': {
                'concurrent_logins': len(results),
                'pollution_evidence': evidence,
                'state_confusion': pollution_detected
            },
            'evidence': results
        }
        
        if pollution_detected:
            self.log(f"🚨 GLOBAL STATE POLLUTION DETECTED! Evidence: {evidence}")
        else:
            self.log("✅ No global state pollution detected")
            
        return vulnerability
        
    def test_toctou_vulnerability(self, api_url):
        """Detecta vulnerabilidades TOCTOU en cupones"""
        self.log("🔍 Testing TOCTOU Vulnerabilities...")
        
        # Reset API
        try:
            requests.post(f"{api_url}/api/reset", timeout=5)
        except:
            pass
            
        # Get initial order state
        try:
            initial_order = requests.get(f"{api_url}/api/order/order1", timeout=5)
            initial_price = initial_order.json().get('finalPrice', 100)
        except:
            initial_price = 100
            
        results = []
        
        def apply_coupon():
            try:
                response = requests.post(
                    f"{api_url}/api/apply-coupon",
                    json={"userId": "user1", "couponCode": "SAVE20", "orderId": "order1"},
                    timeout=15
                )
                results.append({
                    'status_code': response.status_code,
                    'response': response.json() if response.status_code == 200 else response.text,
                    'timestamp': time.time()
                })
            except Exception as e:
                results.append({'error': str(e)})
        
        # Launch 5 concurrent coupon applications
        threads = []
        for _ in range(5):
            thread = threading.Thread(target=apply_coupon)
            threads.append(thread)
            thread.start()
            
        for thread in threads:
            thread.join()
            
        # Check final order state
        try:
            final_order = requests.get(f"{api_url}/api/order/order1", timeout=5)
            final_data = final_order.json()
            final_price = final_data.get('finalPrice', initial_price)
            discounts_applied = len(final_data.get('discountsApplied', []))
        except:
            final_price = initial_price
            discounts_applied = 0
            
        # Analysis
        successful_applications = [r for r in results if r.get('status_code') == 200]
        toctou_detected = len(successful_applications) > 1  # More than 1 use of single-use coupon
        
        vulnerability = {
            'type': 'TOCTOU (Time-of-Check-Time-of-Use)',
            'api': api_url,
            'severity': 'HIGH' if toctou_detected else 'LOW',
            'found': toctou_detected,
            'details': {
                'initial_price': initial_price,
                'final_price': final_price,
                'successful_applications': len(successful_applications),
                'total_discounts_applied': discounts_applied,
                'single_use_coupon_bypassed': toctou_detected,
                'price_reduction': initial_price - final_price
            },
            'evidence': results
        }
        
        if toctou_detected:
            self.log(f"🚨 TOCTOU VULNERABILITY DETECTED! Single-use coupon applied {len(successful_applications)} times")
        else:
            self.log("✅ No TOCTOU vulnerability detected")
            
        return vulnerability
        
    def scan_api(self, api_name, api_url, tests=['race', 'pollution', 'toctou']):
        """Escanea una API específica"""
        self.log(f"🎯 Scanning {api_name} at {api_url}")
        
        api_results = {
            'name': api_name,
            'url': api_url,
            'vulnerabilities': [],
            'scan_time': datetime.now().isoformat()
        }
        
        # Test connectivity
        try:
            info_response = requests.get(f"{api_url}/api/info", timeout=5)
            if info_response.status_code != 200:
                raise Exception(f"API not accessible: {info_response.status_code}")
            api_results['info'] = info_response.json()
        except Exception as e:
            self.log(f"❌ Cannot connect to {api_name}: {e}")
            return api_results
            
        # Run tests
        if 'race' in tests and 'transfer' in str(api_results.get('info', {})):
            vulnerability = self.test_race_condition(api_url)
            api_results['vulnerabilities'].append(vulnerability)
            
        if 'pollution' in tests and 'auth' in api_name.lower():
            vulnerability = self.test_global_state_pollution(api_url)
            api_results['vulnerabilities'].append(vulnerability)
            
        if 'toctou' in tests and 'shop' in api_name.lower():
            vulnerability = self.test_toctou_vulnerability(api_url)
            api_results['vulnerabilities'].append(vulnerability)
            
        return api_results
        
    def scan_all_apis(self):
        """Escanea todas las APIs vulnerables"""
        apis = [
            ('VulnBank', 'http://localhost:3001'),
            ('VulnAuth', 'http://localhost:3002'),
            ('VulnShop', 'http://localhost:3003')
        ]
        
        self.log("🚀 Starting vulnerability scan...")
        
        for api_name, api_url in apis:
            api_results = self.scan_api(api_name, api_url)
            self.results['apis_tested'].append(api_results)
            
        # Generate summary
        total_vulns = 0
        critical_vulns = 0
        high_vulns = 0
        
        for api in self.results['apis_tested']:
            for vuln in api['vulnerabilities']:
                if vuln.get('found'):
                    total_vulns += 1
                    if vuln['severity'] == 'CRITICAL':
                        critical_vulns += 1
                    elif vuln['severity'] == 'HIGH':
                        high_vulns += 1
                        
        self.results['summary'] = {
            'total_vulnerabilities': total_vulns,
            'critical': critical_vulns,
            'high': high_vulns,
            'apis_scanned': len(self.results['apis_tested'])
        }
        
        return self.results
        
    def generate_report(self, output_file='vulnerability_report.json'):
        """Genera reporte de vulnerabilidades"""
        with open(output_file, 'w') as f:
            json.dump(self.results, f, indent=2)
            
        # Console report
        print("\n" + "="*60)
        print("🛡️  VULNERABILITY SCAN REPORT")
        print("="*60)
        
        summary = self.results['summary']
        print(f"📊 Summary: {summary['total_vulnerabilities']} vulnerabilities found")
        print(f"   🔴 Critical: {summary['critical']}")
        print(f"   🟠 High: {summary['high']}")
        print(f"   📡 APIs scanned: {summary['apis_scanned']}")
        
        print("\n📋 Detailed Results:")
        for api in self.results['apis_tested']:
            print(f"\n🎯 {api['name']} ({api['url']})")
            
            if not api['vulnerabilities']:
                print("   ✅ No vulnerabilities tested")
                continue
                
            for vuln in api['vulnerabilities']:
                status = "🚨 VULNERABLE" if vuln.get('found') else "✅ SECURE"
                print(f"   {status} {vuln['type']} [{vuln['severity']}]")
                
                if vuln.get('found'):
                    details = vuln.get('details', {})
                    for key, value in details.items():
                        if isinstance(value, (int, float, bool, str)) and len(str(value)) < 50:
                            print(f"     • {key}: {value}")
                            
        print(f"\n📄 Full report saved to: {output_file}")
        print("="*60)

def main():
    detector = VulnerabilityDetector()
    
    # Scan all APIs
    results = detector.scan_all_apis()
    
    # Generate report
    detector.generate_report()
    
    # Exit with appropriate code
    total_vulns = results['summary']['total_vulnerabilities']
    sys.exit(0 if total_vulns == 0 else 1)

if __name__ == "__main__":
    main()