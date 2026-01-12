import React, { useMemo } from 'react';
import {
  FlexAlignType,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export type ColumnDef = {
  key: string;
  label: string;
  flex?: number;
  align?: FlexAlignType;
  formatter?: (value: unknown, row: any) => string;
};

type Props = {
  data: any[];
  columns: ColumnDef[];
  rowHeight?: number;
  tableWidth: number;
  theme: any;
};

export default function DynamicTable({
  data,
  columns,
  rowHeight = 44,
  tableWidth,
  theme,
}: Props) {

  /* ---------- CALCULATE FIXED COLUMN WIDTHS ---------- */
  const columnWidths = useMemo(() => {
    const totalFlex = columns.reduce((s, c) => s + (c.flex ?? 1), 0);
    return columns.map(col =>
      Math.round(((col.flex ?? 1) / totalFlex) * tableWidth)
    );
  }, [columns, tableWidth]);

  /* ---------------- HEADER ---------------- */
  const renderHeader = () => (
    <View style={[styles.row, styles.headerRow]}>
      {columns.map((col, i) => (
        <View key={col.key} style={[styles.cell, { width: columnWidths[i] }]}>
          <Text
            style={[styles.headerText, { color: theme.secondary, textAlign: align(col.align) }]}
          >
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
        { backgroundColor: index % 2 === 0 ? theme.cardBackground : theme.background },
      ]}
    >
      {columns.map((col, i) => {
        const value = col.formatter
          ? col.formatter(item[col.key], item)
          : item[col.key] ?? '';

        return (
          <View key={col.key} style={[styles.cell, { width: columnWidths[i] }]}>
            <Text
              style={[styles.cellText, { color: theme.text, textAlign: align(col.align), flexWrap: 'wrap' }]}
            >
              {String(value)}
            </Text>
          </View>
        );
      })}
    </View>
  );

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={{ width: tableWidth }}>
        {renderHeader()}
        <SectionList
          sections={[{ title: 'DATA', data }]}
          keyExtractor={(_, i) => i.toString()}
          renderItem={renderRow}
          renderSectionHeader={() => null}
          stickySectionHeadersEnabled={false}
        />
      </View>
    </ScrollView>
  );
}

const align = (a?: FlexAlignType) =>
  a === 'flex-end' ? 'right' : a === 'center' ? 'center' : 'left';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 12,
  },
  headerRow: {
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 2,
  },
  cell: {
    justifyContent: 'center',
    paddingHorizontal: 10,
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
