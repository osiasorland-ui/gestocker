import React from "react";

const buttonVariants = {
  primary:
    "bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500",
  secondary:
    "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-2 focus:ring-gray-500",
  success:
    "bg-green-600 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500",
  danger:
    "bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500",
  outline:
    "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500",
  ghost: "text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-gray-500",
};

const buttonSizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

const Button = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = "left",
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const classes = [
    baseClasses,
    buttonVariants[variant],
    buttonSizes[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const renderIcon = () => {
    if (!Icon) return null;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading && (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
      )}

      {iconPosition === "left" && !loading && renderIcon()}
      {children}
      {iconPosition === "right" && !loading && renderIcon()}
    </button>
  );
};

export default Button;
