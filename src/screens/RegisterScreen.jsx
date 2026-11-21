import { useState } from "react";
import { ArrowLeft, Eye, EyeSlash, UserPlus, WarningCircle } from "@phosphor-icons/react";
import { api } from "../services/api";
import PhoneFrame from "../components/PhoneFrame";
import Logo from "../components/Logo";
import Btn from "../components/Btn";

export default function RegisterScreen({ onSuccess, onBack }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    if (e) e.preventDefault();
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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PhoneFrame bgClass="bg-fundo">
      <div className="flex flex-1 flex-col px-5 py-6">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-[8px] border border-borda bg-superficie px-3.5 text-[16px] font-semibold text-texto focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-cuidado"
          >
            <ArrowLeft size={20} weight="bold" aria-hidden="true" />
            <span>Voltar</span>
          </button>
          <Logo size="sm" />
        </div>

        <form onSubmit={handleRegister} className="rounded-[10px] border border-borda bg-superficie p-5">
          <h1 className="mt-0 mb-1 font-display text-[24px] font-bold text-texto">
            Criar conta
          </h1>
          <p className="mt-0 mb-5 text-[16px] text-texto-secundario">
            Cadastre a conta principal da família.
          </p>

          <div className="mb-5 flex flex-col gap-4">
            <div>
              <label htmlFor="reg-name" className="mb-1.5 block text-[16px] font-semibold text-texto">
                Nome completo
              </label>
              <input
                id="reg-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Maria da Silva"
                className="min-h-[56px] w-full rounded-[8px] border border-borda bg-fundo px-3.5 text-[18px] text-texto placeholder:text-texto-suave focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-cuidado"
              />
            </div>

            <div>
              <label htmlFor="reg-email" className="mb-1.5 block text-[16px] font-semibold text-texto">
                E-mail
              </label>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="maria@email.com"
                className="min-h-[56px] w-full rounded-[8px] border border-borda bg-fundo px-3.5 text-[18px] text-texto placeholder:text-texto-suave focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-cuidado"
              />
              <p className="mt-1 mb-0 text-[14px] text-texto-secundario">
                Usado para receber avisos de emergência por e-mail.
              </p>
            </div>

            <div>
              <label htmlFor="reg-phone" className="mb-1.5 block text-[16px] font-semibold text-texto">
                Telefone de contato
              </label>
              <input
                id="reg-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+55 11 99999-9999"
                className="min-h-[56px] w-full rounded-[8px] border border-borda bg-fundo px-3.5 text-[18px] text-texto placeholder:text-texto-suave focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-cuidado"
              />
            </div>

            <div>
              <label htmlFor="reg-password" className="mb-1.5 block text-[16px] font-semibold text-texto">
                Senha
              </label>
              <div className="flex gap-2">
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
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

            <div>
              <label htmlFor="reg-confirm" className="mb-1.5 block text-[16px] font-semibold text-texto">
                Confirmar senha
              </label>
              <input
                id="reg-confirm"
                type={showPassword ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repita a senha"
                className={`min-h-[56px] w-full rounded-[8px] border bg-fundo px-3.5 text-[18px] text-texto placeholder:text-texto-suave focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-cuidado ${
                  confirm && confirm !== password ? "border-emergencia" : "border-borda"
                }`}
              />
              {confirm && confirm !== password && (
                <p className="mt-1 mb-0 text-[15px] font-semibold text-emergencia">
                  As senhas não coincidem.
                </p>
              )}
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
            <UserPlus size={20} weight="bold" aria-hidden="true" />
            <span>{loading ? "Criando conta…" : "Criar conta"}</span>
          </Btn>
        </form>
      </div>
    </PhoneFrame>
  );
}
