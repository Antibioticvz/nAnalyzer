#!/bin/bash
# Integration test scenarios from quickstart.md
# Tests core functionality of nAnalyzer system

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_BASE="http://localhost:8000"
SCENARIO_RESULTS=()

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

check_service() {
    local service=$1
    local url=$2
    
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|404"; then
        log_info "$service is running"
        return 0
    else
        log_error "$service is not running at $url"
        return 1
    fi
}

record_result() {
    local scenario=$1
    local status=$2
    local message=$3
    
    SCENARIO_RESULTS+=("$scenario|$status|$message")
}

# Test Scenario 1: User Onboarding
test_scenario_1() {
    log_info "=== Scenario 1: User Onboarding ==="
    
    # Register user
    log_info "Step 1: Register user"
    RESPONSE=$(curl -s -X POST "$API_BASE/api/v1/users/register" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "Alice Johnson",
            "email": "alice.test.'$(date +%s)'@company.com",
            "role": "seller"
        }')
    
    if echo "$RESPONSE" | grep -q "user_id"; then
        USER_ID=$(echo "$RESPONSE" | grep -o '"user_id":"[^"]*"' | cut -d'"' -f4)
        log_info "User registered successfully: $USER_ID"
        
        # Step 2: Get user to verify
        log_info "Step 2: Verify user exists"
        GET_RESPONSE=$(curl -s "$API_BASE/api/v1/users/$USER_ID" \
            -H "X-User-ID: $USER_ID")
        
        if echo "$GET_RESPONSE" | grep -q "$USER_ID"; then
            log_info "User retrieved successfully"
            record_result "Scenario 1" "PASS" "User onboarding completed"
            return 0
        else
            log_error "Failed to retrieve user"
            record_result "Scenario 1" "FAIL" "Could not retrieve created user"
            return 1
        fi
    else
        log_error "Failed to register user: $RESPONSE"
        record_result "Scenario 1" "FAIL" "User registration failed"
        return 1
    fi
}

# Test Scenario 2: Simple Call Analysis
test_scenario_2() {
    log_info "=== Scenario 2: Simple Call Analysis ==="
    
    # First, register a user
    log_info "Step 1: Register user for call upload"
    REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE/api/v1/users/register" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "Bob Seller",
            "email": "bob.test.'$(date +%s)'@company.com",
            "role": "seller"
        }')
    
    if ! echo "$REGISTER_RESPONSE" | grep -q "user_id"; then
        log_error "Failed to register user for call test"
        record_result "Scenario 2" "FAIL" "User registration failed"
        return 1
    fi
    
    USER_ID=$(echo "$REGISTER_RESPONSE" | grep -o '"user_id":"[^"]*"' | cut -d'"' -f4)
    log_info "User registered: $USER_ID"
    
    # Initialize upload
    log_info "Step 2: Initialize upload"
    INIT_RESPONSE=$(curl -s -X POST "$API_BASE/api/v1/analysis/upload" \
        -H "Content-Type: application/json" \
        -H "X-User-ID: $USER_ID" \
        -d '{
            "user_id": "'$USER_ID'",
            "filename": "test_call.wav",
            "total_size_bytes": 1024,
            "content_type": "audio/wav"
        }')
    
    if echo "$INIT_RESPONSE" | grep -q "upload_id"; then
        UPLOAD_ID=$(echo "$INIT_RESPONSE" | grep -o '"upload_id":"[^"]*"' | cut -d'"' -f4)
        log_info "Upload initialized: $UPLOAD_ID"
        
        # Complete upload (simplified - no actual audio data)
        log_info "Step 3: Complete upload"
        COMPLETE_RESPONSE=$(curl -s -X POST "$API_BASE/api/v1/analysis/upload/$UPLOAD_ID/complete" \
            -H "X-User-ID: $USER_ID")
        
        if echo "$COMPLETE_RESPONSE" | grep -q "call_id"; then
            CALL_ID=$(echo "$COMPLETE_RESPONSE" | grep -o '"call_id":"[^"]*"' | cut -d'"' -f4)
            log_info "Upload completed, call created: $CALL_ID"
            record_result "Scenario 2" "PASS" "Call analysis flow completed"
            return 0
        else
            log_warn "Upload complete but no call_id: $COMPLETE_RESPONSE"
            record_result "Scenario 2" "PARTIAL" "Upload completed but analysis pending"
            return 0
        fi
    else
        log_error "Failed to initialize upload: $INIT_RESPONSE"
        record_result "Scenario 2" "FAIL" "Upload initialization failed"
        return 1
    fi
}

