import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function Leaderboard() {
  const leaderboard = useQuery(api.users.getLeaderboard);

  if (!leaderboard) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const formatProfit = (profit: number) => {
    const sign = profit >= 0 ? "+" : "";
    return `${sign}$${profit.toFixed(2)}`;
  };

  const getProfitColor = (profit: number) => {
    if (profit > 0) return "text-green-600";
    if (profit < 0) return "text-red-600";
    return "text-gray-600";
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return "🥇";
      case 2: return "🥈";
      case 3: return "🥉";
      default: return `#${rank}`;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
        <p className="text-gray-600">Top performers by lifetime profit</p>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b text-sm font-medium text-gray-600">
          <div className="col-span-1">Rank</div>
          <div className="col-span-3">Username</div>
          <div className="col-span-2">Lifetime Profit</div>
          <div className="col-span-2">Win Rate</div>
          <div className="col-span-2">Total Bets</div>
          <div className="col-span-2">Record</div>
        </div>

        {leaderboard.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <p className="text-lg">No users on leaderboard yet</p>
            <p className="text-sm mt-1">Start betting to appear here!</p>
          </div>
        ) : (
          <div className="divide-y">
            {leaderboard.map((user) => (
              <div key={user._id} className="grid grid-cols-12 gap-4 p-4 hover:bg-gray-50">
                <div className="col-span-1 font-semibold text-lg">
                  {getRankIcon(user.rank)}
                </div>
                <div className="col-span-3 font-medium">
                  {user.username}
                </div>
                <div className={`col-span-2 font-bold ${getProfitColor(user.lifetimeProfit)}`}>
                  {formatProfit(user.lifetimeProfit)}
                </div>
                <div className="col-span-2">
                  {user.totalBets > 0 ? `${user.winRate.toFixed(1)}%` : "N/A"}
                </div>
                <div className="col-span-2">
                  {user.totalBets}
                </div>
                <div className="col-span-2 text-sm text-gray-600">
                  {user.wins}W - {user.losses}L - {user.pushes}P
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {leaderboard.length > 0 && (
        <div className="mt-6 text-center text-sm text-gray-500">
          Showing top {leaderboard.length} users
        </div>
      )}
    </div>
  );
}
