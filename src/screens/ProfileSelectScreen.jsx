import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Check,
  Copy,
  DeviceMobile,
  HandHeart,
  PencilSimple,
  Plus,
  SignOut,
  Trash,
  UserCircle,
  UserPlus,
  WarningCircle,
} from "@phosphor-icons/react";
import { api } from "../services/api";
import PhoneFrame from "../components/PhoneFrame";
import Logo from "../components/Logo";
import Btn from "../components/Btn";
import ConfirmModal from "../components/ConfirmModal";

const WEB_DEVICE_TOKEN_KEY = "staysafe_device_token";

function getDeviceToken() {
  try {
    let token = localStorage.getItem(WEB_DEVICE_TOKEN_KEY);
    if (!token) {
      token = `web-${Math.random().toString(36).slice(2)}-${Date.now()}`;
      localStorage.setItem(WEB_DEVICE_TOKEN_KEY, token);
    }
    return token;
  } catch {
    return `web-${Math.random().toString(36).slice(2)}`;
  }
}

export default function ProfileSelectScreen({
  user,
  profiles: initialProfiles,
  onSelect,
  onCreateProfile,
  onLogout,
}) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [loadingId, setLoadingId] = useState(null);
  const [error, setError] = useState("");

  const [editModal, setEditModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPin, setEditPin] = useState("");
  const [editConfirmPin, setEditConfirmPin] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  const handleSelect = async (profile) => {
    setLoadingId(profile.id);
    setError("");
    try {
      const data = await api.post("/auth/select-profile", {
        userId: user.id,
        profileId: profile.id,
        deviceToken: getDeviceToken(),
        platform: "web",
      });
      onSelect(profile, data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingId(null);
    }
  };

  const openEdit = (profile) => {
    setEditName(profile.name);
    setEditPin("");
    setEditConfirmPin("");
    setModalError("");
    setCopiedId(false);
    setEditModal(profile);
  };

  const handleEdit = async () => {
    if (!editName.trim()) return setModalError("O nome não pode ficar vazio.");
    if (editPin && editPin !== editConfirmPin) return setModalError("Os PINs não coincidem.");

    setModalLoading(true);
    setModalError("");
    try {
      const body = { userId: user.id, profileId: editModal.id, name: editName.trim() };
      if (editPin) body.pin = editPin;

      const data = await api.patch("/auth/update-profile", body);
      setProfiles((prev) =>
        prev.map((p) => (p.id === data.profile.id ? { ...p, ...data.profile } : p))
      );
      setEditModal(null);
    } catch (e) {
      setModalError(e.message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setModalLoading(true);
    setError("");
    try {
      await api.delete("/auth/delete-profile", {
        userId: user.id,
        profileId: deleteTarget.id,
      });
      setProfiles((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e) {
      setError(e.message);
      setDeleteTarget(null);
    } finally {
      setModalLoading(false);
    }
  };

  const handleConfirmForceLogout = async () => {
    setConfirmLogout(false);
    if (!editModal) return;
    setModalLoading(true);
    setModalError("");
    try {
      await api.post("/auth/force-logout", { userId: user.id, profileId: editModal.id });
      setEditModal(null);
    } catch (e) {
      setModalError(e.message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleCopyId = async () => {
    if (!editModal?.id) return;
    try {
      await navigator.clipboard.writeText(editModal.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  const carers = profiles.filter((p) => p.role === "carer");
  const dependents = profiles.filter((p) => p.role === "dependent");
  const firstName = user?.name?.split(" ")[0] || "usuário";

  const renderProfileCard = (profile) => {
    const isCarer = profile.role === "carer";
    const Icon = isCarer ? HandHeart : UserCircle;

    return (
      <div
        key={profile.id}
        className="rounded-[10px] border border-borda bg-superficie p-4"
      >
        <button
          type="button"
          onClick={() => handleSelect(profile)}
          disabled={loadingId !== null}
          className="flex min-h-[64px] w-full items-center gap-3.5 rounded-[8px] text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-cuidado disabled:opacity-60"
        >
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] ${
              isCarer
                ? "bg-cuidado-suave text-cuidado"
                : "bg-emergencia-suave text-emergencia"
            }`}
          >
            <Icon size={28} weight="bold" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <p className="m-0 text-[20px] font-bold text-texto">{profile.name}</p>
            <p
              className={`m-0 text-[16px] font-semibold ${
                isCarer ? "text-cuidado" : "text-emergencia"
              }`}
            >
              {loadingId === profile.id
                ? "Entrando…"
                : isCarer
                  ? "Cuidador — tocar para abrir"
                  : "Dependente — tocar para abrir"}
            </p>
          </div>
        </button>

        <div className="mt-3 flex gap-2 border-t border-borda pt-3">
          <button
            type="button"
            onClick={() => openEdit(profile)}
            className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-[8px] border border-borda bg-fundo px-3 text-[16px] font-semibold text-texto focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-cuidado"
          >
            <PencilSimple size={18} weight="bold" aria-hidden="true" />
            <span>Editar</span>
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(profile)}
            className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-[8px] border border-emergencia/40 bg-emergencia-suave px-3 text-[16px] font-semibold text-emergencia focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emergencia"
          >
            <Trash size={18} weight="bold" aria-hidden="true" />
            <span>Apagar</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <PhoneFrame bgClass="bg-fundo">
      <div className="flex flex-1 flex-col px-5 py-6">
        <header className="mb-6 flex items-center justify-between gap-2">
          <Logo size="sm" />
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex min-h-[48px] items-center gap-1.5 rounded-[8px] border border-borda bg-superficie px-3 text-[16px] font-semibold text-texto focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-cuidado"
            >
              <SignOut size={18} weight="bold" aria-hidden="true" />
              <span>Sair</span>
            </button>
          )}
        </header>

        <div className="mb-6">
          <h1 className="m-0 font-display text-[28px] font-bold text-texto">
            Olá, {firstName}
          </h1>
          <p className="mt-1 mb-0 text-[18px] text-texto-secundario">
            Selecione quem vai usar este aparelho.
          </p>
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

        {carers.length > 0 && (
          <section className="mb-5">
            <h2 className="mt-0 mb-2.5 font-display text-[18px] font-bold text-texto">
              Perfis de Cuidador
            </h2>
            <div className="flex flex-col gap-3">{carers.map(renderProfileCard)}</div>
          </section>
        )}

        {dependents.length > 0 && (
          <section className="mb-5">
            <h2 className="mt-0 mb-2.5 font-display text-[18px] font-bold text-texto">
              Perfis de Dependente
            </h2>
            <div className="flex flex-col gap-3">{dependents.map(renderProfileCard)}</div>
          </section>
        )}

        {profiles.length === 0 && (
          <div className="mb-5 flex flex-col items-center rounded-[10px] border border-borda bg-superficie px-5 py-8 text-center">
            <UserPlus size={44} weight="bold" className="mb-3 text-cuidado" aria-hidden="true" />
            <p className="m-0 text-[18px] font-bold text-texto">Nenhum perfil criado</p>
            <p className="mt-1 mb-0 text-[16px] text-texto-secundario">
              Crie o primeiro perfil para começar.
            </p>
          </div>
        )}

        <div className="mt-auto flex flex-col gap-3 pt-2">
          <Btn onClick={onCreateProfile} variant="secundario" size="normal">
            <Plus size={20} weight="bold" aria-hidden="true" />
            <span>Adicionar novo perfil</span>
          </Btn>

          <button
            type="button"
            onClick={() => setShowInstallGuide(true)}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[8px] px-3 text-[16px] font-semibold text-cuidado underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-cuidado"
          >
            <DeviceMobile size={20} weight="bold" aria-hidden="true" />
            <span>Como instalar no celular do dependente</span>
          </button>
        </div>
      </div>

      <Dialog.Root open={Boolean(editModal)} onOpenChange={(open) => { if (!open) setEditModal(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-texto/50" />
          <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[90dvh] w-full max-w-[480px] overflow-y-auto rounded-t-[16px] border-t border-borda bg-superficie px-5 pt-4 pb-8 focus-visible:outline-none">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-borda" aria-hidden="true" />
            <Dialog.Title className="m-0 font-display text-[22px] font-bold text-texto">
              Editar perfil
            </Dialog.Title>
            <Dialog.Description className="mt-1 mb-4 text-[16px] text-texto-secundario">
              Atualize os dados do perfil selecionado.
            </Dialog.Description>

            <div className="flex flex-col gap-4">
              <div>
                <label htmlFor="select-edit-name" className="mb-1.5 block text-[16px] font-semibold text-texto">
                  Nome do perfil
                </label>
                <input
                  id="select-edit-name"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="min-h-[56px] w-full rounded-[8px] border border-borda bg-fundo px-3.5 text-[18px] text-texto focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-cuidado"
                />
              </div>

              {editModal?.role === "dependent" && (
                <>
                  <div>
                    <label htmlFor="select-edit-pin" className="mb-1.5 block text-[16px] font-semibold text-texto">
                      Novo PIN (deixe vazio para não alterar)
                    </label>
                    <input
                      id="select-edit-pin"
                      type="password"
                      inputMode="numeric"
                      value={editPin}
                      onChange={(e) => setEditPin(e.target.value)}
                      placeholder="Novo PIN"
                      className="min-h-[56px] w-full rounded-[8px] border border-borda bg-fundo px-3.5 text-[18px] text-texto focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-cuidado"
                    />
                  </div>

                  {editPin && (
                    <div>
                      <label htmlFor="select-edit-confirm-pin" className="mb-1.5 block text-[16px] font-semibold text-texto">
                        Confirmar PIN
                      </label>
                      <input
                        id="select-edit-confirm-pin"
                        type="password"
                        inputMode="numeric"
                        value={editConfirmPin}
                        onChange={(e) => setEditConfirmPin(e.target.value)}
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
                      <code className="break-all text-[14px] text-texto">{editModal.id}</code>
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

                  <div className="rounded-[8px] border border-emergencia/40 bg-emergencia-suave p-3.5">
                    <p className="mt-0 mb-1 text-[16px] font-bold text-emergencia">
                      Desconectar dispositivo
                    </p>
                    <p className="mt-0 mb-3 text-[15px] text-texto">
                      Força a saída do dependente em todos os celulares conectados.
                    </p>
                    <Btn
                      onClick={() => setConfirmLogout(true)}
                      variant="perigo"
                      size="normal"
                      disabled={modalLoading}
                    >
                      <SignOut size={18} weight="bold" aria-hidden="true" />
                      <span>Desconectar dependente</span>
                    </Btn>
                  </div>
                </>
              )}

              {modalError && (
                <p role="alert" className="m-0 text-[16px] font-semibold text-emergencia">
                  {modalError}
                </p>
              )}

              <div className="flex flex-col gap-2.5 pt-2">
                <Btn onClick={handleEdit} variant="primario" size="normal" disabled={modalLoading}>
                  {modalLoading ? "Salvando…" : "Salvar alterações"}
                </Btn>
                <Btn onClick={() => setEditModal(null)} variant="secundario" size="normal">
                  Cancelar
                </Btn>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={showInstallGuide} onOpenChange={setShowInstallGuide}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-texto/50" />
          <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[480px] rounded-t-[16px] border-t border-borda bg-superficie px-5 pt-4 pb-8 focus-visible:outline-none">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-borda" aria-hidden="true" />
            <Dialog.Title className="m-0 font-display text-[22px] font-bold text-texto">
              Adicionar à tela inicial
            </Dialog.Title>
            <Dialog.Description className="mt-1 mb-4 text-[16px] text-texto-secundario">
              Instale o Stay Safe como aplicativo no celular do dependente para acesso rápido com um toque.
            </Dialog.Description>
            <div className="mb-5 flex flex-col gap-3 text-[16px] text-texto">
              <div className="rounded-[8px] border border-borda bg-fundo p-3.5">
                <p className="mt-0 mb-1 font-bold">Android (Chrome)</p>
                <p className="m-0 text-texto-secundario">
                  Toque no menu (três pontos no canto superior) e escolha "Adicionar à tela inicial" ou "Instalar aplicativo".
                </p>
              </div>
              <div className="rounded-[8px] border border-borda bg-fundo p-3.5">
                <p className="mt-0 mb-1 font-bold">iPhone (Safari)</p>
                <p className="m-0 text-texto-secundario">
                  Toque no botão Compartilhar (quadrado com seta para cima) e escolha "Adicionar à Tela de Início".
                </p>
              </div>
            </div>
            <Btn onClick={() => setShowInstallGuide(false)} variant="primario" size="normal">
              Entendi
            </Btn>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Apagar perfil?"
        message={`O perfil ${deleteTarget?.name || ""} será apagado permanentemente.`}
        confirmText="Apagar perfil"
        cancelText="Cancelar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isDestructive
      />

      <ConfirmModal
        isOpen={confirmLogout}
        title="Desconectar dependente?"
        message="Isso desconectará o dependente de todos os dispositivos conectados."
        confirmText="Sim, desconectar"
        cancelText="Cancelar"
        onConfirm={handleConfirmForceLogout}
        onCancel={() => setConfirmLogout(false)}
        isDestructive
      />
    </PhoneFrame>
  );
}
