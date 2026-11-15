# Bowlers play each Frame simultaneously within a Frame Window

Instead of taking turns as in a real bowling alley, every Bowler plays the same Frame at the same time within a shared Frame Window (30 s, 45 s for the Tenth Frame). The window closes early once every connected Bowler has finished the Frame; Rolls not made by then count as zero pins. Nobody waits for others and an absent Bowler can never block the Room. During the window, Bowlers only see who has finished; results are revealed to everyone when it closes. The server owns the clock: it sends remaining milliseconds, not timestamps, and accepts Rolls up to 500 ms late to absorb latency.

## Considered Options

- Turns as in a real alley: rejected; with up to six Bowlers most of the time is spent waiting.
- One window per Roll: rejected; Bowlers drift out of step as soon as someone bowls a Strike.
