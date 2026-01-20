import Header, { HEADER_HEIGHT } from "@/components/Header";
import { useProtectedBack } from "@/hooks/useProtectedBack";
import { getDomainUrl } from "@/services/urldomain";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
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
  FolderName: string;
}

const OfficeDocument: React.FC<any> = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useUser();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [domain, setDomain] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewingUrl, setViewingUrl] = useState<string | null>(null);

  useProtectedBack({
    home: "/home",
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await ApiService.getOfficeDocuments("OfficeDoc");
      if (result.success && result.data) {
        setDocuments(result.data);
      } else {
        setError(result.error || "Failed to fetch documents");
      }
    } catch (error: any) {
      setError(error.message || "Error fetching documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchDomain = async () => {
      const domainUrl = await getDomainUrl();
      setDomain(domainUrl || null);
    };
    fetchDomain();
  }, [user]);

  const constructDownloadUrl = (fileName: string) => {
    const customerId = user?.CustomerIdC || "kevit";
    const companyId = user?.CompIdN || "1";
    const empId = user?.EmpIdN || "1";
    return `${domain}/kevit-Customer/${customerId}/${companyId}/OfficeDoc/${empId}/${encodeURIComponent(fileName)}`;
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
        There are no office documents available at the moment.
      </Text>
    </View>
  );

  const isImage = (url: string) => /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(url);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title="Office Documents" />
      <FlatList
        data={documents}
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
              <Ionicons name="alert-circle-outline" size={40} color="#FF6B6B" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: theme.primary }]}
                onPress={fetchDocuments}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : documents.length === 0 ? (
            renderEmptyState()
          ) : null
        }
      />

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

            <View style={{ flexDirection: "row", gap: 16 }}>
              <TouchableOpacity
                onPress={() =>
                  viewingUrl && handleDownloadedFile(viewingUrl, false)
                }
              >
                <Ionicons name="download-outline" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => viewingUrl && handleShareFromPreview(viewingUrl)}
              >
                <Ionicons name="share-social-outline" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            {viewingUrl && (
              <WebView
                source={{
                  uri:
                    Platform.OS === "android" && !isImage(viewingUrl)
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
    paddingTop: HEADER_HEIGHT + 12,
    paddingHorizontal: 16,
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
