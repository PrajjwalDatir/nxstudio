// Re-export Lucide icons for consistent brand identity & high-craft design UI

export { NxLogo } from "./NxLogo";

export {
  // Core Actions
  Copy as CopyIcon,
  Check as CheckIcon,
  Download as DownloadIcon,
  Save as SaveIcon,
  Trash2 as TrashIcon,
  Plus as PlusIcon,
  LogOut as LogOutIcon,
  Mail as MailIcon,
  
  // Navigation & UI
  ChevronDown as ChevronDownIcon,
  ChevronRight as ChevronRightIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronUp as ChevronUpIcon,
  
  // User & Settings
  User as UserIcon,
  Settings as SettingsIcon,
  Lock as LockIcon,
  
  // Content & Files
  Folder as FolderIcon,
  Layers as LayersIcon,
  Palette as PaletteIcon,
  Box as BoxIcon,
  FolderKanban as ProjectIcon,

  // Surfaces / platforms
  Globe as GlobeIcon,
  Apple as AppleIcon,
  Smartphone as SmartphoneIcon,
  Monitor as MonitorIcon,

  // Builder & Precision Vector Icons
  Hammer as HammerIcon,
  LayoutGrid as ScaffoldIcon,
  Waves as WavesIcon,
  Atom as AtomIcon,
  Activity as ActivityIcon,
  Binary as BinaryIcon,
  Spline as SplineIcon,
  Disc as DiscIcon,
  Gem as GemIcon,
  Hexagon as HexagonIcon,
  Film as FilmIcon,
  PencilLine as PencilLineIcon,
  Compass as CompassIcon,
  Aperture as ApertureIcon,
  RotateCcw as RotateCcwIcon,
  
  // Brand
  Zap as ZapIcon,

  // Additional common icons
  Sun as SunIcon,
  Moon as MoonIcon,
  X as XIcon,
  Menu as MenuIcon,
  Search as SearchIcon,
  ExternalLink as ExternalLinkIcon,
  Github as GithubIcon,
  Twitter as TwitterIcon,
  Sparkles as SparklesIcon,
  Rocket as RocketIcon,
  Target as TargetIcon,
  Lightbulb as LightbulbIcon,
  Building2 as BuildingIcon,
  Sprout as SproutIcon,

  // Marketing / landing
  ArrowRight as ArrowRightIcon,
  Terminal as TerminalIcon,
  Command as CommandIcon,
  Blocks as BlocksIcon,
  ShieldCheck as ShieldCheckIcon,
  Coins as CoinsIcon,
  GitBranch as GitBranchIcon,
  MapPin as MapPinIcon,
  MessageCircle as MessageCircleIcon,
  KeyRound as KeyRoundIcon,

  // Shell / navigation
  Users as UsersIcon,
  Calendar as CalendarIcon,
  CheckCircle2 as CheckCircleIcon,
  ListChecks as ListChecksIcon,
  Bell as BellIcon,
  ArrowLeft as ArrowLeftIcon,
  ArrowUp as ArrowUpIcon,
  SlidersHorizontal as FilterIcon,
  MoreHorizontal as MoreIcon,
  Circle as CircleIcon,
  PlayCircle as PlayIcon,
  PanelLeft as PanelLeftIcon,
  RotateCcw as ResetIcon,

  // Phase & workspace
  Workflow as WorkflowIcon,
  Paperclip as PaperclipIcon,
  Mic as MicIcon,
  FileText as FileTextIcon,
  FileType as FileDocIcon,
  BadgeCheck as BadgeCheckIcon,
  Maximize2 as ExpandIcon,
  Wand2 as WandIcon,
  Pencil as PencilIcon,
  Wrench as WrenchIcon,
  Loader2 as LoaderIcon,
  Database as DatabaseIcon,
  CreditCard as CreditCardIcon,
  AlertTriangle as AlertTriangleIcon,
} from "lucide-react";

import {
  Lightbulb as LightbulbIcon,
  CheckCircle2 as CheckCircleIcon,
  Box as BoxIcon,
  Layers as LayersIcon,
  Play as PlayIcon,
  Rocket as RocketIcon,
  Sparkles as SparklesIcon,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  lightbulb: LightbulbIcon,
  check: CheckCircleIcon,
  box: BoxIcon,
  layers: LayersIcon,
  play: PlayIcon,
  rocket: RocketIcon,
  sparkles: SparklesIcon,
};

export function PhaseIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] ?? BoxIcon;
  return <Icon className={className} />;
}

/* Brand Partner Logos (Inspector, Compass, Loops MGMT, Wick) */
export function InspectorLogo({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="currentColor">
      <circle cx="50" cy="50" r="48" />
      <path
        d="M34 30L68 48L49 57L39 74L34 30Z"
        fill="var(--background, #000)"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

export function CompassLogo({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" stroke="currentColor">
      <circle cx="50" cy="50" r="46" strokeWidth="3" strokeDasharray="3 3" />
      <path d="M50 8V92 M8 50H92" strokeWidth="2" opacity="0.6" />
      <polygon points="50,20 57,47 50,44 43,47" fill="currentColor" stroke="none" />
      <polygon points="50,80 57,53 50,56 43,53" fill="currentColor" stroke="none" />
      <polygon points="20,50 47,43 44,50 47,57" fill="currentColor" stroke="none" />
      <polygon points="80,50 53,43 56,50 53,57" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function LoopsMgmtLogo({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" stroke="currentColor">
      <circle cx="50" cy="50" r="46" strokeWidth="3" fill="currentColor" fillOpacity="0.1" />
      <path
        d="M50 14 C70 14, 86 30, 86 50 C86 70, 70 86, 50 86 C30 86, 14 70, 14 50 C14 30, 30 14, 50 14 Z M50 26 C36 26, 26 36, 26 50 C26 64, 36 74, 50 74 C64 74, 74 64, 74 50 C74 36, 64 26, 50 26 Z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  );
}

export function WickLogo({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="currentColor">
      <rect x="8" y="8" width="84" height="84" rx="24" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="3" />
      <rect x="25" y="28" width="14" height="44" rx="3" fill="currentColor" />
      <rect x="45" y="44" width="10" height="20" rx="2" fill="currentColor" />
      <line x1="50" y1="36" x2="50" y2="44" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="50" y1="64" x2="50" y2="70" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M63 28H77V72L70 65L63 72V28Z" fill="currentColor" />
    </svg>
  );
}
