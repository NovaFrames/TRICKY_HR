/* utils/timeFormat.ts */

/**
 * Format API date (/Date(…)/ or ISO or Date) → readable date
 */
// export const formatDisplayDate = (val: any): string => {
//     if (!val) return '';

//     // ASP.NET style: /Date(1700000000000)/
//     if (typeof val === 'string' && val.includes('/Date(')) {
//         const timestamp = parseInt(val.replace(/\D/g, ''), 10);
//         return new Date(timestamp).toDateString();
//     }

//     return new Date(val).toDateString();
// };

/**
 * Universal date formatter
 * Works with ASP.NET, ISO, string, number
 */
export const formatDisplayDate = (
    val: any,
    options?: {
        showTime?: boolean;
    }
): string => {
    if (!val) return '';

    let date: Date;

    // ASP.NET format: /Date(1700000000000)/
    if (typeof val === 'string' && val.includes('/Date(')) {
        const match = val.match(/\/Date\((-?\d+)\)\//);
        if (!match) return '';

        const timestamp = parseInt(match[1], 10);
        date = new Date(timestamp);
    } else {
        date = new Date(val);
    }

    if (isNaN(date.getTime())) return '';

    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    // Date only
    if (!options?.showTime) {
        return `${month} ${day}, ${year}`;
    }

    // Date + time
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12 || 12;

    return `${month} ${day}, ${year}, ${hours}:${minutes} ${ampm}`;
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
