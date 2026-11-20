import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Pressable, Text, useColorScheme, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { startOfWeek, today } from './src/date';
import { GoalEditor } from './src/GoalEditor';
import { GoalsScreen } from './src/screens/GoalsScreen';
import { ProgressScreen } from './src/screens/ProgressScreen';
import { WeekScreen } from './src/screens/WeekScreen';
import { StoreProvider, useStore } from './src/store';
import { palette, ThemeContext } from './src/theme';
import { Goal } from './src/types';
import { IconButton, IconName, Logo } from './src/ui';

type Tab = 'week' | 'progress' | 'goals';
const TABS: { key: Tab; label: string; icon: IconName; iconOn: IconName }[] = [
  { key: 'week', label: 'Week', icon: 'grid-outline', iconOn: 'grid' },
  { key: 'progress', label: 'Progress', icon: 'stats-chart-outline', iconOn: 'stats-chart' },
  { key: 'goals', label: 'Goals', icon: 'list-outline', iconOn: 'list' },
];

function Shell() {
  const { state, dispatch } = useStore();
  const system = useColorScheme();
  const mode = state.theme === 'system' ? (system === 'dark' ? 'dark' : 'light') : state.theme;
  const t = palette[mode];
  const [tab, setTab] = useState<Tab>('week');
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today()));
  // undefined = editor closed, null = new goal
  const [editing, setEditing] = useState<Goal | null | undefined>(undefined);

  return (
    <ThemeContext.Provider value={{ t, mode }}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: t.bg }}>
        <View style={{ flex: 1, width: '100%', maxWidth: 680, alignSelf: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, gap: 10 }}>
            <Logo />
            <Text style={{ color: t.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.5, flex: 1 }}>Daymark</Text>
            <IconButton
              name={mode === 'dark' ? 'sunny-outline' : 'moon-outline'}
              label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              onPress={() => dispatch({ type: 'theme', theme: mode === 'dark' ? 'light' : 'dark' })}
            />
          </View>
          <View style={{ flex: 1 }}>
            {tab === 'week' && <WeekScreen weekStart={weekStart} setWeekStart={setWeekStart} onEdit={setEditing} />}
            {tab === 'progress' && <ProgressScreen weekStart={weekStart} />}
            {tab === 'goals' && <GoalsScreen onEdit={setEditing} />}
          </View>
        </View>
      </SafeAreaView>
      <SafeAreaView edges={['bottom', 'left', 'right']} style={{ backgroundColor: t.card, borderTopWidth: 1, borderTopColor: t.border }}>
        <View style={{ flexDirection: 'row', width: '100%', maxWidth: 680, alignSelf: 'center' }}>
          {TABS.map((x) => {
            const on = x.key === tab;
            return (
              <Pressable
                key={x.key}
                onPress={() => setTab(x.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                style={{ flex: 1, alignItems: 'center', paddingVertical: 8 }}
              >
                <Ionicons name={on ? x.iconOn : x.icon} size={22} color={on ? t.accent : t.muted} />
                <Text style={{ color: on ? t.text : t.muted, fontSize: 11, fontWeight: on ? '700' : '500', marginTop: 2 }}>{x.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </SafeAreaView>
      <GoalEditor visible={editing !== undefined} goal={editing ?? null} onClose={() => setEditing(undefined)} />
    </ThemeContext.Provider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Shell />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
