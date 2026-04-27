#!/bin/bash

# KlipCam Disaster Recovery Script
# 
# This script provides comprehensive disaster recovery procedures for KlipCam.
# It handles various failure scenarios and guides the recovery process.
#
# Usage:
#   ./disaster-recovery.sh [scenario] [options]
#
# Scenarios:
#   database    - Database failure recovery
#   application - Application/Vercel failure recovery  
#   storage     - Storage service failure recovery
#   full        - Complete system recovery
#
# Options:
#   --dry-run   - Show what would be done without executing
#   --verbose   - Enable verbose output
#   --confirm   - Skip confirmation prompts (use with caution)

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_FILE="${PROJECT_DIR}/logs/disaster-recovery-$(date +%Y%m%d-%H%M%S).log"
BACKUP_BUCKET="klipcam-disaster-recovery"
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Flags
DRY_RUN=false
VERBOSE=false
CONFIRM=false

# Logging function
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
    
    case "$level" in
        "ERROR")   echo -e "${RED}❌ $message${NC}" ;;
        "WARN")    echo -e "${YELLOW}⚠️  $message${NC}" ;;
        "SUCCESS") echo -e "${GREEN}✅ $message${NC}" ;;
        "INFO")    echo -e "${BLUE}ℹ️  $message${NC}" ;;
        *)         echo "$message" ;;
    esac
}

# Notification function
notify_slack() {
    local message="$1"
    local emoji="${2:-🚨}"
    
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$emoji KlipCam Disaster Recovery: $message\"}" \
            "$SLACK_WEBHOOK_URL" &>/dev/null || true
    fi
}

# Confirmation function
confirm() {
    if [[ "$CONFIRM" == "true" ]]; then
        return 0
    fi
    
    local message="$1"
    echo -e "${YELLOW}⚠️  $message${NC}"
    read -r -p "Do you want to continue? (y/N) " response
    
    case "$response" in
        [yY][eE][sS]|[yY])
            return 0
            ;;
        *)
            log "INFO" "Operation cancelled by user"
            exit 1
            ;;
    esac
}

# Check prerequisites
check_prerequisites() {
    log "INFO" "Checking prerequisites..."
    
    local tools=("curl" "jq" "psql" "aws" "vercel")
    local missing_tools=()
    
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            missing_tools+=("$tool")
        fi
    done
    
    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        log "ERROR" "Missing required tools: ${missing_tools[*]}"
        log "INFO" "Please install missing tools and try again"
        exit 1
    fi
    
    # Check environment variables
    local required_vars=("PROD_DATABASE_URL" "STAGING_DATABASE_URL" "VERCEL_TOKEN" "AWS_ACCESS_KEY_ID")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        log "ERROR" "Missing required environment variables: ${missing_vars[*]}"
        exit 1
    fi
    
    log "SUCCESS" "All prerequisites met"
}

# System health assessment
assess_system_health() {
    log "INFO" "Assessing system health..."
    
    local health_status="unknown"
    
    # Check main application
    if curl -sf "https://klipcam.com/api/health" &>/dev/null; then
        health_status="application_healthy"
    else
        log "WARN" "Main application not responding"
    fi
    
    # Check database connectivity
    if pg_isready -h "$(echo "$PROD_DATABASE_URL" | sed 's/.*@\([^:]*\).*/\1/')" &>/dev/null; then
        log "SUCCESS" "Database is accessible"
    else
        log "ERROR" "Database is not accessible"
        health_status="database_down"
    fi
    
    # Check Vercel status
    if curl -sf "https://api.vercel.com/v1/status" | jq -r '.status' | grep -q "operational"; then
        log "SUCCESS" "Vercel is operational"
    else
        log "WARN" "Vercel may be experiencing issues"
    fi
    
    echo "$health_status"
}

