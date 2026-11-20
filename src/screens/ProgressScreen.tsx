import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { addDays, DAY_SHORT, formatWeek, startOfWeek, toKey, today, weekDays } from '../date';
import { bestStreak, currentStreak, dayKept, dayScore, earliestDate, signed, toDisplayWeight, weekScore } from '../scoring';
import { useStore } from '../store';
import { useTheme } from '../theme';
import { BarChart, Card, LineChart, ProgressBar, SectionTitle } from '../ui';

export function ProgressScreen({ weekStart }: { weekStart: Date }) {
  const { t } = useTheme();
  const { state } = useStore();
  const now = today();
  const todayKey = toKey(now);
  const days = weekDays(weekStart);
  const active = state.goals.filter((g) => !g.archived);
  const thisWeek = toKey(startOfWeek(now));

  const daily = days.map((d, i) => ({ label: DAY_SHORT[i], value: dayScore(state, toKey(d)), highlight: toKey(d) === todayKey }));
  const weeks = Array.from({ length: 8 }, (_, i) => addDays(weekStart, -7 * (7 - i)));
  const weekly = weeks.map((w) => ({ label: `${w.getMonth() + 1}/${w.getDate()}`, value: weekScore(state, w), highlight: toKey(w) === thisWeek }));
  const elapsed = days.filter((d) => toKey(d) <= todayKey);

  const avg = weekly.reduce((s, w) => s + w.value, 0) / weekly.length;
  const bestDay = daily.reduce((b, d) => (d.value > b.value ? d : b), daily[0]);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Text style={{ color: t.muted, fontSize: 13, textAlign: 'center', marginBottom: 12 }}>{formatWeek(weekStart)}</Text>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Stat label="This week" value={signed(weekly[7].value)} />
        <Stat label="8-week avg" value={signed(Math.round(avg))} />
        <Stat label="Best day" value={bestDay.value > 0 ? bestDay.label : '—'} />
      </View>

      <Card>
        <SectionTitle>Daily score</SectionTitle>
        <BarChart data={daily} />
      </Card>

      <Card>
        <SectionTitle>Last 8 weeks</SectionTitle>
        <BarChart data={weekly} />
      </Card>

      <WeightProgress />

      <SectionTitle>Streaks</SectionTitle>
      {active.length === 0 && <Text style={{ color: t.muted }}>Add some goals to see streaks here.</Text>}
      {active.map((g) => {
        const cur = currentStreak(state, g, now);
        const best = bestStreak(state, g, now);
        const since = earliestDate(state, g);
        const tracked = elapsed.filter((d) => d >= since);
        const kept = tracked.filter((d) => dayKept(state, g, toKey(d))).length;
        const color = g.kind === 'bad' ? t.bad : g.color;
        return (
          <Card key={g.id} style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color, marginRight: 8 }} />
              <Text style={{ color: t.text, fontWeight: '700', flex: 1 }} numberOfLines={1}>{g.name}</Text>
              <Ionicons name={g.kind === 'bad' ? 'shield-checkmark' : 'flame'} size={16} color={cur ? t.accent : t.muted} />
              <Text style={{ color: t.text, fontWeight: '800', marginLeft: 4 }}>{cur}d</Text>
            </View>
            <ProgressBar ratio={tracked.length ? kept / tracked.length : 0} color={g.kind === 'bad' ? t.good : color} />
            <Text style={{ color: t.muted, fontSize: 12, marginTop: 6 }}>
              {g.kind === 'bad' ? 'Clean' : 'Target met'} {kept}/{tracked.length} days this week · best streak {best}d
            </Text>
          </Card>
        );
      })}
    </ScrollView>
  );
}

function WeightProgress() {
  const { t } = useTheme();
  const { state } = useStore();
  const unit = state.unit;
  const keys = Object.keys(state.weights).sort().slice(-30);
  const pts = keys.map((k) => ({ label: `${Number(k.slice(5, 7))}/${Number(k.slice(8))}`, value: toDisplayWeight(state.weights[k], unit) }));
  const first = pts[0]?.value;
  const last = pts[pts.length - 1]?.value;
  const change = pts.length > 1 ? Math.round((last - first) * 10) / 10 : null;
  return (
    <Card>
      <SectionTitle right={<Text style={{ color: t.muted, fontSize: 12 }}>last {pts.length} entries</Text>}>Weight</SectionTitle>
      {pts.length === 0 ? (
        <Text style={{ color: t.muted }}>Log your weight on the Week tab to see a trend here.</Text>
      ) : (
        <>
          <View style={{ flexDirection: 'row', marginBottom: 8 }}>
            <MiniStat label="Latest" value={`${last} ${unit}`} />
            <MiniStat label="Change" value={change === null ? '—' : `${change > 0 ? '+' : ''}${change} ${unit}`} />
            <MiniStat label="Lowest" value={`${Math.min(...pts.map((p) => p.value))} ${unit}`} />
          </View>
          <LineChart data={pts} color={t.accent} />
        </>
      )}
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  const { t } = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: t.muted, fontSize: 11, fontWeight: '600' }}>{label.toUpperCase()}</Text>
      <Text style={{ color: t.text, fontSize: 16, fontWeight: '800' }}>{value}</Text>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const { t } = useTheme();
  return (
    <Card style={{ flex: 1, paddingVertical: 12 }}>
      <Text style={{ color: t.muted, fontSize: 11, fontWeight: '600' }}>{label.toUpperCase()}</Text>
      <Text style={{ color: t.text, fontSize: 22, fontWeight: '800', marginTop: 2 }}>{value}</Text>
    </Card>
  );
}
