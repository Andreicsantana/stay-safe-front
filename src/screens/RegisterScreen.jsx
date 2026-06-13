import { useState } from "react";
import { api } from "../services/api";
import { G } from "../constants/colors";
import Btn from "../components/Btn";

export default function RegisterScreen({ onSuccess, onBack }) {
  const [name, setName]           = useState("");
  const [email, setEmail]         = useState("");
  const [phone, setPhone]         = useState("");
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  const handleRegister = async () => {
    setError("");

    if (!name.trim() || !email.trim() || !phone.trim() || !password) {
      return setError("Preencha todos os campos obrigatórios.");
    }
    if (password !== confirm) {
      return setError("As senhas não coincidem.");
    }
    if (password.length < 6) {
      return setError("A senha deve ter pelo menos 6 caracteres.");
    }

    setLoading(true);
    try {
      await api.post("/users/register", { name, email, phone, password });
      onSuccess();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "13px 14px",
    border: `1.5px solid ${G.gray200}`,
    borderRadius: "12px",
    fontSize: "15px",
    background: G.bgInput,
    outline: "none",
    boxSizing: "border-box",
    color: G.textPrimary,
  };

  const labelStyle = {
    fontSize: "13px",
    color: G.gray600,
    fontWeight: 500,
    display: "block",
    marginBottom: "6px",
  };

  const field = (label, input, hint) => (
    <div>
      <label style={labelStyle}>{label}</label>
      {input}
      {hint && <p style={{ fontSize: "11px", color: G.gray400, margin: "4px 0 0" }}>{hint}</p>}
    </div>
  );

  return (
    <div className="login-page-wrapper">
      <div className="login-card">
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{
            width: "72px", height: "72px", background: G.blue,
            borderRadius: "50%", margin: "0 auto 14px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "32px", boxShadow: "0 8px 16px rgba(37,99,235,0.2)",
          }}>
            🛡️
          </div>
          <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 700, color: G.gray800 }}>Criar conta</h1>
          <p style={{ margin: "4px 0 0", color: G.gray400, fontSize: "14px" }}>Junte-se ao Stay Safe</p>
        </div>

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "20px" }}>
          {field("Nome completo",
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Maria da Silva" style={inputStyle} />
          )}

          {field("Email",
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="maria@email.com" style={inputStyle} />,
            "Usado para notificações de alerta"
          )}

          {field("Telefone / WhatsApp",
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="+55 11 99999-9999" style={inputStyle} />,
            "Receberá ligação e SMS quando o alerta for acionado"
          )}

          {field("Senha",
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres" style={inputStyle} />
          )}

          {field("Confirmar senha",
            <>
              <input type="password" value={confirm}
                onChange={e => setConfirm(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleRegister()}
                placeholder="Repita a senha"
                style={{
                  ...inputStyle,
                  borderColor: confirm && confirm !== password ? G.red : G.gray200,
                }} />
              {confirm && confirm !== password && (
                <p style={{ color: G.red, fontSize: "12px", margin: "4px 0 0" }}>As senhas não coincidem</p>
              )}
            </>
          )}
        </div>

        {error && (
          <div style={{
            background: G.redLight, color: G.red,
            padding: "10px 14px", borderRadius: "10px",
            marginBottom: "16px", fontSize: "14px",
          }}>
            {error}
          </div>
        )}

        <Btn onClick={handleRegister} disabled={loading} color={G.blue}>
          {loading ? "Criando conta..." : "Criar conta"}
        </Btn>

        <button onClick={onBack} style={{
          marginTop: "16px", background: "transparent", border: "none",
          color: G.blue, fontSize: "14px", fontWeight: 500,
          cursor: "pointer", padding: "8px",
        }}>
          ← Já tenho uma conta
        </button>
      </div>
    </div>
  );
}
