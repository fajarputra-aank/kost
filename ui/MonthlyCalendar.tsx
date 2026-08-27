import { useMemo, useState } from "react";
import "./monthly-calendar.css";

export type CalendarChannel = "TikTok" | "Instagram Reels" | "YouTube Shorts" | "LinkedIn";
export type CalendarStatus = "draft" | "scheduled" | "published" | "failed";

export type CalendarItem = {
  id: string;
  title: string;
  scheduledFor: string;
  channel: CalendarChannel;
  status: CalendarStatus;
};

type Props = {
  items: CalendarItem[];
  onMove?: (itemId: string, scheduledFor: string) => Promise<void> | void;
};

const channels: Array<"all" | CalendarChannel> = ["all", "TikTok", "Instagram Reels", "YouTube Shorts", "LinkedIn"];
const statuses: Array<"all" | CalendarStatus> = ["all", "draft", "scheduled", "published", "failed"];
const dayNames = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function dateKey(date: Date) {
  return `${monthKey(date)}-${String(date.getDate()).padStart(2, "0")}`;
}

export function MonthlyCalendar({ items, onMove }: Props) {
  const [cursor, setCursor] = useState(() => new Date());
  const [channel, setChannel] = useState<(typeof channels)[number]>("all");
  const [status, setStatus] = useState<(typeof statuses)[number]>("all");
  const [draggedId, setDraggedId] = useState<string>();
  const firstDay = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const firstCell = new Date(cursor.getFullYear(), cursor.getMonth(), 1 - ((firstDay.getDay() + 6) % 7));
  const cells = Array.from({ length: 42 }, (_, index) => new Date(firstCell.getFullYear(), firstCell.getMonth(), firstCell.getDate() + index));
  const visible = useMemo(() => items.filter(item => (channel === "all" || item.channel === channel) && (status === "all" || item.status === status)), [items, channel, status]);

  async function dropOn(date: Date) {
    if (!draggedId) return;
    await onMove?.(draggedId, dateKey(date));
    setDraggedId(undefined);
  }

  return <section className="monthly-calendar" aria-label="Kalender konten bulanan">
    <header className="monthly-calendar__toolbar">
      <div><p className="eyebrow">Distribusi konten</p><h2>Kalender bulanan</h2></div>
      <div className="monthly-calendar__actions"><button type="button" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} aria-label="Bulan sebelumnya">‹</button><strong>{cursor.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</strong><button type="button" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} aria-label="Bulan berikutnya">›</button></div>
      <div className="monthly-calendar__filters"><label>Kanal<select value={channel} onChange={event => setChannel(event.target.value as (typeof channels)[number])}>{channels.map(value => <option key={value} value={value}>{value === "all" ? "Semua kanal" : value}</option>)}</select></label><label>Status<select value={status} onChange={event => setStatus(event.target.value as (typeof statuses)[number])}>{statuses.map(value => <option key={value} value={value}>{value === "all" ? "Semua status" : value}</option>)}</select></label></div>
    </header>
    <div className="monthly-calendar__grid" role="grid">{dayNames.map(day => <div className="monthly-calendar__day-name" role="columnheader" key={day}>{day}</div>)}{cells.map(date => { const key = dateKey(date); const dayItems = visible.filter(item => item.scheduledFor.startsWith(key)); const outside = date.getMonth() !== cursor.getMonth(); return <div className={`monthly-calendar__cell${outside ? " is-outside" : ""}`} role="gridcell" key={key} onDragOver={event => event.preventDefault()} onDrop={() => dropOn(date)}><time dateTime={key}>{date.getDate()}</time>{dayItems.map(item => <button type="button" draggable onDragStart={() => setDraggedId(item.id)} key={item.id} className={`calendar-card status-${item.status}`} title={`${item.channel} · ${item.status}`}>{item.title}<small>{item.channel}</small></button>)}</div>; })}</div>
  </section>;
}
