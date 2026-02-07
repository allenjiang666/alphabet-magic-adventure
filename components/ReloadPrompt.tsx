
import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const ReloadPrompt: React.FC = () => {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ' + r);
        },
        onRegisterError(error) {
            console.log('SW registration error', error);
        },
    });

    const close = () => {
        setOfflineReady(false);
        setNeedRefresh(false);
    };

    if (!offlineReady && !needRefresh) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[9999] p-4 bg-white rounded-2xl shadow-2xl border-2 border-orange-400 max-w-sm animate-in slide-in-from-bottom-5">
            <div className="flex flex-col gap-3">
                <div className="text-gray-800 font-kids text-lg">
                    {offlineReady ? (
                        <span>App ready to work offline! 🚀</span>
                    ) : (
                        <span>New magic update available! ✨</span>
                    )}
                </div>
                <div className="flex gap-2 text-sm font-kids">
                    {needRefresh && (
                        <button
                            onClick={() => updateServiceWorker(true)}
                            className="bg-orange-500 text-white px-4 py-2 rounded-xl hover:bg-orange-600 transition-colors shadow-sm"
                        >
                            Update Now
                        </button>
                    )}
                    <button
                        onClick={close}
                        className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReloadPrompt;