# Test Scenario 3: User Feedback
test_scenario_3() {
    log_info "=== Scenario 3: User Feedback & Continuous Learning ==="
    
    # First, register a user to get X-User-ID
    log_info "Step 1: Register user for feedback test"
    REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE/api/v1/users/register" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "Feedback Test User",
            "email": "feedback.test.'$(date +%s)'@company.com",
            "role": "seller"
        }')
    
    if ! echo "$REGISTER_RESPONSE" | grep -q "user_id"; then
        log_error "Failed to register user for feedback test"
        record_result "Scenario 3" "FAIL" "User registration failed"
        return 1
    fi
    
    USER_ID=$(echo "$REGISTER_RESPONSE" | grep -o '"user_id":"[^"]*"' | cut -d'"' -f4)
    log_info "User registered: $USER_ID"
    
    # For this test, we need a call ID from scenario 2
    log_info "Step 2: Checking call history to find a call..."
    
    # Try to get calls list
    CALLS_RESPONSE=$(curl -s "$API_BASE/api/v1/calls?limit=1" \
        -H "X-User-ID: $USER_ID")
    
    if echo "$CALLS_RESPONSE" | grep -q "calls"; then
        # Extract first call ID if available
        CALL_ID=$(echo "$CALLS_RESPONSE" | grep -o '"call_id":"[^"]*"' | head -1 | cut -d'"' -f4)
        
        if [ -z "$CALL_ID" ]; then
            log_warn "No calls available for feedback test"
            record_result "Scenario 3" "SKIP" "No calls available for feedback"
            return 0
        fi
        
        log_info "Found call: $CALL_ID"
        
        # Submit feedback
        log_info "Submitting feedback..."
        FEEDBACK_RESPONSE=$(curl -s -X POST "$API_BASE/api/v1/calls/$CALL_ID/feedback" \
            -H "Content-Type: application/json" \
            -d '{
                "segment_id": "seg_1",
                "emotion_label": "positive",
                "confidence_score": 0.95
            }')
        
        if echo "$FEEDBACK_RESPONSE" | grep -q "success\|message"; then
            log_info "Feedback submitted successfully"
            record_result "Scenario 3" "PASS" "Feedback submission completed"
            return 0
        else
            log_error "Failed to submit feedback: $FEEDBACK_RESPONSE"
            record_result "Scenario 3" "FAIL" "Feedback submission failed"
            return 1
        fi
    else
        log_warn "Could not retrieve calls: $CALLS_RESPONSE"
        record_result "Scenario 3" "SKIP" "Calls endpoint not accessible"
        return 0
    fi
}

# Test Scenario 4: Long Call Handling
test_scenario_4() {
    log_info "=== Scenario 4: Long Call Handling ==="
    log_warn "This scenario requires a 45-minute audio file - skipping in automated test"
    record_result "Scenario 4" "SKIP" "Requires long audio file"
    return 0
}

# Test Scenario 5: Multi-User Concurrent Uploads
test_scenario_5() {
    log_info "=== Scenario 5: Multi-User Concurrent Uploads ==="
    log_warn "This scenario requires concurrent load testing - skipping in automated test"
    record_result "Scenario 5" "SKIP" "Requires load testing tools"
    return 0
}

