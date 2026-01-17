import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";

export function Dashboard() {
  const user = useQuery(api.users.getCurrentUser);
  const bets = useQuery(api.bets.getUserBets, user ? { userId: user._id } : "skip");
  const [activeTab, setActiveTab] = useState<"open" | "settled">("open");

  if (!user || !bets) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const openBets = bets.filter(bet => bet.status === "pending");
  const settledBets = bets.filter(bet => bet.status !== "pending");
  
  const totalBets = bets.length;
  const wonBets = bets.filter(bet => bet.status === "won").length;
  const lostBets = bets.filter(bet => bet.status === "lost").length;
  const pushBets = bets.filter(bet => bet.status === "push").length;
  
  const totalStaked = bets.reduce((sum, bet) => sum + bet.stake, 0);
  const totalWon = bets
    .filter(bet => bet.status === "won")
    .reduce((sum, bet) => sum + bet.potentialPayout, 0);
  const totalRefunded = bets
    .filter(bet => bet.status === "push")
    .reduce((sum, bet) => sum + bet.stake, 0);
  
  const netProfit = totalWon + totalRefunded - totalStaked;
  const winRate = totalBets > 0 ? ((wonBets / (totalBets - pushBets)) * 100) : 0;

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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Current Balance</h3>
          <p className="text-2xl font-bold text-green-600">
            ${(user.virtualBalance || 0).toLocaleString()}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Net Profit/Loss</h3>
          <p className={`text-2xl font-bold ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
            {netProfit >= 0 ? "+" : ""}${netProfit.toFixed(2)}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Win Rate</h3>
          <p className="text-2xl font-bold text-blue-600">
            {winRate.toFixed(1)}%
          </p>
          <p className="text-sm text-gray-500">
            {wonBets}W - {lostBets}L - {pushBets}P
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Wagered</h3>
          <p className="text-2xl font-bold text-gray-800">
            ${totalStaked.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500">
            {totalBets} bet{totalBets !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Bet History */}
      <div className="bg-white rounded-lg border">
        <div className="border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab("open")}
              className={`px-6 py-4 font-medium ${
                activeTab === "open"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Open Bets ({openBets.length})
            </button>
            <button
              onClick={() => setActiveTab("settled")}
              className={`px-6 py-4 font-medium ${
                activeTab === "settled"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Settled Bets ({settledBets.length})
            </button>
          </div>
        </div>

        <div className="p-6">
          {(activeTab === "open" ? openBets : settledBets).length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>No {activeTab} bets found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(activeTab === "open" ? openBets : settledBets).map(bet => (
                <div key={bet._id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(bet.status)}`}>
                        {bet.status.toUpperCase()}
                      </span>
                      <span className="ml-2 text-sm text-gray-600">
                        {bet.type.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">
                        Stake: ${bet.stake.toFixed(2)}
                      </div>
                      <div className="text-sm font-medium">
                        Potential: ${bet.potentialPayout.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {bet.legs.map((leg, index) => (
                      <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                        <div className="font-medium">
                          {leg.game?.awayTeam} @ {leg.game?.homeTeam}
                        </div>
                        <div className="text-gray-600">
                          {leg.prop?.playerName} - {leg.prop?.propType.replace('_', ' ')}
                        </div>
                        <div>
                          {leg.side === "over" ? "Over" : "Under"} {leg.prop?.lineValue} ({formatOdds(leg.odds)})
                          {leg.legResult !== "pending" && (
                            <span className={`ml-2 px-1 py-0.5 rounded text-xs ${getStatusColor(leg.legResult)}`}>
                              {leg.legResult.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 text-xs text-gray-500">
                    Placed: {new Date(bet._creationTime).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
