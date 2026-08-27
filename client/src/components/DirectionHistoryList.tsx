import type { DirectionEntry } from "@shared/history";

export default function DirectionHistoryList({ entries }: { entries: DirectionEntry[] }) {
  return <div className="mt-2 space-y-2">{entries.map((entry, index) => <div key={`${entry.createdAt}-${index}`} className="rounded-xl border border-[#e6ebe2] p-3"><div className="flex items-center justify-between gap-3 text-[10px] text-[#9aa59e]"><span className="font-semibold text-[#718b2d]">{entry.source} · {entry.label}</span><span>{new Date(entry.createdAt).toLocaleString("id-ID")}</span></div><p className="mt-2 text-xs leading-6 text-[#65736b]">{entry.prompt}</p></div>)}</div>;
}