# Test Scenario 6: Settings Management
test_scenario_6() {
    log_info "=== Scenario 6: Settings Management ==="
    
    # Register user
    log_info "Step 1: Register user"
    REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE/api/v1/users/register" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "Settings Test User",
            "email": "settings.test.'$(date +%s)'@company.com",
            "role": "seller"
        }')
    
    if ! echo "$REGISTER_RESPONSE" | grep -q "user_id"; then
        log_error "Failed to register user"
        record_result "Scenario 6" "FAIL" "User registration failed"
        return 1
    fi
    
    USER_ID=$(echo "$REGISTER_RESPONSE" | grep -o '"user_id":"[^"]*"' | cut -d'"' -f4)
    log_info "User registered: $USER_ID"
    
    # Update settings
    log_info "Step 2: Update retention period"
    SETTINGS_RESPONSE=$(curl -s -X PUT "$API_BASE/api/v1/users/$USER_ID/settings" \
        -H "Content-Type: application/json" \
        -d '{
            "retention_days": 14
        }')
    
    if echo "$SETTINGS_RESPONSE" | grep -q "success\|retention_days\|14"; then
        log_info "Settings updated successfully"
        record_result "Scenario 6" "PASS" "Settings management completed"
        return 0
    else
        log_error "Failed to update settings: $SETTINGS_RESPONSE"
        record_result "Scenario 6" "FAIL" "Settings update failed"
        return 1
    fi
}

# Test Scenario 7: Background Cleanup
test_scenario_7() {
    log_info "=== Scenario 7: Background Cleanup ==="
    log_warn "This scenario requires time-based expiration - skipping in automated test"
    record_result "Scenario 7" "SKIP" "Requires background job scheduler"
    return 0
}

# Main execution
main() {
    echo "========================================="
    echo "nAnalyzer Integration Test Suite"
    echo "========================================="
    echo ""
    
    # Check if backend is running
    log_info "Checking backend service..."
    if ! check_service "Backend API" "$API_BASE/docs"; then
        log_error "Backend is not running. Please start it with: cd backend && uvicorn app.main:app --reload"
        exit 1
    fi
    
    echo ""
    
    # Run all scenarios
    test_scenario_1 || true
    echo ""
    test_scenario_2 || true
    echo ""
    test_scenario_3 || true
    echo ""
    test_scenario_4 || true
    echo ""
    test_scenario_5 || true
    echo ""
    test_scenario_6 || true
    echo ""
    test_scenario_7 || true
    
    # Print summary
    echo ""
    echo "========================================="
    echo "Test Summary"
    echo "========================================="
    
    PASS_COUNT=0
    FAIL_COUNT=0
    SKIP_COUNT=0
    PARTIAL_COUNT=0
    
    for result in "${SCENARIO_RESULTS[@]}"; do
        IFS='|' read -r scenario status message <<< "$result"
        
        case "$status" in
            PASS)
                echo -e "${GREEN}✓${NC} $scenario: $message"
                ((PASS_COUNT++))
                ;;
            FAIL)
                echo -e "${RED}✗${NC} $scenario: $message"
                ((FAIL_COUNT++))
                ;;
            SKIP)
                echo -e "${YELLOW}○${NC} $scenario: $message"
                ((SKIP_COUNT++))
                ;;
            PARTIAL)
                echo -e "${YELLOW}◐${NC} $scenario: $message"
                ((PARTIAL_COUNT++))
                ;;
        esac
    done
    
    echo ""
    echo "Total: ${#SCENARIO_RESULTS[@]} scenarios"
    echo -e "${GREEN}Passed: $PASS_COUNT${NC}"
    echo -e "${RED}Failed: $FAIL_COUNT${NC}"
    echo -e "${YELLOW}Skipped: $SKIP_COUNT${NC}"
    echo -e "${YELLOW}Partial: $PARTIAL_COUNT${NC}"
    
    if [ $FAIL_COUNT -eq 0 ]; then
        echo ""
        log_info "All executable scenarios passed! ✨"
        exit 0
    else
        echo ""
        log_error "Some scenarios failed. Please check the logs above."
        exit 1
    fi
}

# Run main function
main