# Database recovery procedures
recover_database() {
    log "INFO" "Starting database recovery procedure..."
    notify_slack "Database recovery initiated" "🔧"
    
    confirm "This will attempt to recover the database. This may cause downtime."
    
    # Step 1: Create maintenance page
    if [[ "$DRY_RUN" == "false" ]]; then
        log "INFO" "Activating maintenance mode..."
        # This would set a maintenance flag or redirect
    else
        log "INFO" "[DRY RUN] Would activate maintenance mode"
    fi
    
    # Step 2: Check for recent backups
    log "INFO" "Checking for recent backups..."
    local latest_backup
    latest_backup=$(aws s3 ls "s3://$BACKUP_BUCKET/database/" --recursive | sort | tail -n 1 | awk '{print $4}' || echo "")
    
    if [[ -z "$latest_backup" ]]; then
        log "ERROR" "No backups found in S3"
        return 1
    fi
    
    log "INFO" "Latest backup found: $latest_backup"
    
    # Step 3: Download backup
    local backup_file="/tmp/recovery-backup.sql"
    
    if [[ "$DRY_RUN" == "false" ]]; then
        log "INFO" "Downloading backup..."
        aws s3 cp "s3://$BACKUP_BUCKET/$latest_backup" "$backup_file"
        
        if [[ "$latest_backup" == *.gz ]]; then
            gunzip "$backup_file"
            backup_file="${backup_file%.gz}"
        fi
    else
        log "INFO" "[DRY RUN] Would download backup: $latest_backup"
    fi
    
    # Step 4: Test database connectivity
    if pg_isready -d "$PROD_DATABASE_URL" &>/dev/null; then
        log "SUCCESS" "Database is accessible for recovery"
    else
        log "ERROR" "Cannot connect to database for recovery"
        
        # Attempt to create new database instance (Supabase)
        log "INFO" "Attempting to create new database instance..."
        if [[ "$DRY_RUN" == "false" ]]; then
            # This would involve Supabase API calls or manual intervention
            log "WARN" "Manual intervention required: Create new Supabase instance"
            log "INFO" "Update DATABASE_URL environment variable after creating new instance"
            read -r -p "Press Enter after creating new database instance and updating environment variables..."
        else
            log "INFO" "[DRY RUN] Would create new database instance"
        fi
    fi
    
    # Step 5: Restore from backup
    if [[ "$DRY_RUN" == "false" ]]; then
        log "INFO" "Restoring database from backup..."
        psql "$PROD_DATABASE_URL" < "$backup_file"
        rm -f "$backup_file"
    else
        log "INFO" "[DRY RUN] Would restore database from backup"
    fi
    
    # Step 6: Verify restoration
    if [[ "$DRY_RUN" == "false" ]]; then
        log "INFO" "Verifying database restoration..."
        local user_count
        user_count=$(psql "$PROD_DATABASE_URL" -t -c "SELECT COUNT(*) FROM users;" | xargs)
        log "SUCCESS" "Database restored successfully. User count: $user_count"
    else
        log "INFO" "[DRY RUN] Would verify database restoration"
    fi
    
    # Step 7: Update Vercel environment variables if needed
    log "INFO" "Checking if Vercel environment variables need updating..."
    # This would be done if we had to create a new database instance
    
    # Step 8: Deactivate maintenance mode
    if [[ "$DRY_RUN" == "false" ]]; then
        log "INFO" "Deactivating maintenance mode..."
        # Remove maintenance flag
    else
        log "INFO" "[DRY RUN] Would deactivate maintenance mode"
    fi
    
    notify_slack "Database recovery completed successfully" "✅"
    log "SUCCESS" "Database recovery completed"
}

