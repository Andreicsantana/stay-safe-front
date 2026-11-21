import { Backspace, Check } from "@phosphor-icons/react";

const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export default function PinPad({
  value,
  onChange,
  onConfirm,
  error = "",
  loading = false,
  maxLength = 6,
}) {
  const handleDigit = (digit) => {
    if (loading || value.length >= maxLength) return;
    onChange(value + digit);
  };

  const handleBackspace = () => {
    if (loading || value.length === 0) return;
    onChange(value.slice(0, -1));
  };

  const totalCircles = Math.max(4, Math.min(maxLength, Math.max(4, value.length)));

  return (
    <div className="flex flex-col gap-4">
      <div
        className="flex items-center justify-center gap-3 rounded-[10px] border border-borda bg-fundo py-4"
        aria-label={`PIN digitado: ${value.length} dígitos`}
      >
        {Array.from({ length: totalCircles }).map((_, index) => {
          const filled = index < value.length;
          return (
            <span
              key={index}
              className={`h-5 w-5 rounded-full border-2 ${
                filled
                  ? "border-texto bg-texto"
                  : "border-texto-suave bg-superficie"
              }`}
              aria-hidden="true"
            />
          );
        })}
      </div>

      {error && (
        <p role="alert" className="m-0 text-center text-[18px] font-semibold text-emergencia">
          {error}
        </p>
      )}

      <div className="grid grid-cols-3 gap-2.5">
        {DIGITS.map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handleDigit(digit)}
            disabled={loading}
            className="flex min-h-[72px] items-center justify-center rounded-[10px] border border-borda bg-superficie text-[28px] font-bold text-texto active:bg-superficie-suave focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-cuidado disabled:opacity-50"
          >
            {digit}
          </button>
        ))}

        <button
          type="button"
          onClick={handleBackspace}
          disabled={loading || value.length === 0}
          aria-label="Apagar dígito"
          className="flex min-h-[72px] flex-col items-center justify-center gap-0.5 rounded-[10px] border border-borda bg-superficie-suave text-[14px] font-semibold text-texto active:bg-borda focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-cuidado disabled:opacity-40"
        >
          <Backspace size={26} weight="bold" aria-hidden="true" />
          <span>Apagar</span>
        </button>

        <button
          type="button"
          onClick={() => handleDigit("0")}
          disabled={loading}
          className="flex min-h-[72px] items-center justify-center rounded-[10px] border border-borda bg-superficie text-[28px] font-bold text-texto active:bg-superficie-suave focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-cuidado disabled:opacity-50"
        >
          0
        </button>

        <button
          type="button"
          onClick={onConfirm}
          disabled={loading || value.length === 0}
          aria-label="Confirmar PIN"
          className="flex min-h-[72px] flex-col items-center justify-center gap-0.5 rounded-[10px] border border-cuidado bg-cuidado text-[14px] font-semibold text-superficie active:opacity-90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-cuidado disabled:opacity-40"
        >
          <Check size={26} weight="bold" aria-hidden="true" />
          <span>Confirmar</span>
        </button>
      </div>
    </div>
  );
}
