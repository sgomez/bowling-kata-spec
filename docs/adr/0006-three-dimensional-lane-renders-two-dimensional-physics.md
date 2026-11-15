# The 3D Lane only renders the 2D physics

The Lane is drawn in 3D with three.js, loaded on demand like the physics, but the simulation stays 2D top-down (ADR 0003). The scene maps every body 1:1 onto the Lane plane; tipping, wobbling and falling Pins are animation driven by the 2D result, never physics of their own. A Swipe is read by casting each touch onto the Lane plane, so it stays in Lane metres.

## Consequences

- The Roll is sent as soon as the physics settles; Pin falls and celebrations play afterwards, so they never spend the Frame Window.
- There is no 2D fallback: a phone without WebGL is told it can't show the Lane.

## Considered Options

- Pseudo-3D on the 2D canvas: rejected; it can't give the design's camera, materials or lighting.
- 3D physics: rejected; much heavier on mid-range phones for Pins that only need to fall.
- Stretching the scene (compressed depth, wider Pin rows) for readability: rejected; the ball would visibly pass through Pins the physics says it hit, or the reverse.
