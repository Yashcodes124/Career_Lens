import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteResume, fetchResumes, uploadResume } from "./resumeApi";

export const RESUMES_QUERY_KEY = ["resumes"] as const;

export const useResumes = () =>
  useQuery({
    queryKey: RESUMES_QUERY_KEY,
    queryFn: fetchResumes,
  });

// The newest resume is the active one. Used by pages that need a resume ID.
export const useLatestResumeId = (): string | undefined => {
  const { data } = useResumes();
  return data?.[0]?.id;
};

export const useUploadResume = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadResume,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: RESUMES_QUERY_KEY }),
  });
};

export const useDeleteResume = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteResume,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: RESUMES_QUERY_KEY }),
  });
};
