#!/usr/bin/env bash
set -euo pipefail

export COMPOSE_PROJECT_NAME="comty"

COMPOSE_FILE="docker/compose.yml"
STATE_FILE="docker/.bluegreen_state"
MAX_HEALTH_RETRIES=30
HEALTH_RETRY_INTERVAL=2
DRAIN_TIMEOUT=30

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

get_active_slot() {
    if [ -f "$STATE_FILE" ]; then
        cat "$STATE_FILE"
    else
        echo "blue"
    fi
}

set_active_slot() {
    echo "$1" > "$STATE_FILE"
}

slot_profile() {
    echo "$1"
}

slot_service() {
    echo "server-$1"
}

slot_container() {
    echo "comty-server-$1"
}

haproxy_cmd() {
    docker exec comty-haproxy sh -c "echo '$1' | socat stdio /tmp/haproxy-admin.sock" 2>/dev/null || true
}

haproxy_enable() {
    local slot=$1
    log_info "Enabling HAProxy backends for slot $slot"
    haproxy_cmd "enable server api_backends/server-$slot"
    haproxy_cmd "enable server webrtc_backends/server-$slot"
}

haproxy_disable() {
    local slot=$1
    log_info "Disabling HAProxy backends for slot $slot"
    haproxy_cmd "disable server api_backends/server-$slot"
    haproxy_cmd "disable server webrtc_backends/server-$slot"
}

wait_healthy() {
    local container=$1
    local retries=$MAX_HEALTH_RETRIES

    log_info "Waiting for healthcheck on $container ..."

    for i in $(seq 1 $retries); do
        if docker exec "$container" curl -sf http://localhost:9000/health > /dev/null 2>&1; then
            log_info "Healthcheck OK (attempt $i)"
            return 0
        fi

        sleep "$HEALTH_RETRY_INTERVAL"
    done

    log_error "Healthcheck failed after $retries attempts"
    return 1
}

ensure_infra() {
    log_info "Ensuring infrastructure is running..."
    if ! docker compose -f "$COMPOSE_FILE" up -d redis scylla mongodb nats haproxy; then
        log_error "Failed to start infrastructure."
        exit 1
    fi
    sleep 2
}

deploy() {
    ensure_infra

    local active_slot=$(get_active_slot)
    local new_slot
    if [ "$active_slot" = "blue" ]; then new_slot="green"; else new_slot="blue"; fi

    local new_profile=$(slot_profile "$new_slot")
    local new_service=$(slot_service "$new_slot")
    local new_container=$(slot_container "$new_slot")
    local old_container=$(slot_container "$active_slot")

    log_info "Active slot: $active_slot -> Deploying to slot $new_slot ($new_service)"

    # step 1: build new image
    log_info "Building server image..."
    docker compose -f "$COMPOSE_FILE" --profile "$new_profile" build "$new_service"

    # step 2: stop old container
    log_info "Stopping old container ($old_container)..."
    docker compose -f "$COMPOSE_FILE" --profile "$(slot_profile "$active_slot")" \
        stop "$(slot_service "$active_slot")" 2>/dev/null || true

    # step 3: start new container
    log_info "Starting new server via compose ($new_service)..."
    if ! docker compose -f "$COMPOSE_FILE" --profile "$new_profile" up -d "$new_service"; then
        log_error "Failed to start new container."

        # rollback: restart old
        docker compose -f "$COMPOSE_FILE" --profile "$(slot_profile "$active_slot")" \
            up -d "$(slot_service "$active_slot")" 2>/dev/null || true
        exit 1
    fi

    sleep 2

    # step 4: wait for healthcheck
    if ! wait_healthy "$new_container"; then
        log_error "New container failed healthcheck. Rolling back..."
        docker compose -f "$COMPOSE_FILE" --profile "$new_profile" stop "$new_service" 2>/dev/null || true
        docker compose -f "$COMPOSE_FILE" --profile "$(slot_profile "$active_slot")" \
            up -d "$(slot_service "$active_slot")" 2>/dev/null || true
        log_info "Old container ($old_container) is still serving traffic"
        exit 1
    fi

    # step 5: switch traffic via HAProxy
    haproxy_enable "$new_slot"
    haproxy_disable "$active_slot"

    # persist active slot
    set_active_slot "$new_slot"

    log_info "Deploy complete! Slot $new_slot is now active"
    log_info "To rollback: $0 --rollback"
}

rollback() {
    ensure_infra

    local active_slot=$(get_active_slot)
    local prev_slot
    if [ "$active_slot" = "1" ]; then prev_slot="2"; else prev_slot="1"; fi

    local prev_profile=$(slot_profile "$prev_slot")
    local prev_service=$(slot_service "$prev_slot")
    local prev_container=$(slot_container "$prev_slot")

    log_warn "Rolling back to slot $prev_slot ($prev_container)..."

    if ! docker compose -f "$COMPOSE_FILE" --profile "$prev_profile" up -d "$prev_service" 2>/dev/null; then
        log_error "Failed to start previous container."
        exit 1
    fi

    sleep 2

    if ! wait_healthy "$prev_container"; then
        log_error "Previous container failed healthcheck. Manual intervention required."
        exit 1
    fi

    haproxy_enable "$prev_slot"
    haproxy_disable "$active_slot"

    set_active_slot "$prev_slot"

    log_info "Rollback complete! Slot $prev_slot is now active"
}

status_cmd() {
    echo "=== Blue-Green Status ==="
    local active=$(get_active_slot)
    echo "Active slot: $active"
    echo ""
    for slot in 1 2; do
        local container=$(slot_container "$slot")
        echo -n "Slot $slot ($container): "
        if docker ps --filter "name=$container" --filter "status=running" -q | grep -q .; then
            echo "RUNNING"
            docker exec "$container" curl -sf http://localhost:9000/health 2>/dev/null | python3 -m json.tool 2>/dev/null || echo "  (healthcheck unavailable)"
        else
            echo "STOPPED"
        fi
        echo ""
    done
}

reload_haproxy() {
    log_info "Reloading HAProxy..."
    docker kill -s HUP comty-haproxy
}

case "${1:-deploy}" in
    deploy)          deploy ;;
    rollback) rollback ;;
    status) status_cmd ;;
    reload-proxy) reload_haproxy ;;
    stop-all)
        log_info 'Stopping all services...'
        docker compose -f "$COMPOSE_FILE" --profile blue stop --timeout="$DRAIN_TIMEOUT" 2>/dev/null || true
        docker compose -f "$COMPOSE_FILE" --profile green stop --timeout="$DRAIN_TIMEOUT" 2>/dev/null || true
        docker compose -f "$COMPOSE_FILE" stop redis scylla mongodb nats haproxy 2>/dev/null || true
        log_info 'All services stopped.'
        ;;
    stop)
        slot=$(get_active_slot)
        log_info "Stopping active gateway (slot $slot)..."
        docker compose -f "$COMPOSE_FILE" --profile "$(slot_profile "$slot")"             stop --timeout="$DRAIN_TIMEOUT" "$(slot_service "$slot")"
        log_info "Gateway stopped."
        ;;
    *) echo "Usage: $0 [deploy|rollback|status|reload-proxy|stop|stop-all|stop|stop-all]" ; exit 1 ;;
esac
