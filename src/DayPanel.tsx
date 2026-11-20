import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { DAY_SHORT, fromKey, shortDate } from './date';
import { fromDisplayWeight, TASK_POINTS, toDisplayWeight } from './scoring';
import { useStore } from './store';
import { useTheme } from './theme';
import { Card, IconButton, SectionTitle } from './ui';

export const dayLabel = (key: string) => {
  const d = fromKey(key);
  return `${DAY_SHORT[(d.getDay() + 6) % 7]}, ${shortDate(d)}`;
};

/** One-off goals for a single day. Each finished one earns a happy face and +1. */
export function DayGoals({ date, isFuture }: { date: string; isFuture: boolean }) {
  const { t } = useTheme();
  const { state, dispatch } = useStore();
  const [text, setText] = useState('');
  const tasks = state.tasks[date] ?? [];
  const done = tasks.filter((x) => x.done).length;
  const allDone = tasks.length > 0 && done === tasks.length;

  const add = () => {
    const v = text.trim();
    if (!v) return;
    dispatch({ type: 'addTask', date, text: v });
    setText('');
  };

  return (
    <Card>
      <SectionTitle
        right={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name={allDone ? 'happy' : 'happy-outline'} size={22} color={allDone ? t.good : t.muted} />
            <Text style={{ color: done ? t.good : t.muted, fontWeight: '800' }}>
              {tasks.length ? `+${done * TASK_POINTS}` : ''}
            </Text>
          </View>
        }
      >
        Day goals · {dayLabel(date)}
      </SectionTitle>

      {tasks.length === 0 && (
        <Text style={{ color: t.muted, fontSize: 13, marginBottom: 8 }}>
          Things you want to get done {isFuture ? 'that day' : 'today'}. Each one you finish earns a happy face and +{TASK_POINTS}.
        </Text>
      )}

      {tasks.map((x) => (
        <View key={x.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4 }}>
          <Pressable
            onPress={() => dispatch({ type: 'toggleTask', date, id: x.id })}
            disabled={isFuture}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: x.done, disabled: isFuture }}
            accessibilityLabel={x.text}
            hitSlop={6}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10, opacity: pressed ? 0.7 : 1 })}
          >
            <Ionicons name={x.done ? 'happy' : 'ellipse-outline'} size={28} color={x.done ? t.good : isFuture ? t.border : t.muted} />
            <Text style={{ flex: 1, color: x.done ? t.muted : t.text, fontSize: 15, textDecorationLine: x.done ? 'line-through' : 'none' }}>
              {x.text}
            </Text>
            {x.done && <Text style={{ color: t.good, fontWeight: '800' }}>+{TASK_POINTS}</Text>}
          </Pressable>
          <IconButton name="close" size={18} color={t.muted} label={`Remove ${x.text}`} onPress={() => dispatch({ type: 'removeTask', date, id: x.id })} />
        </View>
      ))}

      {allDone && (
        <Text style={{ color: t.good, fontWeight: '700', textAlign: 'center', marginVertical: 6 }}>All done. Great day!</Text>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={add}
          placeholder="Add a goal for the day…"
          placeholderTextColor={t.muted}
          returnKeyType="done"
          blurOnSubmit={false}
          maxLength={80}
          style={{ flex: 1, minWidth: 0, color: t.text, backgroundColor: t.track, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 }}
        />
        <Pressable
          onPress={add}
          disabled={!text.trim()}
          accessibilityRole="button"
          accessibilityLabel="Add day goal"
          style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center', opacity: text.trim() ? 1 : 0.4 }}
        >
          <Ionicons name="add" size={22} color={t.onAccent} />
        </Pressable>
      </View>
    </Card>
  );
}

/** Log body weight for a day. Stored in kg, shown in the chosen unit. */
export function WeightCard({ date, isFuture }: { date: string; isFuture: boolean }) {
  const { t } = useTheme();
  const { state, dispatch } = useStore();
  const unit = state.unit;
  const saved = state.weights[date];
  const [value, setValue] = useState('');

  useEffect(() => {
    setValue(saved ? String(toDisplayWeight(saved, unit)) : '');
  }, [saved, unit, date]);

  const prevKey = Object.keys(state.weights).filter((k) => k < date).sort().pop();
  const diff = saved && prevKey ? toDisplayWeight(saved, unit) - toDisplayWeight(state.weights[prevKey], unit) : null;
  const parsed = parseFloat(value.replace(',', '.'));
  const valid = !isNaN(parsed) && parsed > 0 && parsed < 1000;
  const dirty = valid && (!saved || Math.abs(toDisplayWeight(saved, unit) - parsed) > 0.001);

  const save = () => {
    if (valid) dispatch({ type: 'weight', date, kg: fromDisplayWeight(parsed, unit) });
  };

  if (isFuture) return null;
  return (
    <Card>
      <SectionTitle right={<Ionicons name="scale-outline" size={20} color={t.muted} />}>Weight · {dayLabel(date)}</SectionTitle>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', backgroundColor: t.track, borderRadius: 12, paddingHorizontal: 12 }}>
          <TextInput
            value={value}
            onChangeText={setValue}
            onSubmitEditing={save}
            keyboardType="decimal-pad"
            inputMode="decimal"
            placeholder="0.0"
            placeholderTextColor={t.muted}
            accessibilityLabel={`Weight in ${unit}`}
            style={{ flex: 1, minWidth: 0, width: '100%', color: t.text, paddingVertical: 10, fontSize: 18, fontWeight: '700' }}
          />
          <Text style={{ color: t.muted, fontWeight: '700' }}>{unit}</Text>
        </View>
        <Pressable
          onPress={save}
          disabled={!dirty}
          accessibilityRole="button"
          style={{ flexShrink: 0, paddingHorizontal: 16, height: 44, borderRadius: 12, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center', opacity: dirty ? 1 : 0.4 }}
        >
          <Text style={{ color: t.onAccent, fontWeight: '700' }}>{saved ? 'Update' : 'Save'}</Text>
        </Pressable>
        {saved !== undefined && (
          <IconButton name="trash-outline" color={t.muted} label="Delete weight entry" onPress={() => dispatch({ type: 'weight', date, kg: null })} />
        )}
      </View>
      {diff !== null && prevKey && (
        <Text style={{ color: t.muted, fontSize: 13, marginTop: 8, fontWeight: '600' }}>
          {diff > 0 ? '▲ +' : diff < 0 ? '▼ ' : ''}
          {Math.round(diff * 10) / 10} {unit} since {shortDate(fromKey(prevKey))}
        </Text>
      )}
    </Card>
  );
}
