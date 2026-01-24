import Header, { HEADER_HEIGHT } from "@/components/Header";
import { useProtectedBack } from "@/hooks/useProtectedBack";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Dimensions, FlatList, PanResponder, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ConfirmModal from "@/components/common/ConfirmModal";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import DocumentCard from "../../../components/UploadDocument/DocumentCard";
import UploadDocumentModal from "../../../components/UploadDocument/UploadDocumentModal";
import { useTheme } from "../../../context/ThemeContext";
import ApiService from "../../../services/ApiService";
import Modal from "@/components/common/SingleModal";
interface Document {
  id: string;
  name: string;
  type: string;
  date: string;
  size: string;
  url?: string;
}
type DocumentType = string;
const initialLayout = { width: Dimensions.get("window").width };
const empdocument: React.FC = () => {
  const { theme } = useTheme();
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "education", title: "EDUCATION" },
    { key: "experience", title: "EXPERIENCE" },
    { key: "proof", title: "PROOF" },
    { key: "birth", title: "BIRTH CERTIFICATE" },
  ]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<Document | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const flatListRefs = useRef<{ [key: string]: FlatList | null }>({});
  useProtectedBack({
    home: "/home",
  });
  useEffect(() => {
    fetchDocuments();
  }, []);
  useEffect(() => {
    // Refetch documents when tab changes
    fetchDocuments();
  }, [index]);
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      // Get the current tab and convert to folder name
      const currentTab = routes[index].key;
      const folderName =
        currentTab === "all" ? "All" : currentTab.toUpperCase();
      const docs = await ApiService.getDocuments(folderName);
      setDocuments(docs);
      setFilteredDocuments(docs); // API already filters by category
    } catch (error) {
      ConfirmModal.alert("Error", "Failed to load documents");
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  const filterDocumentsByTab = () => {
    // API handles filtering now
    setFilteredDocuments(documents);
  };
  const handleUpload = async (data: {
    name: string;
    type: DocumentType;
    remarks: string;
    file: {
      uri: string;
      name: string;
      type: string;
    };
  }) => {
    try {
      setUploading(true);
      const result = await ApiService.uploadDocument(data);
      if (result.success) {
        ConfirmModal.alert("Success", "Document uploaded successfully");
        setModalVisible(false);
        fetchDocuments(); // Refresh list
      } else {
        ConfirmModal.alert(
          "Upload Failed",
          result.error || "Failed to upload document",
        );
      }
    } catch (error: any) {
      ConfirmModal.alert(
        "Upload Failed",
        error.message || "Failed to upload document",
      );
    } finally {
      setUploading(false);
    }
  };
  const handleDocumentPress = (document: Document) => {
    if (document.url) {
      setViewingDoc(document);
    } else {
      ConfirmModal.alert("Info", "Preview not available for this document.");
    }
  };
  const handleShare = async (document: Document) => {
    if (!document.url) return;
    try {
      const fileUri = `${(FileSystem as any).documentDirectory}${document.name}`;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        await FileSystem.downloadAsync(document.url, fileUri);
      }
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        ConfirmModal.alert("Error", "Sharing is not available on this device");
      }
    } catch (error) {
      console.error(error);
      ConfirmModal.alert("Error", "Failed to share document");
    }
  };
  const handleRefresh = () => {
    setRefreshing(true);
    fetchDocuments();
  };
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Determine if swipe is horizontal and significant enough
        return (
          Math.abs(gestureState.dx) > 20 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy)
        );
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 50) {
          // Swipe Right -> Previous Tab
          setIndex((prev) => Math.max(0, prev - 1));
        } else if (gestureState.dx < -50) {
          // Swipe Left -> Next Tab
          setIndex((prev) => Math.min(routes.length - 1, prev + 1));
        }
      },
    }),
  ).current;
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title="Documents" />
      {/* Custom Tab Bar */}
      <View style={{ paddingTop: HEADER_HEIGHT + 6 }}>
        <FlatList
          data={routes}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.key}
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
          style={[styles.tabBar, { backgroundColor: theme.cardBackground }]}
          contentContainerStyle={{ paddingHorizontal: 10 }}
        />
      </View>
      {/* Content Area with Swipe Support */}
      <View
        style={{ flex: 1, paddingHorizontal: 16 }}
        {...panResponder.panHandlers}
      >
        {loading && !refreshing ? (
          <View
            style={[styles.centered, { backgroundColor: theme.background }]}
          >
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textLight }]}>
              Loading documents...
            </Text>
          </View>
        ) : (
          <FlatList
            ref={(ref) => {
              flatListRefs.current["list"] = ref;
            }}
            data={filteredDocuments}
            renderItem={({ item }) => (
              <DocumentCard
                document={item}
                onPress={() => handleDocumentPress(item)}
              />
            )}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Icon name="folder-open" size={60} color={theme.icon} />
                <Text style={[styles.emptyText, { color: theme.text }]}>
                  No documents found
                </Text>
                <Text style={[styles.emptySubText, { color: theme.textLight }]}>
                  {index === 0
                    ? "No documents available"
                    : `No ${routes[index].title.toLowerCase()} documents`}
                </Text>
              </View>
            )}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={() => setModalVisible(true)}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Icon name="add" size={28} color="#FFFFFF" />
        )}
      </TouchableOpacity>
      {/* Upload Modal */}
      <UploadDocumentModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onUpload={handleUpload}
        uploading={uploading}
      />
      {/* Document Viewer Modal */}
      <Modal
        visible={!!viewingDoc}
        transparent={true}
        onRequestClose={() => setViewingDoc(null)}
        animationType="slide"
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "black" }}>
          <View style={styles.viewerHeader}>
            <TouchableOpacity
              onPress={() => setViewingDoc(null)}
              style={styles.closeButton}
            >
              <Icon name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            {viewingDoc?.url && (
              <WebView
                source={{
                  uri:
                    Platform.OS === "android" &&
                    !/\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(viewingDoc.url)
                      ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(viewingDoc.url)}`
                      : viewingDoc.url,
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
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  tabBar: {
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  tabItem: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  listContainer: {
    paddingTop: 4,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  viewerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  closeButton: {
    padding: 8,
  },
  viewerActions: {
    flexDirection: "row",
  },
  actionButton: {
    padding: 8,
    marginLeft: 16,
  },
});
export default empdocument;