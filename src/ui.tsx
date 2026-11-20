import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleProp, Text, View, ViewStyle } from 'react-native';
import { useTheme } from './theme';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { t } = useTheme();
  return (
    <View
      style={[
        { backgroundColor: t.card, borderRadius: 18, borderWidth: 1, borderColor: t.border, padding: 14, marginBottom: 14 },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  const { t } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <Text style={{ color: t.text, fontSize: 15, fontWeight: '700' }}>{children}</Text>
      {right}
    </View>
  );
}

export function Logo({ size = 26 }: { size?: number }) {
  const { t } = useTheme();
  return (
    <View
      style={{
        width: size, height: size, borderRadius: size * 0.32, backgroundColor: t.accent,
        alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-6deg' }],
      }}
    >
      <Ionicons name="checkmark-sharp" size={size * 0.7} color={t.onAccent} />
    </View>
  );
}

export function IconButton({
  name, onPress, label, color, disabled, size = 20,
}: { name: IconName; onPress: () => void; label: string; color?: string; disabled?: boolean; size?: number }) {
  const { t } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => ({
        width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
        backgroundColor: pressed ? t.track : 'transparent', opacity: disabled ? 0.3 : 1,
      })}
    >
      <Ionicons name={name} size={size} color={color ?? t.text} />
    </Pressable>
  );
}

export function Button({
  title, onPress, kind = 'primary', icon, disabled,
}: { title: string; onPress: () => void; kind?: 'primary' | 'ghost' | 'danger'; icon?: IconName; disabled?: boolean }) {
  const { t } = useTheme();
  const bg = kind === 'primary' ? t.accent : kind === 'danger' ? t.bad : 'transparent';
  const fg = kind === 'primary' ? t.onAccent : kind === 'danger' ? '#fff' : t.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, backgroundColor: bg,
        borderWidth: kind === 'ghost' ? 1 : 0, borderColor: t.border,
        opacity: disabled ? 0.4 : pressed ? 0.8 : 1,
      })}
    >
      {icon && <Ionicons name={icon} size={18} color={fg} />}
      <Text style={{ color: fg, fontWeight: '700', fontSize: 15 }}>{title}</Text>
    </Pressable>
  );
}

export function Segmented<T extends string>({
  value, options, onChange,
}: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  const { t } = useTheme();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: t.track, borderRadius: 12, padding: 3 }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={{
              flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center',
              backgroundColor: on ? t.card : 'transparent',
            }}
          >
            <Text style={{ color: on ? t.text : t.muted, fontWeight: on ? '700' : '500', fontSize: 14 }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Stepper({
  value, min, max, onChange, label,
}: { value: number; min: number; max: number; onChange: (n: number) => void; label: string }) {
  const { t } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: t.track, borderRadius: 12 }}>
      <IconButton name="remove" label={`Decrease ${label}`} disabled={value <= min} onPress={() => onChange(value - 1)} />
      <Text style={{ color: t.text, fontSize: 16, fontWeight: '700', minWidth: 28, textAlign: 'center' }}>{value}</Text>
      <IconButton name="add" label={`Increase ${label}`} disabled={value >= max} onPress={() => onChange(value + 1)} />
    </View>
  );
}

