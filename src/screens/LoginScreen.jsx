import { useState } from "react";
import { Eye, EyeSlash, SignIn, UserPlus, WarningCircle } from "@phosphor-icons/react";
import { api } from "../services/api";
import PhoneFrame from "../components/PhoneFrame";
import Logo from "../components/Logo";
import Btn from "../components/Btn";

export default function LoginScreen({ onLogin, onRegister, notice = "" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await api.post("/auth/login", { email, password });
      onLogin(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PhoneFrame bgClass="bg-fundo">
      <div className="flex flex-1 flex-col justify-center px-5 py-8">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size="lg" />
          <p className="mt-2 mb-0 text-[18px] text-texto-secundario">
            Cuidado conectado, segurança garantida
          </p>
        </div>

        {notice && (
          <div
            role="status"
            className="mb-5 flex items-start gap-2.5 rounded-[10px] border border-atencao bg-atencao-suave p-3.5 text-[16px] font-semibold text-atencao"
          >
            <WarningCircle size={22} weight="bold" className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{notice}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="rounded-[10px] border border-borda bg-superficie p-5">
          <h1 className="mt-0 mb-5 font-display text-[24px] font-bold text-texto">
            Entrar na conta
          </h1>

          <div className="mb-4 flex flex-col gap-4">
            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-[16px] font-semibold text-texto">
                E-mail
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="min-h-[56px] w-full rounded-[8px] border border-borda bg-fundo px-3.5 text-[18px] text-texto placeholder:text-texto-suave focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-cuidado"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="mb-1.5 block text-[16px] font-semibold text-texto">
                Senha
              </label>
              <div className="flex gap-2">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  className="min-h-[56px] flex-1 rounded-[8px] border border-borda bg-fundo px-3.5 text-[18px] text-texto placeholder:text-texto-suave focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-cuidado"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="inline-flex min-h-[56px] shrink-0 items-center gap-1.5 rounded-[8px] border border-borda bg-fundo px-3 text-[15px] font-semibold text-texto focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-cuidado"
                >
                  {showPassword ? (
                    <>
                      <EyeSlash size={20} weight="bold" aria-hidden="true" />
                      <span>Ocultar</span>
                    </>
                  ) : (
                    <>
                      <Eye size={20} weight="bold" aria-hidden="true" />
                      <span>Mostrar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2.5 rounded-[8px] border border-emergencia bg-emergencia-suave p-3 text-[16px] font-semibold text-emergencia"
            >
              <WarningCircle size={20} weight="bold" className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <Btn type="submit" disabled={loading} variant="primario" size="normal">
            <SignIn size={20} weight="bold" aria-hidden="true" />
            <span>{loading ? "Entrando…" : "Entrar"}</span>
          </Btn>
        </form>

        <p className="mt-5 mb-4 text-center text-[16px] text-texto-secundario">
          Login único — após configurado, o dependente fica conectado neste aparelho.
        </p>

        <Btn onClick={onRegister} variant="secundario" size="normal">
          <UserPlus size={20} weight="bold" aria-hidden="true" />
          <span>Criar conta</span>
        </Btn>
      </div>
    </PhoneFrame>
  );
}
