import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export default function ChangelogModal({ isOpen, onClose }) {
    const [updates, setUpdates] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && updates.length === 0) {
            setLoading(true);
            fetch(`${API_BASE}/updates`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) setUpdates(data.data);
                })
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-lg bg-stone-900 rounded-xl border border-stone-700 shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-stone-800 shrink-0">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-semibold text-stone-100">Cập nhật & Tính năng</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-stone-500 hover:text-stone-300 hover:bg-stone-800 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-0 overflow-y-auto grow custom-scrollbar">
                    {loading ? (
                        <div className="p-8 text-center text-stone-500">Đang tải lịch sử...</div>
                    ) : updates.length === 0 ? (
                        <div className="p-8 text-center text-stone-500">Chưa có thông tin cập nhật.</div>
                    ) : (
                        <div className="divide-y divide-stone-800">
                            {updates.map((update, idx) => (
                                <div key={idx} className="p-5">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-xl font-bold text-stone-200">{update.version}</span>
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase border ${update.type === 'feature' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800/50' :
                                                update.type === 'fix' ? 'bg-rose-900/30 text-rose-400 border-rose-800/50' :
                                                    'bg-sky-900/30 text-sky-400 border-sky-800/50'
                                            }`}>
                                            {update.type === 'feature' ? 'Tính năng' : update.type === 'fix' ? 'Sửa lỗi' : 'Cải thiện'}
                                        </span>
                                        <span className="text-xs text-stone-500 ml-auto">
                                            {new Date(update.date).toLocaleDateString('vi-VN')}
                                        </span>
                                    </div>
                                    <ul className="space-y-2">
                                        {update.content.map((point, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-stone-400 leading-relaxed">
                                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-stone-600 shrink-0" />
                                                <span>{point}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-stone-800 shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg transition-colors text-sm font-medium"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}