/** Bar chart that handles negative values with a zero baseline. */
export function BarChart({
  data, height = 130,
}: { data: { label: string; value: number; highlight?: boolean }[]; height?: number }) {
  const { t } = useTheme();
  const pos = Math.max(0, ...data.map((d) => d.value));
  const neg = Math.max(0, ...data.map((d) => -d.value));
  const span = pos + neg || 1;
  const topH = (height * pos) / span;
  const botH = (height * neg) / span;
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'stretch', gap: 6, paddingTop: 16 }}>
        {data.map((d, i) => {
          const h = (height * Math.abs(d.value)) / span;
          const color = d.value < 0 ? t.bad : d.highlight ? t.accent : t.good;
          return (
            <View key={i} style={{ flex: 1, alignItems: 'center' }}>
              <View style={{ height: topH, justifyContent: 'flex-end', alignSelf: 'stretch', alignItems: 'center' }}>
                {d.value >= 0 && (
                  <>
                    <Text style={{ color: t.muted, fontSize: 10, marginBottom: 2 }}>{d.value || ''}</Text>
                    <View style={{ height: Math.max(h, d.value ? 3 : 0), alignSelf: 'stretch', backgroundColor: color, borderTopLeftRadius: 6, borderTopRightRadius: 6 }} />
                  </>
                )}
              </View>
              <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: t.border }} />
              <View style={{ height: botH, alignSelf: 'stretch', alignItems: 'center' }}>
                {d.value < 0 && (
                  <>
                    <View style={{ height: Math.max(h, 3), alignSelf: 'stretch', backgroundColor: color, borderBottomLeftRadius: 6, borderBottomRightRadius: 6 }} />
                    <Text style={{ color: t.muted, fontSize: 10, marginTop: 2 }}>{d.value}</Text>
                  </>
                )}
              </View>
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', gap: 6, marginTop: neg ? 16 : 6 }}>
        {data.map((d, i) => (
          <Text
            key={i}
            numberOfLines={1}
            style={{ flex: 1, textAlign: 'center', fontSize: 11, color: d.highlight ? t.text : t.muted, fontWeight: d.highlight ? '700' : '400' }}
          >
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

export function ProgressBar({ ratio, color }: { ratio: number; color: string }) {
  const { t } = useTheme();
  return (
    <View style={{ height: 6, borderRadius: 3, backgroundColor: t.track, overflow: 'hidden' }}>
      <View style={{ width: `${Math.round(Math.max(0, Math.min(1, ratio)) * 100)}%`, height: 6, backgroundColor: color }} />
    </View>
  );
}

/** Simple line chart: dots joined by rotated hairlines, auto-scaled to the data. */
export function LineChart({ data, color, height = 120 }: { data: { label: string; value: number }[]; color: string; height?: number }) {
  const { t } = useTheme();
  const [w, setW] = useState(0);
  const vals = data.map((d) => d.value);
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const pad = Math.max((hi - lo) * 0.15, 0.5);
  const min = lo - pad;
  const range = hi + pad - min;
  const step = data.length > 1 ? w / (data.length - 1) : 0;
  const pts = data.map((d, i) => ({
    x: data.length > 1 ? i * step : w / 2,
    y: height - ((d.value - min) / range) * height,
  }));
  return (
    <View>
      <View style={{ height, marginHorizontal: 6 }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
        {[0, 0.5, 1].map((f) => (
          <View key={f} style={{ position: 'absolute', left: 0, right: 0, top: f * height, height: 1, backgroundColor: t.border }} />
        ))}
        {w > 0 &&
          pts.slice(1).map((p, i) => {
            const a = pts[i];
            const dx = p.x - a.x;
            const dy = p.y - a.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            return (
              <View
                key={`l${i}`}
                style={{
                  position: 'absolute', left: (a.x + p.x) / 2 - len / 2, top: (a.y + p.y) / 2 - 1, width: len, height: 2.5,
                  borderRadius: 2, backgroundColor: color, transform: [{ rotate: `${Math.atan2(dy, dx)}rad` }],
                }}
              />
            );
          })}
        {w > 0 &&
          pts.map((p, i) => (
            <View
              key={`d${i}`}
              style={{ position: 'absolute', left: p.x - 4, top: p.y - 4, width: 8, height: 8, borderRadius: 4, backgroundColor: t.card, borderWidth: 2, borderColor: color }}
            />
          ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
        <Text style={{ color: t.muted, fontSize: 11 }}>{data[0]?.label}</Text>
        <Text style={{ color: t.muted, fontSize: 11 }}>{data[data.length - 1]?.label}</Text>
      </View>
    </View>
  );
}
