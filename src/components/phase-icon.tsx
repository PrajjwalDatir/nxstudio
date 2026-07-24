import {
  LightbulbIcon,
  CheckCircleIcon,
  BoxIcon,
  LayersIcon,
  PlayIcon,
  RocketIcon,
  SparklesIcon,
} from "@/components/icons";

const MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  lightbulb: LightbulbIcon,
  check: CheckCircleIcon,
  box: BoxIcon,
  layers: LayersIcon,
  play: PlayIcon,
  rocket: RocketIcon,
  sparkles: SparklesIcon,
};

export function PhaseIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = MAP[name] ?? BoxIcon;
  return <Icon className={className} />;
}
