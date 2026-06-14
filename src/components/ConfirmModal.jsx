import { G } from "../constants/colors";
import Btn from "./Btn";

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
  confirmColor = G.blue,
  isDestructive = false,
}) {
  if (!isOpen) return null;

  const activeConfirmColor = isDestructive ? G.red : confirmColor;

  return (
    <div
      onClick={onCancel}
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "flex-end",
        borderRadius: "inherit",
        zIndex: 200,
        backdropFilter: "blur(3px)",
        animation: "fadeIn 0.2s ease-out",
        boxSizing: "border-box",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          background: G.white,
          borderRadius: "24px 24px 0 0",
          padding: "24px 20px 32px",
          boxShadow: "var(--shadow-modal)",
          boxSizing: "border-box",
          animation: "slideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Drag/Handle Bar */}
        <div
          style={{
            width: "40px",
            height: "4px",
            background: G.gray200,
            borderRadius: "4px",
            margin: "0 auto 20px",
          }}
        />

        {/* Content */}
        <h3
          style={{
            margin: "0 0 8px",
            fontSize: "18px",
            fontWeight: 700,
            color: G.gray800,
            textAlign: "center",
          }}
        >
          {title}
        </h3>
        <p
          style={{
            margin: "0 0 24px",
            fontSize: "14px",
            color: G.gray600,
            textAlign: "center",
            lineHeight: "1.5",
          }}
        >
          {message}
        </p>

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <Btn onClick={onConfirm} color={activeConfirmColor}>
            {confirmText}
          </Btn>
          <button
            onClick={onCancel}
            style={{
              background: "transparent",
              border: "none",
              color: G.gray600,
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              width: "100%",
              padding: "10px",
              transition: "color 0.15s",
            }}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}
