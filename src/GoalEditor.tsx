import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useStore } from './store';
import { GOAL_COLORS, useTheme } from './theme';
import { Goal, GoalKind } from './types';
import { Button, Segmented, Stepper } from './ui';

export function GoalEditor({ visible, goal, onClose }: { visible: boolean; goal: Goal | null; onClose: () => void }) {
  const { t } = useTheme();
  const { dispatch } = useStore();
  const [name, setName] = useState('');
  const [kind, setKind] = useState<GoalKind>('good');
  const [points, setPoints] = useState(1);
  const [perDay, setPerDay] = useState(1);
  const [color, setColor] = useState(GOAL_COLORS[0]);

  useEffect(() => {
    if (!visible) return;
    setName(goal?.name ?? '');
    setKind(goal?.kind ?? 'good');
    setPoints(goal?.points ?? 1);
    setPerDay(goal?.perDay ?? 1);
    setColor(goal?.color ?? GOAL_COLORS[0]);
  }, [visible, goal]);

  const save = () => {
    const data = { name: name.trim(), kind, points, perDay, color };
    if (!data.name) return;
    if (goal) dispatch({ type: 'updateGoal', id: goal.id, patch: data });
    else dispatch({ type: 'addGoal', goal: data });
    onClose();
  };

  const label = (s: string) => <Text style={{ color: t.muted, fontSize: 12, fontWeight: '700', marginBottom: 6, marginTop: 14 }}>{s}</Text>;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable style={{ flex: 1, backgroundColor: t.overlay }} onPress={onClose} accessibilityLabel="Close" />
        <View
          style={{
            backgroundColor: t.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32,
            width: '100%', maxWidth: 560, alignSelf: 'center',
          }}
        >
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: t.border, alignSelf: 'center', marginBottom: 14 }} />
          <Text style={{ color: t.text, fontSize: 20, fontWeight: '800' }}>{goal ? 'Edit' : 'New'} {kind === 'bad' ? 'habit' : 'goal'}</Text>

          {label('TYPE')}
          <Segmented<GoalKind>
            value={kind}
            onChange={(k) => {
              setKind(k);
              if (k === 'bad' && color !== GOAL_COLORS[6] && !goal) setColor(GOAL_COLORS[6]);
            }}
            options={[
              { value: 'good', label: 'Goal to do  +' },
              { value: 'bad', label: 'Habit to drop  −' },
            ]}
          />

          {label('NAME')}
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={kind === 'bad' ? 'e.g. Doomscrolling in bed' : 'e.g. Walk 10,000 steps'}
            placeholderTextColor={t.muted}
            autoFocus={!goal}
            maxLength={60}
            returnKeyType="done"
            onSubmitEditing={save}
            style={{ color: t.text, backgroundColor: t.track, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 }}
          />

          <View style={{ flexDirection: 'row', gap: 16 }}>
            <View style={{ flex: 1 }}>
              {label(kind === 'bad' ? 'POINTS LOST EACH TIME' : 'POINTS PER CHECK')}
              <Stepper label="points" value={points} min={1} max={10} onChange={setPoints} />
            </View>
            <View style={{ flex: 1 }}>
              {label(kind === 'bad' ? 'MAX TIMES A DAY' : 'TIMES PER DAY')}
              <Stepper label="times per day" value={perDay} min={1} max={12} onChange={setPerDay} />
            </View>
          </View>

          {label('COLOUR')}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {GOAL_COLORS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                accessibilityRole="button"
                accessibilityLabel={`Colour ${c}`}
                accessibilityState={{ selected: c === color }}
                style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: c, borderWidth: 3, borderColor: c === color ? t.text : 'transparent' }}
              />
            ))}
          </View>
          {kind === 'bad' && <Text style={{ color: t.muted, fontSize: 12, marginTop: 6 }}>Habits always show in red on the grid; the colour marks them in lists.</Text>}

          <Text style={{ color: t.muted, fontSize: 13, marginTop: 16 }}>
            {kind === 'good'
              ? `Each check adds ${points} point${points > 1 ? 's' : ''}${perDay > 1 ? `; hit it ${perDay} times for the full ${points * perDay}` : ''}.`
              : `Each time it happens you lose ${points} point${points > 1 ? 's' : ''}.`}
          </Text>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
            {goal && (
              <Button
                title="Archive"
                kind="ghost"
                icon="archive-outline"
                onPress={() => {
                  dispatch({ type: 'archive', id: goal.id, archived: true });
                  onClose();
                }}
              />
            )}
            <View style={{ flex: 1 }} />
            <Button title="Cancel" kind="ghost" onPress={onClose} />
            <Button title="Save" onPress={save} disabled={!name.trim()} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
