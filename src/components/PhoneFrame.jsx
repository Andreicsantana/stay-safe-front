export default function PhoneFrame({ children, bgClass = "bg-fundo" }) {
  return (
    <div className="flex min-h-[100dvh] w-full justify-center bg-superficie-suave font-sans text-texto">
      <div
        className={`relative flex min-h-[100dvh] w-full max-w-[480px] flex-col border-x border-borda ${bgClass}`}
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
