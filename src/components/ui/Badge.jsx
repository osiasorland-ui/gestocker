import React from "react";

const badgeVariants = {
  default: "bg-gray-100 text-gray-800",
  primary: "bg-blue-100 text-blue-800",
  success: "bg-green-100 text-green-800",
  danger: "bg-red-100 text-red-800",
  warning: "bg-yellow-100 text-yellow-800",
  info: "bg-cyan-100 text-cyan-800",
};

const Badge = ({
  children,
  variant = "default",
  className = "",
  size = "sm",
}) => {
  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-2.5 py-1.5 text-sm",
    lg: "px-3 py-2 text-base",
  };

  const classes = [
    "inline-flex items-center rounded-full font-medium",
    badgeVariants[variant],
    sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <span className={classes}>{children}</span>;
};

export default Badge;
