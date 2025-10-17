import { useState, useEffect } from "react";
import { TickerSuggestion, StockData } from "@/lib/types";
import { fetchMultipleStocks } from "@/lib/services/stockApi";

/**
 * Hook to fetch stock data for ticker suggestions
 * Automatically fetches when tickers change
 * Caches results to avoid re-fetching
 */
export function useStockData(tickers: TickerSuggestion[]) {
  const [stockData, setStockData] = useState<Record<string, StockData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tickers.length === 0) {
      setStockData({});
      setIsLoading(false);
      return;
    }

    const symbols = tickers.map((t) => t.symbol);

    // Check if we already have data for all symbols
    const missingSymbols = symbols.filter((symbol) => !stockData[symbol]);

    if (missingSymbols.length === 0) {
      // We already have all the data
      return;
    }

    setIsLoading(true);
    setError(null);

    fetchMultipleStocks(missingSymbols)
      .then((newData) => {
        setStockData((prev) => ({
          ...prev,
          ...newData,
        }));
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to fetch stock data");
        setIsLoading(false);
      });
  }, [tickers]); // Only re-run when tickers change

  return {
    stockData,
    isLoading,
    error,
  };
}
