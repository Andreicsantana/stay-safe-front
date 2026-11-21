export default function Logo({ size = "md", showText = true }) {
  const iconSize = size === "lg" ? 64 : size === "sm" ? 32 : 44;

  return (
    <div className="inline-flex items-center gap-3">
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M32 6L10 15V31C10 45.2 19.4 56.5 32 60C44.6 56.5 54 45.2 54 31V15L32 6Z"
          fill="#1F6F5C"
        />
        <path
          d="M32 45.5C32 45.5 20.5 37.8 20.5 29.2C20.5 25.4 23.4 22.5 27 22.5C29.2 22.5 31.1 23.6 32 25.3C32.9 23.6 34.8 22.5 37 22.5C40.6 22.5 43.5 25.4 43.5 29.2C43.5 37.8 32 45.5 32 45.5Z"
          fill="#FAF6EF"
        />
      </svg>
      {showText && (
        <span
          className={
            size === "lg"
              ? "font-display text-3xl font-bold tracking-tight text-texto"
              : size === "sm"
                ? "font-display text-xl font-bold tracking-tight text-texto"
                : "font-display text-2xl font-bold tracking-tight text-texto"
          }
        >
          Stay Safe
        </span>
      )}
    </div>
  );
}
