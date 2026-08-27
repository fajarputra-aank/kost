import { Bell, Check, Circle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const unreadInput = { unreadOnly: true } as const;

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const knownIds = useRef(new Set<number>());
  const initialized = useRef(false);
  const notifications = trpc.studio.notifications.useQuery(unreadInput, { refetchInterval: 15000 });
  const markRead = trpc.studio.markNotificationRead.useMutation({ onSuccess: () => notifications.refetch() });
  const unread = notifications.data ?? [];
  useEffect(() => {
    const fresh = unread.filter(item => !knownIds.current.has(item.id));
    if (initialized.current) fresh.forEach(item => toast.success(item.title, { description: item.message }));
    unread.forEach(item => knownIds.current.add(item.id));
    initialized.current = true;
  }, [unread]);
  return <div className="relative"><button type="button" aria-label={`Notifikasi${unread.length ? `, ${unread.length} belum dibaca` : ""}`} onClick={() => setOpen(value => !value)} className="relative grid size-9 place-items-center rounded-full text-[#78847d] transition hover:bg-white hover:text-[#17211e] dark:hover:bg-white/10 dark:hover:text-white"><Bell size={16} />{unread.length > 0 && <span className="absolute right-1.5 top-1.5 grid min-w-3.5 place-items-center rounded-full bg-[#d6f37b] px-1 text-[8px] font-bold leading-3 text-[#34421f]">{unread.length > 9 ? "9+" : unread.length}</span>}</button>{open && <div className="absolute right-0 top-11 z-30 w-80 rounded-2xl border border-[#e1e7df] bg-white p-3 shadow-[0_18px_60px_rgba(33,48,37,.14)] dark:border-white/10 dark:bg-[#18221e]"><div className="flex items-center justify-between px-2 pb-2"><p className="text-xs font-semibold">Notifikasi studio</p><span className="text-[10px] text-[#8a968f]">Otomatis</span></div>{unread.length ? <div className="space-y-1">{unread.map(item => <button type="button" key={item.id} onClick={() => markRead.mutate({ id: item.id })} className="flex w-full items-start gap-2 rounded-xl p-2 text-left transition hover:bg-[#f3f7ed] dark:hover:bg-white/5"><Circle size={7} className="mt-1.5 shrink-0 fill-[#8ca93a] text-[#8ca93a]" /><span className="min-w-0 flex-1"><strong className="block text-xs font-semibold">{item.title}</strong><span className="mt-0.5 block text-[10px] leading-4 text-[#7b887f]">{item.message}</span><span className="mt-1 block text-[9px] text-[#a0aaa3]">{new Date(item.createdAt).toLocaleString("id-ID")}</span></span><Check size={13} className="mt-1 shrink-0 text-[#8ca93a]" /></button>)}</div> : <p className="px-2 py-5 text-center text-[11px] text-[#8a968f]">Belum ada render yang selesai.</p>}</div>}</div>;
}
