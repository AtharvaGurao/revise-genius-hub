import { useState, useEffect } from "react";

const STORAGE_KEY = "smartrevise-selected-pdf";

export const useSelectedPdf = () => {
  const [selectedPdfId, setSelectedPdfId] = useState<string | null>(() => {
    // Initialize from localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored || null;
  });

  useEffect(() => {
    // Persist to localStorage whenever it changes
    if (selectedPdfId) {
      localStorage.setItem(STORAGE_KEY, selectedPdfId);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [selectedPdfId]);

  return [selectedPdfId, setSelectedPdfId] as const;
};
