import { useQuery } from "@tanstack/react-query";
import { getTodayStats } from "../https";

export const useTodayStats = () =>
  useQuery({
    queryKey: ["today-stats"],
    queryFn: async () => {
      const res = await getTodayStats();
      return res?.data?.data || null;
    },
    staleTime: 60 * 1000,
  });

export default useTodayStats;