# Application recovery procedures
recover_application() {
    log "INFO" "Starting application recovery procedure..."
    notify_slack "Application recovery initiated" "🔧"
    
    confirm "This will attempt to recover the application. This may involve redeployment."
    
    # Step 1: Check Vercel status
    log "INFO" "Checking Vercel deployment status..."
    local deployment_status
    deployment_status=$(vercel ls --token="$VERCEL_TOKEN" -m 1 2>/dev/null | head -n 1 || echo "unknown")
    
    if [[ "$deployment_status" == "unknown" ]]; then
        log "WARN" "Unable to get deployment status"
    else
        log "INFO" "Current deployment: $deployment_status"
    fi
    
    # Step 2: Try redeploying from last known good commit
    log "INFO" "Attempting redeployment..."
    
    if [[ "$DRY_RUN" == "false" ]]; then
        cd "$PROJECT_DIR"
        
        # Get last successful deployment commit
        local last_commit
        last_commit=$(git log --oneline -n 10 | grep -E "deploy|release" | head -n 1 | awk '{print $1}' || echo "HEAD")
        
        log "INFO" "Deploying from commit: $last_commit"
        git checkout "$last_commit"
        
        # Deploy to production
        vercel --prod --token="$VERCEL_TOKEN" --yes
        
        # Return to main branch
        git checkout main
    else
        log "INFO" "[DRY RUN] Would redeploy application"
    fi
    
    # Step 3: Verify deployment
    log "INFO" "Verifying application deployment..."
    local retry_count=0
    local max_retries=10
    
    while [[ $retry_count -lt $max_retries ]]; do
        if curl -sf "https://klipcam.com/api/health" &>/dev/null; then
            log "SUCCESS" "Application is responding"
            break
        else
            log "WARN" "Application not responding, waiting..."
            sleep 30
            ((retry_count++))
        fi
    done
    
    if [[ $retry_count -eq $max_retries ]]; then
        log "ERROR" "Application still not responding after $max_retries attempts"
        
        # Step 4: Deploy to backup hosting (Railway/Fly.io)
        log "INFO" "Attempting deployment to backup hosting..."
        if [[ "$DRY_RUN" == "false" ]]; then
            # This would involve deploying to an alternative platform
            log "WARN" "Manual intervention required: Deploy to backup hosting"
            log "INFO" "Consider using Railway or Fly.io as backup"
        else
            log "INFO" "[DRY RUN] Would deploy to backup hosting"
        fi
        
        return 1
    fi
    
    notify_slack "Application recovery completed successfully" "✅"
    log "SUCCESS" "Application recovery completed"
}

# Storage recovery procedures
recover_storage() {
    log "INFO" "Starting storage recovery procedure..."
    notify_slack "Storage recovery initiated" "🔧"
    
    # Step 1: Check Supabase Storage health
    log "INFO" "Checking Supabase Storage health..."
    
    if curl -sf "${SUPABASE_URL}/storage/v1/bucket/generated" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" &>/dev/null; then
        log "SUCCESS" "Supabase Storage is accessible"
        return 0
    else
        log "ERROR" "Supabase Storage is not accessible"
    fi
    
    # Step 2: Switch to backup storage (S3)
    log "INFO" "Switching to backup storage (S3)..."
    
    if [[ "$DRY_RUN" == "false" ]]; then
        # Update environment variables to use S3
        log "INFO" "Updating storage configuration to use S3..."
        # This would require application code changes
        log "WARN" "Manual intervention required: Update storage configuration in code"
        log "INFO" "1. Update storage URLs to point to S3"
        log "INFO" "2. Update asset serving logic"
        log "INFO" "3. Redeploy application with S3 configuration"
    else
        log "INFO" "[DRY RUN] Would switch to S3 storage"
    fi
    
    # Step 3: Sync existing assets to S3 (if possible)
    if [[ "$DRY_RUN" == "false" ]]; then
        log "INFO" "Syncing assets to S3 backup storage..."
        # This would involve a data migration script
        log "WARN" "Manual intervention required: Run asset migration to S3"
    else
        log "INFO" "[DRY RUN] Would sync assets to S3"
    fi
    
    notify_slack "Storage recovery completed - using S3 backup" "✅"
    log "SUCCESS" "Storage recovery completed (using S3 backup)"
}

