import { useState, useEffect } from 'react';
import { addVote, checkVoteStatus } from '../services/api';

export default function VoteButton({ novelId, voteCount, onVoteSuccess }) {
    const [voted, setVoted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [currentCount, setCurrentCount] = useState(voteCount || 0);

    useEffect(() => {
        if (novelId) {
            checkVoteStatus(novelId).then(res => {
                if (res.success) setVoted(res.voted);
            }).catch(() => { });
        }
    }, [novelId]);

    useEffect(() => {
        // Sync local count if prop updates
        if (voteCount !== undefined) setCurrentCount(voteCount);
    }, [voteCount]);

    const handleVote = async (e) => {
        e.stopPropagation();
        if (voted || loading) return;

        setLoading(true);
        try {
            const res = await addVote(novelId);
            if (res.success) {
                setVoted(true);
                setCurrentCount(res.data.voteCount);
                if (onVoteSuccess) onVoteSuccess(res.data.voteCount);
            } else {
                alert(res.message);
                if (res.message.includes('đã vote')) setVoted(true);
            }
        } catch (error) {
            console.error('Vote error:', error);
            alert('Có lỗi xảy ra khi bình chọn.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleVote}
            disabled={voted || loading}
            className={`
        flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
        ${voted
                    ? 'bg-rose-500/20 text-rose-400 cursor-default border border-rose-500/20'
                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/20'}
      `}
            title={voted ? 'Bạn đã bình chọn hôm nay' : 'Bình chọn cho truyện này'}
        >
            <svg
                className={`w-5 h-5 ${voted ? 'fill-current' : 'fill-none stroke-current'}`}
                strokeWidth="2"
                viewBox="0 0 24 24"
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>{voted ? 'Đã bình chọn' : 'Bình chọn'}</span>
            <span className={`ml-1 px-1.5 py-0.5 rounded text-xs ${voted ? 'bg-rose-500/10' : 'bg-rose-800/30'}`}>
                {currentCount.toLocaleString()}
            </span>
        </button>
    );
}
