// utils/adjacency.ts

export const ADJ: Record<string, string[]> = {
    "region-1": ["region-2", "region-4"],
    "region-2": ["region-1", "region-3", "region-5"],
    "region-3": ["region-2", "region-6"],
    "region-4": ["region-1", "region-5", "region-7"],
    "region-5": ["region-2", "region-4", "region-6", "region-8"],
    "region-6": ["region-3", "region-5", "region-9"],
    "region-7": ["region-4", "region-8", "region-10"],
    "region-8": ["region-5", "region-7", "region-9"],
    "region-9": ["region-6", "region-8", "region-11", "region-12"],
    "region-10": ["region-7"],
    "region-11": ["region-9", "region-12"],
    "region-12": ["region-9", "region-11"],
  };
  