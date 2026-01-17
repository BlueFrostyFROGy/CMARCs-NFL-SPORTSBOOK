import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { BetSlipLeg } from "./Sportsbook";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface BetSlipProps {
  legs: BetSlipLeg[];
  onRemoveLeg: (propId: Id<"props">, side: "over" | "under") => void;
  onClearSlip: () => void;
}

export function BetSlip({ legs, onRemoveLeg, onClearSlip }: BetSlipProps) {
  const [stake, setStake] = useState("");
  const [betType, setBetType] = useState<"single" | "parlay">("single");
  
  const user = useQuery(api.users.getCurrentUser);
  const placeBet = useMutation(api.bets.placeBet);

  const calculatePayout = (stakeAmount: number, americanOdds: number): number => {
    if (americanOdds < 0) {
      return stakeAmount + (stakeAmount * 100) / Math.abs(americanOdds);
    } else {
      return stakeAmount + (stakeAmount * americanOdds) / 100;
    }
  };

  const americanToDecimal = (americanOdds: number): number => {
    if (americanOdds < 0) {
      return 1 + 100 / Math.abs(americanOdds);
    } else {
      return 1 + americanOdds / 100;
    }
  };

  const calculateParlayOdds = (americanOddsArray: number[]): number => {
    const decimalOdds = americanOddsArray.map(americanToDecimal);
    const combinedDecimal = decimalOdds.reduce((acc, odds) => acc * odds, 1);
    
    if (combinedDecimal >= 2) {
      return Math.round((combinedDecimal - 1) * 100);
    } else {
      return Math.round(-100 / (combinedDecimal - 1));
    }
  };

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  const stakeAmount = parseFloat(stake) || 0;
  const totalStake = betType === "single" ? stakeAmount * legs.length : stakeAmount;
  
  let potentialPayout = 0;
  if (stakeAmount > 0 && legs.length > 0) {
    if (betType === "single") {
      potentialPayout = legs.reduce((sum, leg) => 
        sum + calculatePayout(stakeAmount, leg.odds), 0
      );
    } else {
      const parlayOdds = calculateParlayOdds(legs.map(leg => leg.odds));
      potentialPayout = calculatePayout(stakeAmount, parlayOdds);
    }
  }

  const handlePlaceBet = async () => {
    if (!user || !user._id) {
      toast.error("Please log in to place bets");
      return;
    }

    if (legs.length === 0) {
      toast.error("Add at least one selection to your bet slip");
      return;
    }

    if (stakeAmount <= 0) {
      toast.error("Please enter a valid stake amount");
      return;
    }

    if (totalStake > (user.virtualBalance || 0)) {
      toast.error("Insufficient balance");
      return;
    }

    try {
      await placeBet({
        userId: user._id,
        legs: legs.map(leg => ({
          propId: leg.propId,
          side: leg.side,
          odds: leg.odds,
          customLineValue: leg.customLineValue,
          isCustomLine: leg.isCustomLine,
        })),
        stake: stakeAmount,
        betType,
      });

      toast.success(`${betType === "single" ? "Bets" : "Parlay"} placed successfully!`);
      onClearSlip();
      setStake("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to place bet");
    }
  };

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Bet Slip</h2>
        {legs.length > 0 && (
          <button
            onClick={onClearSlip}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Clear All
          </button>
        )}
      </div>

      {legs.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-500 text-center">
          <div>
            <p className="mb-2">Your bet slip is empty</p>
            <p className="text-sm">Click on odds to add selections</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Bet Type Selection */}
          <div className="mb-4">
            <div className="flex rounded-lg border overflow-hidden">
              <button
                onClick={() => setBetType("single")}
                className={`flex-1 py-2 px-3 text-sm font-medium ${
                  betType === "single"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Single Bets
              </button>
              <button
                onClick={() => setBetType("parlay")}
                className={`flex-1 py-2 px-3 text-sm font-medium ${
                  betType === "parlay"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Parlay
              </button>
            </div>
          </div>

          {/* Selections */}
          <div className="flex-1 overflow-y-auto mb-4">
            <div className="space-y-3">
              {legs.map((leg, index) => (
                <div key={`${leg.propId}-${leg.side}`} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{leg.gameInfo}</div>
                      <div className="text-sm text-gray-600">
                        {leg.playerName} - {leg.propType}
                      </div>
                      <div className="text-sm flex items-center gap-2">
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
                    <button
                      onClick={() => onRemoveLeg(leg.propId, leg.side)}
                      className="text-red-600 hover:text-red-800 ml-2"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stake Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Stake {betType === "single" && legs.length > 1 && "(per bet)"}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Bet Summary */}
          {stakeAmount > 0 && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex justify-between text-sm mb-1">
                <span>Total Stake:</span>
                <span className="font-medium">${totalStake.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span>Potential Payout:</span>
                <span className="font-medium text-green-600">${potentialPayout.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Potential Profit:</span>
                <span className="font-medium text-green-600">
                  ${(potentialPayout - totalStake).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Place Bet Button */}
          <button
            onClick={handlePlaceBet}
            disabled={legs.length === 0 || stakeAmount <= 0 || !user || totalStake > (user.virtualBalance || 0)}
            className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Place {betType === "single" ? `${legs.length} Bet${legs.length > 1 ? "s" : ""}` : "Parlay"}
          </button>

          {user && totalStake > (user.virtualBalance || 0) && (
            <p className="text-red-600 text-sm mt-2 text-center">
              Insufficient balance (${(user.virtualBalance || 0).toLocaleString()} available)
            </p>
          )}
        </div>
      )}
    </div>
  );
}
