interface Props {
  phaseName: string;
  description: string;
  poseCount: number;
}

export default function PhaseHeader({ phaseName, description, poseCount }: Props) {
  return (
    <div
      className="w-full px-5 py-4 flex items-start justify-between"
      style={{ backgroundColor: "#0D9488" }}
    >
      <div>
        <h3 className="text-white font-bold text-lg leading-tight">{phaseName}</h3>
        <p className="text-white/75 text-sm mt-0.5">{description}</p>
      </div>
      <span className="shrink-0 ml-3 mt-0.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold">
        {poseCount} {poseCount === 1 ? "pose" : "poses"}
      </span>
    </div>
  );
}