import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, Copy, SignOut } from "@phosphor-icons/react";
import Btn from "./Btn";

export default function EditProfileModal({
  profile,
  onClose,
  onSave,
  onRequestForceLogout,
  loading = false,
  error = "",
  title = "Editar perfil",
  description = "Atualize os dados do perfil selecionado.",
}) {
  const [name, setName] = useState(profile?.name || "");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [localError, setLocalError] = useState("");
  const [copiedId, setCopiedId] = useState(false);

  const handleSave = () => {
    setLocalError("");
    if (!name.trim()) return setLocalError("O nome não pode ficar vazio.");
    if (pin && pin !== confirmPin) return setLocalError("Os PINs não coincidem.");
    onSave({ name: name.trim(), pin: pin || undefined });
  };

  const handleCopyId = async () => {
    if (!profile?.id) return;
    try {
      await navigator.clipboard.writeText(profile.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  const displayError = localError || error;

  return (
    <Dialog.Root open={Boolean(profile)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-texto/50" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[90dvh] w-full max-w-[480px] overflow-y-auto rounded-t-[16px] border-t border-borda bg-superficie px-5 pt-4 pb-8 focus-visible:outline-none">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-borda" aria-hidden="true" />
          <Dialog.Title className="m-0 font-display text-[22px] font-bold text-texto">
            {title}
          </Dialog.Title>
          <Dialog.Description className="mt-1 mb-4 text-[16px] text-texto-secundario">
            {description}
          </Dialog.Description>

          <div className="flex flex-col gap-4">
            <div>
              <label htmlFor="edit-profile-name" className="mb-1.5 block text-[16px] font-semibold text-texto">
                Nome do perfil
              </label>
              <input
                id="edit-profile-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="min-h-[56px] w-full rounded-[8px] border border-borda bg-fundo px-3.5 text-[18px] text-texto focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-cuidado"
              />
            </div>

            {profile?.role === "dependent" && (
              <>
                <div>
                  <label htmlFor="edit-profile-pin" className="mb-1.5 block text-[16px] font-semibold text-texto">
                    Novo PIN (deixe vazio para não alterar)
                  </label>
                  <input
                    id="edit-profile-pin"
                    type="password"
                    inputMode="numeric"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Novo PIN"
                    className="min-h-[56px] w-full rounded-[8px] border border-borda bg-fundo px-3.5 text-[18px] text-texto focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-cuidado"
                  />
                </div>

                {pin && (
                  <div>
                    <label htmlFor="edit-profile-confirm-pin" className="mb-1.5 block text-[16px] font-semibold text-texto">
                      Confirmar PIN
                    </label>
                    <input
                      id="edit-profile-confirm-pin"
                      type="password"
                      inputMode="numeric"
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value)}
                      placeholder="Repita o PIN"
                      className="min-h-[56px] w-full rounded-[8px] border border-borda bg-fundo px-3.5 text-[18px] text-texto focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-cuidado"
                    />
                  </div>
                )}

                <div className="rounded-[8px] border border-borda bg-fundo p-3.5">
                  <p className="mt-0 mb-1 text-[14px] font-semibold text-texto-secundario">
                    ID do perfil
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <code className="break-all text-[14px] text-texto">{profile.id}</code>
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className="inline-flex min-h-[48px] shrink-0 items-center gap-1.5 rounded-[8px] border border-borda bg-superficie px-3 text-[15px] font-semibold text-texto focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-cuidado"
                    >
                      {copiedId ? (
                        <>
                          <Check size={18} weight="bold" className="text-cuidado" aria-hidden="true" />
                          <span>Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy size={18} weight="bold" aria-hidden="true" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {onRequestForceLogout && (
                  <div className="rounded-[8px] border border-emergencia/40 bg-emergencia-suave p-3.5">
                    <p className="mt-0 mb-1 text-[16px] font-bold text-emergencia">
                      Desconectar dispositivo
                    </p>
                    <p className="mt-0 mb-3 text-[15px] text-texto">
                      Força a saída do dependente em todos os celulares conectados.
                    </p>
                    <Btn
                      onClick={onRequestForceLogout}
                      variant="perigo"
                      size="normal"
                      disabled={loading}
                    >
                      <SignOut size={18} weight="bold" aria-hidden="true" />
                      <span>Desconectar dependente</span>
                    </Btn>
                  </div>
                )}
              </>
            )}

            {displayError && (
              <p role="alert" className="m-0 text-[16px] font-semibold text-emergencia">
                {displayError}
              </p>
            )}

            <div className="flex flex-col gap-2.5 pt-2">
              <Btn onClick={handleSave} variant="primario" size="normal" disabled={loading}>
                {loading ? "Salvando…" : "Salvar alterações"}
              </Btn>
              <Btn onClick={onClose} variant="secundario" size="normal">
                Cancelar
              </Btn>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
