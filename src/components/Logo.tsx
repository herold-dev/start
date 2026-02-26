export function Logo({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 40"
      className={className}
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#000000" />
          <stop offset="100%" stopColor="#4b5563" />
        </linearGradient>
      </defs>
      <text
        x="0"
        y="28"
        fontFamily="inherit"
        fontWeight="800"
        fontSize="24"
        fill="url(#logoGradient)"
        letterSpacing="-0.025em"
      >
        START DIGITAL
      </text>
    </svg>
  );
}
