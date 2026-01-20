import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import type { BetSlipLeg } from "./Sportsbook";

interface BetSlipProps {
  legs: BetSlipLeg[];
  onRemoveLeg: (propId: string, side: "over" | "under") => void;
  onClearSlip: () => void;
  userId: string;
}

export function BetSlip({ legs, onRemoveLeg, onClearSlip, userId }: BetSlipProps) {
  const [stake, setStake] = useState("");

  const formatOdds = (odds: number) => (odds > 0 ? `+${odds}` : `${odds}`);
  const stakeAmount = parseFloat(stake) || 0;

  const handlePlaceBet = async () => {
    if (legs.length === 0) {
      toast.error("Add at least one selection to your bet slip");
      return;
    }

    if (stakeAmount <= 0) {
      toast.error("Please enter a valid stake amount");
      return;
    }

    try {
      const { error } = await supabase.from("bets").insert(
        legs.map(leg => ({
          user_id: userId,
          game_id: leg.gameId,
          prop_id: leg.propId,
          amount: stakeAmount,
          prediction: leg.side,
          odds: leg.odds,
          settled: false,
          result: null,
        }))
      );

      if (error) throw error;

      toast.success("Bet submitted to Supabase");
      onClearSlip();
      setStake("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to place bet");
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
          <div className="flex-1 overflow-y-auto mb-4">
            <div className="space-y-3">
              {legs.map(leg => (
                <div key={`${leg.propId}-${leg.side}`} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{leg.gameInfo}</div>
                      <div className="text-sm text-gray-600">
                        {leg.description} ({leg.type})
                      </div>
                      <div className="text-sm flex items-center gap-2">
                        <span>
                          {leg.side === "over" ? "Over" : "Under"} {leg.line} ({formatOdds(leg.odds)})
                        </span>
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

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Stake (per selection)</label>
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

          <button
            onClick={handlePlaceBet}
            disabled={legs.length === 0 || stakeAmount <= 0}
            className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Place Bets ({legs.length})
          </button>
        </div>
      )}
    </div>
  );
}
