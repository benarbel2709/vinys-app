import ChipCloudSelector from "@/components/onboarding/ChipCloudSelector";
import type { ConditionKey } from "@/constants/conditions";

interface Props {
  selected: ConditionKey[];
  onToggle: (condition: ConditionKey) => void;
}

export default function Step1Conditions({ selected, onToggle }: Props) {
  return <ChipCloudSelector selected={selected} onToggle={onToggle} />;
}
