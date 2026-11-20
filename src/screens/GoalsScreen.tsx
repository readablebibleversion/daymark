import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useStore } from '../store';
import { useTheme } from '../theme';
import { Goal, ThemePref, WeightUnit } from '../types';
import { Button, Card, IconButton, Segmented, SectionTitle } from '../ui';

export function GoalsScreen({ onEdit }: { onEdit: (g: Goal | null) => void }) {
  const { t } = useTheme();
  const { state, dispatch } = useStore();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const active = state.goals.filter((g) => !g.archived);
  const archived = state.goals.filter((g) => g.archived);

  const row = (g: Goal, i: number, list: Goal[]) => (
    <View
      key={g.id}
      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderTopWidth: i ? 1 : 0, borderTopColor: t.border }}
    >
      <View style={{ width: 4, height: 32, borderRadius: 2, backgroundColor: g.kind === 'bad' ? t.bad : g.color, marginRight: 10 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: g.archived ? t.muted : t.text, fontWeight: '600' }} numberOfLines={1}>{g.name}</Text>
        <Text style={{ color: t.muted, fontSize: 12 }}>
          {g.kind === 'bad' ? 'Habit to drop · −' : 'Goal · +'}{g.points} pt{g.perDay > 1 ? ` · up to ${g.perDay}×/day` : ''}
        </Text>
      </View>
      {g.archived ? (
        <>
          <IconButton name="arrow-undo-outline" label={`Restore ${g.name}`} onPress={() => dispatch({ type: 'archive', id: g.id, archived: false })} />
          <IconButton
            name={confirmDelete === g.id ? 'trash' : 'trash-outline'}
            color={t.bad}
            label={confirmDelete === g.id ? `Confirm delete ${g.name}` : `Delete ${g.name}`}
            onPress={() => {
              if (confirmDelete === g.id) {
                dispatch({ type: 'delete', id: g.id });
                setConfirmDelete(null);
              } else setConfirmDelete(g.id);
            }}
          />
        </>
      ) : (
        <>
          <IconButton name="chevron-up" label={`Move ${g.name} up`} disabled={i === 0} onPress={() => dispatch({ type: 'move', id: g.id, dir: -1 })} />
          <IconButton name="chevron-down" label={`Move ${g.name} down`} disabled={i === list.length - 1} onPress={() => dispatch({ type: 'move', id: g.id, dir: 1 })} />
          <IconButton name="create-outline" label={`Edit ${g.name}`} onPress={() => onEdit(g)} />
          <IconButton name="archive-outline" label={`Archive ${g.name}`} onPress={() => dispatch({ type: 'archive', id: g.id, archived: true })} />
        </>
      )}
    </View>
  );

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Card>
        <SectionTitle>Active ({active.length})</SectionTitle>
        {active.length ? active.map(row) : <Text style={{ color: t.muted }}>No active goals.</Text>}
        <View style={{ marginTop: 12 }}>
          <Button title="New goal or habit" icon="add" onPress={() => onEdit(null)} />
        </View>
      </Card>

      {archived.length > 0 && (
        <Card>
          <SectionTitle>Archived ({archived.length})</SectionTitle>
          <Text style={{ color: t.muted, fontSize: 12, marginBottom: 6 }}>
            Archived items keep their history and still count in past scores. Delete removes them and their checks for good (tap the bin twice).
          </Text>
          {archived.map(row)}
        </Card>
      )}

      <Card>
        <SectionTitle>Appearance</SectionTitle>
        <Segmented<ThemePref>
          value={state.theme}
          onChange={(theme) => dispatch({ type: 'theme', theme })}
          options={[
            { value: 'system', label: 'System' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
        />
        <Text style={{ color: t.muted, fontSize: 12, fontWeight: '700', marginTop: 14, marginBottom: 6 }}>WEIGHT UNIT</Text>
        <Segmented<WeightUnit>
          value={state.unit}
          onChange={(unit) => dispatch({ type: 'unit', unit })}
          options={[
            { value: 'kg', label: 'Kilograms' },
            { value: 'lb', label: 'Pounds' },
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>How scoring works</SectionTitle>
        <Text style={{ color: t.muted, lineHeight: 20 }}>
          Each check on a goal adds its points. Each check on a habit you're dropping takes its points away. Each day goal you finish adds +1 and a happy face. Your day's score is the sum, and the week score adds up all seven days. Streaks count days you hit a goal's daily target, or days a habit stayed clean.
        </Text>
      </Card>
      <Text style={{ color: t.muted, fontSize: 12, textAlign: 'center' }}>Your data is stored only on this device.</Text>
    </ScrollView>
  );
}
