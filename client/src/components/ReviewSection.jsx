import { useState, useEffect } from 'react';
import StarRating from './StarRating';
import { createReview, getReviews } from '../services/api';

export default function ReviewSection({ novelId }) {
    const [reviews, setReviews] = useState([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [nickname, setNickname] = useState('Ẩn danh');
    const [content, setContent] = useState('');
    const [rating, setRating] = useState(5);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (novelId) fetchReviews();
    }, [novelId]);

    const fetchReviews = async () => {
        try {
            const data = await getReviews(novelId);
            setReviews(data);
        } catch (error) {
            console.error('Fetch reviews error:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;

        setIsLoading(true);
        try {
            await createReview({ novelId, nickname, content, rating });
            await fetchReviews();
            setIsFormOpen(false);
            setContent('');
            setNickname('Ẩn danh');
            setRating(5);
        } catch (error) {
            alert('Lỗi: ' + (error.message || 'Không thể gửi review'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="mt-6 border-t border-stone-800 pt-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-stone-200">Đánh giá & Bình luận</h3>
                <button
                    onClick={() => setIsFormOpen(!isFormOpen)}
                    className="text-pink-400 hover:text-pink-300 text-sm font-medium"
                >
                    {isFormOpen ? 'Đóng' : 'Viết đánh giá'}
                </button>
            </div>

            {isFormOpen && (
                <form onSubmit={handleSubmit} className="bg-stone-800/50 p-4 rounded-lg mb-6 border border-stone-700">
                    <div className="mb-3">
                        <label className="block text-xs text-stone-500 mb-1">Đánh giá của bạn</label>
                        <StarRating rating={rating} onChange={setRating} size="lg" />
                    </div>

                    <div className="mb-3">
                        <label className="block text-xs text-stone-500 mb-1">Tên hiển thị (Tùy chọn)</label>
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="Ẩn danh"
                            maxLength={30}
                            className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200 text-sm focus:outline-none focus:border-stone-500"
                        />
                        <p className="text-[10px] text-stone-600 mt-1">* Vui lòng không đặt tên phản cảm</p>
                    </div>

                    <div className="mb-3">
                        <label className="block text-xs text-stone-500 mb-1">Nội dung</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Chia sẻ cảm nghĩ của bạn về bộ truyện này..."
                            className="w-full h-24 bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200 text-sm focus:outline-none focus:border-stone-500 resize-none"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-pink-900 hover:bg-pink-800 text-pink-100 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        {isLoading ? 'Đang gửi...' : 'Gửi đánh giá'}
                    </button>
                </form>
            )}

            <div className="space-y-4">
                {reviews.length === 0 ? (
                    <p className="text-stone-500 text-sm text-center py-4">Chưa có đánh giá nào.</p>
                ) : (
                    reviews.map((review) => (
                        <div key={review._id} className="bg-stone-800/30 p-3 rounded-lg border border-stone-800">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-stone-300 text-sm">{review.nickname}</span>
                                    <StarRating rating={review.rating} readonly size="sm" />
                                </div>
                                <span className="text-xs text-stone-600">
                                    {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                                </span>
                            </div>
                            <p className="text-stone-400 text-sm whitespace-pre-wrap">{review.content}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
