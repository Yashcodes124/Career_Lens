import { useQuery } from "@tanstack/react-query";
import { fetchApplications } from "./trackerApi";

export const useApplications = () =>
  useQuery({
    queryKey: ["applications"],
    queryFn: fetchApplications,
  });
