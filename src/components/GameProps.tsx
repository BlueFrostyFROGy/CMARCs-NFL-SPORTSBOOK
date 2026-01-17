import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { BetSlipLeg } from "./Sportsbook";
import { PropLineSlider } from "./PropLineSlider";
import { useState } from "react";

interface GamePropsProps {
  gameId: Id<"games">;
  onAddToBetSlip: (leg: BetSlipLeg) => void;
  betSlipLegs: BetSlipLeg[];
}

export function GameProps({ gameId, onAddToBetSlip, betSlipLegs }: GamePropsProps) {
  const game = useQuery(api.games.getGame, { gameId });
  const props = useQuery(api.props.getGameProps, { gameId });
  const [activeSliders, setActiveSliders] = useState<Record<string, { side: "over" | "under", customLine: number, customOdds: number }>>({});

  if (!game || !props) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const formatPropType = (propType: string) => {
    return propType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  const isLegInSlip = (propId: Id<"props">, side: "over" | "under") => {
    return betSlipLegs.some(leg => leg.propId === propId && leg.side === side);
  };

  const handleSliderToggle = (propId: Id<"props">, side: "over" | "under") => {
    const key = `${propId}-${side}`;
    if (activeSliders[key]) {
      // Remove from active sliders
      const newSliders = { ...activeSliders };
      delete newSliders[key];
      setActiveSliders(newSliders);
    } else {
      // Add to active sliders
      const prop = props.find(p => p._id === propId);
      if (prop) {
        setActiveSliders({
          ...activeSliders,
          [key]: {
            side,
            customLine: prop.lineValue,
            customOdds: side === "over" ? prop.overOdds : prop.underOdds,
          }
        });
      }
    }
  };

  const handleLineChange = (propId: Id<"props">, side: "over" | "under", customLine: number, customOdds: number) => {
    const key = `${propId}-${side}`;
    setActiveSliders({
      ...activeSliders,
      [key]: {
        ...activeSliders[key],
        customLine,
        customOdds,
      }
    });
  };

  const handleAddToBetSlip = (prop: any, side: "over" | "under") => {
    const key = `${prop._id}-${side}`;
    const sliderData = activeSliders[key];
    const customLine = sliderData?.customLine || prop.lineValue;
    const isCustom = !!sliderData && sliderData.customLine !== prop.lineValue;
    
    const leg: BetSlipLeg = {
      propId: prop._id,
      playerName: prop.playerName,
      propType: formatPropType(prop.propType),
      lineValue: customLine,
      side,
      odds: sliderData?.customOdds || (side === "over" ? prop.overOdds : prop.underOdds),
      gameInfo: `${game.awayTeam} @ ${game.homeTeam}`,
      isCustomLine: isCustom,
      customLineValue: isCustom ? customLine : undefined,
    };

    onAddToBetSlip(leg);
    
    // Clear the slider after adding to slip
    if (sliderData) {
      const newSliders = { ...activeSliders };
      delete newSliders[key];
      setActiveSliders(newSliders);
    }
  };

  const groupedProps = props.reduce((acc, prop) => {
    if (!acc[prop.propType]) {
      acc[prop.propType] = [];
    }
    acc[prop.propType].push(prop);
    return acc;
  }, {} as Record<string, typeof props>);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {game.awayTeam} @ {game.homeTeam}
        </h1>
        <p className="text-gray-600">
          {new Date(game.startTime).toLocaleDateString()} at{" "}
          {new Date(game.startTime).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </p>
      </div>

      {Object.keys(groupedProps).length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          <p className="text-lg">No props available for this game</p>
          <p className="text-sm mt-1">Props will be added closer to game time</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedProps).map(([propType, propList]) => (
            <div key={propType}>
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                {formatPropType(propType)}
              </h2>
              
              <div className="bg-white rounded-lg border overflow-hidden">
                <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b text-sm font-medium text-gray-600">
                  <div className="col-span-4">Player</div>
                  <div className="col-span-2 text-center">Line</div>
                  <div className="col-span-3 text-center">Over</div>
                  <div className="col-span-3 text-center">Under</div>
                </div>
                
                {propList.map(prop => (
                  <div key={prop._id} className="grid grid-cols-12 gap-4 p-4 border-b last:border-b-0 hover:bg-gray-50">
                    <div className="col-span-4 font-medium">
                      {prop.playerName}
                    </div>
                    <div className="col-span-2 text-center font-semibold">
                      {prop.lineValue}
                    </div>
                    <div className="col-span-3">
                      {activeSliders[`${prop._id}-over`] ? (
                        <PropLineSlider
                          prop={prop}
                          side="over"
                          onLineChange={(customLine, customOdds) => 
                            handleLineChange(prop._id, "over", customLine, customOdds)
                          }
                          isActive={true}
                        />
                      ) : (
                        <div className="space-y-2">
                          <button
                            onClick={() => handleAddToBetSlip(prop, "over")}
                            className={`w-full py-2 px-3 rounded border text-sm font-medium transition-colors ${
                              isLegInSlip(prop._id, "over")
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            Over {formatOdds(prop.overOdds)}
                          </button>
                          <button
                            onClick={() => handleSliderToggle(prop._id, "over")}
                            className="w-full py-1 px-2 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                          >
                            Adjust Line
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="col-span-3">
                      {activeSliders[`${prop._id}-under`] ? (
                        <PropLineSlider
                          prop={prop}
                          side="under"
                          onLineChange={(customLine, customOdds) => 
                            handleLineChange(prop._id, "under", customLine, customOdds)
                          }
                          isActive={true}
                        />
                      ) : (
                        <div className="space-y-2">
                          <button
                            onClick={() => handleAddToBetSlip(prop, "under")}
                            className={`w-full py-2 px-3 rounded border text-sm font-medium transition-colors ${
                              isLegInSlip(prop._id, "under")
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            Under {formatOdds(prop.underOdds)}
                          </button>
                          <button
                            onClick={() => handleSliderToggle(prop._id, "under")}
                            className="w-full py-1 px-2 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                          >
                            Adjust Line
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