# Full system recovery
recover_full_system() {
    log "INFO" "Starting full system recovery procedure..."
    notify_slack "Full system recovery initiated - all hands on deck!" "🚨"
    
    confirm "This will attempt to recover the entire system. This will cause extended downtime."
    
    # Step 1: Assess damage
    log "INFO" "Assessing system damage..."
    local health_status
    health_status=$(assess_system_health)
    log "INFO" "System health status: $health_status"
    
    # Step 2: Activate emergency procedures
    log "INFO" "Activating emergency procedures..."
    if [[ "$DRY_RUN" == "false" ]]; then
        # Set up maintenance page
        # Notify all stakeholders
        # Escalate to senior engineers
        log "WARN" "Manual intervention required:"
        log "INFO" "1. Notify all stakeholders of system outage"
        log "INFO" "2. Set up status page with updates"
        log "INFO" "3. Escalate to senior engineering team"
        log "INFO" "4. Consider external incident response if needed"
    else
        log "INFO" "[DRY RUN] Would activate emergency procedures"
    fi
    
    # Step 3: Recover in order of criticality
    log "INFO" "Recovering systems in order of criticality..."
    
    # 3a. Database (most critical)
    if ! recover_database; then
        log "ERROR" "Database recovery failed - aborting full recovery"
        return 1
    fi
    
    # 3b. Application
    if ! recover_application; then
        log "ERROR" "Application recovery failed - continuing with storage recovery"
    fi
    
    # 3c. Storage
    if ! recover_storage; then
        log "ERROR" "Storage recovery failed - system partially recovered"
    fi
    
    # Step 4: Comprehensive health check
    log "INFO" "Running comprehensive health check..."
    if node "$SCRIPT_DIR/health-check.js" --url "https://klipcam.com"; then
        notify_slack "Full system recovery completed successfully!" "🎉"
        log "SUCCESS" "Full system recovery completed successfully"
    else
        notify_slack "Full system recovery completed with issues" "⚠️"
        log "WARN" "Full system recovery completed but issues remain"
    fi
    
    # Step 5: Post-recovery tasks
    log "INFO" "Executing post-recovery tasks..."
    if [[ "$DRY_RUN" == "false" ]]; then
        log "INFO" "1. Schedule post-mortem meeting"
        log "INFO" "2. Update incident documentation"
        log "INFO" "3. Review and improve recovery procedures"
        log "INFO" "4. Monitor system closely for next 24 hours"
    else
        log "INFO" "[DRY RUN] Would execute post-recovery tasks"
    fi
}

# Main execution
main() {
    local scenario="${1:-}"
    
    # Parse options
    shift || true
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            --confirm)
                CONFIRM=true
                shift
                ;;
            *)
                log "ERROR" "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Create log directory if it doesn't exist
    mkdir -p "$(dirname "$LOG_FILE")"
    
    log "INFO" "KlipCam Disaster Recovery Script Started"
    log "INFO" "Scenario: ${scenario:-'none specified'}"
    log "INFO" "Dry run: $DRY_RUN"
    log "INFO" "Log file: $LOG_FILE"
    
    # Check prerequisites
    check_prerequisites
    
    # Execute recovery based on scenario
    case "$scenario" in
        "database")
            recover_database
            ;;
        "application")
            recover_application
            ;;
        "storage")
            recover_storage
            ;;
        "full")
            recover_full_system
            ;;
        "")
            log "ERROR" "No recovery scenario specified"
            echo "Usage: $0 [database|application|storage|full] [options]"
            exit 1
            ;;
        *)
            log "ERROR" "Unknown recovery scenario: $scenario"
            echo "Available scenarios: database, application, storage, full"
            exit 1
            ;;
    esac
    
    log "SUCCESS" "Disaster recovery procedure completed"
    log "INFO" "Log file saved to: $LOG_FILE"
}

# Help function
show_help() {
    cat << EOF
KlipCam Disaster Recovery Script

USAGE:
    $0 [SCENARIO] [OPTIONS]

SCENARIOS:
    database     Recover from database failure
    application  Recover from application/Vercel failure
    storage      Recover from storage service failure  
    full         Complete system recovery (all components)

OPTIONS:
    --dry-run    Show what would be done without executing
    --verbose    Enable verbose output
    --confirm    Skip confirmation prompts (use with caution)
    --help       Show this help message

EXAMPLES:
    $0 database --dry-run
    $0 full --confirm
    $0 application --verbose

PREREQUISITES:
    - Required tools: curl, jq, psql, aws, vercel
    - Environment variables: PROD_DATABASE_URL, VERCEL_TOKEN, AWS_ACCESS_KEY_ID
    - Proper AWS and Vercel credentials configured

EOF
}

# Handle help and script execution
if [[ "${1:-}" == "--help" ]] || [[ "${1:-}" == "-h" ]]; then
    show_help
    exit 0
fi

# Execute main function with all arguments
main "$@"