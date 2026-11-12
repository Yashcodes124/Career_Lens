import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Eye, FileText, Trash2 } from "lucide-react";
import { useResumes } from "./useResumes";
import { deleteResume } from "./resumeApi";
import { ResumeUploader } from "./ResumeUploader";
import { ResumeParsedPreview, type ResumeRecord } from "./ResumeParsedPreview";
import { ContentContainer, PageHeader } from "../../components/layout";
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Modal,
  SectionCard,
  Skeleton,
  Table,
  Toast,
} from "../../components/ui";

const ACTIVE_RESUME_STORAGE_KEY = "truehire_active_resume_id";

export const ResumePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const detailSectionRef = useRef<HTMLDivElement | null>(null);
  const { data: resumesData, isLoading, isError, refetch } = useResumes();

  const resumes = useMemo<ResumeRecord[]>(
    () => (Array.isArray(resumesData) ? (resumesData as ResumeRecord[]) : []),
    [resumesData],
  );

  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [modalResume, setModalResume] = useState<ResumeRecord | null>(null);
  const [activeResumeId, setActiveResumeId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(ACTIVE_RESUME_STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const [resumeToDelete, setResumeToDelete] = useState<ResumeRecord | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (resumes.length > 0) {
      if (
        !selectedResumeId ||
        !resumes.some((r) => r.id === selectedResumeId)
      ) {
        setSelectedResumeId(resumes[0].id);
      }
      if (!activeResumeId || !resumes.some((r) => r.id === activeResumeId)) {
        setActiveResumeId(resumes[0].id);
      }
    } else {
      setSelectedResumeId(null);
    }
  }, [resumes, selectedResumeId, activeResumeId]);

  const selectedResume = useMemo(
    () => resumes.find((r) => r.id === selectedResumeId) ?? resumes[0] ?? null,
    [resumes, selectedResumeId],
  );

  const handleSetActiveResume = (id: string) => {
    setActiveResumeId(id);
    setSelectedResumeId(id);
    try {
      localStorage.setItem(ACTIVE_RESUME_STORAGE_KEY, id);
    } catch {
      // Ignore storage errors
    }
    setToastMessage("Set as active resume for job matching.");
  };

  const handleViewResume = (row: ResumeRecord) => {
    setSelectedResumeId(row.id);
    setModalResume(row);
    detailSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleDeleteResume = async () => {
    if (!resumeToDelete) return;
    setIsDeleting(true);
    try {
      await deleteResume(resumeToDelete.id);
      await queryClient.invalidateQueries({ queryKey: ["resumes"] });
      setToastMessage(
        `Deleted ${resumeToDelete.fileName || resumeToDelete.title || "resume"}.`,
      );
      if (modalResume?.id === resumeToDelete.id) {
        setModalResume(null);
      }
      setResumeToDelete(null);
    } catch {
      setToastMessage("Could not delete resume. Please try again.");
      setResumeToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const getFileTypeBadge = (resume: ResumeRecord) => {
    const name = resume.fileName || resume.title || "";
    if (/\.docx$/i.test(name)) return "DOCX";
    if (/\.pdf$/i.test(name)) return "PDF";
    if (resume.mimeType?.includes("word")) return "DOCX";
    return "PDF";
  };

  const getStatusBadge = (resume: ResumeRecord) => {
    const rawStatus = (resume.status || "PARSED").toUpperCase();
    if (rawStatus === "PROCESSING") {
      return (
        <Badge tone="warning" size="sm">
          Processing
        </Badge>
      );
    }
    if (rawStatus === "FAILED") {
      return (
        <Badge tone="danger" size="sm">
          Failed
        </Badge>
      );
    }
    return (
      <Badge tone="success" size="sm">
        Parsed
      </Badge>
    );
  };

  return (
    <ContentContainer size="xl" className="space-y-6">
      <PageHeader
        eyebrow="Resume Intelligence"
        title="Resumes"
        description="Upload and manage the resumes used for job matching and skill extraction."
        primaryAction={
          <Button
            variant="primary"
            onClick={() => navigate("/jobs")}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Compare with jobs
          </Button>
        }
        secondaryActions={
          <Button variant="outline" onClick={() => navigate("/readiness")}>
            View skill ledger
          </Button>
        }
      />

      {toastMessage && (
        <Toast
          tone="success"
          title="Resume updated"
          description={toastMessage}
          onDismiss={() => setToastMessage(null)}
        />
      )}

      {/* 1. Upload Area */}
      <ResumeUploader
        onUploadSuccess={(created) => {
          const newId = (created as { id?: string })?.id;
          if (newId) {
            setSelectedResumeId(newId);
            handleSetActiveResume(newId);
          }
        }}
      />

      {isError && (
        <ErrorState
          title="Unable to load your resumes"
          message="We could not fetch your uploaded resumes. Please try again."
          onRetry={() => void refetch()}
        />
      )}

      {/* 2. Resume List & 3. Resume Detail View */}
      {isLoading ? (
        <div className="space-y-4" aria-busy="true">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      ) : resumes.length === 0 ? (
        <EmptyState
          title="No resumes yet"
          description="Upload your resume to get personalized job matches and interview preparation."
          icon={<FileText className="h-5 w-5" />}
        />
      ) : (
        <div className="space-y-6">
          <SectionCard
            eyebrow="Uploaded Versions"
            title={`Resume List (${resumes.length})`}
            description="Click View on any resume to open the full document inspector, confirm skills, or set it active for job matching."
          >
            <Table<ResumeRecord>
              data={resumes}
              rowKey={(row) => row.id}
              onRowClick={(row) => {
                setSelectedResumeId(row.id);
                detailSectionRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }}
              columns={[
                {
                  key: "title",
                  header: "Resume",
                  render: (row) => {
                    const isSelected = selectedResume?.id === row.id;
                    const isActive = activeResumeId === row.id;
                    return (
                      <div className="flex flex-wrap items-center gap-2">
                        <FileText className="h-4 w-4 shrink-0 text-primary" />
                        <span className="font-semibold text-content-heading">
                          {row.fileName || row.title || "Untitled Resume"}
                        </span>
                        {isActive && (
                          <Badge
                            tone="success"
                            size="sm"
                            icon={<CheckCircle2 className="h-3 w-3" />}
                          >
                            Active
                          </Badge>
                        )}
                        {isSelected && !isActive && (
                          <Badge tone="primary" size="sm">
                            Viewing
                          </Badge>
                        )}
                      </div>
                    );
                  },
                },
                {
                  key: "status",
                  header: "Status",
                  render: (row) => getStatusBadge(row),
                },
                {
                  key: "type",
                  header: "File Type",
                  render: (row) => (
                    <Badge tone="neutral" size="sm">
                      {getFileTypeBadge(row)}
                    </Badge>
                  ),
                },
                {
                  key: "sections",
                  header: "Extracted Details",
                  render: (row) => {
                    const projCount = row.parsedData?.projects?.length ?? 0;
                    const expCount = row.parsedData?.experience?.length ?? 0;
                    return (
                      <span className="text-xs font-medium text-content-body tabular-nums">
                        {row.skills?.length ?? 0} skills · {projCount} projects
                        · {expCount} exp
                      </span>
                    );
                  },
                },
                {
                  key: "date",
                  header: "Upload Date",
                  render: (row) => (
                    <span className="text-xs text-content-secondary tabular-nums">
                      {new Date(row.createdAt).toLocaleDateString()}
                    </span>
                  ),
                },
                {
                  key: "actions",
                  header: "Actions",
                  align: "right",
                  render: (row) => {
                    const isActive = activeResumeId === row.id;
                    return (
                      <div
                        className="flex flex-wrap items-center justify-end gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewResume(row)}
                          leftIcon={<Eye className="h-3.5 w-3.5" />}
                        >
                          View resume
                        </Button>
                        {!isActive && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleSetActiveResume(row.id)}
                          >
                            Set active
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`Delete ${row.fileName || row.title || "resume"}`}
                          onClick={() => setResumeToDelete(row)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-status-danger" />
                        </Button>
                      </div>
                    );
                  },
                },
              ]}
            />
          </SectionCard>

          {/* Inline Selected Resume Detail View */}
          {selectedResume && (
            <div ref={detailSectionRef} id="resume-detail-section">
              <ResumeParsedPreview
                key={selectedResume.id}
                resume={selectedResume}
                isActiveForMatching={activeResumeId === selectedResume.id}
                onSetActiveForMatching={handleSetActiveResume}
              />
            </div>
          )}
        </div>
      )}

      {/* Full Resume Inspector Modal (Opened when clicking the Eye "View resume" button) */}
      <Modal
        open={Boolean(modalResume)}
        onClose={() => setModalResume(null)}
        title={
          modalResume?.fileName || modalResume?.title || "Uploaded Resume View"
        }
        description="Complete view of your extracted summary, projects, work experience, education, skills, and plain text."
        size="xl"
        footer={
          <Button variant="primary" onClick={() => setModalResume(null)}>
            Close preview
          </Button>
        }
      >
        {modalResume && (
          <ResumeParsedPreview
            key={`modal-${modalResume.id}`}
            resume={modalResume}
            isActiveForMatching={activeResumeId === modalResume.id}
            onSetActiveForMatching={handleSetActiveResume}
            defaultTab="full"
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(resumeToDelete)}
        onClose={() => setResumeToDelete(null)}
        title="Delete resume?"
        description="This will remove the uploaded resume version from your workspace."
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setResumeToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={isDeleting}
              onClick={() => void handleDeleteResume()}
            >
              Delete resume
            </Button>
          </>
        }
      >
        <p className="text-sm text-content-body">
          Are you sure you want to delete{" "}
          <strong className="font-semibold text-content-heading">
            {resumeToDelete?.fileName || resumeToDelete?.title}
          </strong>
          ?
        </p>
      </Modal>
    </ContentContainer>
  );
};

export default ResumePage;
