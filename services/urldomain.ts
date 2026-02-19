import AsyncStorage from '@react-native-async-storage/async-storage';

const normalize = (value?: string | null): string | undefined => {
    const trimmed = (value ?? '').trim();
    if (!trimmed) return undefined;
    return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
};

export async function getDomainUrl(): Promise<string | undefined> {
    const direct = normalize(await AsyncStorage.getItem('domain_url'));
    if (direct) return direct;

    try {
        const rawUser = await AsyncStorage.getItem('user_data');
        if (!rawUser) return undefined;
        const parsed = JSON.parse(rawUser);
        return normalize(parsed?.domain_url);
    } catch {
        return undefined;
    }
}

export async function setDomainUrlSafely(
    domainUrl: string,
    options?: { force?: boolean }
): Promise<boolean> {
    const normalized = normalize(domainUrl);
    if (!normalized) return false;

    const existing = await getDomainUrl();
    if (existing && existing !== normalized && !options?.force) {
        console.warn('[Storage] domain_url already set. Keeping existing domain.', {
            existing,
            attempted: normalized,
        });
        return false;
    }

    await AsyncStorage.setItem('domain_url', normalized);
    return true;
}

export async function getDomainId(): Promise<string | undefined> {
    const domainId = await AsyncStorage.getItem('domain_id');
    return domainId ?? undefined;
}

export async function getAuthTokenSafely(): Promise<string | undefined> {
    const token = (await AsyncStorage.getItem('auth_token'))?.trim();
    return token || undefined;
}

export async function initDomainUrl(): Promise<string | undefined> {
    return getDomainUrl();
}
