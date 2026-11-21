import { useState } from "react";
import {
  ArrowLeft,
  CaretRight,
  HandHeart,
  SignOut,
  UserCircle,
  UserPlus,
  WarningCircle,
} from "@phosphor-icons/react";
import { api } from "../services/api";
import PhoneFrame from "../components/PhoneFrame";
import Logo from "../components/Logo";
import Btn from "../components/Btn";

export default function CreateProfileScreen({ user, onCreated, onLogout }) {
  const [step, setStep] = useState("role");
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

  const handleCreate = async (e) => {
    if (e) e.preventDefault();
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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    {
      role: "carer",
      Icon: HandHeart,
      label: "Cuidador",
      description: "Recebe alertas em tempo real e confirma que está a caminho.",
      badgeClasses: "bg-cuidado-suave text-cuidado",
    },
    {
      role: "dependent",
      Icon: UserCircle,
      label: "Dependente",
      description: "Tela simplificada com botão grande de ajuda para o idoso.",
      badgeClasses: "bg-emergencia-suave text-emergencia",
    },
  ];

  const firstName = user?.name?.split(" ")[0] || "usuário";

  return (
    <PhoneFrame bgClass="bg-fundo">
      <div className="flex flex-1 flex-col px-5 py-6">
        <header className="mb-6 flex items-center justify-between gap-2">
          <Logo size="sm" />
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex min-h-[48px] items-center gap-1.5 rounded-[8px] border border-borda bg-superficie px-3 text-[16px] font-semibold text-texto focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-cuidado"
          >
            <SignOut size={18} weight="bold" aria-hidden="true" />
            <span>Sair</span>
          </button>
        </header>

        <p className="mt-0 mb-2 text-[15px] font-semibold text-cuidado">
          {step === "role" ? "Passo 1 de 2" : "Passo 2 de 2"}
        </p>

        {step === "role" ? (
          <div>
            <h1 className="mt-0 mb-1 font-display text-[26px] font-bold text-texto">
              Criar perfil para {firstName}
            </h1>
            <p className="mt-0 mb-6 text-[18px] text-texto-secundario">
              Escolha quem vai usar este perfil:
            </p>

            <div className="flex flex-col gap-3">
              {roleOptions.map((opt) => {
                const { Icon } = opt;
                return (
                  <button
                    key={opt.role}
                    type="button"
                    onClick={() => handleSelectRole(opt.role)}
                    className="flex min-h-[88px] w-full items-center gap-4 rounded-[10px] border border-borda bg-superficie p-4 text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-cuidado"
                  >
                    <div
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[10px] ${opt.badgeClasses}`}
                    >
                      <Icon size={32} weight="bold" aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                      <p className="m-0 text-[20px] font-bold text-texto">{opt.label}</p>
                      <p className="mt-1 mb-0 text-[16px] leading-snug text-texto-secundario">
                        {opt.description}
                      </p>
                    </div>
                    <CaretRight size={24} weight="bold" className="shrink-0 text-texto-suave" aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="flex flex-1 flex-col">
            <button
              type="button"
              onClick={() => {
                setStep("role");
                setError("");
              }}
              className="mb-4 inline-flex min-h-[48px] w-fit items-center gap-2 rounded-[8px] border border-borda bg-superficie px-3.5 text-[16px] font-semibold text-texto focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-cuidado"
            >
              <ArrowLeft size={20} weight="bold" aria-hidden="true" />
              <span>Voltar</span>
            </button>

            <div className="rounded-[10px] border border-borda bg-superficie p-5">
              <div className="mb-4 flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-[10px] ${
                    role === "carer"
                      ? "bg-cuidado-suave text-cuidado"
                      : "bg-emergencia-suave text-emergencia"
                  }`}
                >
                  {role === "carer" ? (
                    <HandHeart size={28} weight="bold" aria-hidden="true" />
                  ) : (
                    <UserCircle size={28} weight="bold" aria-hidden="true" />
                  )}
                </div>
                <div>
                  <h1 className="m-0 font-display text-[22px] font-bold text-texto">
                    Perfil de {role === "carer" ? "Cuidador" : "Dependente"}
                  </h1>
                  <p className="m-0 text-[15px] text-texto-secundario">
                    Preencha as informações abaixo
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label htmlFor="create-prof-name" className="mb-1.5 block text-[16px] font-semibold text-texto">
                    Nome do perfil
                  </label>
                  <input
                    id="create-prof-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={role === "carer" ? "Ex: Maria (Cuidadora)" : "Ex: João (Dependente)"}
                    className="min-h-[56px] w-full rounded-[8px] border border-borda bg-fundo px-3.5 text-[18px] text-texto placeholder:text-texto-suave focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-cuidado"
                  />
                </div>

                {role === "dependent" && (
                  <>
                    <div>
                      <label htmlFor="create-prof-pin" className="mb-1.5 block text-[16px] font-semibold text-texto">
                        PIN de segurança (opcional)
                      </label>
                      <input
                        id="create-prof-pin"
                        type="password"
                        inputMode="numeric"
                        maxLength={6}
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        placeholder="Ex: 1234"
                        className="min-h-[56px] w-full rounded-[8px] border border-borda bg-fundo px-3.5 text-[18px] text-texto placeholder:text-texto-suave focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-cuidado"
                      />
                      <p className="mt-1 mb-0 text-[14px] text-texto-secundario">
                        Se definido, o dependente precisará digitar este PIN para encerrar um alerta.
                      </p>
                    </div>

                    {pin && (
                      <div>
                        <label htmlFor="create-prof-confirm-pin" className="mb-1.5 block text-[16px] font-semibold text-texto">
                          Confirmar PIN
                        </label>
                        <input
                          id="create-prof-confirm-pin"
                          type="password"
                          inputMode="numeric"
                          maxLength={6}
                          value={confirmPin}
                          onChange={(e) => setConfirmPin(e.target.value)}
                          placeholder="Repita o PIN"
                          className="min-h-[56px] w-full rounded-[8px] border border-borda bg-fundo px-3.5 text-[18px] text-texto placeholder:text-texto-suave focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-cuidado"
                        />
                        {confirmPin && confirmPin !== pin && (
                          <p className="mt-1 mb-0 text-[15px] font-semibold text-emergencia">
                            Os PINs não coincidem.
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}

                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 rounded-[8px] border border-emergencia bg-emergencia-suave p-3 text-[16px] font-semibold text-emergencia"
                  >
                    <WarningCircle size={20} weight="bold" className="mt-0.5 shrink-0" aria-hidden="true" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="pt-2">
                  <Btn type="submit" disabled={loading} variant="primario" size="normal">
                    <UserPlus size={20} weight="bold" aria-hidden="true" />
                    <span>{loading ? "Criando perfil…" : "Criar perfil"}</span>
                  </Btn>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </PhoneFrame>
  );
}
