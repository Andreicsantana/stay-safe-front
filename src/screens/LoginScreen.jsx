import { useState } from "react";
import { api } from "../services/api";
import { G } from "../constants/colors";
import Btn from "../components/Btn";

export default function LoginScreen({ onLogin, onRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.post("/auth/login", { email, password });
      onLogin(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-card">
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{
            width: "80px",
            height: "80px",
            background: G.blue,
            borderRadius: "50%",
            margin: "0 auto 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "36px",
            boxShadow: "0 8px 16px rgba(37,99,235,0.2)",
          }}>
            🛡️
          </div>
          <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 700, color: G.gray800 }}>Stay Safe</h1>
          <p style={{ margin: "4px 0 0", color: G.gray400, fontSize: "14px" }}>Cuidado conectado, segurança garantida</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
          <div>
            <label style={{ fontSize: "13px", color: G.gray600, fontWeight: 500, display: "block", marginBottom: "6px" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              style={{
                width: "100%",
                padding: "13px 14px",
                border: `1.5px solid ${G.gray200}`,
                borderRadius: "12px",
                fontSize: "15px",
                background: G.white,
                outline: "none",
                boxSizing: "border-box",
                color: G.gray800,
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: "13px", color: G.gray600, fontWeight: 500, display: "block", marginBottom: "6px" }}>
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              style={{
                width: "100%",
                padding: "13px 14px",
                border: `1.5px solid ${G.gray200}`,
                borderRadius: "12px",
                fontSize: "15px",
                background: G.white,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        {error && (
          <div style={{
            background: G.redLight,
            color: G.red,
            padding: "10px 14px",
            borderRadius: "10px",
            marginBottom: "16px",
            fontSize: "14px",
          }}>
            {error}
          </div>
        )}

        <Btn onClick={handleLogin} disabled={loading} color={G.blue}>
          {loading ? "Entrando..." : "Entrar"}
        </Btn>

        <p style={{ textAlign: "center", fontSize: "12px", color: G.gray400, marginTop: "24px" }}>
          Login único — após configurado, o dependente não precisa fazer login novamente.
        </p>

        <div style={{ borderTop: `1px solid ${G.gray200}`, margin: "20px 0 0" }} />

        <button
          onClick={onRegister}
          style={{
            marginTop: "16px",
            background: "transparent",
            border: "none",
            color: G.blue,
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
            padding: "8px",
          }}
        >
          Não tem uma conta? <strong>Criar conta</strong>
        </button>
      </div>
    </div>
  );
}
