import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface PropLineSliderProps {
  prop: any;
  side: "over" | "under";
  onLineChange: (customLine: number, customOdds: number) => void;
  isActive: boolean;
}

export function PropLineSlider({ prop, side, onLineChange, isActive }: PropLineSliderProps) {
  const [customLine, setCustomLine] = useState(prop.lineValue);
  const baseOdds = side === "over" ? prop.overOdds : prop.underOdds;
  
  const customOddsQuery = useQuery(api.props.calculateCustomOdds, {
    baseOdds,
    baseLine: prop.lineValue,
    customLine,
    side,
  });

  useEffect(() => {
    if (customOddsQuery !== undefined && customOddsQuery !== null) {
      onLineChange(customLine, customOddsQuery);
    }
  }, [customLine, customOddsQuery]);

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  const getSliderRange = () => {
    const baseValue = prop.lineValue;
    const step = prop.propType === "receptions" ? 0.5 : 5;
    const range = prop.propType === "receptions" ? 3 : 25;
    
    return {
      min: Math.max(0, baseValue - range),
      max: baseValue + range,
      step,
    };
  };

  const { min, max, step } = getSliderRange();

  if (!isActive) {
    return (
      <div className="text-center">
        <div className="text-sm font-medium">
          {side === "over" ? "Over" : "Under"} {prop.lineValue}
        </div>
        <div className="text-sm text-gray-600">
          {formatOdds(baseOdds)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 bg-blue-50 rounded border-2 border-blue-200">
      <div className="text-center mb-3">
        <div className="text-sm font-medium">
          {side === "over" ? "Over" : "Under"} {customLine}
        </div>
        <div className="text-sm font-bold text-blue-600">
          {customOddsQuery !== undefined ? formatOdds(customOddsQuery) : "..."}
        </div>
      </div>
      
      <div className="space-y-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={customLine}
          onChange={(e) => setCustomLine(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
        
        <div className="flex justify-between text-xs text-gray-500">
          <span>{min}</span>
          <span className="font-medium">Base: {prop.lineValue}</span>
          <span>{max}</span>
        </div>
      </div>
      
      <div className="mt-2 text-xs text-center text-gray-600">
        Adjust line for better odds
      </div>
    </div>
  );
}
