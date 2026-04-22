export default function Logo({ compact = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <path d="M18 2L33 10.5V25.5L18 34L3 25.5V10.5L18 2Z" fill="rgba(244,123,32,0.15)" stroke="#F47B20" strokeWidth="1.5"/>
        <text x="18" y="23" textAnchor="middle" fill="#F47B20" fontSize="14" fontWeight="800" fontFamily="Montserrat,sans-serif">A</text>
        <path d="M24 22L27 19L30 22" stroke="#F47B20" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
      {!compact && <span className="font-display font-extrabold text-xl text-text-primary tracking-[2px]">AXORA</span>}
    </div>
  )
}
