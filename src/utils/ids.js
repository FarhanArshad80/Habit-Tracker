// Ids only have to be unique within one browser's worth of rituals, so the
// timestamp carries the ordering and the random tail covers two rituals
// created in the same millisecond.
export function createId() {
  return `hb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
