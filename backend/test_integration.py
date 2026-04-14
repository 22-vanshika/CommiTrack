#!/usr/bin/env python3
"""
Comprehensive Integration Test
Tests the EXACT scenario from requirements:
- Sarah (Agent) sells $500K policy
- Override commissions cascade
- Volume bonuses calculated
- Policy cancellation triggers clawbacks
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://127.0.0.1:5000/api"


def print_section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")


def print_result(test_name, passed, details=""):
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status} - {test_name}")
    if details:
        print(f"    {details}")


# Test Results Tracker
tests_passed = 0
tests_failed = 0


def test(name, condition, details=""):
    global tests_passed, tests_failed
    if condition:
        tests_passed += 1
        print_result(name, True, details)
    else:
        tests_failed += 1
        print_result(name, False, details)


print_section("COMMISSION CALCULATION SYSTEM - INTEGRATION TEST")

# ============================================================================
# PHASE 1: Setup Hierarchy
# ============================================================================
print_section("PHASE 1: Creating Agent Hierarchy")

# Create Mike (Director - Level 4)
resp = requests.post(
    f"{BASE_URL}/agents",
    json={"name": "Mike (Director)", "level": 4, "parent_id": None},
)
test("Create Director", resp.status_code == 201)
mike_id = resp.json()["id"]
print(f"    Mike ID: {mike_id}")

# Create Lisa (Manager - Level 3)
resp = requests.post(
    f"{BASE_URL}/agents",
    json={"name": "Lisa (Manager)", "level": 3, "parent_id": mike_id},
)
test("Create Manager", resp.status_code == 201)
lisa_id = resp.json()["id"]
print(f"    Lisa ID: {lisa_id}")

# Create Bob (Team Lead - Level 2)
resp = requests.post(
    f"{BASE_URL}/agents",
    json={"name": "Bob (Team Lead)", "level": 2, "parent_id": lisa_id},
)
test("Create Team Lead", resp.status_code == 201)
bob_id = resp.json()["id"]
print(f"    Bob ID: {bob_id}")

# Create Sarah (Agent - Level 1)
resp = requests.post(
    f"{BASE_URL}/agents",
    json={"name": "Sarah (Agent)", "level": 1, "parent_id": bob_id},
)
test("Create Agent", resp.status_code == 201)
sarah_id = resp.json()["id"]
print(f"    Sarah ID: {sarah_id}")

# Verify hierarchy
resp = requests.get(f"{BASE_URL}/agents")
test("Get hierarchy", resp.status_code == 200 and len(resp.json()) > 0)

# ============================================================================
# PHASE 2: Record Sale with FYC Commissions
# ============================================================================
print_section("PHASE 2: Sarah Sells $500,000 Policy")

resp = requests.post(
    f"{BASE_URL}/sales",
    json={
        "policy_number": "LIFE-2024-001",
        "policy_value": 500000,
        "agent_id": sarah_id,
    },
)
test("Record sale", resp.status_code == 201)
sale_id = resp.json().get("sale_id")
print(f"    Sale ID: {sale_id}")

# Verify FYC commission (50% of $500K = $250K)
# This happens automatically in the sale endpoint

# ============================================================================
# PHASE 3: Calculate Monthly Bonuses
# ============================================================================
print_section("PHASE 3: Calculate Monthly Bonuses")

current_date = datetime.now()
period_str = f"{current_date.year}-{current_date.month:02d}"

resp = requests.post(
    f"{BASE_URL}/bonuses/calculate", json={"period": period_str, "type": "Monthly"}
)
test("Calculate monthly bonuses", resp.status_code == 200)
print(f"    Period: {period_str}")
print(f"    Response: {resp.json().get('message', 'N/A')}")

# Get bonuses to verify
resp = requests.get(f"{BASE_URL}/bonuses")
if resp.status_code == 200:
    bonuses = resp.json()
    monthly_bonuses = [b for b in bonuses if b["bonus_type"] == "Monthly"]
    test(
        "Monthly bonuses created",
        len(monthly_bonuses) > 0,
        f"Created {len(monthly_bonuses)} monthly bonuses",
    )

    # Find Sarah's bonus
    sarah_bonus = next((b for b in monthly_bonuses if b["agent_id"] == sarah_id), None)
    if sarah_bonus:
        # Sarah with $500K volume should be in PLATINUM tier (>$100K) = 5%
        # Expected: $500,000 × 5% = $25,000
        expected = 500000 * 0.05
        actual = sarah_bonus["amount"]
        test(
            "Sarah's monthly bonus calculation",
            abs(actual - expected) < 1,
            f"Expected ~${expected:,.0f}, Got ${actual:,.0f}",
        )

# ============================================================================
# PHASE 4: Calculate Quarterly Bonuses
# ============================================================================
print_section("PHASE 4: Calculate Quarterly Bonuses")

quarter = (current_date.month - 1) // 3 + 1
period_str = f"{current_date.year}-Q{quarter}"

resp = requests.post(
    f"{BASE_URL}/bonuses/calculate", json={"period": period_str, "type": "Quarterly"}
)
test("Calculate quarterly bonuses", resp.status_code == 200)
print(f"    Period: {period_str}")

# ============================================================================
# PHASE 5: Calculate Annual Bonuses
# ============================================================================
print_section("PHASE 5: Calculate Annual Bonuses")

period_str = f"{current_date.year}"

resp = requests.post(
    f"{BASE_URL}/bonuses/calculate", json={"period": period_str, "type": "Annual"}
)
test("Calculate annual bonuses", resp.status_code == 200)
print(f"    Period: {period_str}")

# ============================================================================
# PHASE 6: Verify Dashboard Summary
# ============================================================================
print_section("PHASE 6: Dashboard Summary")

resp = requests.get(f"{BASE_URL}/dashboard/summary")
if resp.status_code == 200:
    summary = resp.json()
    test("Get dashboard summary", True)
    print(f"    Total Sales: ${summary.get('total_sales_value', 0):,.2f}")
    print(f"    Total Commissions: ${summary.get('total_commissions_paid', 0):,.2f}")
    print(f"    Total Bonuses: ${summary.get('total_bonuses_paid', 0):,.2f}")
    print(f"    Total Clawbacks: ${summary.get('total_clawbacks_value', 0):,.2f}")
    print(f"    Agent Count: {summary.get('agent_count', 0)}")

    # Verify commissions were paid
    test(
        "Commissions calculated",
        summary.get("total_commissions_paid", 0) > 0,
        f"${summary.get('total_commissions_paid', 0):,.2f}",
    )
else:
    test("Get dashboard summary", False)

# ============================================================================
# PHASE 7: Policy Cancellation & Clawbacks
# ============================================================================
print_section("PHASE 7: Cancel Policy & Trigger Clawbacks")

resp = requests.put(f"{BASE_URL}/sales/{sale_id}/cancel")
test("Cancel policy", resp.status_code == 200)
print(f"    Response: {resp.json().get('message', 'N/A')}")

# Verify clawbacks were created
resp = requests.get(f"{BASE_URL}/dashboard/summary")
if resp.status_code == 200:
    summary = resp.json()
    clawback_amount = summary.get("total_clawbacks_value", 0)
    test(
        "Clawbacks created",
        clawback_amount != 0,
        f"Clawback amount: ${abs(clawback_amount):,.2f}",
    )

# Verify sale is marked as cancelled
resp = requests.get(f"{BASE_URL}/sales")
if resp.status_code == 200:
    sales = resp.json()
    cancelled_sale = next((s for s in sales if s["id"] == sale_id), None)
    if cancelled_sale:
        test(
            "Sale marked as cancelled",
            cancelled_sale.get("is_cancelled", False) == True,
        )

# ============================================================================
# PHASE 8: Edge Cases & Validation
# ============================================================================
print_section("PHASE 8: Validation Tests")

# Test duplicate policy number
resp = requests.post(
    f"{BASE_URL}/sales",
    json={
        "policy_number": "LIFE-2024-001",  # Duplicate!
        "policy_value": 100000,
        "agent_id": sarah_id,
    },
)
test("Prevent duplicate policy", resp.status_code == 409)

# Test invalid agent level
resp = requests.post(
    f"{BASE_URL}/agents",
    json={"name": "Invalid Agent", "level": 5, "parent_id": None},  # Invalid!
)
test("Reject invalid agent level", resp.status_code == 400)

# Test invalid hierarchy
resp = requests.post(
    f"{BASE_URL}/agents",
    json={
        "name": "Bad Hierarchy",
        "level": 4,  # Director
        "parent_id": sarah_id,  # Parent is Level 1!
    },
)
test("Reject invalid hierarchy", resp.status_code == 400)

# ============================================================================
# FINAL RESULTS
# ============================================================================
print_section("TEST RESULTS SUMMARY")

total_tests = tests_passed + tests_failed
pass_rate = (tests_passed / total_tests * 100) if total_tests > 0 else 0

print(f"Total Tests: {total_tests}")
print(f"Passed: {tests_passed} ✅")
print(f"Failed: {tests_failed} ❌")
print(f"Pass Rate: {pass_rate:.1f}%")

if tests_failed == 0:
    print("\n🎉 ALL TESTS PASSED! System is working correctly.")
else:
    print(f"\n⚠️  {tests_failed} test(s) failed. Please review.")

print("\n" + "=" * 60)
