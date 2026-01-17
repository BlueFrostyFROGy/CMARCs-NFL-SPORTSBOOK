import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface GamesListProps {
  selectedGameId: Id<"games"> | null;
  onSelectGame: (gameId: Id<"games">) => void;
}

export function GamesList({ selectedGameId, onSelectGame }: GamesListProps) {
  const games = useQuery(api.games.listGames);

  if (!games) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
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
      
      {games.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <p>No games available</p>
          <p className="text-sm mt-1">Check back later or contact admin</p>
        </div>
      ) : (
        <div className="space-y-2">
          {games.map(game => (
            <button
              key={game._id}
              onClick={() => onSelectGame(game._id)}
              className={`w-full p-3 rounded-lg border text-left transition-colors ${
                selectedGameId === game._id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="font-medium">
                  {game.awayTeam} @ {game.homeTeam}
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(game.status)}`}>
                  {game.status.toUpperCase()}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                {formatDate(game.startTime)}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
