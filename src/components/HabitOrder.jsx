import { ArrowDownWideNarrow } from 'lucide-react';
import { HABIT_ORDERS, canOrder } from '../utils/habitOrder';

export default function HabitOrder({ habits, active, onChange }) {
  if (!canOrder(habits)) return null;

  return (
    <label className="flex items-center gap-2 text-ink-500">
      <ArrowDownWideNarrow className="h-3.5 w-3.5" strokeWidth={2} />

      <span className="sr-only">Order rituals by</span>

      <select
        value={active}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Order rituals by"
        className="rounded-full border border-void-400 bg-void-200 px-3 py-1.5 font-mono text-xs text-ink-500 outline-none transition-colors hover:border-void-500 hover:text-ink-300 focus:border-gold/60"
      >
        {HABIT_ORDERS.map((order) => (
          <option key={order.id} value={order.id}>
            {order.label}
          </option>
        ))}
      </select>
    </label>
  );
}
