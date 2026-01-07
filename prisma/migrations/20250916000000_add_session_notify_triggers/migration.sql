-- Emitir NOTIFY en cambios de active_sessions para SSE cross-navegador
CREATE OR REPLACE FUNCTION notify_active_sessions_change()
RETURNS TRIGGER AS $$
DECLARE
    v_operation TEXT := TG_OP;
    v_userId TEXT;
    v_tabId TEXT;
    v_payload TEXT;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        v_userId := OLD."userId";
        v_tabId := OLD."tabId";
    ELSE
        v_userId := NEW."userId";
        v_tabId := NEW."tabId";
    END IF;

    v_payload := json_build_object(
        'operation', v_operation,
        'userId', v_userId,
        'tabId', v_tabId,
        'timestamp', EXTRACT(EPOCH FROM NOW()) * 1000
    )::text;

    PERFORM pg_notify('session_change', v_payload);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers para INSERT/UPDATE/DELETE
DROP TRIGGER IF EXISTS trg_notify_active_sessions_insert ON "public"."active_sessions";
CREATE TRIGGER trg_notify_active_sessions_insert
AFTER INSERT ON "public"."active_sessions"
FOR EACH ROW EXECUTE FUNCTION notify_active_sessions_change();

DROP TRIGGER IF EXISTS trg_notify_active_sessions_update ON "public"."active_sessions";
CREATE TRIGGER trg_notify_active_sessions_update
AFTER UPDATE ON "public"."active_sessions"
FOR EACH ROW EXECUTE FUNCTION notify_active_sessions_change();

DROP TRIGGER IF EXISTS trg_notify_active_sessions_delete ON "public"."active_sessions";
CREATE TRIGGER trg_notify_active_sessions_delete
AFTER DELETE ON "public"."active_sessions"
FOR EACH ROW EXECUTE FUNCTION notify_active_sessions_change();
