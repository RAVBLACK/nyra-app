import React from 'react';
import Svg, { Path, Circle, Rect, Defs, LinearGradient, Stop, G, Ellipse, Line } from 'react-native-svg';

// Shield icon for Protection Status
export function ShieldIcon({ size = 52, active = false }) {
  const color1 = active ? '#4CAF50' : '#BDBDBD';
  const color2 = active ? '#81C784' : '#E0E0E0';
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id="shieldGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color2} />
          <Stop offset="1" stopColor={color1} />
        </LinearGradient>
      </Defs>
      <Path
        d="M32 4 L56 16 V34 C56 48 44 58 32 62 C20 58 8 48 8 34 V16 L32 4Z"
        fill="url(#shieldGrad)"
        stroke={color1}
        strokeWidth="2"
      />
      {active ? (
        <Path d="M22 32 L28 38 L42 24" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      ) : (
        <G>
          <Line x1="24" y1="24" x2="40" y2="40" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
          <Line x1="40" y1="24" x2="24" y2="40" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
        </G>
      )}
    </Svg>
  );
}

// Alert/Panic icon
export function AlertIcon({ size = 54, color = '#D32F2F' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id="alertGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FF5252" />
          <Stop offset="1" stopColor="#D32F2F" />
        </LinearGradient>
      </Defs>
      <Circle cx="32" cy="32" r="28" fill="url(#alertGrad)" />
      <Rect x="29" y="14" width="6" height="24" rx="3" fill="#fff" />
      <Circle cx="32" cy="46" r="4" fill="#fff" />
    </Svg>
  );
}

// Walking figure
export function WalkingIcon({ size = 60, color = '#1591EA' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Circle cx="32" cy="10" r="6" fill={color} />
      <Path
        d="M28 20 L36 20 L38 30 L44 40 M26 30 L20 38 M38 30 L30 30 L26 44 L22 56 M34 30 L38 44 L42 56"
        stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
      />
    </Svg>
  );
}

// Running figure
export function RunningIcon({ size = 60, color = '#1591EA' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Circle cx="36" cy="10" r="6" fill={color} />
      <Path
        d="M30 18 L40 20 L44 30 L52 34 M24 28 L18 22 M40 28 L32 32 L26 46 L18 56 M36 32 L42 46 L48 54"
        stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
      />
    </Svg>
  );
}

// Standing figure
export function StandingIcon({ size = 60, color = '#1591EA' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Circle cx="32" cy="10" r="6" fill={color} />
      <Line x1="32" y1="16" x2="32" y2="38" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
      <Line x1="32" y1="22" x2="22" y2="32" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
      <Line x1="32" y1="22" x2="42" y2="32" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
      <Line x1="32" y1="38" x2="24" y2="56" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
      <Line x1="32" y1="38" x2="40" y2="56" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
    </Svg>
  );
}

// Idle/Meditation figure
export function IdleIcon({ size = 60, color = '#1591EA' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Circle cx="32" cy="12" r="6" fill={color} />
      <Path
        d="M32 18 L32 36 M22 28 L32 24 L42 28 M24 36 L20 44 M40 36 L44 44 M28 36 L24 52 L32 48 L40 52 L36 36"
        stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"
      />
    </Svg>
  );
}

// Sleep/Inactive icon
export function SleepIcon({ size = 60, color = '#BDBDBD' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Circle cx="32" cy="36" r="20" fill={color + '20'} stroke={color} strokeWidth="2" />
      <Path d="M24 32 L28 32 L24 38 L28 38" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M34 26 L40 26 L34 34 L40 34" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M42 18 L50 18 L42 28 L50 28" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

// Chart/Sensor icon
export function ChartIcon({ size = 44, color = '#757575' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Rect x="8" y="48" width="48" height="2" rx="1" fill={color} />
      <Rect x="8" y="8" width="2" height="42" rx="1" fill={color} />
      <Path
        d="M14 40 L22 28 L30 34 L38 18 L46 24 L54 12"
        stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"
      />
      <Circle cx="22" cy="28" r="3" fill={color} />
      <Circle cx="38" cy="18" r="3" fill={color} />
      <Circle cx="54" cy="12" r="3" fill={color} />
    </Svg>
  );
}

// Contact/People icon for empty state
export function ContactsEmptyIcon({ size = 60, color = '#c0c0c0' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Circle cx="24" cy="18" r="8" fill={color + '60'} stroke={color} strokeWidth="2" />
      <Path d="M10 44 C10 34 18 30 24 30 C30 30 38 34 38 44" fill={color + '40'} stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="42" cy="16" r="6" fill={color + '40'} stroke={color} strokeWidth="1.5" />
      <Path d="M34 40 C34 32 38 30 42 30 C46 30 52 32 52 40" fill={color + '20'} stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Circle cx="46" cy="48" r="10" fill="#4CAF50" opacity="0.9" />
      <Line x1="46" y1="43" x2="46" y2="53" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="41" y1="48" x2="51" y2="48" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}
