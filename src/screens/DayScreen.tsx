import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { DayGoals, WeightCard } from '../DayPanel';
import { addDays, MONTHS, toKey, today } from '../date';
import { countOf, dayScore, maxDayScore, signed, tasksDone } from '../scoring';
import { useStore } from '../store';
import { useTheme, withAlpha } from '../theme';
import { Goal } from '../types';
import { Button, IconButton, ProgressBar } from '../ui';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface Props {
  day: Date;
  setDay: (d: Date) => void;
  onEdit: (g: Goal | null) => void;
}

export function DayScreen({ day, setDay, onEdit }: Props) {
  const { t } = useTheme();
  const { state, dispatch } = useStore();
  const now = today();
  const key = toKey(day);
  const todayKey = toKey(now);
  const isToday = key === todayKey;
  const isFuture = key > todayKey;
  const active = state.goals.filter((g) => !g.archived);
  const good = active.filter((g) => g.kind === 'good');
  const bad = active.filter((g) => g.kind === 'bad');

  const score = dayScore(state, key);
  const possible = maxDayScore(state.goals) + (state.tasks[key]?.length ?? 0);
  const doneGoals = good.filter((g) => countOf(state, key, g.id) >= g.perDay).length + tasksDone(state, key);
  const totalGoals = good.length + (state.tasks[key]?.length ?? 0);
  const mood = score > 0 ? 'happy' : score < 0 ? 'sad' : 'happy-outline';
  const moodColor = score > 0 ? t.good : score < 0 ? t.bad : t.muted;

  const relative = isToday ? 'Today' : key === toKey(addDays(now, -1)) ? 'Yesterday' : key === toKey(addDays(now, 1)) ? 'Tomorrow' : null;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      {/* Day navigator */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
        <IconButton name="chevron-back" label="Previous day" onPress={() => setDay(addDays(day, -1))} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ color: t.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 }}>{relative ?? WEEKDAYS[day.getDay()]}</Text>
          <Text style={{ color: t.muted, fontSize: 13 }}>
            {relative ? `${WEEKDAYS[day.getDay()]}, ` : ''}
            {MONTHS[day.getMonth()]} {day.getDate()}
          </Text>
        </View>
        <IconButton name="chevron-forward" label="Next day" onPress={() => setDay(addDays(day, 1))} />
      </View>
      {!isToday && (
        <Pressable onPress={() => setDay(now)} accessibilityRole="button" style={{ alignSelf: 'center', marginTop: -8, marginBottom: 12 }}>
          <Text style={{ color: t.accent, fontWeight: '700' }}>Back to today</Text>
        </Pressable>
      )}

      {/* Score hero */}
      <View
        style={{
          backgroundColor: isToday ? t.todayBg : t.card, borderRadius: 22, borderWidth: 1, borderColor: t.border,
          padding: 18, marginBottom: 18, flexDirection: 'row', alignItems: 'center', gap: 16,
        }}
      >
        <Ionicons name={mood} size={56} color={moodColor} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.muted, fontSize: 12, fontWeight: '700' }}>{isToday ? "TODAY'S SCORE" : 'DAY SCORE'}</Text>
          <Text style={{ color: score < 0 ? t.bad : t.text, fontSize: 38, fontWeight: '800', lineHeight: 44 }}>{signed(score)}</Text>
          <View style={{ marginVertical: 6 }}>
            <ProgressBar ratio={possible ? Math.max(0, score) / possible : 0} color={t.good} />
          </View>
          <Text style={{ color: t.muted, fontSize: 12 }}>
            {totalGoals ? `${doneGoals} of ${totalGoals} goals done · ` : ''}
            {possible} possible
          </Text>
        </View>
      </View>

      {/* Goals */}
      {good.length > 0 && <Heading>Goals</Heading>}
      {good.map((g) => (
        <GoalRow key={g.id} goal={g} count={countOf(state, key, g.id)} locked={isFuture} date={key} onEdit={() => onEdit(g)} dispatch={dispatch} />
      ))}

      {bad.length > 0 && <Heading>Habits to avoid</Heading>}
      {bad.map((g) => (
        <GoalRow key={g.id} goal={g} count={countOf(state, key, g.id)} locked={isFuture} date={key} onEdit={() => onEdit(g)} dispatch={dispatch} />
      ))}

      {active.length === 0 && (
        <Text style={{ color: t.muted, textAlign: 'center', marginVertical: 12 }}>
          Add a goal you want to do every day, or a habit you want to drop.
        </Text>
      )}
      <View style={{ marginTop: 4, marginBottom: 18 }}>
        <Button title="Add a daily goal or habit" icon="add" kind="ghost" onPress={() => onEdit(null)} />
      </View>

      <DayGoals date={key} isFuture={isFuture} />
      <WeightCard date={key} isFuture={isFuture} />
    </ScrollView>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  const { t } = useTheme();
  return <Text style={{ color: t.muted, fontSize: 12, fontWeight: '800', letterSpacing: 0.6, marginBottom: 8, marginTop: 4 }}>{String(children).toUpperCase()}</Text>;
}

