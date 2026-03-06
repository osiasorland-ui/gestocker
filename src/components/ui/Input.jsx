import React from "react";

const Input = ({
  className = "",
  type = "text",
  label,
  error,
  helperText,
  icon: Icon,
  ...props
}) => {
  const inputClasses = [
    "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50",
    Icon && "pl-10",
    error &&
      "border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-gray-700 leading-none">
          {label}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <Icon className="h-4 w-4 text-gray-400" />
          </div>
        )}

        <input type={type} className={inputClasses} {...props} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

export default Input;
