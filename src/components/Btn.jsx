export default function Btn({
  onClick,
  children,
  variant = "primario",
  size = "normal",
  disabled = false,
  type = "button",
  className = "",
  ariaLabel,
}) {
  const variantClasses = {
    primario: "bg-cuidado text-superficie border border-cuidado",
    perigo: "bg-emergencia text-superficie border border-emergencia",
    secundario: "bg-superficie text-texto border border-borda",
  };

  const sizeClasses = {
    normal: "min-h-[56px] px-5 py-3 text-[18px]",
    grande: "min-h-[64px] px-6 py-4 text-[22px]",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`inline-flex w-full items-center justify-center gap-2.5 rounded-[10px] font-semibold transition-opacity focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-cuidado focus-visible:ring-offset-2 focus-visible:ring-offset-fundo disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant] || variantClasses.primario} ${sizeClasses[size] || sizeClasses.normal} ${className}`}
    >
      {children}
    </button>
  );
}
