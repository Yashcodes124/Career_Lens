import { useQuery } from "@tanstack/react-query";
import { fetchReadinessApi } from "./readinessApi";

export const useReadiness = () =>
  useQuery({
    queryKey: ["readiness"],
    queryFn: fetchReadinessApi,
  });
