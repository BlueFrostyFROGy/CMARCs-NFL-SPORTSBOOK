import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";

interface PublicBetFeedProps {
  onTailBet: (legs: any[], stake: number, betType: "single" | "parlay") => void;
}

export function PublicBetFeed({ onTailBet }: PublicBetFeedProps) {
  const publicBets = useQuery(api.bets.getPublicBetFeed);
  const [selectedBetId, setSelectedBetId] = useState<Id<"bets"> | null>(null);
  const copyBetData = useQuery(api.bets.copyBetToSlip, 
    selectedBetId ? { betId: selectedBetId } : "skip"
  );

  if (!publicBets) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "won": return "text-green-600 bg-green-100";
      case "lost": return "text-red-600 bg-red-100";
      case "push": return "text-yellow-600 bg-yellow-100";
      case "pending": return "text-blue-600 bg-blue-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const handleTailBet = (betId: Id<"bets">) => {
    setSelectedBetId(betId);
  };

  // Handle the copied bet data
  if (copyBetData && selectedBetId) {
    onTailBet(copyBetData.legs, copyBetData.stake, copyBetData.betType);
    toast.success("Bet copied to your slip!");
    setSelectedBetId(null);
  }

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Public Bet Feed</h2>
        <p className="text-sm text-gray-600">Recent bets from all users</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {publicBets.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No public bets yet</p>
            <p className="text-sm mt-1">Be the first to place a bet!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {publicBets.map((bet) => (
              <div key={bet._id} className="border rounded-lg p-3 bg-white">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium text-sm">{bet.username}</div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(bet.status)}`}>
                        {bet.status.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-600">
                        {bet.type.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-gray-600">
                      Stake: ${bet.stake.toFixed(2)}
                    </div>
                    <div className="font-medium text-green-600">
                      To Win: ${(bet.potentialPayout - bet.stake).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="space-y-1 mb-3">
                  {bet.legs.map((leg, index) => (
                    <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                      <div className="font-medium">{leg.gameInfo}</div>
                      <div className="text-gray-600">
                        {leg.playerName} - {leg.propType.replace('_', ' ')}
                      </div>
                      <div className="flex items-center gap-1">
                        <span>
                          {leg.side === "over" ? "Over" : "Under"} {leg.lineValue} ({formatOdds(leg.odds)})
                        </span>
                        {leg.isCustomLine && (
                          <span className="px-1 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                            Custom
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {bet.status === "pending" && (
                  <button
                    onClick={() => handleTailBet(bet.betId)}
                    className="w-full py-2 px-3 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    Tail This Bet
                  </button>
                )}

                <div className="mt-2 text-xs text-gray-500">
                  {new Date((bet._creationTime || Date.now())).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
