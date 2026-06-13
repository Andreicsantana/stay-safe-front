import { G } from "../constants/colors";

export default function StatusBadge({ status }) {
  const map = {
    pending: { label: "Aguardando", bg: G.skyBlueLight, color: G.skyBlue },
    notified: { label: "Notificado", bg: G.skyBlueLight, color: G.skyBlue },
    acknowledged: { label: "Cuidador a caminho", bg: G.blueLight, color: G.blue },
    resolved_carer: { label: "Resolvido", bg: G.greenLight, color: G.green },
    resolved_dependent: { label: "Encerrado", bg: G.greenLight, color: G.green },
    escalated: { label: "🚨 Autoridades", bg: G.redLight, color: G.red },
  };
  const s = map[status] || { label: status, bg: G.gray100, color: G.gray600 };
  return (
    <span style={{
      background: s.bg,
      color: s.color,
      borderRadius: "20px",
      padding: "3px 10px",
      fontSize: "12px",
      fontWeight: 600,
    }}>
      {s.label}
    </span>
  );
}
