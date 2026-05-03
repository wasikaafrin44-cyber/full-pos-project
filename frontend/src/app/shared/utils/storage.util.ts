export class StorageUtil {
    static getItem<T>(key: string, defaultData: T): T {
        const data = localStorage.getItem(key);
        if (data) {
            try {
                return JSON.parse(data) as T;
            } catch (e) {
                console.error(`Error parsing localStorage key "${key}":`, e);
                return defaultData;
            }
        }
        return defaultData;
    }

    static setItem<T>(key: string, data: T): void {
        localStorage.setItem(key, JSON.stringify(data));
    }
}
