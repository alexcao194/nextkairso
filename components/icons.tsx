import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 15, children, ...rest }: Props & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconHome = (p: Props) => (
  <Svg {...p}>
    <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" />
  </Svg>
);
export const IconInbox = (p: Props) => (
  <Svg {...p}>
    <path d="M22 12h-5.5l-1.8 2.6H9.3L7.5 12H2" />
    <path d="M5.6 5h12.8L22 12v6.5H2V12z" />
  </Svg>
);
export const IconCheckSquare = (p: Props) => (
  <Svg {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="3.5" />
    <path d="m8.4 12.2 2.5 2.5 4.7-5.4" />
  </Svg>
);
export const IconChat = (p: Props) => (
  <Svg {...p}>
    <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </Svg>
);
export const IconCalendar = (p: Props) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
    <path d="M3.5 10h17M8 3.2v3.6M16 3.2v3.6" />
  </Svg>
);
export const IconWorkflow = (p: Props) => (
  <Svg {...p}>
    <rect x="3" y="3.5" width="7" height="7" rx="2" />
    <rect x="14" y="13.5" width="7" height="7" rx="2" />
    <path d="M10 7h5.5a2 2 0 0 1 2 2v4.5" />
  </Svg>
);
export const IconBulb = (p: Props) => (
  <Svg {...p}>
    <path d="M9.2 18h5.6M10 21h4" />
    <path d="M12 3a6 6 0 0 0-3.4 10.9c.5.4.9 1 .9 1.6h5c0-.6.4-1.2.9-1.6A6 6 0 0 0 12 3" />
  </Svg>
);
export const IconChart = (p: Props) => (
  <Svg {...p}>
    <path d="M3.5 20.5h17M7 20.5v-7M12 20.5V6M17 20.5v-10" />
  </Svg>
);
export const IconUsers = (p: Props) => (
  <Svg {...p}>
    <circle cx="9.2" cy="8.4" r="3.4" />
    <path d="M3 19.5a6.2 6.2 0 0 1 12.4 0" />
    <path d="M16.2 5.4a3.4 3.4 0 0 1 0 6M17 19.5a6.2 6.2 0 0 0-1.6-4.2" />
  </Svg>
);
export const IconSearch = (p: Props) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.6-3.6" />
  </Svg>
);
export const IconPlus = (p: Props) => (
  <Svg strokeWidth={2.1} {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);
export const IconClose = (p: Props) => (
  <Svg strokeWidth={2} {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Svg>
);
export const IconChevronDown = (p: Props) => (
  <Svg strokeWidth={2.2} {...p}>
    <path d="m7 10 5 5 5-5" />
  </Svg>
);
export const IconChevronRight = (p: Props) => (
  <Svg strokeWidth={2.2} {...p}>
    <path d="m10 7 5 5-5 5" />
  </Svg>
);
export const IconChevronLeft = (p: Props) => (
  <Svg strokeWidth={2} {...p}>
    <path d="m15 6-6 6 6 6" />
  </Svg>
);
export const IconBreadcrumbSep = (p: Props) => (
  <Svg strokeWidth={2} {...p}>
    <path d="m9 6 6 6-6 6" />
  </Svg>
);
export const IconFilter = (p: Props) => (
  <Svg {...p}>
    <path d="M3 5h18l-7 8.2V20l-4 1.6v-8.4z" />
  </Svg>
);
export const IconColumns = (p: Props) => (
  <Svg {...p}>
    <rect x="3.5" y="4" width="17" height="16" rx="2.5" />
    <path d="M10 4v16M16 4v16" />
  </Svg>
);
export const IconMore = ({ size = 15, ...rest }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...rest}>
    <circle cx="5" cy="12" r="1.7" />
    <circle cx="12" cy="12" r="1.7" />
    <circle cx="19" cy="12" r="1.7" />
  </svg>
);
export const IconClock = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5.2l3.2 2" />
  </Svg>
);
export const IconAlert = (p: Props) => (
  <Svg strokeWidth={1.9} {...p}>
    <path d="M12 3 2.5 20h19z" />
    <path d="M12 9.5v4.5M12 17.3v.01" />
  </Svg>
);
export const IconSettings = (p: Props) => (
  <Svg {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Svg>
);
export const IconNote = (p: Props) => (
  <Svg strokeWidth={1.7} {...p}>
    <path d="M6 3h8l4 4v14H6z" />
    <path d="M14 3v4h4M9 12h6M9 16h4" />
  </Svg>
);
export const IconSun = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" />
  </Svg>
);
export const IconMoon = (p: Props) => (
  <Svg {...p}>
    <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5" />
  </Svg>
);
export const IconCheck = (p: Props) => (
  <Svg strokeWidth={2.2} {...p}>
    <path d="m5 12 5 5L20 7" />
  </Svg>
);
export const IconLink = (p: Props) => (
  <Svg {...p}>
    <path d="M10 13.5a4 4 0 0 0 5.7 0l2.8-2.8a4 4 0 0 0-5.7-5.7L11.5 6.3" />
    <path d="M14 10.5a4 4 0 0 0-5.7 0l-2.8 2.8a4 4 0 0 0 5.7 5.7l1.3-1.3" />
  </Svg>
);
export const IconArchive = (p: Props) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="4.5" rx="1.5" />
    <path d="M5 8.5V19a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19V8.5M10 12.5h4" />
  </Svg>
);
export const IconMaximize = (p: Props) => (
  <Svg strokeWidth={1.9} {...p}>
    <path d="M14 4h6v6M20 4l-7.5 7.5M10 20H4v-6M4 20l7.5-7.5" />
  </Svg>
);
export const IconSend = (p: Props) => (
  <Svg {...p}>
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </Svg>
);
export const IconPaperclip = (p: Props) => (
  <Svg {...p}>
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </Svg>
);
export const IconZap = (p: Props) => (
  <Svg {...p}>
    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
  </Svg>
);

