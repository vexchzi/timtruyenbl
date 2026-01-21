import { useState, useEffect } from 'react';
import { getRankings } from '../services/api';
import NovelCard from './NovelCard';

export default function RankingPage({ onNovelClick }) {
    const [novels, setNovels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [tab, setTab] = useState('vote'); // vote, view, newest, rating

    useEffect(() => {
        fetchRankings();
    }, [tab]);

    const fetchRankings = async () => {
        setLoading(true);
        try {
            const data = await getRankings(tab, 20);
            setNovels(data);
        } catch (error) {
            console.error('Fetch ranking error:', error);
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'vote', label: 'Top Bình Chọn' },
        { id: 'view', label: 'Nhiều Lượt Đọc' },
        { id: 'rating', label: 'Điểm Cao' },
        { id: 'newest', label: 'Mới Cập Nhật' }
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-stone-100 mb-2">Bảng Xếp Hạng</h1>
                <p className="text-stone-400">Những bộ truyện được yêu thích nhất thời gian qua</p>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap justify-center gap-2 mb-8 border-b border-stone-800 pb-4">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${tab === t.id
                                ? 'bg-rose-900/40 text-rose-300 border border-rose-800/50'
                                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                            }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {loading ? (
                    // Skeleton loading
                    Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="h-32 bg-stone-800/30 rounded-xl animate-pulse"></div>
                    ))
                ) : (
                    novels.map((novel, index) => (
                        <div key={novel._id} className="relative group">
                            {/* Rank Badge */}
                            <div className={`
                        absolute -top-2 -left-2 w-8 h-8 flex items-center justify-center rounded-full font-bold z-10 shadow-lg border-2 border-stone-900
                        ${index === 0 ? 'bg-yellow-500 text-yellow-950' :
                                    index === 1 ? 'bg-zinc-400 text-zinc-900' :
                                        index === 2 ? 'bg-amber-700 text-amber-100' :
                                            'bg-stone-700 text-stone-300'}
                   `}>
                                {index + 1}
                            </div>
                            <NovelCard
                                novel={novel}
                                rankingMode
                                onCardClick={onNovelClick}
                                showVoteCount={tab === 'vote'}
                            />
                        </div>
                    ))
                )}
            </div>

            {!loading && novels.length === 0 && (
                <div className="text-center text-stone-500 py-12">Chưa có dữ liệu xếp hạng.</div>
            )}
        </div>
    );
}
