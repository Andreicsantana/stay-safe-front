import { useState } from "react";
import { api } from "../services/api";
import { G } from "../constants/colors";
import Btn from "../components/Btn";
import PhoneFrame from "../components/PhoneFrame";

export default function CreateProfileScreen({ user, onCreated, onLogout }) {
  const [step, setStep] = useState("role"); // "role" | "details"
  const [role, setRole] = useState(null);
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSelectRole = (selectedRole) => {
    setRole(selectedRole);
    setStep("details");
  };

  const handleCreate = async () => {
    setError("");

    if (!name.trim()) return setError("Digite um nome para o perfil.");
    if (role === "dependent" && pin && pin !== confirmPin) {
      return setError("Os PINs não coincidem.");
    }

    setLoading(true);
    try {
      const body = { userId: user.id, name: name.trim(), role };
      if (role === "dependent" && pin) body.pin = pin;

      const data = await api.post("/auth/create-profile", body);
      onCreated(data.profile);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    {
      role: "carer",
      emoji: "🩺",
      label: "Cuidador",
      description: "Monitora alertas e responde quando o dependente precisa de ajuda.",
      bg: G.blueLight,
      color: G.blue,
    },
    {
      role: "dependent",
      emoji: "🙋",
      label: "Dependente",
      description: "Emite alertas de emergência para ser atendido pelo cuidador.",
      bg: G.redLight,
      color: G.red,
    },
  ];

  return (
    <PhoneFrame>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "24px 20px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
          <div>
            <p style={{ margin: 0, fontSize: "13px", color: G.gray400 }}>Bem-vindo,</p>
            <p style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: G.gray800 }}>{user.name.split(" ")[0]}!</p>
          </div>
          <button
            onClick={onLogout}
            style={{
              background: G.gray100,
              border: "none",
              borderRadius: "10px",
              padding: "8px 12px",
              fontSize: "12px",
              color: G.gray600,
              cursor: "pointer",
            }}
          >
            Sair
          </button>
        </div>

        {step === "role" && (
          <>
            <div style={{ textAlign: "center", marginBottom: "28px" }}>
              <div style={{ fontSize: "40px", marginBottom: "10px" }}>👤</div>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: G.gray800 }}>
                Criar primeiro perfil
              </h2>
              <p style={{ margin: "6px 0 0", color: G.gray400, fontSize: "14px" }}>
                Qual é o tipo de perfil que você deseja criar?
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {roleOptions.map(opt => (
                <button
                  key={opt.role}
                  onClick={() => handleSelectRole(opt.role)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    padding: "18px 16px",
                    background: G.white,
                    border: `1.5px solid ${G.gray200}`,
                    borderRadius: "18px",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "border-color 0.15s",
                  }}
                >
                  <div style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    background: opt.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "26px",
                    flexShrink: 0,
                  }}>
                    {opt.emoji}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: "16px", color: G.gray800 }}>{opt.label}</p>
                    <p style={{ margin: "3px 0 0", fontSize: "13px", color: G.gray400, lineHeight: 1.4 }}>
                      {opt.description}
                    </p>
                  </div>
                  <span style={{ marginLeft: "auto", color: G.gray400, fontSize: "18px" }}>›</span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === "details" && (
          <>
            <button
              onClick={() => { setStep("role"); setError(""); }}
              style={{
                background: "transparent",
                border: "none",
                color: G.blue,
                fontSize: "14px",
                cursor: "pointer",
                padding: 0,
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              ← Voltar
            </button>

            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: role === "carer" ? G.blueLight : G.redLight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "30px",
                margin: "0 auto 12px",
              }}>
                {role === "carer" ? "🩺" : "🙋"}
              </div>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: G.gray800 }}>
                Perfil de {role === "carer" ? "Cuidador" : "Dependente"}
              </h2>
              <p style={{ margin: "4px 0 0", fontSize: "13px", color: G.gray400 }}>
                Preencha as informações do perfil
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "13px", color: G.gray600, fontWeight: 500, display: "block", marginBottom: "6px" }}>
                  Nome do perfil
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={role === "carer" ? "Ex: Maria (Cuidadora)" : "Ex: João (Dependente)"}
                  style={{
                    width: "100%",
                    padding: "13px 14px",
                    border: `1.5px solid ${G.gray200}`,
                    borderRadius: "12px",
                    fontSize: "15px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {role === "dependent" && (
                <>
                  <div>
                    <label style={{ fontSize: "13px", color: G.gray600, fontWeight: 500, display: "block", marginBottom: "6px" }}>
                      PIN de segurança <span style={{ color: G.gray400, fontWeight: 400 }}>(opcional)</span>
                    </label>
                    <p style={{ fontSize: "12px", color: G.gray400, margin: "0 0 8px" }}>
                      Usado para encerrar alertas pelo dependente
                    </p>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={10}
                      value={pin}
                      onChange={e => setPin(e.target.value)}
                      placeholder="Deixe vazio para não usar PIN"
                      style={{
                        width: "100%",
                        padding: "13px 14px",
                        border: `1.5px solid ${G.gray200}`,
                        borderRadius: "12px",
                        fontSize: "15px",
                        outline: "none",
                        boxSizing: "border-box",
                        letterSpacing: pin ? "6px" : "0",
                      }}
                    />
                  </div>
                  {pin && (
                    <div>
                      <label style={{ fontSize: "13px", color: G.gray600, fontWeight: 500, display: "block", marginBottom: "6px" }}>
                        Confirmar PIN
                      </label>
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={10}
                        value={confirmPin}
                        onChange={e => setConfirmPin(e.target.value)}
                        placeholder="Repita o PIN"
                        style={{
                          width: "100%",
                          padding: "13px 14px",
                          border: `1.5px solid ${confirmPin && confirmPin !== pin ? G.red : G.gray200}`,
                          borderRadius: "12px",
                          fontSize: "15px",
                          outline: "none",
                          boxSizing: "border-box",
                          letterSpacing: confirmPin ? "6px" : "0",
                        }}
                      />
                      {confirmPin && confirmPin !== pin && (
                        <p style={{ color: G.red, fontSize: "12px", margin: "4px 0 0" }}>PINs não coincidem</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {error && (
              <div style={{
                background: G.redLight,
                color: G.red,
                padding: "10px 14px",
                borderRadius: "10px",
                marginTop: "16px",
                fontSize: "14px",
              }}>
                {error}
              </div>
            )}

            <div style={{ marginTop: "auto", paddingTop: "24px" }}>
              <Btn
                onClick={handleCreate}
                disabled={loading}
                color={role === "carer" ? G.blue : G.red}
              >
                {loading ? "Criando perfil..." : "Criar perfil"}
              </Btn>
            </div>
          </>
        )}
      </div>
    </PhoneFrame>
  );
}
