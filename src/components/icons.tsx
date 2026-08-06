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