export const IconEdit = (p: Props) => (
  <Svg {...p}>
    <path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17z" />
    <path d="m14.5 7.5 3 3" />
  </Svg>
);
export const IconTrash = (p: Props) => (
  <Svg {...p}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a1.5 1.5 0 0 0 1.5 1.4h7A1.5 1.5 0 0 0 17 19l1-12M9 7V4.5h6V7" />
  </Svg>
);
export const IconCopy = (p: Props) => (
  <Svg {...p}>
    <rect x="8.5" y="8.5" width="12" height="12" rx="2.5" />
    <path d="M15.5 8.5V6A2.5 2.5 0 0 0 13 3.5H6A2.5 2.5 0 0 0 3.5 6v7A2.5 2.5 0 0 0 6 15.5h2.5" />
  </Svg>
);
export const IconExternal = (p: Props) => (
  <Svg {...p}>
    <path d="M14 4h6v6M20 4l-9 9M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10" />
  </Svg>
);
export const IconBell = (p: Props) => (
  <Svg {...p}>
    <path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 2h-15z" />
    <path d="M10 21a2.2 2.2 0 0 0 4 0" />
  </Svg>
);
export const IconLogout = (p: Props) => (
  <Svg {...p}>
    <path d="M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14M10 8l-4 4 4 4M6 12h9" />
  </Svg>
);
export const IconTimeline = (p: Props) => (
  <Svg {...p}>
    <path d="M4 6h8M8 12h10M6 18h7" />
  </Svg>
);
export const IconList = (p: Props) => (
  <Svg {...p}>
    <path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
  </Svg>
);
export const IconLayers = (p: Props) => (
  <Svg {...p}>
    <path d="m12 3.5 8.5 4.5-8.5 4.5L3.5 8z" />
    <path d="m3.5 12.5 8.5 4.5 8.5-4.5M3.5 16.5 12 21l8.5-4.5" />
  </Svg>
);
export const IconUpload = (p: Props) => (
  <Svg {...p}>
    <path d="M12 16V4M7 9l5-5 5 5M4.5 15v3.5A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5V15" />
  </Svg>
);
export const IconDownload = (p: Props) => (
  <Svg {...p}>
    <path d="M12 4v12M7 11l5 5 5-5M4.5 19h15" />
  </Svg>
);
export const IconFile = (p: Props) => (
  <Svg {...p}>
    <path d="M14 3.5H7A1.5 1.5 0 0 0 5.5 5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8z" />
    <path d="M14 3.5V8h4.5" />
  </Svg>
);
export const IconRefresh = (p: Props) => (
  <Svg {...p}>
    <path d="M20 11a8 8 0 0 0-14.3-4.3L4 8.5M4 4v4.5h4.5M4 13a8 8 0 0 0 14.3 4.3L20 15.5M20 20v-4.5h-4.5" />
  </Svg>
);
export const IconUser = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M4.5 20.5c.6-3.6 3.8-5.5 7.5-5.5s6.9 1.9 7.5 5.5" />
  </Svg>
);
export const IconMapPin = (p: Props) => (
  <Svg {...p}>
    <path d="M12 21s6.5-5.6 6.5-11a6.5 6.5 0 0 0-13 0c0 5.4 6.5 11 6.5 11z" />
    <circle cx="12" cy="10" r="2.4" />
  </Svg>
);
export const IconFolder = (p: Props) => (
  <Svg {...p}>
    <path d="M3.5 6.5A1.5 1.5 0 0 1 5 5h4.2l2 2.5H19A1.5 1.5 0 0 1 20.5 9v9A1.5 1.5 0 0 1 19 19.5H5A1.5 1.5 0 0 1 3.5 18z" />
  </Svg>
);
export const IconArrowLeft = (p: Props) => (
  <Svg {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Svg>
);
export const IconArrowRight = (p: Props) => (
  <Svg {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);
export const IconChevronUp = (p: Props) => (
  <Svg {...p}>
    <path d="m6 15 6-6 6 6" />
  </Svg>
);
export const IconCircleCheck = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.2 12.3 2.6 2.6 5-5.5" />
  </Svg>
);
export const IconGlobe = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.6 2.6 3.8 5.6 3.8 9S14.6 18.4 12 21c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3z" />
  </Svg>
);
export const IconGrip = (p: Props) => (
  <Svg {...p}>
    <path d="M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01" strokeWidth={2.6} />
  </Svg>
);
export const IconPlay = (p: Props) => (
  <Svg {...p}>
    <path d="M7 4.8v14.4a.8.8 0 0 0 1.2.7l11.5-7.2a.8.8 0 0 0 0-1.4L8.2 4.1A.8.8 0 0 0 7 4.8z" />
  </Svg>
);
export const IconMenu = (p: Props) => (
  <Svg {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Svg>
);
export const IconSave = (p: Props) => (
  <Svg {...p}>
    <path d="M5 4.5h11l3.5 3.5v11A1.5 1.5 0 0 1 18 20.5H6A1.5 1.5 0 0 1 4.5 19V6A1.5 1.5 0 0 1 6 4.5z" />
    <path d="M8 4.5v5h7v-5M8 20.5v-6h8v6" />
  </Svg>
);
