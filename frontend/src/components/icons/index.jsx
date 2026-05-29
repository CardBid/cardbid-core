// Centralna biblioteka ikon SVG. Zastępuje emotki w całym froncie.
// Każda ikona dziedziczy kolor (currentColor) i przyjmuje className do rozmiaru.

function Outline({ className = 'h-5 w-5', children, ...props }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

function Solid({ className = 'h-5 w-5', children, ...props }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      {children}
    </svg>
  );
}

// --- Strzałki / nawigacja ---
export const IconArrowRight = (p) => (
  <Outline {...p}><path d="M13.5 4.5 21 12l-7.5 7.5M21 12H3" /></Outline>
);
export const IconArrowLeft = (p) => (
  <Outline {...p}><path d="M10.5 19.5 3 12l7.5-7.5M3 12h18" /></Outline>
);
export const IconChevronDown = (p) => (
  <Outline {...p}><path d="m19.5 8.25-7.5 7.5-7.5-7.5" /></Outline>
);

// --- Symbole akcji ---
export const IconCheck = (p) => (
  <Outline {...p}><path d="m4.5 12.75 6 6 9-13.5" /></Outline>
);
export const IconCheckCircle = (p) => (
  <Outline {...p}>
    <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
  </Outline>
);
export const IconX = (p) => (
  <Outline {...p}><path d="M6 18 18 6M6 6l12 12" /></Outline>
);
export const IconPlus = (p) => (
  <Outline {...p}><path d="M12 4.5v15m7.5-7.5h-15" /></Outline>
);
export const IconMinus = (p) => (
  <Outline {...p}><path d="M5 12h14" /></Outline>
);

// --- Oceny ---
export const IconStar = (p) => (
  <Solid {...p}>
    <path d="M11.48 3.5a.56.56 0 0 1 1.04 0l2.125 5.111a.56.56 0 0 0 .475.345l5.518.442c.5.04.701.663.321.988l-4.204 3.602a.56.56 0 0 0-.182.557l1.285 5.385a.56.56 0 0 1-.84.61l-4.725-2.885a.56.56 0 0 0-.586 0L6.982 20.54a.56.56 0 0 1-.84-.61l1.285-5.386a.56.56 0 0 0-.182-.557l-4.204-3.602a.56.56 0 0 1 .321-.988l5.518-.442a.56.56 0 0 0 .475-.345L11.48 3.5z" />
  </Solid>
);

// --- Piktogramy ---
export const IconVideo = (p) => (
  <Outline {...p}>
    <path d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h7.5a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-7.5A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25z" />
  </Outline>
);
export const IconClapperboard = (p) => (
  <Outline {...p}>
    <path d="M3.75 4.5h16.5a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H3.75a1.5 1.5 0 0 1-1.5-1.5V6a1.5 1.5 0 0 1 1.5-1.5zM2.25 9h19.5M7 4.5 5 9M12 4.5 10 9M17 4.5 15 9" />
  </Outline>
);
export const IconFire = (p) => (
  <Outline {...p}>
    <path d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48z" />
    <path d="M12 18a3.75 3.75 0 0 0 .495-7.467 5.99 5.99 0 0 0-1.925 3.546 5.974 5.974 0 0 1-2.133-1A3.75 3.75 0 0 0 12 18z" />
  </Outline>
);
export const IconCart = (p) => (
  <Outline {...p}>
    <path d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0z" />
  </Outline>
);
export const IconLock = (p) => (
  <Outline {...p}>
    <path d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25z" />
  </Outline>
);
export const IconBan = (p) => (
  <Outline {...p}>
    <path d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
  </Outline>
);
export const IconBroadcast = (p) => (
  <Outline {...p}>
    <path d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0z" />
  </Outline>
);
export const IconHourglass = (p) => (
  <Outline {...p}>
    <path d="M6 3h12M6 21h12M18 3v3l-4.5 4.5L18 15v3M6 3v3l4.5 4.5L6 15v3" />
  </Outline>
);
export const IconBox = (p) => (
  <Outline {...p}>
    <path d="M21 7.5 12 2.25 3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
  </Outline>
);
export const IconLayers = (p) => (
  <Outline {...p}>
    <path d="M3.75 6.75h16.5M3.75 6.75a1.5 1.5 0 0 0-1.5 1.5v9a1.5 1.5 0 0 0 1.5 1.5h16.5a1.5 1.5 0 0 0 1.5-1.5v-9a1.5 1.5 0 0 0-1.5-1.5M3.75 6.75V5.25a1.5 1.5 0 0 1 1.5-1.5h13.5a1.5 1.5 0 0 1 1.5 1.5v1.5" />
  </Outline>
);
export const IconCards = (p) => (
  <Outline {...p}>
    <path d="M8.25 6.75h7.5a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5h-7.5a1.5 1.5 0 0 1-1.5-1.5v-9a1.5 1.5 0 0 1 1.5-1.5zM6.75 4.5h7.5" />
  </Outline>
);
export const IconMoon = (p) => (
  <Outline {...p}>
    <path d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998z" />
  </Outline>
);
export const IconTv = (p) => (
  <Outline {...p}>
    <path d="M6 20.25h12m-7.5-3v3m3-3v3M3.75 4.5h16.5a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5H3.75a1.5 1.5 0 0 1-1.5-1.5V6a1.5 1.5 0 0 1 1.5-1.5z" />
  </Outline>
);
export const IconWarning = (p) => (
  <Outline {...p}>
    <path d="M12 9v3.75m0 3.75h.008M10.34 3.94 1.81 18a1.5 1.5 0 0 0 1.29 2.25h17.8A1.5 1.5 0 0 0 22.19 18L13.66 3.94a1.5 1.5 0 0 0-2.58 0z" />
  </Outline>
);
export const IconCrown = (p) => (
  <Outline {...p}>
    <path d="M5 19h14M3.75 6.75l4 3 4.25-6 4.25 6 4-3-1.75 10.5H5.5L3.75 6.75z" />
  </Outline>
);
export const IconCalendar = (p) => (
  <Outline {...p}>
    <path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0V11.25A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
  </Outline>
);
export const IconSwords = (p) => (
  <Outline {...p}>
    <path d="M5 19 19 5M5 5l4 4m6 6 4 4" />
  </Outline>
);
export const IconMoney = (p) => (
  <Outline {...p}>
    <path d="M2.25 8.625A2.25 2.25 0 0 1 4.5 6.375h15a2.25 2.25 0 0 1 2.25 2.25v6.75a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25v-6.75zM12 14.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5zM5.25 9h.008v.008H5.25V9zm13.5 6h.008v.008h-.008V15z" />
  </Outline>
);
export const IconChat = (p) => (
  <Outline {...p}>
    <path d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
  </Outline>
);
export const IconBolt = (p) => (
  <Solid {...p}>
    <path d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143z" />
  </Solid>
);
export const IconTrophy = (p) => (
  <Outline {...p}>
    <path d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />
  </Outline>
);
export const IconInfo = (p) => (
  <Outline {...p}>
    <path d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zm-9-3.75h.008v.008H12V8.25z" />
  </Outline>
);
export const IconLiveDot = (p) => (
  <Solid {...p}><circle cx="12" cy="12" r="6" /></Solid>
);
