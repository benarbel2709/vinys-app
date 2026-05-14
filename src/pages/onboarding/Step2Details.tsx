import BodyMapSelector from "@/components/onboarding/BodyMapSelector";
import type { ConditionKey } from "@/constants/conditions";

interface Props {
  selected: ConditionKey[];
  onToggle: (condition: ConditionKey) => void;
  onClear: () => void;
}

export default function Step2Details({ selected, onToggle, onClear }: Props) {
  return <BodyMapSelector selected={selected} onToggle={onToggle} onClear={onClear} />;
}
