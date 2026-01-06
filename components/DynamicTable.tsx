import React, { useMemo } from 'react';
import {
    FlexAlignType,
    ScrollView,
    SectionList,
    StyleSheet,
    Text,
    View,
} from 'react-native';

/* ---------------- TYPES ---------------- */

export type ColumnDef = {
  key: string;
  label: string;
  flex?: number;
  align?: FlexAlignType;
  formatter?: (value: unknown, row: Record<string, any>) => string;
};

type Props = {
  data: Record<string, any>[];
  columns?: ColumnDef[];
  rowHeight?: number;
  tableWidth?: number;
  theme: any;
};

/* ---------------- COMPONENT ---------------- */

export default function DynamicTable({
  data,
  columns,
  rowHeight = 44,
  tableWidth = 780,
  theme,
}: Props) {
  /* -------- AUTO GENERATE COLUMNS FROM API -------- */
  const resolvedColumns: ColumnDef[] = useMemo(() => {
    if (columns?.length) return columns;
    if (!data.length) return [];

    return Object.keys(data[0]).map(key => ({
      key,
      label: key.replace(/([A-Z])/g, ' $1').trim(),
      flex: 1,
      align: 'flex-end',
    }));
  }, [columns, data]);

  /* ---------------- HEADER ---------------- */

  const renderHeader = () => (
    <View
      style={[
        styles.row,
        styles.headerRow,
        { backgroundColor: theme.inputBg, height: rowHeight },
      ]}
    >
      {resolvedColumns.map(col => (
        <View
          key={col.key}
          style={[
            styles.cell,
            { flex: col.flex ?? 1, alignItems: col.align ?? 'flex-end' },
          ]}
        >
          <Text style={[styles.headerText, { color: theme.secondary }]}>
            {col.label}
          </Text>
        </View>
      ))}
    </View>
  );

  /* ---------------- ROW ---------------- */

  const renderRow = ({ item, index }: any) => (
    <View
      style={[
        styles.row,
        {
          height: rowHeight,
          backgroundColor:
            index % 2 === 0 ? theme.cardBackground : theme.background,
        },
      ]}
    >
      {resolvedColumns.map(col => {
        const raw = item[col.key];
        const value = col.formatter
          ? col.formatter(raw, item)
          : raw ?? '';

        return (
          <View
            key={col.key}
            style={[
              styles.cell,
              { flex: col.flex ?? 1, alignItems: col.align ?? 'flex-end' },
            ]}
          >
            <Text style={[styles.cellText, { color: theme.text }]}>
              {String(value)}
            </Text>
          </View>
        );
      })}
    </View>
  );

  /* ---------------- RENDER ---------------- */

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={{ minWidth: tableWidth }}>
        {renderHeader()}
        <SectionList
          sections={[{ title: 'DATA', data }]}
          keyExtractor={(_, i) => i.toString()}
          renderItem={renderRow}
          renderSectionHeader={() => null}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      </View>
    </ScrollView>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  headerRow: {
    borderBottomWidth: 2,
  },
  cell: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderColor: '#e5e7eb',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cellText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
