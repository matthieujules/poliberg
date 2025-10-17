# Activity Feed Logic - How It Works

## Overview

The dashboard now operates as a **chronological activity feed** showing the most recent volume spike activity, not just the highest current spikes.

## Key Behavior

### What Pushes Events to the Top

An event gets bumped to #1 position when:

1. **🆕 New Spike Detected** - Market volume spikes for the first time (>1.5x average)
2. **📈 Spike Increased** - Existing spike grows by >10% (e.g., 4.0x → 5.2x)

### What Keeps Events in Place

An event stays in its current position when:

- Volume spike remains stable (±10%)
- No new spike activity detected
- Gradually ages down as newer spikes appear

### What Doesn't Push to Top

These changes do NOT bump timestamp:

- **📉 Spike Decreased** - Volume drops (not exciting)
- **❌ Spike Removed** - Falls below 1.5x threshold (event is cooling off)

## Example Timeline

```
Time   | Event              | Action            | Spike | Position
-------|-------------------|-------------------|-------|----------
1:00pm | Blue Jays         | New spike         | 7.0x  | #1
       | (detectedAt: 1:00pm)
-------|-------------------|-------------------|-------|----------
1:05pm | Solana Price      | New spike         | 5.0x  | #1
       | Blue Jays         | No change         | 7.0x  | #2 ⬇
       | (detectedAt: 1:05pm vs 1:00pm)
-------|-------------------|-------------------|-------|----------
1:10pm | Gold Price        | New spike         | 6.0x  | #1
       | Solana Price      | No change         | 5.0x  | #2 ⬇
       | Blue Jays         | No change         | 7.0x  | #3 ⬇
       | (detectedAt: 1:10pm > 1:05pm > 1:00pm)
-------|-------------------|-------------------|-------|----------
1:15pm | Blue Jays         | Spike increased!  | 9.0x  | #1 ⬆
       | Gold Price        | No change         | 6.0x  | #2 ⬇
       | Solana Price      | No change         | 5.0x  | #3 ⬇
       | (detectedAt: 1:15pm > 1:10pm > 1:05pm)
```

**Key insight:** Blue Jays had the highest spike (7.0x) all along, but only returned to #1 when it **increased** to 9.0x at 1:15pm!

## Technical Implementation

### Backend: Timestamp Bumping

When a change is detected:

```python
# In detect_changes():
if change_type in ["new_spike", "spike_increased"]:
    event.detectedAt = now  # Update to current time
    # This marks the event as "just had activity"
```

### Backend: Activity-Based Sorting

```python
# In get_frontier_events():
events.sort(
    key=lambda e: (
        e.detectedAt,                    # Primary: Most recent activity
        e.volumeSpike if e.volumeSpike else 0,  # Tiebreaker: Higher spike
        e.volume24hr                     # Tiebreaker: Higher volume
    ),
    reverse=True  # Newest first
)
```

### Sorting Priorities

1. **Most recent `detectedAt`** - Events with newest activity first
2. **If same timestamp** - Higher spike ratio wins
3. **If same spike ratio** - Higher volume wins

## Change Detection Thresholds

### New Spike
- Previous: No spike (ratio < 1.5x)
- Current: Has spike (ratio >= 1.5x)
- **Action**: Bump timestamp ✅

### Spike Increased
- Previous: Spike ratio = X
- Current: Spike ratio >= X * 1.1 (10% increase)
- **Example**: 4.0x → 4.4x or higher
- **Action**: Bump timestamp ✅

### Spike Decreased
- Previous: Spike ratio = X
- Current: Spike ratio <= X * 0.9 (10% decrease)
- **Example**: 5.0x → 4.5x or lower
- **Action**: Do NOT bump timestamp ⛔

### Spike Removed
- Previous: Had spike
- Current: Ratio < 1.5x (below threshold)
- **Action**: Do NOT bump timestamp ⛔

## Edge Cases Handled

### 1. Initial Load (First Poll)
- All 286 spikes detected as "new_spike"
- All get same `detectedAt` timestamp
- **Sorted by**: Spike ratio (tiebreaker kicks in)
- **Result**: Shows highest spikes first initially

### 2. Multiple Events Spike Simultaneously
- If 5 markets spike in same 60s window
- All get same `detectedAt`
- **Sorted by**: Spike ratio as tiebreaker
- **Result**: Highest spike among the new ones shows first

### 3. Event Re-spiking
- Market had spike, cooled down, spikes again
- Gets fresh `detectedAt` timestamp
- **Returns to top** of feed

### 4. Gradual Increase
- Spike goes 4.0x → 4.5x → 5.0x over multiple polls
- Each 10%+ increase bumps timestamp
- **Stays near top** with continued activity

## User Experience

### What Users See

**Scenario 1: Market Breaking News**
```
A major political event happens at 2:00pm
→ Related Polymarket market volume explodes 8.0x
→ Backend detects at 2:01pm (next poll)
→ Event shoots to #1 position
→ Users see it immediately on next frontend poll (within 5s)
```

**Scenario 2: Sustained Activity**
```
Market continues seeing trading volume
→ Spike ratio keeps increasing
→ Timestamp keeps updating
→ Stays near top of feed
```

**Scenario 3: Cooling Off**
```
Market spike stabilizes
→ No timestamp updates
→ New spikes appear
→ Event gradually moves down list
→ Eventually ages out of top 20
```

## Benefits of Activity Feed

1. **Fresh content** - Always see newest spike activity
2. **No stale data** - Old spikes don't dominate forever
3. **Catch momentum** - See markets with increasing activity
4. **Natural aging** - Inactive events fade away
5. **Re-surface capability** - Events can return to top with new activity

## Debug Console Shows

The debug console displays changes in real-time:

```
Recent Changes:
├─ 🆕 NEW: Gold Price (6.0x) - 1:10pm
├─ 📈 UP: Blue Jays (7.0x → 9.0x) - 1:15pm
├─ 🆕 NEW: Solana Price (5.0x) - 1:05pm
└─ 📉 DOWN: Bitcoin (4.0x → 3.2x) - 1:08pm
```

This gives you visibility into WHY the order changed!

## Performance Considerations

### Timestamp Updates
- Only updates on meaningful changes (new/increased spikes)
- Doesn't spam updates on every poll
- ~5-20 events might bump per poll cycle (depends on market volatility)

### Sorting Performance
- 500 events sorted by datetime (fast)
- O(n log n) complexity
- <1ms sorting time

### Memory
- No additional memory needed
- Just updates existing event objects
- Change log limited to 100 entries (rolling)

## Configuration

### Thresholds (Configurable)

**Spike Detection:**
```python
VOLUME_SPIKE_THRESHOLD = 1.5  # 50% above average
```

**Change Detection:**
```python
spike_increased = new_spike > old_spike * 1.1  # 10% increase
spike_decreased = new_spike < old_spike * 0.9  # 10% decrease
```

**Change Log:**
```python
MAX_CHANGES = 100  # Keep last 100 changes
```

---

**Result**: A dynamic, living feed of Polymarket volume spike activity! 🚀
