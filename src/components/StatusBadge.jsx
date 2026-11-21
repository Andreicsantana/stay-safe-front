import { CheckCircle, HourglassMedium, PersonSimpleRun, Siren } from "@phosphor-icons/react";

const STATUS_MAP = {
  pending: {
    label: "Aguardando",
    classes: "bg-atencao-suave text-atencao border-atencao/30",
    Icon: HourglassMedium,
  },
  notified: {
    label: "Notificado",
    classes: "bg-atencao-suave text-atencao border-atencao/30",
    Icon: HourglassMedium,
  },
  acknowledged: {
    label: "Cuidador a caminho",
    classes: "bg-cuidado-suave text-cuidado border-cuidado/30",
    Icon: PersonSimpleRun,
  },
  resolved_carer: {
    label: "Resolvido",
    classes: "bg-cuidado-suave text-cuidado border-cuidado/30",
    Icon: CheckCircle,
  },
  resolved_dependent: {
    label: "Encerrado",
    classes: "bg-cuidado-suave text-cuidado border-cuidado/30",
    Icon: CheckCircle,
  },
  escalated: {
    label: "Escalonado",
    classes: "bg-emergencia-suave text-emergencia border-emergencia/30",
    Icon: Siren,
  },
};

export default function StatusBadge({ status }) {
  const entry = STATUS_MAP[status] || {
    label: status,
    classes: "bg-superficie-suave text-texto-secundario border-borda",
    Icon: HourglassMedium,
  };
  const { Icon } = entry;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[8px] border px-2.5 py-1 text-[14px] font-semibold ${entry.classes}`}
    >
      <Icon size={16} weight="bold" aria-hidden="true" />
      <span>{entry.label}</span>
    </span>
  );
}
