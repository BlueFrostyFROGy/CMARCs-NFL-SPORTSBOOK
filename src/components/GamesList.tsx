import { useEffect, useState } from "react";
import { supabase, type Database } from "../lib/supabase";

type GameRow = Database["public"]["Tables"]["games"]["Row"];

interface GamesListProps {
  selectedGameId: string | null;
  onSelectGame: (gameId: string) => void;
}

export function GamesList({ selectedGameId, onSelectGame }: GamesListProps) {
  const [games, setGames] = useState<GameRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("games")
      .select("*")
      .order("start_time", { ascending: true })
      .then(({ data }) => {
        setGames(data ?? []);
        setLoading(false);
      });
  }, []);

  const formatDate = (isoString: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming": return "bg-blue-100 text-blue-800";
      case "live": return "bg-red-100 text-red-800";
      case "final": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">NFL Games</h2>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      ) : games.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <p>No games available</p>
          <p className="text-sm mt-1">Check back later or contact admin</p>
        </div>
      ) : (
        <div className="space-y-2">
          {games.map(game => (
            <button
              key={game.id}
              onClick={() => onSelectGame(game.id)}
              className={`w-full p-3 rounded-lg border text-left transition-colors ${
                selectedGameId === game.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="font-medium">
                  {game.away_team} @ {game.home_team}
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(game.status)}`}>
                  {game.status?.toUpperCase()}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                {formatDate(game.start_time)}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
