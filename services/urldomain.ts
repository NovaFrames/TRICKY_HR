import AsyncStorage from "@react-native-async-storage/async-storage";

const normalize = (value?: string | null): string | undefined => {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return undefined;
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
};

export async function getDomainUrl(): Promise<string | undefined> {
  const direct = normalize(await AsyncStorage.getItem("domain_url"));
  if (direct) return direct;

  try {
    const rawUser = await AsyncStorage.getItem("user_data");
    if (!rawUser) return undefined;
    const parsed = JSON.parse(rawUser);
    console.log("Parsed user data for domain URL:", parsed);
    return normalize(parsed?.domain_url);
  } catch (error) {
    console.error("Error parsing user data:", error);
    return undefined;
  }
}

export const setDomainUrlSafely = async (domainUrl: string) => {
  const normalized = normalize(domainUrl);
  if (!normalized) return false;

  await AsyncStorage.setItem("domain_url", normalized);
  return true;
};

export async function getDomainId(): Promise<string | undefined> {
  const domainId = await AsyncStorage.getItem("domain_id");
  return domainId ?? undefined;
}

export async function getAuthTokenSafely(): Promise<string | undefined> {
  const token = (await AsyncStorage.getItem("auth_token"))?.trim();
  return token || undefined;
}

export async function initDomainUrl(): Promise<string | undefined> {
  return getDomainUrl();
}
