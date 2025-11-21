import { useQuery } from "@tanstack/react-query";
import { getTodayStats } from "../https";

// Hook para métricas del dashboard (diarias y mensuales calculadas en backend)
export const useTodayStats = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: ["today-stats"],
    queryFn: async () => {
      const res = await getTodayStats();
      return res?.data?.data || null;
    },
    staleTime: 60 * 1000,
    enabled,
  });

export default useTodayStats;
