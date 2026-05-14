interface Props {
  current: number;
  total: number;
}

export default function FlowProgress({ current, total }: Props) {
  return (
    <p
      className="text-xs text-muted-foreground/70 font-semibold uppercase tracking-wider"
      role="status"
      aria-live="polite"
    >
      Step {current} of {total}
    </p>
  );
}
