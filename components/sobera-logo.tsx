export function SoberaLogo({ compact = false, className = "" }: { compact?: boolean; className?: string }) {
  if (compact) return <img src={import.meta.env.BASE_URL + "images/logo-sobera-small.png"} alt="SOBERA, Inteligência em Saúde" className={`object-contain ${className}`} />
  return <svg
    viewBox="0 240 1280 880"
    role="img"
    aria-label="SOBERA, Inteligência em Saúde"
    className={className}
  >
    <image href={import.meta.env.BASE_URL + "images/logo-sobera.png"} width="1280" height="1280" />
  </svg>
}
