import React from "react";

export interface ContentContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl" | "full";
  padded?: boolean;
  children: React.ReactNode;
}

export const ContentContainer: React.FC<ContentContainerProps> = ({
  size = "xl",
  padded = true,
  className = "",
  children,
  ...props
}) => {
  const maxWidths: Record<
    NonNullable<ContentContainerProps["size"]>,
    string
  > = {
    sm: "max-w-2xl",
    md: "max-w-4xl",
    lg: "max-w-5xl",
    xl: "max-w-6xl",
    full: "max-w-full",
  };

  return (
    <div
      className={`mx-auto w-full ${maxWidths[size]} ${
        padded ? "px-4 py-6 sm:px-6 sm:py-8 lg:px-8" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
