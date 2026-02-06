import React, { useMemo } from "react";
import {
  FlexAlignType,
  Image,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";

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
    return columns.map((col) =>
      Math.round(((col.flex ?? 1) / totalFlex) * tableWidth),
    );
  }, [columns, tableWidth]);

  /* ---------------- HEADER ---------------- */
  const renderHeader = () => (
    <View
      style={[
        styles.row,
        styles.headerRow,
        {
          backgroundColor: theme.cardBackground,
          borderColor: theme.inputBorder,
        },
      ]}
    >
      {columns.map((col, i) => (
        <View
          key={col.key}
          style={[
            styles.cell,
            { width: columnWidths[i], borderColor: theme.inputBorder },
          ]}
        >
          <Text
            style={[
              styles.headerText,
              { color: theme.text, textAlign: align(col.align) },
            ]}
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
        {
          backgroundColor:
            index % 2 === 0 ? theme.cardBackground : theme.background,
          borderColor: theme.inputBorder,
        },
      ]}
    >
      {columns.map((col, i) => {
        const value = col.formatter
          ? col.formatter(item[col.key], item)
          : (item[col.key] ?? "");
        const showImage = isImageValue(value);

        return (
          <View
            key={col.key}
            style={[
              styles.cell,
              {
                width: columnWidths[i],
                borderColor: theme.inputBorder,
                alignItems: showImage ? col.align ?? "flex-start" : undefined,
              },
            ]}
          >
            {showImage ? (
              <Image
                source={{ uri: value, cache: "force-cache" }}
                style={styles.cellImage}
                resizeMode="cover"
              />
            ) : (
              <Text
                style={[
                  styles.cellText,
                  {
                    color: theme.text,
                    textAlign: align(col.align),
                    flexWrap: "wrap",
                  },
                ]}
              >
                {String(value)}
              </Text>
            )}
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
          sections={[{ title: "DATA", data }]}
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
  a === "flex-end" ? "right" : a === "center" ? "center" : "left";

const isImageValue = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  return (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:image/")
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 12,
  },
  headerRow: {
    borderBottomWidth: 2,
  },
  cell: {
    justifyContent: "center",
    paddingHorizontal: 10,
    // borderRightWidth: 1,
    // borderColor: "#e5e7eb",
  },
  headerText: {
    fontSize: 12,
    fontWeight: "700",
  },
  cellText: {
    fontSize: 11,
    fontWeight: "500",
  },
  cellImage: {
    width: 36,
    height: 36,
    borderRadius: 6,
  },
});
