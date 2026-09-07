// Shared-element-style morph opener: hands the tapped card's rectangle to the
// detail layer so it can FLIP itself from the card's footprint (see
// HabitDetail.jsx). Kept tiny and dependency-free on purpose.
export function cardRect(el) {
  return el?.getBoundingClientRect?.() ?? null
}
