import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { addDays, DAY_LETTERS, formatWeek, startOfWeek, toKey, today, weekDays } from '../date';
import { countOf, dayScore, maxDayScore, signed } from '../scoring';
import { useStore } from '../store';
import { useTheme, withAlpha } from '../theme';
import { Goal } from '../types';
import { Button, Card, IconButton } from '../ui';

interface Props {
  weekStart: Date;
  setWeekStart: (d: Date) => void;
  onEdit: (g: Goal | null) => void;
  /** Open a day in the Today view. */
  onPickDay: (d: Date) => void;
}

const NAME_COL = '34%';

export function WeekScreen({ weekStart, setWeekStart, onEdit, onPickDay }: Props) {
  const { t } = useTheme();
  const { state, dispatch } = useStore();
  const now = today();
  const todayKey = toKey(now);
  const days = weekDays(weekStart);
  const active = state.goals.filter((g) => !g.archived);
  const isCurrent = toKey(weekStart) === toKey(startOfWeek(now));
  const scores = days.map((d) => dayScore(state, toKey(d)));
  const week = scores.reduce((a, b) => a + b, 0);
  const best = maxDayScore(state.goals);
  const todayScore = dayScore(state, todayKey);


  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      {/* Week navigator */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <IconButton name="chevron-back" label="Previous week" onPress={() => setWeekStart(addDays(weekStart, -7))} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ color: t.text, fontSize: 16, fontWeight: '700' }}>{formatWeek(weekStart)}</Text>
          {isCurrent ? (
            <Text style={{ color: t.muted, fontSize: 12 }}>This week</Text>
          ) : (
            <Pressable onPress={() => setWeekStart(startOfWeek(now))} accessibilityRole="button">
              <Text style={{ color: t.accent, fontSize: 12, fontWeight: '700' }}>Jump to this week</Text>
            </Pressable>
          )}
        </View>
        <IconButton name="chevron-forward" label="Next week" onPress={() => setWeekStart(addDays(weekStart, 7))} />
      </View>

      {/* Scores */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Card style={{ flex: 1 }}>
          <Text style={{ color: t.muted, fontSize: 12, fontWeight: '600' }}>WEEK SCORE</Text>
          <Text style={{ color: week < 0 ? t.bad : t.text, fontSize: 32, fontWeight: '800' }}>{signed(week)}</Text>
          <Text style={{ color: t.muted, fontSize: 12 }}>of {best * 7} possible</Text>
        </Card>
        <Card style={{ flex: 1, backgroundColor: t.todayBg }}>
          <Text style={{ color: t.muted, fontSize: 12, fontWeight: '600' }}>TODAY</Text>
          <Text style={{ color: todayScore < 0 ? t.bad : t.text, fontSize: 32, fontWeight: '800' }}>{signed(todayScore)}</Text>
          <Text style={{ color: t.muted, fontSize: 12 }}>of {best} possible</Text>
        </Card>
      </View>

      {/* Grid */}
      <Card style={{ paddingHorizontal: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 6 }}>
          <View style={{ width: NAME_COL }} />
          {days.map((d, i) => {
            const key = toKey(d);
            const isToday = key === todayKey;
            return (
              <Pressable
                key={i}
                onPress={() => onPickDay(d)}
                accessibilityRole="button"
                accessibilityLabel={`Open ${d.toDateString()}`}
                style={{ flex: 1, alignItems: 'center' }}
              >
                <Text style={{ color: isToday ? t.accent : t.muted, fontSize: 11, fontWeight: '700' }}>{DAY_LETTERS[i]}</Text>
                <View
                  style={{
                    width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: isToday ? t.accent : 'transparent', 
                  }}
                >
                  <Text style={{ color: isToday ? t.onAccent : t.text, fontSize: 12, fontWeight: '700' }}>{d.getDate()}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {active.length === 0 && (
          <View style={{ paddingVertical: 28, alignItems: 'center', gap: 6 }}>
            <Text style={{ color: t.text, fontWeight: '700' }}>Nothing to track yet</Text>
            <Text style={{ color: t.muted, textAlign: 'center' }}>Add a goal you want to do, or a habit you want to drop.</Text>
          </View>
        )}

        {active.map((g) => (
          <View key={g.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 3 }}>
            <Pressable
              onPress={() => onEdit(g)}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${g.name}`}
              style={{ width: NAME_COL, flexDirection: 'row', alignItems: 'center', paddingRight: 6 }}
            >
              <View style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, backgroundColor: g.kind === 'bad' ? t.bad : g.color, marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text numberOfLines={2} style={{ color: t.text, fontSize: 13, fontWeight: '600' }}>{g.name}</Text>
                <Text style={{ color: g.kind === 'bad' ? t.bad : t.muted, fontSize: 11 }}>
                  {g.kind === 'bad' ? '−' : '+'}{g.points} pt{g.perDay > 1 ? ` · ${g.perDay}×/day` : ''}
                </Text>
              </View>
            </Pressable>
            {days.map((d) => {
              const key = toKey(d);
              return (
                <Cell
                  key={key}
                  goal={g}
                  count={countOf(state, key, g.id)}
                  future={key > todayKey}
                  isToday={key === todayKey}
                  onPress={() => dispatch({ type: 'tap', date: key, id: g.id })}
                  onLongPress={() => dispatch({ type: 'clear', date: key, id: g.id })}
                />
              );
            })}
          </View>
        ))}

        {active.length > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: t.border, marginTop: 8, paddingTop: 8 }}>
            <Text style={{ width: NAME_COL, color: t.muted, fontSize: 12, fontWeight: '700', paddingLeft: 12 }}>Score</Text>
            {scores.map((s, i) => (
              <Text
                key={i}
                style={{ flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '800', color: s > 0 ? t.good : s < 0 ? t.bad : t.muted }}
              >
                {s === 0 ? '·' : signed(s)}
              </Text>
            ))}
          </View>
        )}
      </Card>

      <Text style={{ color: t.muted, fontSize: 12, textAlign: 'center', marginBottom: 14 }}>
        Tap a square to check it off (tap again for repeats). Long-press to clear. Tap a date to open that day.
      </Text>
      <Button title="Add goal or habit" icon="add" onPress={() => onEdit(null)} />
    </ScrollView>
  );
}

function Cell({
  goal, count, future, isToday, onPress, onLongPress,
}: { goal: Goal; count: number; future: boolean; isToday: boolean; onPress: () => void; onLongPress: () => void }) {
  const { t } = useTheme();
  const color = goal.kind === 'bad' ? t.bad : goal.color;
  const ratio = count / goal.perDay;
  const full = count >= goal.perDay;
  const strong = ratio >= 0.6;
  const bg = count > 0 ? withAlpha(color, 0.25 + 0.75 * ratio) : t.track;
  const fg = strong ? '#FFFFFF' : t.text;
  return (
    <View style={{ flex: 1, paddingHorizontal: 2 }}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={future}
        accessibilityRole="button"
        accessibilityLabel={`${goal.name}: ${count} of ${goal.perDay}`}
        style={({ pressed }) => ({
          height: 42, borderRadius: 11, alignItems: 'center', justifyContent: 'center',
          backgroundColor: bg, opacity: future ? 0.35 : pressed ? 0.75 : 1,
          borderWidth: isToday ? 1.5 : 0, borderColor: t.accent,
          transform: [{ scale: pressed ? 0.94 : 1 }],
        })}
      >
        {count > 0 &&
          (full && goal.perDay === 1 ? (
            <Ionicons name={goal.kind === 'bad' ? 'close' : 'checkmark'} size={20} color={fg} />
          ) : full && goal.kind === 'good' ? (
            <Ionicons name="checkmark-done" size={18} color={fg} />
          ) : (
            <Text style={{ color: fg, fontWeight: '800', fontSize: 13, marginBottom: goal.perDay > 1 ? 4 : 0 }}>{count}</Text>
          ))}
        {goal.perDay > 1 && count > 0 && !full && (
          <View style={{ position: 'absolute', bottom: 5, flexDirection: 'row', gap: 2 }}>
            {Array.from({ length: Math.min(goal.perDay, 6) }, (_, i) => (
              <View key={i} style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: i < count ? fg : withAlpha(fg === '#FFFFFF' ? '#FFFFFF' : t.text, 0.25) }} />
            ))}
          </View>
        )}
      </Pressable>
    </View>
  );
}
