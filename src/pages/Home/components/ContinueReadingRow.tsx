import { ReadHistoryItem } from '../../../services/readHistoryService';

interface Props {
    readHistory: ReadHistoryItem[];
    navigate: (path: string) => void;
}

export default function ContinueReadingRow({ readHistory, navigate }: Props) {
    if (readHistory.length === 0) return null;

    return (
        <section className="mb-12 animate-fade-in">
            <div className="content-row-header">
                <h2 className="content-row-title flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-emerald-400">
                        <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
                    </svg>
                    Continue Reading
                </h2>
            </div>
            <div className="horizontal-scroll">
                {readHistory.slice(0, 10).map(item => (
                    <div
                        key={item.id}
                        onClick={() => navigate(`/read/${encodeURIComponent(item.title)}`)}
                        className="flex-shrink-0 w-72 landscape-card group cursor-pointer"
                    >
                        <img
                            src={item.image_url}
                            alt={item.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-4">
                            <h3 className="font-bold text-white text-sm line-clamp-1 mb-1 drop-shadow-lg">{item.title}</h3>
                            <div className="flex items-center gap-2 text-xs text-gray-300">
                                <span>Ch. {item.currentChapter}</span>
                                {item.chapters && <span className="text-gray-500">/ {item.chapters}</span>}
                            </div>
                            <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                                    style={{ width: `${item.progress}%` }}
                                />
                            </div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-sm">
                            <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/50 group-hover:scale-110 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                                    <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
