import Header, { HEADER_HEIGHT } from "@/components/Header";
import { useProtectedBack } from "@/hooks/useProtectedBack";
import { getDomainUrl } from "@/services/urldomain";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useTheme } from "../../../context/ThemeContext";
import { useUser } from "../../../context/UserContext";
import ApiService from "../../../services/ApiService";

interface Document {
  NameC: string;
  LastWriteTimeC: string;
  FolderNameC: string;
  FileNameC?: string;
  IconC?: string;
}

interface DocumentRoute {
  key: string;
  title: string;
  folderName: string | null;
}

const OfficeDocument: React.FC<any> = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useUser();
  const [index, setIndex] = useState(0);
  const routes: DocumentRoute[] = [
    { key: "office", title: "Office Docs", folderName: null },
    { key: "company", title: "Company Policiesx", folderName: null },
  ];
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [domain, setDomain] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewingUrl, setViewingUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchDocumentsByTab(index);
  }, [index]);

  const fetchDocumentsByTab = async (tabIndex: number) => {
    setLoading(true);
    setError(null);

    try {
      let result;

      if (tabIndex === 0) {
        // Office Docs tab
        result = await ApiService.getOfficeDocuments("OfficeDoc");
      } else {
        // ALL Docs tab (different API)
        result = await ApiService.getCompanyPolicies("CompanyPolicies");
      }
      if (result?.success && Array.isArray(result.data)) {
        setDocuments(result.data);
        setFilteredDocuments(result.data); // no filtering
      } else {
        setDocuments([]);
        setFilteredDocuments([]);
        setError("No documents found");
      }
    } catch (e: any) {
      setError(e.message || "Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  useProtectedBack({
    home: "/home",
  });

  const fetchDocuments = () => {
    return fetchDocumentsByTab;
  };

  useEffect(() => {
    const fetchDomain = async () => {
      const domainUrl = await getDomainUrl();
      setDomain(domainUrl || null);
    };
    fetchDomain();
  }, [user]);

  const constructDownloadUrl = (fileName: string) => {
    // console.log("File Name: ", fileName);
    const customerId = user?.CustomerIdC || "kevit";
    const companyId = user?.CompIdN || "1";
    // console.log(
    //   "View Url: ",
    //   `${domain}/kevit-Customer/${customerId}/CompanyPolicies/${fileName}`,
    // );
    const empId = user?.EmpIdN || "1";
    return index === 0
      ? `${domain}/kevit-Customer/${customerId}/${companyId}/OfficeDoc/${empId}/${encodeURIComponent(fileName)}`
      : `${domain}/kevit-Customer/${customerId}/CompanyPolicies/${fileName}`;
  };

  const handleDownloadedFile = async (
    url: string,
    shouldShare: boolean = false,
  ) => {
    try {
      if (!url) {
        throw new Error("Download URL is empty");
      }

      const fileName = `Document_${new Date().getTime()}.pdf`; // Or extract extension
      const fileUri = FileSystem.documentDirectory + fileName;

      console.log("Starting download from URL:", url);

      // 1. If explicit "Download" on Android -> Use Storage Access Framework
      if (!shouldShare && Platform.OS === "android") {
        const permissions =
          await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permissions.granted) {
          const downloadRes = await FileSystem.downloadAsync(url, fileUri);
          if (downloadRes.status !== 200)
            throw new Error("Failed to download temp file");

          const base64 = await FileSystem.readAsStringAsync(downloadRes.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          const createdUri =
            await FileSystem.StorageAccessFramework.createFileAsync(
              permissions.directoryUri,
              fileName,
              "application/pdf",
            );
          await FileSystem.writeAsStringAsync(createdUri, base64, {
            encoding: FileSystem.EncodingType.Base64,
          });

          Alert.alert("Success", "File captured to selected folder.");
          return;
        } else {
          return;
        }
      }

      // 2. Default logic
      const downloadRes = await FileSystem.downloadAsync(url, fileUri);

      if (downloadRes.status === 200) {
        if (shouldShare) {
          const isAvailable = await Sharing.isAvailableAsync();
          if (isAvailable) {
            await Sharing.shareAsync(downloadRes.uri);
          } else {
            Alert.alert("Success", "File downloaded to: " + downloadRes.uri);
          }
        } else {
          Alert.alert("Success", "File downloaded successfully.");
        }
      } else {
        throw new Error(`Download failed with status: ${downloadRes.status}`);
      }
    } catch (error: any) {
      console.error("Error downloading file:", error);
      Alert.alert(
        "Download Error",
        error?.message || "Could not download the file.",
      );
    }
  };

  const handleDocumentPress = async (document: Document) => {
    const url = constructDownloadUrl(document.NameC);
    // Directly open viewer
    setViewingUrl(url);
  };

  const handleShareFromPreview = async (url: string) => {
    if (url) await handleDownloadedFile(url, true);
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return "";
      const match = dateString.match(/\/Date\((\d+)\)\//);
      if (match) {
        return (
          new Date(parseInt(match[1])).toLocaleDateString() +
          " " +
          new Date(parseInt(match[1])).toLocaleTimeString()
        );
      }
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const renderDocumentItem = ({ item }: { item: Document }) => (
    <TouchableOpacity
      style={[styles.documentItem, { backgroundColor: theme.cardBackground }]}
      onPress={() => handleDocumentPress(item)}
    >
      <View style={styles.documentIcon}>
        <Ionicons
          name="document-text-outline"
          size={32}
          color={theme.primary}
        />
      </View>

      <View style={styles.documentInfo}>
        <Text
          style={[styles.documentName, { color: theme.text }]}
          numberOfLines={1}
        >
          {item.NameC}
        </Text>
        <Text style={[styles.documentDate, { color: theme.textLight }]}>
          Modified: {formatDate(item.LastWriteTimeC)}
        </Text>
      </View>

      <View style={styles.documentAction}>
        <Ionicons name="eye-outline" size={24} color={theme.icon} />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="folder-open-outline" size={80} color={theme.icon} />
      <Text style={[styles.emptyText, { color: theme.text }]}>
        No documents found
      </Text>
      <Text style={[styles.emptySubText, { color: theme.textLight }]}>
        {`No ${routes[index]?.title.toLowerCase()} documents`}
      </Text>
    </View>
  );

  useEffect(() => {
    console.log("Current Index: ", index);
  }, [index]);

  const isImage = (url: string) => /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(url);
  const isHtml = (url: string) => /\.(html|htm)$/i.test(url);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return (
          Math.abs(gestureState.dx) > 20 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy)
        );
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 50) {
          setIndex((prev) => Math.max(0, prev - 1));
        } else if (gestureState.dx < -50) {
          setIndex((prev) => Math.min(routes.length - 1, prev + 1));
        }
      },
    }),
  ).current;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title="Office Documents" />
      <View style={{ paddingTop: HEADER_HEIGHT + 6 }}>
        <FlatList
          data={routes}
          horizontal
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.tabList}
          renderItem={({ item, index: i }) => (
            <TouchableOpacity
              style={[
                styles.tabItem,
                index === i && { borderBottomColor: theme.primary },
              ]}
              onPress={() => setIndex(i)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: index === i ? theme.primary : theme.textLight },
                ]}
              >
                {item.title}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <View
        style={{ flex: 1, paddingHorizontal: 16 }}
        {...panResponder.panHandlers}
      >
        <FlatList
          data={filteredDocuments}
          renderItem={renderDocumentItem}
          keyExtractor={(item, index) => `${item.NameC}-${index}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={fetchDocuments}
          ListEmptyComponent={
            loading && !documents.length ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.textLight }]}>
                  Loading documents...
                </Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Ionicons
                  name="alert-circle-outline"
                  size={40}
                  color="#FF6B6B"
                />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                  style={[
                    styles.retryButton,
                    { backgroundColor: theme.primary },
                  ]}
                  onPress={fetchDocuments}
                >
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : filteredDocuments.length === 0 ? (
              renderEmptyState()
            ) : null
          }
        />
      </View>

      <Modal
        visible={!!viewingUrl}
        transparent={true}
        onRequestClose={() => setViewingUrl(null)}
        animationType="slide"
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "black" }}>
          <View style={styles.viewerHeader}>
            <TouchableOpacity
              onPress={() => setViewingUrl(null)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>

            <Text
              style={{
                color: "white",
                fontWeight: "bold",
                flex: 1,
                textAlign: "center",
              }}
            >
              Document Preview
            </Text>

            {index === 0 && (
              <View style={{ flexDirection: "row", gap: 16 }}>
                <TouchableOpacity
                  onPress={() =>
                    viewingUrl && handleDownloadedFile(viewingUrl, false)
                  }
                >
                  <Ionicons name="download-outline" size={24} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    viewingUrl && handleShareFromPreview(viewingUrl)
                  }
                >
                  <Ionicons
                    name="share-social-outline"
                    size={24}
                    color="white"
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>
          <View style={{ flex: 1 }}>
            {viewingUrl && (
              <WebView
                source={{
                  uri:
                    Platform.OS === "android" &&
                    !isImage(viewingUrl) &&
                    !isHtml(viewingUrl)
                      ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(viewingUrl)}`
                      : viewingUrl,
                }}
                style={{ flex: 1 }}
                startInLoadingState={true}
                renderLoading={() => (
                  <View
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ActivityIndicator size="large" color={theme.primary} />
                  </View>
                )}
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 50,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 4,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 16,
    flexGrow: 1,
  },
  tabBar: {
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  tabItem: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  tabList: {
    flexGrow: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    width: "100%",
  },
  documentItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 4,
    padding: 16,
    marginBottom: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  documentIcon: {
    marginRight: 16,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  documentDate: {
    fontSize: 12,
  },
  documentAction: {
    marginLeft: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    textAlign: "center",
  },
  viewerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  closeButton: {
    padding: 8,
  },
});

export default OfficeDocument;
