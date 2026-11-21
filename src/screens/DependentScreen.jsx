import { useState, useEffect, useRef, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  HourglassMedium,
  PersonSimpleRun,
  Siren,
  Timer,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { api } from "../services/api";
import { useAlertSocket } from "../hooks/useAlertSocket";
import PhoneFrame from "../components/PhoneFrame";
import Btn from "../components/Btn";
import PinPad from "../components/PinPad";
import ConnectionBanner from "../components/ConnectionBanner";
import { notifyAlertSent, notifyAlertAcknowledged } from "../utils/feedback";

export default function DependentScreen({ session, onLogout, onSessionExpired }) {
  const { token, profile } = session;
  const [activeAlert, setActiveAlert] = useState(null);
  const [sendingCountdown, setSendingCountdown] = useState(null);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [emitError, setEmitError] = useState("");
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [resolving, setResolving] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  const timerRef = useRef(null);
  const countdownRef = useRef(null);
  const wakeLockRef = useRef(null);

  const hasActive =
    Boolean(activeAlert) &&
    !["resolved_carer", "resolved_dependent", "cancelled"].includes(activeAlert?.status);

  const loadActiveAlert = useCallback(async () => {
    try {
      const d = await api.get("/alerts/active-for-me", token);
      setActiveAlert(d.alert || null);
    } catch (err) {
      if (err.status === 401 && onSessionExpired) {
        onSessionExpired();
      }
    }
  }, [token, onSessionExpired]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadActiveAlert();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadActiveAlert]);

  const handleSocketMessage = useCallback(
    (msg) => {
      if (msg.type === "ALERT_STATE") {
        setActiveAlert(msg.alert || null);
      }
      if (msg.type === "ALERT_ACKNOWLEDGED") {
        setActiveAlert((a) => (a ? { ...a, status: "acknowledged" } : a));
        notifyAlertAcknowledged();
      }
      if (msg.type === "ALERT_RESOLVED") {
        setActiveAlert(null);
        setShowResolveModal(false);
        setPin("");
        clearInterval(timerRef.current);
      }
      if (msg.type === "ALERT_ESCALATED") {
        setActiveAlert((a) => (a ? { ...a, status: "escalated" } : a));
      }
      if (msg.type === "FORCE_LOGOUT") {
        onLogout();
      }
    },
    [onLogout]
  );

  const { isConnected } = useAlertSocket({
    token,
    onOpen: loadActiveAlert,
    onMessage: handleSocketMessage,
    onSessionExpired,
  });

  useEffect(() => {
    if (
      !activeAlert ||
      ["acknowledged", "resolved_carer", "resolved_dependent", "escalated", "cancelled"].includes(
        activeAlert.status
      )
    ) {
      clearInterval(timerRef.current);
      return;
    }
    const emitted = new Date(activeAlert.emitted_at || Date.now()).getTime();
    const escalateAt = emitted + 30000;
    const tick = () => {
      const left = Math.max(0, Math.ceil((escalateAt - Date.now()) / 1000));
      setTimeLeft(left);
      if (left <= 0) clearInterval(timerRef.current);
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [activeAlert]);

  useEffect(() => {
    const requestWakeLock = async () => {
      if (!hasActive || !("wakeLock" in navigator)) return;
      try {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
      } catch {
        // Wake Lock rejected or unsupported
      }
    };

    const releaseWakeLock = async () => {
      if (wakeLockRef.current) {
        try {
          await wakeLockRef.current.release();
        } catch {
          // ignore release error
        }
        wakeLockRef.current = null;
      }
    };

    if (hasActive) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    const handleVisibility = () => {
      if (document.visibilityState === "visible" && hasActive) {
        requestWakeLock();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      releaseWakeLock();
    };
  }, [hasActive]);

  const dispatchAlert = useCallback(async () => {
    setSendingRequest(true);
    setEmitError("");

    const sendToApi = async (coords = {}) => {
      try {
        const data = await api.post("/alerts/emit", coords, token);
        setActiveAlert({
          id: data.alertId,
          status: data.status || "pending",
          emitted_at: data.emittedAt || new Date().toISOString(),
        });
        notifyAlertSent();
      } catch (e) {
        if (e.status === 401 && onSessionExpired) {
          onSessionExpired();
          return;
        }
        setEmitError(e.message || "Não foi possível enviar o alerta.");
      } finally {
        setSendingRequest(false);
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
        () => {
          sendToApi({});
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else {
      sendToApi({});
    }
  }, [token, onSessionExpired]);

  useEffect(() => {
    if (sendingCountdown === null) return;
    countdownRef.current = setTimeout(() => {
      if (sendingCountdown <= 1) {
        setSendingCountdown(null);
        dispatchAlert();
      } else {
        setSendingCountdown((c) => (c !== null ? c - 1 : null));
      }
    }, 1000);
    return () => clearTimeout(countdownRef.current);
  }, [sendingCountdown, dispatchAlert]);

  const handleHelpPress = () => {
    setEmitError("");
    if (!navigator.onLine) {
      setEmitError("Você está sem internet. Conecte-se para pedir ajuda.");
      return;
    }
    setSendingCountdown(3);
  };

  const handleCancelSending = () => {
    clearTimeout(countdownRef.current);
    setSendingCountdown(null);
  };

  const handleResolve = async (pinValue) => {
    setPinError("");
    setResolving(true);
    try {
      const body = pinValue ? { pin: pinValue } : {};
      await api.post(`/alerts/${activeAlert.id}/resolve`, body, token);
      setActiveAlert(null);
      setShowResolveModal(false);
      setPin("");
    } catch (e) {
      setPinError(e.message || "PIN incorreto");
    } finally {
      setResolving(false);
    }
  };

  const isAcknowledged = activeAlert?.status === "acknowledged";
  const isEscalated = activeAlert?.status === "escalated";

  const activeBgClass = hasActive
    ? isEscalated
      ? "bg-emergencia text-superficie"
      : isAcknowledged
        ? "bg-cuidado text-superficie"
        : "bg-atencao text-superficie"
    : "bg-fundo text-texto";

  const firstName = profile?.name?.split(" ")[0] || profile?.name || "";

  return (
    <PhoneFrame bgClass={activeBgClass}>
      <ConnectionBanner isConnected={isConnected} />

      {!hasActive ? (
        <div className="flex flex-1 flex-col justify-between px-5 pt-6 pb-6">
          <header>
            <h1 className="m-0 font-display text-[32px] leading-tight font-bold text-texto">
              Olá, {firstName}
            </h1>
          </header>

          {emitError && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-[10px] border border-emergencia bg-emergencia-suave p-4 text-[18px] font-semibold text-emergencia"
            >
              <WarningCircle size={26} weight="bold" className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>{emitError}</span>
            </div>
          )}

          {sendingCountdown !== null || sendingRequest ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-6 py-4">
              <div className="flex w-full flex-1 flex-col items-center justify-center rounded-[24px] border-2 border-atencao bg-atencao-suave px-6 py-8 text-center">
                <HourglassMedium
                  size={80}
                  weight="bold"
                  className="mb-4 text-atencao"
                  aria-hidden="true"
                />
                <p
                  role="status"
                  aria-live="assertive"
                  className="m-0 text-[32px] leading-tight font-bold text-texto"
                >
                  {sendingRequest
                    ? "Enviando ajuda agora…"
                    : `Enviando em ${sendingCountdown}…`}
                </p>
              </div>

              {sendingCountdown !== null && (
                <button
                  type="button"
                  onClick={handleCancelSending}
                  className="flex min-h-[72px] w-full items-center justify-center gap-3 rounded-[14px] border-2 border-texto bg-superficie px-6 py-4 text-[24px] font-bold text-texto focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-cuidado"
                >
                  <X size={28} weight="bold" aria-hidden="true" />
                  <span>Toque aqui para cancelar</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-5 py-4">
              <button
                type="button"
                onClick={handleHelpPress}
                className="flex min-h-[58dvh] w-full flex-col items-center justify-center gap-4 rounded-[28px] border-2 border-emergencia bg-emergencia px-6 py-8 text-superficie active:opacity-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-texto focus-visible:ring-offset-4 focus-visible:ring-offset-fundo"
              >
                <Siren size={72} weight="fill" aria-hidden="true" />
                <span className="text-[44px] leading-none font-bold tracking-wider">
                  AJUDA
                </span>
              </button>
              <p className="m-0 text-center text-[18px] font-medium text-texto-secundario">
                Toque para avisar seus cuidadores.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-1 flex-col justify-between px-6 pt-8 pb-8 text-superficie">
          <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
            <div className={isAcknowledged ? "" : "animate-pulse-discreto"}>
              {isEscalated ? (
                <Siren size={96} weight="fill" aria-hidden="true" />
              ) : isAcknowledged ? (
                <PersonSimpleRun size={96} weight="bold" aria-hidden="true" />
              ) : (
                <HourglassMedium size={96} weight="bold" aria-hidden="true" />
              )}
            </div>

            <h1 className="m-0 text-[32px] leading-tight font-bold">
              {isEscalated
                ? "Estamos tentando outras pessoas."
                : isAcknowledged
                  ? "Seu cuidador está a caminho."
                  : "Ajuda enviada. Aguardando alguém responder."}
            </h1>

            <p className="m-0 text-[20px] leading-snug font-medium opacity-95">
              Seus cuidadores foram avisados por e-mail e no aplicativo.
            </p>

            {timeLeft !== null && timeLeft > 0 && !isAcknowledged && !isEscalated && (
              <div className="inline-flex items-center gap-2.5 rounded-[12px] border border-superficie/40 bg-texto/15 px-5 py-3 text-[20px] font-bold">
                <Timer size={26} weight="bold" aria-hidden="true" />
                <span>Mais pessoas serão avisadas em {timeLeft}s</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setPin("");
              setPinError("");
              setShowResolveModal(true);
            }}
            className="flex min-h-[64px] w-full items-center justify-center gap-2 rounded-[12px] border-2 border-superficie bg-superficie px-6 py-4 text-[24px] font-bold text-texto focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-superficie"
          >
            <span>Encerrar alerta</span>
          </button>
        </div>
      )}

      <Dialog.Root
        open={showResolveModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowResolveModal(false);
            setPin("");
            setPinError("");
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-texto/50" />
          <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[480px] rounded-t-[16px] border-t border-borda bg-superficie px-5 pt-4 pb-8 text-texto focus-visible:outline-none">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-borda" aria-hidden="true" />
            <Dialog.Title className="m-0 text-center font-display text-[24px] font-bold text-texto">
              Encerrar alerta
            </Dialog.Title>
            <Dialog.Description className="mt-1 mb-5 text-center text-[18px] text-texto-secundario">
              {profile?.hasPin === false
                ? "Confirme se está tudo bem para encerrar."
                : "Digite o PIN para confirmar."}
            </Dialog.Description>

            {profile?.hasPin === false ? (
              <div className="flex flex-col gap-3">
                <Btn
                  onClick={() => handleResolve("")}
                  variant="primario"
                  size="grande"
                  disabled={resolving}
                >
                  {resolving ? "Encerrando…" : "Sim, estou bem"}
                </Btn>
                <Btn
                  onClick={() => setShowResolveModal(false)}
                  variant="secundario"
                  size="grande"
                >
                  Voltar
                </Btn>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <PinPad
                  value={pin}
                  onChange={setPin}
                  onConfirm={() => handleResolve(pin)}
                  error={pinError}
                  loading={resolving}
                />
                <Btn
                  onClick={() => setShowResolveModal(false)}
                  variant="secundario"
                  size="normal"
                >
                  <X size={20} weight="bold" aria-hidden="true" />
                  <span>Cancelar</span>
                </Btn>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </PhoneFrame>
  );
}
