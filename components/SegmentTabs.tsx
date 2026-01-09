import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

/* ---------------- TYPES ---------------- */

export type TabValue = string;

interface SegmentTabsProps<T extends TabValue> {
  tabs: T[];
  activeTab: T;
  onChange: (tab: T) => void;
}

/* ---------------- COMPONENT ---------------- */

export default function SegmentTabs<T extends TabValue>({
  tabs,
  activeTab,
  onChange,
}: SegmentTabsProps<T>) {
  const { theme } = useTheme();

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, { backgroundColor: theme.inputBg }]}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab;

          return (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                isActive && { backgroundColor: theme.cardBackground },
              ]}
              onPress={() => onChange(tab)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.text,
                  { color: isActive ? theme.primary : theme.placeholder },
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  container: {
    flexDirection: 'row',
    padding: 5,
    borderRadius: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 4,
  },
  text: {
    fontSize: 14,
    fontWeight: '700',
  },
});
