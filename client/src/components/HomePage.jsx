import { useState } from 'react';
import { Link } from 'react-router-dom';
import SearchBar from './SearchBar';
import NovelCard, { NovelCardSkeleton } from './NovelCard';
import SourceNovelCard from './SourceNovelCard';
import { getRecommendations } from '../services/api';

/**
 * HomePage Component
 * Handles Search and Displaying Recommendations
 */
export default function HomePage({ stats, onNovelClick }) {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleSearch = async (url) => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await getRecommendations(url);
            setResult(data);

            setTimeout(() => {
                document.getElementById('results')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }, 100);

        } catch (err) {
            setError(err.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
            setResult(null);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative z-10">
            {/* Header */}
            <header className="pt-16 pb-10 px-4 sm:pt-20 sm:pb-14">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Logo */}
                    <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-2xl bg-stone-700/50 border border-stone-600/50">
                        <svg className="w-8 h-8 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </div>

                    <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-stone-100">
                        BL Novel Recommender
                    </h1>

                    <p className="text-stone-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
                        Khám phá những câu chuyện phù hợp với bạn
                        <br className="hidden sm:block" />
                        <span className="text-stone-500">Hỗ trợ Wattpad, WordPress, Atlantis</span>
                    </p>

                    <SearchBar onSearch={handleSearch} isLoading={isLoading} />
                </div>
            </header>

            {/* Error */}
            {error && (
                <div className="max-w-3xl mx-auto px-4 mb-8">
                    <div className="flex items-start gap-3 p-4 soft-card border-red-900/30">
                        <svg className="w-5 h-5 text-red-400/80 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <h4 className="font-medium text-red-400/90">Có lỗi xảy ra</h4>
                            <p className="text-red-400/70 text-sm mt-1">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Results */}
            {(result || isLoading) && (
                <section id="results" className="px-4 pb-20">
                    <div className="max-w-7xl mx-auto">

                        {result?.sourceNovel && (
                            <div className="mb-12">
                                <SourceNovelCard novel={result.sourceNovel} />
                            </div>
                        )}

                        <div>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-stone-700/50 border border-stone-600/50 rounded-xl">
                                        <svg className="w-5 h-5 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-xl sm:text-2xl font-bold text-stone-100">
                                            Có thể bạn cũng thích
                                        </h2>
                                        <p className="text-stone-500 text-sm mt-0.5">
                                            {result?.meta?.totalRecommendations || 0} truyện tương tự
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
                                {isLoading ? (
                                    Array.from({ length: 10 }).map((_, idx) => (
                                        <NovelCardSkeleton key={idx} />
                                    ))
                                ) : result?.recommendations?.length > 0 ? (
                                    result.recommendations.map((novel, idx) => (
                                        <NovelCard
                                            key={novel._id || idx}
                                            novel={novel}
                                            matchingTags={novel.matchingTags || []}
                                            showMatchScore={true}
                                            onCardClick={onNovelClick}
                                        />
                                    ))
                                ) : (
                                    <div className="col-span-full text-center py-16">
                                        <div className="inline-flex items-center justify-center w-14 h-14 mb-4 rounded-full bg-stone-800">
                                            <svg className="w-7 h-7 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-semibold text-stone-200 mb-2">Chưa có gợi ý</h3>
                                        <p className="text-stone-500 max-w-md mx-auto">
                                            Thư viện cần thêm truyện để gợi ý tốt hơn.
                                            <Link
                                                to="/browse"
                                                className="text-stone-400 hover:text-stone-300 ml-1 underline underline-offset-2"
                                            >
                                                Duyệt thư viện →
                                            </Link>
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Empty State / Features */}
            {!result && !isLoading && !error && (
                <section className="px-4 pb-20">
                    <div className="max-w-4xl mx-auto">
                        <div className="grid sm:grid-cols-3 gap-5 mb-16">
                            <FeatureCard
                                icon={
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    </svg>
                                }
                                title="Paste Link"
                                description="Copy link truyện từ Wattpad và paste vào ô tìm kiếm"
                            />
                            <FeatureCard
                                icon={
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                }
                                title="Phân tích"
                                description="Hệ thống phân tích tags và tìm truyện tương tự"
                            />
                            <FeatureCard
                                icon={
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                }
                                title="Khám phá"
                                description="Nhận danh sách gợi ý phù hợp với sở thích của bạn"
                            />
                        </div>

                        <div className="text-center">
                            <Link
                                to="/browse"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-stone-700 hover:bg-stone-600 text-stone-100 font-medium rounded-xl transition-colors"
                                onClick={(e) => {
                                    // Link handles e.preventDefault()
                                }}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                Duyệt thư viện ({stats?.totalNovels?.toLocaleString() || 0} truyện)
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {/* Footer */}
            <footer className="py-10 px-4 border-t border-stone-800">
                <div className="max-w-7xl mx-auto text-center text-stone-500 text-sm">
                    <p>
                        BL Novel Recommender © {new Date().getFullYear()}
                        <span className="mx-2">•</span>
                        <span>Made with ♥ for BL fans</span>
                    </p>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, description }) {
    return (
        <div className="soft-card p-5 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 mb-4 rounded-xl bg-stone-800 text-stone-400">
                {icon}
            </div>
            <h3 className="font-semibold text-stone-200 mb-2">{title}</h3>
            <p className="text-stone-500 text-sm leading-relaxed">{description}</p>
        </div>
    );
}