function GoalRow({
  goal, count, locked, date, onEdit, dispatch,
}: {
  goal: Goal; count: number; locked: boolean; date: string; onEdit: () => void;
  dispatch: ReturnType<typeof useStore>['dispatch'];
}) {
  const { t } = useTheme();
  const isBad = goal.kind === 'bad';
  const color = isBad ? t.bad : goal.color;
  const full = count >= goal.perDay;
  const single = goal.perDay === 1;
  const pts = count * goal.points;
  const set = (n: number) => dispatch({ type: 'setCount', date, id: goal.id, n });
  // A finished goal or a clean habit day both feel "good".
  const tint = !isBad && full ? withAlpha(color, 0.14) : isBad && count > 0 ? withAlpha(t.bad, 0.1) : t.card;

  return (
    <View
      style={{
        flexDirection: 'row', alignItems: 'center', backgroundColor: tint, borderRadius: 16, borderWidth: 1,
        borderColor: !isBad && full ? withAlpha(color, 0.5) : t.border, paddingVertical: 10, paddingLeft: 14, paddingRight: 10, marginBottom: 8,
      }}
    >
      <Pressable onPress={onEdit} accessibilityRole="button" accessibilityLabel={`Edit ${goal.name}`} style={{ flex: 1, paddingRight: 8 }}>
        <Text style={{ color: t.text, fontSize: 16, fontWeight: '700' }} numberOfLines={2}>{goal.name}</Text>
        <Text style={{ color: isBad ? t.bad : t.muted, fontSize: 12, marginTop: 2 }}>
          {isBad
            ? count
              ? `Happened ${count}× · −${pts} pts`
              : `Clean so far · −${goal.points} pts each time`
            : single
              ? full ? `Done · +${pts} pts` : `+${goal.points} pts`
              : `${count} of ${goal.perDay} · +${pts} pts`}
        </Text>
        {!single && !isBad && (
          <View style={{ flexDirection: 'row', gap: 3, marginTop: 6 }}>
            {Array.from({ length: goal.perDay }, (_, i) => (
              <View key={i} style={{ flex: 1, maxWidth: 22, height: 5, borderRadius: 3, backgroundColor: i < count ? color : t.track }} />
            ))}
          </View>
        )}
      </Pressable>

      {single && !isBad ? (
        <Pressable
          onPress={() => set(full ? 0 : 1)}
          disabled={locked}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: full, disabled: locked }}
          accessibilityLabel={goal.name}
          hitSlop={8}
          style={({ pressed }) => ({
            width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
            backgroundColor: full ? color : 'transparent', borderWidth: full ? 0 : 2, borderColor: locked ? t.border : withAlpha(color, 0.6),
            transform: [{ scale: pressed ? 0.9 : 1 }], opacity: locked ? 0.5 : 1,
          })}
        >
          {full && <Ionicons name="checkmark" size={28} color="#fff" />}
        </Pressable>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, opacity: locked ? 0.4 : 1 }}>
          <RoundButton icon="remove" label={`Decrease ${goal.name}`} disabled={locked || count === 0} onPress={() => set(count - 1)} color={color} />
          <Text style={{ color: t.text, fontSize: 18, fontWeight: '800', minWidth: 22, textAlign: 'center' }}>{count}</Text>
          <RoundButton icon="add" label={`Increase ${goal.name}`} disabled={locked || full} onPress={() => set(count + 1)} color={color} filled />
        </View>
      )}
    </View>
  );
}

function RoundButton({
  icon, label, onPress, disabled, color, filled,
}: { icon: 'add' | 'remove'; label: string; onPress: () => void; disabled?: boolean; color: string; filled?: boolean }) {
  const { t } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => ({
        width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
        backgroundColor: filled ? color : t.track, opacity: disabled ? 0.35 : 1, transform: [{ scale: pressed ? 0.9 : 1 }],
      })}
    >
      <Ionicons name={icon} size={22} color={filled ? '#fff' : t.text} />
    </Pressable>
  );
}
