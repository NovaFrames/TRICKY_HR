/* utils/timeFormat.ts */

/**
 * Format API date (/Date(…)/ or ISO or Date) → readable date
 */
export const formatDisplayDate = (val: any): string => {
    if (!val) return '';

    // ASP.NET style: /Date(1700000000000)/
    if (typeof val === 'string' && val.includes('/Date(')) {
        const timestamp = parseInt(val.replace(/\D/g, ''), 10);
        return new Date(timestamp).toDateString();
    }

    return new Date(val).toDateString();
};

/**
 * Format number/time value → 2 decimal string
 */
export const formatTimeNumber = (v: any): string => {
    if (v === null || v === undefined || v === '') return '0.00';
    const n = Number(v);
    return isNaN(n) ? '0.00' : n.toFixed(2);
};

/**
 * Convert Date → MM/DD/YYYY (API format)
 */
export const formatDateForApi = (d: Date): string => {
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(
        d.getDate(),
    ).padStart(2, '0')}/${d.getFullYear()}`;
};
