import { useState } from "react";
import { api } from "../services/api";
import { G } from "../constants/colors";
import Btn from "../components/Btn";
import PhoneFrame from "../components/PhoneFrame";
import ConfirmModal from "../components/ConfirmModal";

const WEB_DEMO_TOKEN = `web-demo-${Math.random().toString(36).slice(2)}`;

export default function ProfileSelectScreen({ user, profiles: initialProfiles, onSelect, onCreateProfile }) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState("");

  // Edit/delete modal state
  const [modal, setModal] = useState(null); // null | { mode: "edit"|"delete", profile }
  const [editName, setEditName] = useState("");
  const [editPin, setEditPin] = useState("");
  const [editConfirmPin, setEditConfirmPin] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [confirmLogout, setConfirmLogout] = useState(false);

  const handleSelect = async (profile) => {
    setLoading(profile.id);
    setError("");
    try {
      const data = await api.post("/auth/select-profile", {
        userId: user.id,
        profileId: profile.id,
        deviceToken: WEB_DEMO_TOKEN,
        platform: "web",
      });
      onSelect(profile, data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(null);
    }
  };

  const openEdit = (profile, e) => {
    e.stopPropagation();
    setEditName(profile.name);
    setEditPin("");
    setEditConfirmPin("");
    setModalError("");
    setModal({ mode: "edit", profile });
  };

  const openDelete = (profile, e) => {
    e.stopPropagation();
    setModalError("");
    setModal({ mode: "delete", profile });
  };

  const closeModal = () => {
    setModal(null);
    setModalError("");
    setConfirmLogout(false);
  };

  const handleEdit = async () => {
    if (!editName.trim()) return setModalError("Nome não pode ficar vazio.");
    if (editPin && editPin !== editConfirmPin) return setModalError("Os PINs não coincidem.");

    setModalLoading(true);
    setModalError("");
    try {
      const body = { userId: user.id, profileId: modal.profile.id, name: editName };
      if (editPin !== undefined) body.pin = editPin || undefined;

      const data = await api.patch("/auth/update-profile", body);
      setProfiles(prev => prev.map(p => p.id === data.profile.id ? { ...p, ...data.profile } : p));
      closeModal();
    } catch (e) {
      setModalError(e.message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    setModalLoading(true);
    setModalError("");
    try {
      await api.delete("/auth/delete-profile", { userId: user.id, profileId: modal.profile.id });
      setProfiles(prev => prev.filter(p => p.id !== modal.profile.id));
      closeModal();
    } catch (e) {
      setModalError(e.message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleConfirmForceLogout = async () => {
    setConfirmLogout(false);
    setModalLoading(true);
    setModalError("");
    try {
      await api.post("/auth/force-logout", { userId: user.id, profileId: modal.profile.id });
      setModalError("Desconectado com sucesso.");
      setTimeout(closeModal, 1500);
    } catch (e) {
      setModalError(e.message);
    } finally {
      setModalLoading(false);
    }
  };

  const carers = profiles.filter(p => p.role === "carer");
  const dependents = profiles.filter(p => p.role === "dependent");

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    border: `1.5px solid ${G.gray200}`,
    borderRadius: "12px",
    fontSize: "15px",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle = {
    fontSize: "13px",
    color: G.gray600,
    fontWeight: 500,
    display: "block",
    marginBottom: "6px",
  };

  const renderProfileCard = (p, roleColor, emoji) => (
    <div
      key={p.id}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "14px",
        padding: "14px 16px",
        background: G.white,
        border: `1.5px solid ${G.gray200}`,
        borderRadius: "16px",
        position: "relative",
      }}
    >
      {/* Avatar */}
      <div style={{
        width: "48px", height: "48px", borderRadius: "50%",
        background: roleColor === G.blue ? G.blueLight : G.redLight,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "22px", flexShrink: 0,
      }}>
        {emoji}
      </div>

      {/* Info — clickable to select */}
      <div
        onClick={() => !loading && handleSelect(p)}
        style={{ flex: 1, textAlign: "left", cursor: "pointer" }}
      >
        <p style={{ margin: 0, fontWeight: 600, color: G.gray800, fontSize: "15px" }}>{p.name}</p>
        <p style={{ margin: 0, color: roleColor, fontSize: "12px", fontWeight: 500 }}>
          {p.role === "carer" ? "Cuidador" : "Dependente"}
        </p>
      </div>

      {loading === p.id && (
        <span style={{ color: G.gray400, fontSize: "13px" }}>...</span>
      )}

      {/* Action buttons */}
      {!loading && (
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            onClick={(e) => openEdit(p, e)}
            title="Editar perfil"
            style={{
              background: G.gray100, border: "none", borderRadius: "8px",
              padding: "6px 9px", cursor: "pointer", fontSize: "14px",
              color: G.gray600,
            }}
          >
            ✏️
          </button>
          <button
            onClick={(e) => openDelete(p, e)}
            title="Apagar perfil"
            style={{
              background: G.redLight, border: "none", borderRadius: "8px",
              padding: "6px 9px", cursor: "pointer", fontSize: "14px",
            }}
          >
            🗑️
          </button>
        </div>
      )}
    </div>
  );

  return (
    <PhoneFrame>
      <div style={{ flex: 1, padding: "24px 20px", overflowY: "auto" }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>👋</div>
          <h2 style={{ margin: 0, color: G.gray800, fontSize: "22px" }}>Olá, {user.name.split(" ")[0]}!</h2>
          <p style={{ color: G.gray400, margin: "4px 0 0", fontSize: "14px" }}>
            Selecione ou gerencie seus perfis
          </p>
        </div>

        {carers.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <p style={{ fontSize: "11px", fontWeight: 600, color: G.gray400, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px" }}>
              Perfis de Cuidador
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {carers.map(p => renderProfileCard(p, G.blue, "🩺"))}
            </div>
          </div>
        )}

        {dependents.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <p style={{ fontSize: "11px", fontWeight: 600, color: G.gray400, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px" }}>
              Perfis de Dependente
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {dependents.map(p => renderProfileCard(p, G.red, "🙋"))}
            </div>
          </div>
        )}

        {error && (
          <div style={{ background: G.redLight, color: G.red, padding: "10px 14px", borderRadius: "10px", marginBottom: "12px", fontSize: "14px" }}>
            {error}
          </div>
        )}

        {profiles.length === 0 && (
          <div style={{ textAlign: "center", padding: "32px 20px", background: G.gray50, borderRadius: "16px", marginBottom: "16px" }}>
            <div style={{ fontSize: "40px", marginBottom: "8px" }}>👤</div>
            <p style={{ margin: 0, fontWeight: 600, color: G.gray800, fontSize: "15px" }}>Nenhum perfil criado</p>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: G.gray400 }}>Crie seu primeiro perfil para continuar</p>
          </div>
        )}

        <button
          onClick={onCreateProfile}
          style={{
            display: "flex", alignItems: "center", gap: "12px",
            padding: "14px 16px", background: "transparent",
            border: `1.5px dashed ${G.blue}`, borderRadius: "16px",
            cursor: "pointer", width: "100%", marginTop: "4px",
          }}
        >
          <div style={{
            width: "40px", height: "40px", borderRadius: "50%",
            background: G.blueLight, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: "20px", flexShrink: 0,
          }}>
            ＋
          </div>
          <p style={{ margin: 0, fontWeight: 600, color: G.blue, fontSize: "14px" }}>Adicionar novo perfil</p>
        </button>
      </div>

      {/* ─── Modal overlay ─── */}
      {modal && (
        <div
          onClick={closeModal}
          style={{
            position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "flex-end", borderRadius: "inherit",
            zIndex: 50,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: "100%", background: G.white,
              borderRadius: "24px 24px 0 0",
              padding: "24px 20px 32px",
              boxShadow: "0 -4px 32px rgba(0,0,0,0.12)",
            }}
          >
            {/* Drag handle */}
            <div style={{ width: "40px", height: "4px", background: G.gray200, borderRadius: "4px", margin: "0 auto 20px" }} />

            {modal.mode === "edit" && (
              <>
                <h3 style={{ margin: "0 0 20px", fontSize: "18px", fontWeight: 700, color: G.gray800 }}>
                  Editar perfil
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <label style={labelStyle}>Nome do perfil</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  {modal.profile.role === "dependent" && (
                    <>
                      <div>
                        <label style={labelStyle}>
                          Novo PIN <span style={{ color: G.gray400, fontWeight: 400 }}>(deixe vazio para não alterar)</span>
                        </label>
                        <input
                          type="password"
                          inputMode="numeric"
                          value={editPin}
                          onChange={e => setEditPin(e.target.value)}
                          placeholder="Novo PIN"
                          style={{ ...inputStyle, letterSpacing: editPin ? "6px" : "0" }}
                        />
                      </div>
                      {editPin && (
                        <div>
                          <label style={labelStyle}>Confirmar PIN</label>
                          <input
                            type="password"
                            inputMode="numeric"
                            value={editConfirmPin}
                            onChange={e => setEditConfirmPin(e.target.value)}
                            placeholder="Repita o PIN"
                            style={{
                              ...inputStyle,
                              borderColor: editConfirmPin && editConfirmPin !== editPin ? G.red : G.gray200,
                              letterSpacing: editConfirmPin ? "6px" : "0",
                            }}
                          />
                          {editConfirmPin && editConfirmPin !== editPin && (
                            <p style={{ color: G.red, fontSize: "12px", margin: "4px 0 0" }}>PINs não coincidem</p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                  {modal.profile.role === "dependent" && (
                    <div style={{ marginTop: "10px", padding: "14px", background: G.redLight, borderRadius: "12px", border: `1px solid ${G.red}` }}>
                      <p style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: 600, color: G.redDark }}>Desconectar Dispositivo</p>
                      <p style={{ margin: "0 0 12px", fontSize: "12px", color: G.redDark }}>Força a saída do dependente em todos os celulares conectados.</p>
                      <button
                        onClick={() => setConfirmLogout(true)}
                        disabled={modalLoading}
                        style={{
                          background: G.red, color: G.white, border: "none", borderRadius: "8px",
                          padding: "8px 12px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
                          width: "100%"
                        }}
                      >
                        Desconectar dependente
                      </button>
                    </div>
                  )}
                </div>

                {modalError && (
                  <div style={{ background: modalError.includes("sucesso") ? G.greenLight : G.redLight, color: modalError.includes("sucesso") ? G.green : G.red, padding: "10px 14px", borderRadius: "10px", marginTop: "14px", fontSize: "13px" }}>
                    {modalError}
                  </div>
                )}

                <div style={{ marginTop: "20px" }}>
                  <Btn onClick={handleEdit} disabled={modalLoading} color={G.blue}>
                    {modalLoading ? "Salvando..." : "Salvar alterações"}
                  </Btn>
                  <button onClick={closeModal} style={{ marginTop: "12px", background: "transparent", border: "none", color: G.gray600, fontSize: "14px", cursor: "pointer", width: "100%", padding: "8px" }}>
                    Cancelar
                  </button>
                </div>
              </>
            )}

            {modal.mode === "delete" && (
              <>
                <div style={{ textAlign: "center", marginBottom: "20px" }}>
                  <div style={{ fontSize: "40px", marginBottom: "10px" }}>⚠️</div>
                  <h3 style={{ margin: "0 0 6px", fontSize: "18px", fontWeight: 700, color: G.gray800 }}>
                    Apagar perfil?
                  </h3>
                  <p style={{ margin: 0, color: G.gray400, fontSize: "14px" }}>
                    O perfil <strong style={{ color: G.gray800 }}>{modal.profile.name}</strong> será apagado permanentemente. Esta ação não pode ser desfeita.
                  </p>
                </div>

                {modalError && (
                  <div style={{ background: G.redLight, color: G.red, padding: "10px 14px", borderRadius: "10px", marginBottom: "14px", fontSize: "13px" }}>
                    {modalError}
                  </div>
                )}

                <Btn onClick={handleDelete} disabled={modalLoading} color={G.red}>
                  {modalLoading ? "Apagando..." : "Apagar perfil"}
                </Btn>
                <button onClick={closeModal} style={{ marginTop: "12px", background: "transparent", border: "none", color: G.gray600, fontSize: "14px", cursor: "pointer", width: "100%", padding: "8px" }}>
                  Cancelar
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmLogout}
        title="Desconectar Dependente?"
        message="Isso desconectará o dependente de todos os dispositivos conectados. Tem certeza que deseja continuar?"
        confirmText="Sim, desconectar"
        cancelText="Cancelar"
        onConfirm={handleConfirmForceLogout}
        onCancel={() => setConfirmLogout(false)}
        isDestructive={true}
      />
    </PhoneFrame>
  );
}
