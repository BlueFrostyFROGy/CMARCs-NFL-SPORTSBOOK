import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { GamesList } from "./GamesList";
import { GameProps } from "./GameProps";
import { BetSlip } from "./BetSlip";
import { PublicBetFeed } from "./PublicBetFeed";
import { useState } from "react";
import { Id } from "../../convex/_generated/dataModel";

export interface BetSlipLeg {
  propId: Id<"props">;
  playerName: string;
  propType: string;
  lineValue: number;
  side: "over" | "under";
  odds: number;
  gameInfo: string;
  isCustomLine?: boolean;
  customLineValue?: number;
}

export function Sportsbook() {
  const [selectedGameId, setSelectedGameId] = useState<Id<"games"> | null>(null);
  const [betSlipLegs, setBetSlipLegs] = useState<BetSlipLeg[]>([]);
  const [showPublicFeed, setShowPublicFeed] = useState(false);

  const addToBetSlip = (leg: BetSlipLeg) => {
    setBetSlipLegs(prev => {
      // Remove existing leg for same prop/side if exists
      const filtered = prev.filter(
        existing => !(existing.propId === leg.propId && existing.side === leg.side)
      );
      return [...filtered, leg];
    });
  };

  const removeFromBetSlip = (propId: Id<"props">, side: "over" | "under") => {
    setBetSlipLegs(prev => 
      prev.filter(leg => !(leg.propId === propId && leg.side === side))
    );
  };

  const clearBetSlip = () => {
    setBetSlipLegs([]);
  };

  const handleTailBet = (legs: any[], stake: number, betType: "single" | "parlay") => {
    // Convert the tailed bet legs to BetSlipLeg format
    const convertedLegs: BetSlipLeg[] = legs.map(leg => ({
      propId: leg.propId,
      playerName: leg.playerName,
      propType: leg.propType,
      lineValue: leg.lineValue,
      side: leg.side,
      odds: leg.odds,
      gameInfo: leg.gameInfo,
      isCustomLine: leg.isCustomLine,
      customLineValue: leg.customLineValue,
    }));
    
    setBetSlipLegs(convertedLegs);
    setShowPublicFeed(false); // Switch back to bet slip view
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Games List */}
      <div className="w-80 border-r bg-white overflow-y-auto">
        <GamesList 
          selectedGameId={selectedGameId}
          onSelectGame={setSelectedGameId}
        />
      </div>

      {/* Game Props */}
      <div className="flex-1 overflow-y-auto">
        {selectedGameId ? (
          <GameProps 
            gameId={selectedGameId}
            onAddToBetSlip={addToBetSlip}
            betSlipLegs={betSlipLegs}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Select a Game</h3>
              <p>Choose a game from the left to view player props</p>
            </div>
          </div>
        )}
      </div>

      {/* Bet Slip / Public Feed */}
      <div className="w-80 border-l bg-white flex flex-col">
        {/* Toggle buttons */}
        <div className="flex border-b">
          <button
            onClick={() => setShowPublicFeed(false)}
            className={`flex-1 py-3 px-4 text-sm font-medium ${
              !showPublicFeed
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Bet Slip ({betSlipLegs.length})
          </button>
          <button
            onClick={() => setShowPublicFeed(true)}
            className={`flex-1 py-3 px-4 text-sm font-medium ${
              showPublicFeed
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Public Feed
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {showPublicFeed ? (
            <PublicBetFeed onTailBet={handleTailBet} />
          ) : (
            <BetSlip 
              legs={betSlipLegs}
              onRemoveLeg={removeFromBetSlip}
              onClearSlip={clearBetSlip}
            />
          )}
        </div>
      </div>
    </div>
  );
}
