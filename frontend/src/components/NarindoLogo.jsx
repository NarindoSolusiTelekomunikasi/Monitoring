function NarindoLogo({ className = '', compact = false }) {
  const width = compact ? 118 : 156
  const height = compact ? 34 : 44

  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 156 44"
      fill="none"
      role="img"
      aria-label="Narindo"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="15" cy="22" r="11" fill="#2F3138" />
      <circle cx="29" cy="22" r="11" fill="#A12626" />
      <circle cx="22" cy="22" r="6.3" fill="#F4F7FB" />
      <text x="51" y="28" fill="#D6DEE8" fontFamily="IBM Plex Sans, Arial, sans-serif" fontSize="17" fontWeight="700" letterSpacing="0.3">
        narindo
      </text>
    </svg>
  )
}

export default NarindoLogo
