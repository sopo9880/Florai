# Florai input slider alignment refinement patch

## Changes

- Aligns slider labels exactly under each slider stop.
- Rebuilds slider labels as centered step chips so the text and slider position match.
- Enlarges the cut-flower bloom animation preview.
- Reduces cut-flower slider chip text size.
- Shortens potted plant pot-size dropdown labels to prevent UI overlap.
- Keeps potted plant slider text centered and compact.
- Adds `min-w-0` and `w-full` to common form inputs to prevent grid overflow.

## Validation

- `npm run lint`: passed with existing warnings only.
- `npm run build -- --webpack`: passed.
