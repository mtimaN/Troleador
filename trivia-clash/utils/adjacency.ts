// utils/adjacency.ts

export const ADJ: Record<string, string[]> = {
    "region-0": ["region-1", "region-4"],
    "region-1": ["region-0", "region-2", "region-5"],
    "region-2": ["region-1", "region-3", "region-6"],
    "region-3": ["region-2", "region-7"],
    "region-4": ["region-0", "region-5", "region-8"],
    "region-5": ["region-1", "region-4", "region-6", "region-9"],
    "region-6": ["region-2", "region-5", "region-7", "region-10"],
    "region-7": ["region-3", "region-6", "region-11"],
    "region-8": ["region-4", "region-9"],
    "region-9": ["region-5", "region-8", "region-10"],
    "region-10": ["region-6", "region-9", "region-11"],
    "region-11": ["region-7", "region-10"]
  };
  