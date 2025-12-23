// Custom SVG Icons - Cyber-Physical, Clean, Architectural aesthetic
// Designed to match Nx Studio's "Lilac Monolith" theme

import { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

// Logo - Geometric crystal/node shape
export function NxLogo({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Hexagonal core */}
      <path d="M12 2L20 7V17L12 22L4 17V7L12 2Z" />
      {/* Inner diamond */}
      <path d="M12 6L16 9V15L12 18L8 15V9L12 6Z" opacity="0.6" />
      {/* Center pulse */}
      <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.8" />
    </svg>
  );
}

// Copy - Layered sheets
export function CopyIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Back layer */}
      <rect x="8" y="8" width="12" height="14" rx="1" />
      {/* Front layer */}
      <path d="M16 8V4C16 3.44772 15.5523 3 15 3H5C4.44772 3 4 3.44772 4 4V16C4 16.5523 4.44772 17 5 17H8" />
    </svg>
  );
}

// Check - Sharp confirmation
export function CheckIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M4 12L9 17L20 6" />
    </svg>
  );
}

// Download - Arrow with base
export function DownloadIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M12 3V15" />
      <path d="M7 11L12 16L17 11" />
      <path d="M5 20H19" />
    </svg>
  );
}

// Folder - Open architectural folder
export function FolderIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M3 7V18C3 19.1046 3.89543 20 5 20H19C20.1046 20 21 19.1046 21 18V9C21 7.89543 20.1046 7 19 7H12L10 4H5C3.89543 4 3 4.89543 3 6V7Z" />
      <path d="M3 10H21" opacity="0.5" />
    </svg>
  );
}

// Save - Disk with slot
export function SaveIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M5 3H16L21 8V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3Z" />
      <path d="M7 3V8H15V3" />
      <path d="M7 21V13H17V21" />
    </svg>
  );
}

// Trash - Minimal bin
export function TrashIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M4 6H20" />
      <path d="M9 6V4H15V6" />
      <path d="M6 6L7 20H17L18 6" />
      <path d="M10 10V16" opacity="0.6" />
      <path d="M14 10V16" opacity="0.6" />
    </svg>
  );
}

// Plus - Sharp cross
export function PlusIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M12 5V19" />
      <path d="M5 12H19" />
    </svg>
  );
}

// Chevron - Minimal expand arrow
export function ChevronDownIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M6 9L12 15L18 9" />
    </svg>
  );
}

// Settings - Geometric gear
export function SettingsIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2V5" />
      <path d="M12 19V22" />
      <path d="M4.93 4.93L7.05 7.05" />
      <path d="M16.95 16.95L19.07 19.07" />
      <path d="M2 12H5" />
      <path d="M19 12H22" />
      <path d="M4.93 19.07L7.05 16.95" />
      <path d="M16.95 7.05L19.07 4.93" />
    </svg>
  );
}

// Zap - Energy bolt
export function ZapIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
      className={className}
      {...props}
    >
      <path d="M13 2L4 14H11L10 22L19 10H12L13 2Z" />
    </svg>
  );
}

// User avatar placeholder
export function UserIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20" />
    </svg>
  );
}
