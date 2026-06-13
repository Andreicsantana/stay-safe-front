import { G } from "../constants/colors";

export default function PhoneFrame({ children, bg }) {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      background: G.bgSubtle,
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "480px",
        minHeight: "100vh",
        background: bg || G.bg,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        boxShadow: "var(--shadow-card)",
      }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
