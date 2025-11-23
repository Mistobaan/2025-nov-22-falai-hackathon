import { useState, useCallback } from 'react';

export interface Toast {
    id: string;
    type: 'error' | 'success' | 'info';
    message: string;
    duration?: number;
}

export interface ToastContextValue {
    toasts: Toast[];
    showError: (message: string, duration?: number) => void;
    showSuccess: (message: string, duration?: number) => void;
    showInfo: (message: string, duration?: number) => void;
    removeToast: (id: string) => void;
}

/**
 * Toast notification hook
 * Usage:
 *   const { showError, showSuccess } = useToast();
 *   showError("Upload failed!");
 */
export function useToast() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const addToast = useCallback((type: Toast['type'], message: string, duration: number = 5000) => {
        const id = crypto.randomUUID();
        const toast: Toast = { id, type, message, duration };

        setToasts(prev => [...prev, toast]);

        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, [removeToast]);

    const showError = useCallback((message: string, duration?: number) => {
        addToast('error', message, duration);
    }, [addToast]);

    const showSuccess = useCallback((message: string, duration?: number) => {
        addToast('success', message, duration);
    }, [addToast]);

    const showInfo = useCallback((message: string, duration?: number) => {
        addToast('info', message, duration);
    }, [addToast]);

    return {
        toasts,
        showError,
        showSuccess,
        showInfo,
        removeToast
    };
}
