import { useState, useEffect, useCallback } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import {
  BellRinging,
  Check,
  CheckCircle,
  ClockCounterClockwise,
  LinkBreak,
  MapPin,
  PencilSimple,
  PersonSimpleRun,
  SignOut,
  Siren,
  UserCircle,
  Users,
  WifiHigh,
  WifiSlash,
  X,
} from "@phosphor-icons/react";
import { api } from "../services/api";
import { useAlertSocket } from "../hooks/useAlertSocket";
import PhoneFrame from "../components/PhoneFrame";
import Btn from "../components/Btn";
import StatusBadge from "../components/StatusBadge";
import ConfirmModal from "../components/ConfirmModal";
import EditProfileModal from "../components/EditProfileModal";
import ConnectionBanner from "../components/ConnectionBanner";
import { notifyCarerNewAlert } from "../utils/feedback";

function formatElapsed(iso, nowMs) {
  if (!iso) return "";
  const diffSec = Math.max(0, Math.floor((nowMs - new Date(iso).getTime()) / 1000));
  if (diffSec < 60) return `há ${diffSec}s`;
  const mins = Math.floor(diffSec / 60);
  const secs = diffSec % 60;
  if (mins < 60) return `há ${mins}m ${secs}s`;
  const hrs = Math.floor(mins / 60);
  return `há ${hrs}h ${mins % 60}m`;
}

function formatTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Hoje";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Ontem";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export default function CarerScreen({
  session,
  onLogout,
  onBackToProfiles,
  onSessionExpired,
}) {
  const { token, profile, user } = session;
  const userId = user?.id || profile?.user_id;

  const [activeAlerts, setActiveAlerts] = useState([]);
  const [history, setHistory] = useState([]);
  const [dependents, setDependents] = useState([]);
  const [activeTab, setActiveTab] = useState("home");
  const [alertBanners, setAlertBanners] = useState([]);
  const [confirmResolveId, setConfirmResolveId] = useState(null);
  const [confirmLogoutModal, setConfirmLogoutModal] = useState(false);
  const [actionError, setActionError] = useState("");
  const [nowMs, setNowMs] = useState(() => Date.now());

  const [editModal, setEditModal] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [confirmForceLogout, setConfirmForceLogout] = useState(false);

  const loadDependents = useCallback(async () => {
    try {
      const data = await api.get("/profiles/dependents", token);
      setDependents(data.dependents || []);
    } catch (e) {
      if (e.status === 401 && onSessionExpired) onSessionExpired();
    }
  }, [token, onSessionExpired]);

  const loadAlerts = useCallback(async () => {
    try {
      const [active, hist] = await Promise.all([
        api.get("/alerts/active", token),
        api.get("/alerts?limit=20", token),
      ]);
      setActiveAlerts(active.activeAlerts || []);
      setHistory(hist.alerts || []);
    } catch (e) {
      if (e.status === 401 && onSessionExpired) onSessionExpired();
    }
  }, [token, onSessionExpired]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDependents();
      loadAlerts();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadDependents, loadAlerts]);

  useEffect(() => {
    const ticker = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(ticker);
  }, []);

  const handleSocketMessage = useCallback(
    (msg) => {
      if (msg.type === "ALERT_STATE") {
        setActiveAlerts(msg.activeAlerts || []);
      }
      if (msg.type === "NEW_ALERT") {
        setAlertBanners((prev) => [...prev, { ...msg, bannerId: `${Date.now()}-${Math.random()}` }]);
        notifyCarerNewAlert();
        loadAlerts();
      }
      if (msg.type === "ALERT_UPDATED") {
        setActiveAlerts((prev) => prev.map((a) => (a.id === msg.id ? { ...a, ...msg } : a)));
        loadAlerts();
      }
      if (["ALERT_RESOLVED", "ALERT_ESCALATED", "ALERT_ACKNOWLEDGED"].includes(msg.type)) {
        loadAlerts();
      }
    },
    [loadAlerts]
  );

  const { isConnected } = useAlertSocket({
    token,
    onOpen: loadAlerts,
    onMessage: handleSocketMessage,
    onSessionExpired,
  });

  const acknowledge = async (alertId) => {
    setActionError("");
    try {
      await api.post(`/alerts/${alertId}/acknowledge`, {}, token);
      loadAlerts();
    } catch (e) {
      setActionError(e.message || "Erro ao confirmar atendimento.");
    }
  };

  const handleConfirmResolve = async () => {
    const alertId = confirmResolveId;
    setConfirmResolveId(null);
    if (!alertId) return;
    setActionError("");
    try {
      await api.post(`/alerts/${alertId}/resolve`, { notes: "Resolvido pelo cuidador" }, token);
      loadAlerts();
    } catch (e) {
      setActionError(e.message || "Erro ao encerrar alerta.");
    }
  };

  const handleSaveDependent = async ({ name, pin }) => {
    setEditLoading(true);
    setEditError("");
    try {
      const body = { name };
      if (pin) body.pin = pin;
      const data = await api.patch(`/profiles/${editModal.id}`, body, token);
      setDependents((prev) =>
        prev.map((d) => (d.id === data.profile.id ? { ...d, ...data.profile } : d))
      );
      setEditModal(null);
    } catch (e) {
      setEditError(e.message || "Erro ao salvar alterações.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleForceLogout = async () => {
    setConfirmForceLogout(false);
    if (!editModal?.id || !userId) {
      setEditError("Não foi possível identificar o usuário para desconectar.");
      return;
    }
    setEditLoading(true);
    setEditError("");
    try {
      await api.post("/auth/force-logout", { userId, profileId: editModal.id }, token);
      setEditModal(null);
    } catch (e) {
      setEditError(e.message || "Erro ao desconectar dependente.");
    } finally {
      setEditLoading(false);
    }
  };

  const stripeColor = (status) => {
    if (status === "escalated") return "border-l-emergencia";
    if (status === "acknowledged") return "border-l-cuidado";
    return "border-l-atencao";
  };

  return (
    <PhoneFrame bgClass="bg-fundo">
      <ConnectionBanner isConnected={isConnected} />

      {alertBanners.length > 0 && (
        <button
          type="button"
          onClick={() => {
            setAlertBanners([]);
            setActiveTab("home");
          }}
          className="sticky top-0 z-30 flex w-full items-center justify-between gap-3 bg-emergencia px-4 py-3.5 text-left text-superficie focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-texto"
        >
          <div className="flex items-center gap-2.5">
            <Siren size={24} weight="fill" className="shrink-0" aria-hidden="true" />
            <div>
              <p className="m-0 text-[16px] font-bold">
                {alertBanners.length > 1
                  ? `${alertBanners.length} novos alertas de emergência`
                  : `${alertBanners[0].dependentName || "Dependente"} pediu ajuda`}
              </p>
              <p className="m-0 text-[14px] opacity-90">
                Toque aqui para dispensar este aviso
              </p>
            </div>
          </div>
          <X size={22} weight="bold" className="shrink-0" aria-hidden="true" />
        </button>
      )}

      <header className="border-b border-borda bg-superficie px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="m-0 text-[14px] font-semibold text-texto-suave">Área do cuidador</p>
            <h1 className="m-0 font-display text-[24px] leading-tight font-bold text-texto">
              {profile?.name}
            </h1>
          </div>
          <div
            className={`inline-flex items-center gap-1.5 rounded-[8px] border px-2.5 py-1 text-[13px] font-semibold ${
              isConnected
                ? "border-cuidado/30 bg-cuidado-suave text-cuidado"
                : "border-atencao/30 bg-atencao-suave text-atencao"
            }`}
          >
            {isConnected ? (
              <>
                <WifiHigh size={16} weight="bold" aria-hidden="true" />
                <span>Ao vivo</span>
              </>
            ) : (
              <>
                <WifiSlash size={16} weight="bold" aria-hidden="true" />
                <span>Reconectando</span>
              </>
            )}
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          {onBackToProfiles && (
            <button
              type="button"
              onClick={onBackToProfiles}
              className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-[8px] border border-borda bg-fundo px-3 text-[16px] font-semibold text-texto focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-cuidado"
            >
              <Users size={18} weight="bold" aria-hidden="true" />
              <span>Perfis</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setConfirmLogoutModal(true)}
            className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-[8px] border border-borda bg-fundo px-3 text-[16px] font-semibold text-texto focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-cuidado"
          >
            <SignOut size={18} weight="bold" aria-hidden="true" />
            <span>Sair</span>
          </button>
        </div>
      </header>

      <Tabs.Root
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex flex-1 flex-col"
      >
        <main className="flex-1 overflow-y-auto px-4 pt-4 pb-28">
          {actionError && (
            <div
              role="alert"
              className="mb-4 rounded-[8px] border border-emergencia bg-emergencia-suave p-3 text-[16px] font-semibold text-emergencia"
            >
              {actionError}
            </div>
          )}

          <Tabs.Content value="home" className="focus-visible:outline-none">
            <h2 className="mt-0 mb-3 font-display text-[20px] font-bold text-texto">
              Alertas ativos
            </h2>
            {activeAlerts.length === 0 ? (
              <div className="flex flex-col items-center rounded-[10px] border border-borda bg-superficie px-5 py-10 text-center">
                <CheckCircle size={48} weight="bold" className="mb-3 text-cuidado" aria-hidden="true" />
                <p className="m-0 text-[18px] font-bold text-texto">Tudo tranquilo</p>
                <p className="mt-1 mb-0 text-[16px] text-texto-secundario">
                  Nenhum alerta ativo no momento.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {activeAlerts.map((alert) => {
                  const hasCoords = alert.latitude != null && alert.longitude != null;
                  const mapsUrl =
                    alert.mapsUrl ||
                    (hasCoords
                      ? `https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`
                      : null);

                  return (
                    <article
                      key={alert.id}
                      className={`rounded-[10px] border border-borda border-l-[6px] bg-superficie p-4 ${stripeColor(alert.status)}`}
                    >
                      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="m-0 flex items-center gap-2 text-[20px] font-bold text-texto">
                            <UserCircle size={24} weight="bold" className="text-texto-secundario" aria-hidden="true" />
                            <span>{alert.dependentName || alert.dependent_name || "Dependente"}</span>
                          </h3>
                          <p className="mt-1 mb-0 text-[16px] font-medium text-texto-secundario">
                            Às {formatTime(alert.emitted_at)} ({formatElapsed(alert.emitted_at, nowMs)})
                          </p>
                        </div>
                        <StatusBadge status={alert.status} />
                      </div>

                      {(alert.address || mapsUrl) && (
                        <div className="mb-4 rounded-[8px] border border-borda bg-fundo p-3 text-[16px] text-texto">
                          {alert.address && (
                            <p className="m-0 flex items-start gap-2">
                              <MapPin size={20} weight="bold" className="mt-0.5 shrink-0 text-emergencia" aria-hidden="true" />
                              <span>{alert.address}</span>
                            </p>
                          )}
                          {mapsUrl && (
                            <a
                              href={mapsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-flex min-h-[48px] items-center gap-2 font-semibold text-cuidado underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-cuidado"
                            >
                              <MapPin size={18} weight="bold" aria-hidden="true" />
                              <span>Abrir localização no mapa</span>
                            </a>
                          )}
                        </div>
                      )}

                      <div className="flex flex-col gap-2.5 sm:flex-row">
                        {!["acknowledged", "escalated"].includes(alert.status) && (
                          <Btn
                            onClick={() => acknowledge(alert.id)}
                            variant="primario"
                            size="normal"
                          >
                            <PersonSimpleRun size={20} weight="bold" aria-hidden="true" />
                            <span>Estou indo</span>
                          </Btn>
                        )}
                        <Btn
                          onClick={() => setConfirmResolveId(alert.id)}
                          variant="secundario"
                          size="normal"
                        >
                          <Check size={20} weight="bold" aria-hidden="true" />
                          <span>Encerrar</span>
                        </Btn>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </Tabs.Content>

          <Tabs.Content value="history" className="focus-visible:outline-none">
            <h2 className="mt-0 mb-3 font-display text-[20px] font-bold text-texto">
              Histórico de chamados
            </h2>
            {history.length === 0 ? (
              <div className="rounded-[10px] border border-borda bg-superficie p-8 text-center text-[16px] text-texto-secundario">
                Nenhum chamado registrado ainda.
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[10px] border border-borda bg-superficie p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="m-0 text-[18px] font-bold text-texto">
                          {item.dependentName || item.dependent_name || "Dependente"}
                        </p>
                        <p className="mt-0.5 mb-0 text-[16px] text-texto-secundario">
                          {formatDate(item.emitted_at)} às {formatTime(item.emitted_at)}
                        </p>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                    {item.address && (
                      <p className="mt-2 mb-0 flex items-start gap-1.5 text-[15px] text-texto-secundario">
                        <MapPin size={18} weight="bold" className="mt-0.5 shrink-0" aria-hidden="true" />
                        <span>{item.address}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Tabs.Content>

          <Tabs.Content value="dependents" className="focus-visible:outline-none">
            <h2 className="mt-0 mb-3 font-display text-[20px] font-bold text-texto">
              Dependentes ({dependents.length})
            </h2>
            {dependents.length === 0 ? (
              <div className="flex flex-col items-center rounded-[10px] border border-borda bg-superficie px-5 py-10 text-center">
                <LinkBreak size={44} weight="bold" className="mb-3 text-texto-suave" aria-hidden="true" />
                <p className="m-0 text-[18px] font-bold text-texto">Nenhum dependente vinculado</p>
                <p className="mt-1 mb-0 text-[16px] text-texto-secundario">
                  Crie um perfil de dependente na tela de perfis para começar.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {dependents.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between gap-3 rounded-[10px] border border-borda bg-superficie p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-cuidado-suave text-cuidado">
                        <UserCircle size={28} weight="bold" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="m-0 text-[18px] font-bold text-texto">{d.name}</p>
                        <p className="mt-0.5 mb-0 inline-flex items-center gap-1.5 text-[15px] font-semibold text-cuidado">
                          <CheckCircle size={16} weight="fill" aria-hidden="true" />
                          <span>Vinculado</span>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditError("");
                        setEditModal({ ...d, role: d.role || "dependent" });
                      }}
                      className="inline-flex min-h-[48px] items-center gap-1.5 rounded-[8px] border border-borda bg-fundo px-3.5 text-[16px] font-semibold text-texto focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-cuidado"
                    >
                      <PencilSimple size={18} weight="bold" aria-hidden="true" />
                      <span>Editar</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Tabs.Content>
        </main>

        <Tabs.List
          aria-label="Navegação do cuidador"
          className="fixed inset-x-0 bottom-0 z-20 mx-auto grid w-full max-w-[480px] grid-cols-3 border-t border-borda bg-superficie"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <Tabs.Trigger
            value="home"
            className="relative flex min-h-[64px] flex-col items-center justify-center gap-1 px-2 py-2 text-[14px] font-semibold text-texto-secundario data-[state=active]:border-t-3 data-[state=active]:border-t-cuidado data-[state=active]:text-cuidado focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-cuidado"
          >
            <div className="relative">
              <BellRinging size={22} weight="bold" aria-hidden="true" />
              {activeAlerts.length > 0 && (
                <span className="absolute -top-2 -right-3 inline-flex min-w-[20px] items-center justify-center rounded-full bg-emergencia px-1 text-[12px] font-bold text-superficie">
                  {activeAlerts.length}
                </span>
              )}
            </div>
            <span>Alertas</span>
          </Tabs.Trigger>

          <Tabs.Trigger
            value="history"
            className="flex min-h-[64px] flex-col items-center justify-center gap-1 px-2 py-2 text-[14px] font-semibold text-texto-secundario data-[state=active]:border-t-3 data-[state=active]:border-t-cuidado data-[state=active]:text-cuidado focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-cuidado"
          >
            <ClockCounterClockwise size={22} weight="bold" aria-hidden="true" />
            <span>Histórico</span>
          </Tabs.Trigger>

          <Tabs.Trigger
            value="dependents"
            className="flex min-h-[64px] flex-col items-center justify-center gap-1 px-2 py-2 text-[14px] font-semibold text-texto-secundario data-[state=active]:border-t-3 data-[state=active]:border-t-cuidado data-[state=active]:text-cuidado focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-cuidado"
          >
            <Users size={22} weight="bold" aria-hidden="true" />
            <span>Dependentes</span>
          </Tabs.Trigger>
        </Tabs.List>
      </Tabs.Root>

      {editModal && (
        <EditProfileModal
          key={editModal.id}
          profile={editModal}
          onClose={() => setEditModal(null)}
          onSave={handleSaveDependent}
          onRequestForceLogout={() => setConfirmForceLogout(true)}
          loading={editLoading}
          error={editError}
          title="Editar dependente"
          description="Ajuste o nome, o PIN ou desconecte o aparelho do dependente."
        />
      )}

      <ConfirmModal
        isOpen={Boolean(confirmResolveId)}
        title="Encerrar alerta?"
        message="Confirmar que o dependente está seguro e encerrar este atendimento?"
        confirmText="Sim, encerrar"
        cancelText="Cancelar"
        onConfirm={handleConfirmResolve}
        onCancel={() => setConfirmResolveId(null)}
      />

      <ConfirmModal
        isOpen={confirmLogoutModal}
        title="Sair da conta?"
        message="Tem certeza que deseja sair do aplicativo neste aparelho?"
        confirmText="Sim, sair"
        cancelText="Continuar conectado"
        onConfirm={onLogout}
        onCancel={() => setConfirmLogoutModal(false)}
        isDestructive
      />

      <ConfirmModal
        isOpen={confirmForceLogout}
        title="Desconectar dependente?"
        message="O dependente será desconectado de todos os aparelhos imediatamente."
        confirmText="Sim, desconectar"
        cancelText="Cancelar"
        onConfirm={handleForceLogout}
        onCancel={() => setConfirmForceLogout(false)}
        isDestructive
      />
    </PhoneFrame>
  );
}
