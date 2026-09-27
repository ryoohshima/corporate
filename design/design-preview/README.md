# Panisia — Pull a chair out from the table

Design and motion prototype; not the production Astro implementation.

## Review

- `../design.pen`: desktop/mobile designs and a direction board showing BEFORE / AFTER chair states.
- `desktop.html`: open directly and scroll. “冒頭に戻る” returns to the initial view.
- `mobile.html`: simplified static view, chairs fully pulled out.

## Corrected composition

The hero is typography-only: the notebook/paper hero motif is disabled. The table perimeter begins BELOW the hero and chair clearance, not around the hero. Two downward-facing overhead chair outlines sit above this top edge. Their seat outlines extend beneath the opaque tabletop, which is painted later and masks approximately half the seat initially.

Scroll pulls the chairs UP by 60px: it reveals the entire seat instead of tucking the chair in. The chair container is 220px tall; its initial top is 123px above the table edge. Geometry yields roughly 50% initial seat occlusion and full clearance after moving up 60px. Chair anchors are recalculated against the stationary clearance element to tolerate font/layout changes. No scroll interception, snapping, rotation, or looping.

The Table is restored to the original unboxed 50:50 columns, without book borders or folios. A small line-only notebook/pen motif now sits in the process heading margin. Existing cup markers remain limited to About. The origin photo is unchanged.

## Motion / fallback

Progress starts when the table edge reaches 88% of viewport height and runs over 35% of viewport height. If the edge is already visible on load, progress starts at scroll zero, preserving the initial half-hidden pose. Smoothstep interpolation maps 0 → -60px. Reverse scroll reverses the motion. Passive scroll events are coalesced with requestAnimationFrame; hidden tabs pause work.

Reduced motion, manual static mode, and no JavaScript show the fully pulled-out desktop pose. Mobile uses a directly positioned static pulled-out composition. The canvas desktop shows the initial pose, and the adjacent motion board compares both states.

Prototype controls are not part of the site design. Navigation/contact links are not connected. Fixed-width HTML exports scale to fit for review; they are not production responsive HTML.

## Validation

Canvas composition, clipping, and before/after masks inspected. `node --test design-preview/motion.test.cjs` passes five logic tests covering scroll direction/reversal, half-hidden/full-reveal geometry, reduced motion/static mode, visibility/coalescing, and mobile fallback. These tests use DOM stubs; actual browser scrolling, keyboard controls, and OS preference switching still need interaction verification.
