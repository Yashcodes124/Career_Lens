import { useQuery } from "@tanstack/react-query";
import { fetchReadiness } from "./readinessApi";

export const useReadiness = () =>
  useQuery({
    queryKey: ["readiness"],
    queryFn: fetchReadiness,
  });
