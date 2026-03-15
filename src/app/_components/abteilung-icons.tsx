// Sport/Abteilung icons as inline SVG React components

type IconProps = { className?: string; size?: number };

export function FussballIcon({ className, size = 24 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
      <circle cx="12" cy="12" r="10" />
      <polygon points="12,7 14.5,9.5 13.5,12.5 10.5,12.5 9.5,9.5" fill="currentColor" stroke="none" />
      <line x1="12" y1="7" x2="12" y2="2" />
      <line x1="14.5" y1="9.5" x2="19" y2="7.5" />
      <line x1="13.5" y1="12.5" x2="17" y2="16" />
      <line x1="10.5" y1="12.5" x2="7" y2="16" />
      <line x1="9.5" y1="9.5" x2="5" y2="7.5" />
    </svg>
  );
}

export function LeichtathletikIcon({ className, size = 24 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
      <circle cx="12" cy="4" r="1.5" fill="currentColor" stroke="none" />
      <path d="M12 6 L10 11 L7 14" strokeLinecap="round" />
      <path d="M12 6 L13 10 L16 8" strokeLinecap="round" />
      <path d="M10 11 L9 17 L7 21" strokeLinecap="round" />
      <path d="M10 11 L13 15 L15 21" strokeLinecap="round" />
    </svg>
  );
}

export function TurnenIcon({ className, size = 24 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
      <circle cx="12" cy="4" r="1.5" fill="currentColor" stroke="none" />
      <line x1="4" y1="9" x2="20" y2="9" strokeLinecap="round" />
      <path d="M8 9 L10 15 L12 12 L14 15 L16 9" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="10" y1="15" x2="9" y2="21" strokeLinecap="round" />
      <line x1="14" y1="15" x2="15" y2="21" strokeLinecap="round" />
    </svg>
  );
}

export function TischtennisIcon({ className, size = 24 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
      <circle cx="9" cy="9" r="7" />
      <line x1="14" y1="14" x2="21" y2="21" strokeLinecap="round" strokeWidth={2.5} />
      <circle cx="18" cy="5" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function HandballIcon({ className, size = 24 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
      <circle cx="11" cy="13" r="8" />
      <path d="M11 5 C11 5 14 2 17 4" strokeLinecap="round" />
      <line x1="6" y1="10" x2="16" y2="10" />
      <line x1="5" y1="14" x2="17" y2="14" />
      <line x1="11" y1="5" x2="11" y2="21" />
    </svg>
  );
}

export function SchwimmenIcon({ className, size = 24 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
      <path d="M2 17 C5 14 7 20 10 17 C13 14 15 20 18 17 C19.5 15.5 21 16 22 17" strokeLinecap="round" />
      <circle cx="15" cy="7" r="1.5" fill="currentColor" stroke="none" />
      <path d="M15 9 L13 13 L9 13" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 13 L14 16" strokeLinecap="round" />
    </svg>
  );
}

export function GymnastikIcon({ className, size = 24 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
      <circle cx="12" cy="4" r="1.5" fill="currentColor" stroke="none" />
      <path d="M12 6 L12 13" strokeLinecap="round" />
      <path d="M8 8 L12 10 L16 8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 13 L9 18 L8 22" strokeLinecap="round" />
      <path d="M12 13 L15 18 L16 22" strokeLinecap="round" />
      <path d="M16 8 L20 6" strokeLinecap="round" />
      <circle cx="21" cy="5.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function GesangIcon({ className, size = 24 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
      <ellipse cx="8" cy="18" rx="3" ry="2" />
      <ellipse cx="17" cy="15" rx="3" ry="2" />
      <line x1="11" y1="18" x2="11" y2="6" />
      <line x1="20" y1="15" x2="20" y2="3" />
      <line x1="11" y1="6" x2="20" y2="3" />
    </svg>
  );
}

export function TangSooDoIcon({ className, size = 24 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
      <circle cx="12" cy="4" r="1.5" fill="currentColor" stroke="none" />
      <path d="M12 6 L12 12" strokeLinecap="round" />
      <path d="M12 9 L7 7" strokeLinecap="round" />
      <path d="M12 12 L8 17" strokeLinecap="round" />
      <path d="M12 12 L17 16" strokeLinecap="round" />
      <path d="M12 6 L18 9" strokeLinecap="round" />
    </svg>
  );
}

export function TennisIcon({ className, size = 24 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12 C6 8 6 16 3 12" />
      <path d="M21 12 C18 8 18 16 21 12" />
    </svg>
  );
}

export function JedermaennerIcon({ className, size = 24 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
      <circle cx="8" cy="5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="16" cy="5" r="1.5" fill="currentColor" stroke="none" />
      <path d="M5 8 L11 8 L11 14 L9 20" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 11 L8 13" strokeLinecap="round" />
      <path d="M13 8 L19 8 L19 14 L17 20" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 11 L16 13" strokeLinecap="round" />
      <line x1="11" y1="14" x2="13" y2="14" />
    </svg>
  );
}

export function SkiBergIcon({ className, size = 24 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
      <polyline points="2,20 9,8 14,14 18,9 22,20" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="18" cy="7" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export const ABTEILUNG_ICONS: Record<string, React.ComponentType<IconProps>> = {
  "Fußball": FussballIcon,
  "Leichtathletik": LeichtathletikIcon,
  "Turnen": TurnenIcon,
  "Turnen & Leichtathletik": TurnenIcon,
  "Tischtennis": TischtennisIcon,
  "Handball": HandballIcon,
  "Schwimmen": SchwimmenIcon,
  "Gymnastik": GymnastikIcon,
  "Gesang": GesangIcon,
  "Tang Soo Do": TangSooDoIcon,
  "Tennis": TennisIcon,
  "Jedermänner": JedermaennerIcon,
  "Ski & Berg": SkiBergIcon,
};
