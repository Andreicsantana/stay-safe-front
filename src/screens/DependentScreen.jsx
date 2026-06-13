import { useState, useEffect, useRef } from "react";
import { api, WS_URL } from "../services/api";
import { G } from "../constants/colors";
import Btn from "../components/Btn";
import PhoneFrame from "../components/PhoneFrame";

export default function DependentScreen({ session, onLogout }) {
  const { token, profile } = session;
  const [activeAlert, setActiveAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [timeLeft, setTimeLeft] = useState(null);
  const [escalated, setEscalated] = useState(false);
  const wsRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    api.get("/alerts/active", token)
      .then(d => {
        if (d.activeAlerts?.length) setActiveAlert(d.activeAlerts[0]);
      })
      .catch(err => {
        console.error("Erro ao obter alerta ativo:", err);
      });
  }, [token]);

  useEffect(() => {
    const ws = new WebSocket(`${WS_URL}?token=${token}`);
    wsRef.current = ws;
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "ALERT_ACKNOWLEDGED") {
          setActiveAlert(a => a ? { ...a, status: "acknowledged" } : a);
        }
        if (msg.type === "ALERT_RESOLVED") {
          setActiveAlert(null);
          setEscalated(false);
          clearInterval(timerRef.current);
        }
        if (msg.type === "ALERT_ESCALATED") {
          setEscalated(true);
          setActiveAlert(a => a ? { ...a, status: "escalated" } : a);
        }
        if (msg.type === "FORCE_LOGOUT") {
          onLogout();
        }
      } catch (err) {
        console.error("Erro ao processar mensagem do WebSocket:", err);
      }
    };
    return () => ws.close();
  }, [token, onLogout]);

  useEffect(() => {
    if (!activeAlert || ["resolved_carer", "resolved_dependent", "escalated"].includes(activeAlert.status)) {
      clearInterval(timerRef.current);
      return;
    }
    const emitted = new Date(activeAlert.emitted_at || Date.now()).getTime();
    const escalateAt = emitted + 120000;
    const tick = () => {
      const left = Math.max(0, Math.ceil((escalateAt - Date.now()) / 1000));
      setTimeLeft(left);
      if (left <= 0) clearInterval(timerRef.current);
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [activeAlert]);

  const emitAlert = async () => {
    setLoading(true);

    const sendToApi = async (coords = {}) => {
      try {
        const data = await api.post("/alerts/emit", coords, token);
        setActiveAlert({ id: data.alertId, status: "pending", emitted_at: new Date().toISOString() });
        setEscalated(false);
      } catch (e) {
        alert(e.message);
      } finally {
        setLoading(false);
      }
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          sendToApi({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.warn("Erro ao obter localização:", error.message);
          sendToApi({}); // envia sem coords
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else {
      sendToApi({});
    }
  };

  const handleResolveByPin = async () => {
    setPinError("");
    try {
      await api.post(`/alerts/${activeAlert.id}/resolve`, { pin }, token);
      setActiveAlert(null);
      setShowPinModal(false);
      setPin("");
    } catch (e) {
      setPinError(e.message || "PIN incorreto");
    }
  };

  const statusLabel = {
    pending: "Aguardando cuidador...",
    notified: "Cuidador sendo notificado...",
    acknowledged: "Cuidador a caminho! ✓",
    escalated: "Autoridades foram acionadas",
  };

  const hasActive = !!activeAlert && !["resolved_carer", "resolved_dependent"].includes(activeAlert?.status);

  return (
    <PhoneFrame bg={hasActive ? (escalated ? G.redLight : G.blueLight) : G.bg}>
      <div style={{ padding: "16px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ margin: 0, fontSize: "13px", color: G.gray400 }}>Olá,</p>
          <p style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: G.gray800 }}>{profile.name}</p>
        </div>
      </div>

      {/* ── Profile ID (para compartilhar com o cuidador) ── */}
      <div style={{ margin: "0 20px", padding: "10px 14px", background: G.gray50, borderRadius: "12px", border: `1px solid ${G.gray200}` }}>
        <p style={{ margin: 0, fontSize: "11px", color: G.gray400, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Meu ID de perfil
        </p>
        <p style={{ margin: "2px 0 0", fontSize: "11px", color: G.gray600, fontFamily: "monospace", wordBreak: "break-all" }}>
          {profile.id}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: "10px", color: G.gray400 }}>
          Compartilhe com seu cuidador para ser vinculado
        </p>
      </div>

      {hasActive && (
        <div style={{
          margin: "20px",
          padding: "16px",
          background: escalated ? G.redLight : G.blueLight,
          borderRadius: "16px",
          border: `1.5px solid ${escalated ? G.red : G.blue}`,
        }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: "15px", color: escalated ? G.redDark : G.blue }}>
            {escalated ? "🚨 Autoridades chamadas" : "🔔 Alerta ativo"}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: G.gray600 }}>
            {statusLabel[activeAlert?.status] || "Processando..."}
          </p>
          {timeLeft !== null && timeLeft > 0 && !escalated && (
            <p style={{ margin: "8px 0 0", fontSize: "13px", color: G.blue, fontWeight: 600 }}>
              ⏱ Autoridades em {timeLeft}s se não atendido
            </p>
          )}
        </div>
      )}

      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}>
        {!hasActive ? (
          <>
            <p style={{ fontSize: "15px", color: G.gray600, textAlign: "center", marginBottom: "40px" }}>
              Pressione o botão se precisar de ajuda
            </p>
            <button
              onClick={emitAlert}
              disabled={loading}
              style={{
                width: "220px",
                height: "220px",
                borderRadius: "50%",
                background: loading ? G.gray200 : G.red,
                border: `8px solid ${loading ? G.gray200 : G.redDark}`,
                boxShadow: loading ? "none" : `0 0 0 16px ${G.redLight}, 0 20px 60px rgba(220,38,38,0.4)`,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: G.white,
                transition: "all 0.2s",
              }}
            >
              <span style={{ fontSize: "52px", lineHeight: 1 }}>🆘</span>
              <span style={{ fontSize: "22px", fontWeight: 800, marginTop: "8px", letterSpacing: "2px" }}>
                {loading ? "..." : "AJUDA"}
              </span>
            </button>
            <p style={{ fontSize: "12px", color: G.gray400, textAlign: "center", marginTop: "32px" }}>
              Seu cuidador será avisado por SMS, email e ligação
            </p>
          </>
        ) : (
          <>
            <div style={{
              width: "180px",
              height: "180px",
              borderRadius: "50%",
              background: escalated ? G.redLight : G.blueLight,
              border: `6px solid ${escalated ? G.red : G.blue}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "52px",
            }}>
              {escalated ? "🚨" : "⏳"}
            </div>

            <button
              onClick={() => setShowPinModal(true)}
              style={{
                marginTop: "40px",
                background: "transparent",
                border: `1.5px solid ${G.gray200}`,
                borderRadius: "12px",
                padding: "12px 24px",
                fontSize: "14px",
                color: G.gray600,
                cursor: "pointer",
              }}
            >
              Encerrar alerta
            </button>
            <p style={{ fontSize: "11px", color: G.gray400, marginTop: "6px" }}>Requer PIN de confirmação</p>
          </>
        )}
      </div>

      {showPinModal && (
        <div style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "flex-end",
          zIndex: 100,
        }}>
          <div style={{
            background: G.white,
            width: "100%",
            borderRadius: "24px 24px 0 0",
            padding: "28px 24px 40px",
          }}>
            <h3 style={{ margin: "0 0 4px", color: G.gray800 }}>Encerrar alerta</h3>
            <p style={{ margin: "0 0 20px", fontSize: "13px", color: G.gray400 }}>
              Digite o PIN para confirmar o encerramento
            </p>
            <input
              type="password"
              inputMode="numeric"
              maxLength={10}
              placeholder="PIN"
              value={pin}
              onChange={e => setPin(e.target.value)}
              style={{
                width: "100%",
                padding: "14px",
                fontSize: "20px",
                letterSpacing: "6px",
                textAlign: "center",
                border: `1.5px solid ${pinError ? G.red : G.gray200}`,
                borderRadius: "12px",
                marginBottom: "8px",
                boxSizing: "border-box",
              }}
            />
            {pinError && <p style={{ color: G.red, fontSize: "13px", margin: "0 0 12px" }}>{pinError}</p>}
            <div style={{ display: "flex", gap: "10px" }}>
              <Btn
                onClick={() => {
                  setShowPinModal(false);
                  setPin("");
                  setPinError("");
                }}
                color={G.gray100}
                textColor={G.gray800}
              >
                Cancelar
              </Btn>
              <Btn onClick={handleResolveByPin} color={G.green}>Confirmar</Btn>
            </div>
          </div>
        </div>
      )}
    </PhoneFrame>
  );
}
