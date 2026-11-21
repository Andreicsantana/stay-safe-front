import { WifiSlash } from "@phosphor-icons/react";

export default function ConnectionBanner({ isConnected }) {
  if (isConnected) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-40 flex items-center justify-center gap-2 bg-atencao px-4 py-3 text-center text-[18px] font-semibold text-superficie"
    >
      <WifiSlash size={22} weight="bold" aria-hidden="true" />
      <span>Sem internet. Tentando reconectar…</span>
    </div>
  );
}
