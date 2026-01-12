import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getDomainUrl(): Promise<string | undefined> {
    const domain = await AsyncStorage.getItem('domain_url');
    return domain ? domain : undefined;
}

export async function getDomainId(): Promise<string | undefined> {
    const domainId = await AsyncStorage.getItem('domain_id');
    return domainId ?? undefined;
}

export async function initDomainUrl(): Promise<string | undefined> {
    return getDomainUrl();
}
