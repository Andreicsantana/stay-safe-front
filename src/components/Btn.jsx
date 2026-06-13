import { G } from "../constants/colors";

export default function Btn({ onClick, children, color = G.blue, textColor = G.white, disabled, style = {} }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? G.gray200 : color,
        color: disabled ? G.gray400 : textColor,
        border: "none",
        borderRadius: "14px",
        padding: "14px 24px",
        fontSize: "16px",
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        width: "100%",
        transition: "opacity 0.15s",
        ...style,
      }}
    >
      {children}
    </button>
  );
}
