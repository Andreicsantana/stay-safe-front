import { useState, useEffect, useRef, useCallback } from "react";
import { api, WS_URL } from "../services/api";
import { G } from "../constants/colors";
import Btn from "../components/Btn";
import PhoneFrame from "../components/PhoneFrame";
import StatusBadge from "../components/StatusBadge";
import ConfirmModal from "../components/ConfirmModal";

export default function CarerScreen({ session, onLogout, onBackToProfiles }) {
  const { token, profile } = session;
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [history, setHistory] = useState([]);
  const [dependents, setDependents] = useState([]);
  const [view, setView] = useState("home");
  const [notif, setNotif] = useState(null);
  const [confirmResolveId, setConfirmResolveId] = useState(null);
  const [confirmLogoutModal, setConfirmLogoutModal] = useState(false);
  const wsRef = useRef(null);

  const loadDependents = useCallback(async () => {
    try {
      const data = await api.get("/profiles/dependents", token);
      setDependents(data.dependents || []);
    } catch (e) {
      console.error("Erro ao carregar dependentes:", e);
    }
  }, [token]);

  const loadAlerts = useCallback(async () => {
    try {
      const [active, hist] = await Promise.all([
        api.get("/alerts/active", token),
        api.get("/alerts?limit=20", token),
      ]);
      setActiveAlerts(active.activeAlerts || []);
      setHistory(hist.alerts || []);
    } catch (e) {
      console.error("Erro ao carregar alertas:", e);
    }
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDependents();
    loadAlerts();
  }, [loadDependents, loadAlerts]);

  useEffect(() => {
    let ws;
    let reconnectTimer;

    const connect = () => {
      ws = new WebSocket(`${WS_URL}?token=${token}`);
      wsRef.current = ws;

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === "NEW_ALERT") {
            setNotif({ ...msg, id: Date.now() });
            setTimeout(() => setNotif(null), 8000);
            loadAlerts();
          }
          if (["ALERT_RESOLVED", "ALERT_ESCALATED", "ALERT_ACKNOWLEDGED"].includes(msg.type)) {
            loadAlerts();
          }
        } catch (err) {
          console.error("Erro ao processar mensagem WebSocket:", err);
        }
      };

      ws.onclose = () => {
        // Tentar reconectar em 3 segundos
        reconnectTimer = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, [token, loadAlerts]);

  const acknowledge = async (alertId) => {
    try {
      await api.post(`/alerts/${alertId}/acknowledge`, {}, token);
      loadAlerts();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleConfirmResolve = async () => {
    const alertId = confirmResolveId;
    setConfirmResolveId(null);
    if (!alertId) return;
    try {
      await api.post(`/alerts/${alertId}/resolve`, { notes: "Resolvido pelo cuidador" }, token);
      loadAlerts();
    } catch (e) {
      alert(e.message);
    }
  };

  const fmtTime = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const fmtDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const hoje = new Date();
    if (d.toDateString() === hoje.toDateString()) return "Hoje";
    const ontem = new Date(hoje);
    ontem.setDate(hoje.getDate() - 1);
    if (d.toDateString() === ontem.toDateString()) return "Ontem";
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  const sectionLabel = (txt) => (
    <p style={{ fontSize: "11px", fontWeight: 600, color: G.gray400, textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 10px" }}>
      {txt}
    </p>
  );

  return (
    <PhoneFrame>
      {/* ── Toast de novo alerta ── */}
      {notif && (
        <div style={{
          position: "absolute", top: "54px", left: "16px", right: "16px",
          background: G.red, color: G.white, borderRadius: "16px",
          padding: "14px 16px", zIndex: 200,
          boxShadow: "0 8px 24px rgba(220,38,38,0.4)",
          animation: "slideDown 0.3s ease",
        }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: "14px" }}>🚨 {notif.dependentName} precisa de ajuda!</p>
          <p style={{ margin: "2px 0 0", fontSize: "12px", opacity: 0.85 }}>às {fmtTime(notif.emittedAt)}</p>
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ padding: "16px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ margin: 0, fontSize: "13px", color: G.gray400 }}>Cuidador</p>
          <p style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: G.gray800 }}>{profile.name}</p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {activeAlerts.length > 0 && (
            <div style={{ background: G.red, color: G.white, borderRadius: "20px", padding: "4px 10px", fontSize: "12px", fontWeight: 700 }}>
              {activeAlerts.length} ativo{activeAlerts.length > 1 ? "s" : ""}
            </div>
          )}
          {onBackToProfiles && (
            <button onClick={onBackToProfiles} style={{ background: G.gray100, border: "none", borderRadius: "10px", padding: "8px 12px", fontSize: "12px", color: G.gray600, cursor: "pointer" }}>
              Perfis
            </button>
          )}
          <button onClick={() => setConfirmLogoutModal(true)} style={{ background: G.gray100, border: "none", borderRadius: "10px", padding: "8px 12px", fontSize: "12px", color: G.gray600, cursor: "pointer" }}>
            Sair
          </button>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div style={{ display: "flex", margin: "16px 20px 0", background: G.gray100, borderRadius: "12px", padding: "4px" }}>
        {[["home", "Alertas"], ["history", "Histórico"], ["dependents", "Dependentes"]].map(([v, l]) => (
          <button key={v} onClick={() => setView(v)} style={{
            flex: 1, padding: "8px 4px", background: view === v ? G.white : "transparent",
            border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: 600,
            color: view === v ? G.gray800 : G.gray400, cursor: "pointer",
          }}>
            {l}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 24px" }}>

        {/* ALERTAS ATIVOS */}
        {view === "home" && (
          <>
            {sectionLabel("Alertas ativos")}
            {activeAlerts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", background: G.greenLight, borderRadius: "16px" }}>
                <div style={{ fontSize: "40px", marginBottom: "8px" }}>✅</div>
                <p style={{ margin: 0, fontWeight: 600, color: G.green, fontSize: "15px" }}>Tudo bem!</p>
                <p style={{ margin: "4px 0 0", fontSize: "13px", color: G.gray400 }}>Nenhum alerta ativo no momento</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {activeAlerts.map(alert => (
                  <div key={alert.id} style={{
                    background: G.white,
                    border: `2px solid ${alert.status === "escalated" ? G.red : G.blue}`,
                    borderRadius: "16px", padding: "16px",
                    boxShadow: `0 4px 12px ${alert.status === "escalated" ? "rgba(220,38,38,0.15)" : "rgba(37,99,235,0.08)"}`,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: "16px", color: G.gray800 }}>
                          🙋 {alert.dependent_name || "Dependente"}
                        </p>
                        <p style={{ margin: "2px 0 0", fontSize: "12px", color: G.gray400 }}>
                          às {fmtTime(alert.emitted_at)}
                        </p>
                      </div>
                      <StatusBadge status={alert.status} />
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {!["acknowledged", "escalated"].includes(alert.status) && (
                        <Btn onClick={() => acknowledge(alert.id)} color={G.blue} style={{ fontSize: "13px", padding: "10px" }}>
                          ✓ Confirmar
                        </Btn>
                      )}
                      <Btn onClick={() => setConfirmResolveId(alert.id)} color={G.green} style={{ fontSize: "13px", padding: "10px" }}>
                        ✓ Encerrar
                      </Btn>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* HISTÓRICO */}
        {view === "history" && (
          <>
            {sectionLabel("Histórico de chamados")}
            {history.length === 0 ? (
              <p style={{ color: G.gray400, textAlign: "center", padding: "40px 0", fontSize: "14px" }}>Nenhum histórico ainda</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {history.map(a => (
                  <div key={a.id} style={{
                    background: G.white, border: `1px solid ${G.gray200}`,
                    borderRadius: "14px", padding: "14px 16px",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <div>
                      <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: G.gray800 }}>
                        {a.dependent_name || "Dependente"}
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: "12px", color: G.gray400 }}>
                        {fmtDate(a.emitted_at)} às {fmtTime(a.emitted_at)}
                      </p>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* DEPENDENTES */}
        {view === "dependents" && (
          <>
            {sectionLabel(`Meus dependentes (${dependents.length})`)}

            {dependents.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 20px", background: G.gray50, borderRadius: "16px", marginBottom: "16px" }}>
                <div style={{ fontSize: "36px", marginBottom: "8px" }}>🔗</div>
                <p style={{ margin: 0, fontWeight: 600, color: G.gray800, fontSize: "15px" }}>Nenhum dependente vinculado</p>
                <p style={{ margin: "4px 0 0", fontSize: "13px", color: G.gray400 }}>
                  Vincule um dependente para começar a receber alertas
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                {dependents.map(d => (
                  <div key={d.id} style={{
                    background: G.white, border: `1px solid ${G.gray200}`,
                    borderRadius: "14px", padding: "14px 16px",
                    display: "flex", alignItems: "center", gap: "12px",
                  }}>
                    <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: G.redLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
                      🙋
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: 600, color: G.gray800, fontSize: "14px" }}>{d.name}</p>
                      <p style={{ margin: "2px 0 0", fontSize: "11px", color: G.gray400, fontFamily: "monospace" }}>
                        ID: {d.id.slice(0, 8)}…
                      </p>
                    </div>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: G.green }} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>



      <ConfirmModal
        isOpen={!!confirmResolveId}
        title="Encerrar Alerta?"
        message="Tem certeza que deseja encerrar este alerta de emergência? Esta ação confirmará que o dependente está seguro."
        confirmText="Sim, encerrar"
        cancelText="Cancelar"
        onConfirm={handleConfirmResolve}
        onCancel={() => setConfirmResolveId(null)}
        confirmColor={G.green}
      />

      <ConfirmModal
        isOpen={confirmLogoutModal}
        title="Confirmar Saída"
        message="Tem certeza que deseja sair do aplicativo?"
        confirmText="Sim, sair"
        cancelText="Não, continuar"
        onConfirm={onLogout}
        onCancel={() => setConfirmLogoutModal(false)}
        isDestructive={true}
      />

      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </PhoneFrame>
  );
}
