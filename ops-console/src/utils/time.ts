/**
 * Digital HQ Temporal Utility
 * Calibrates all timestamps to Vietnam Time (ICT / UTC+7)
 */

export const VIETNAM_TZ = 'Asia/Ho_Chi_Minh';

export const formatICT = (date: Date | number = new Date(), options: Intl.DateTimeFormatOptions = {}) => {
    return new Date(date).toLocaleString('en-US', {
        ...options,
        timeZone: VIETNAM_TZ
    });
};

export const formatICTTime = (date: Date | number = new Date()) => {
    return new Date(date).toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        timeZone: VIETNAM_TZ
    });
};

export const formatICTDate = (date: Date | number = new Date()) => {
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: VIETNAM_TZ
    });
};
