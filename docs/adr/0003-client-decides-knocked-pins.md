# The Bowler's client decides which Pins fall

The Swipe is simulated on the Bowler's phone (2D top-down physics with planck.js) and the client sends the server the set of Pins knocked down. The server only checks bowling rules: the Pins were standing, the Frame Window is open, and the Game accepts the Roll. Bowlers play among friends, so cheating is not worth defending against, and a server-authoritative simulation would need deterministic physics across browsers and a heavier server.

## Consequences

Sending Pin identities rather than a count lets the server restore the standing Pins on a reconnection mid-Frame.
