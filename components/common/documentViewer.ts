import { Platform } from "react-native";

const IMAGE_EXT_RE = /\.(jpg|jpeg|png|gif|bmp|webp|heic|heif|svg)$/i;
const PDF_EXT_RE = /\.pdf$/i;
const HTML_EXT_RE = /\.(html|htm)$/i;
const OFFICE_EXT_RE =
  /\.(xlsx|xls|csv|doc|docx|ppt|pptx|rtf|odt|ods|odp|txt)$/i;

const getPathForExt = (url: string) => {
  try {
    return new URL(url).pathname || url;
  } catch {
    return url;
  }
};

export const getDocumentViewerUri = (url: string) => {
  const path = getPathForExt(url);

  if (IMAGE_EXT_RE.test(path) || PDF_EXT_RE.test(path)) {
    return url;
  }

  if (OFFICE_EXT_RE.test(path)) {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
  }

  if (HTML_EXT_RE.test(path)) {
    return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;
  }

  if (Platform.OS === "android" || Platform.OS === "web") {
    return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;
  }

  return url;
};
