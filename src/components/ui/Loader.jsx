import React from "react";

const Loader = ({ size = "md", text = "Chargement...", className = "" }) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div
            className={`animate-spin rounded-full border-2 border-gray-200 ${sizeClasses[size]}`}
          ></div>
          <div
            className={`absolute top-0 left-0 animate-spin rounded-full border-2 border-transparent border-t-blue-600 ${sizeClasses[size]}`}
          ></div>
        </div>
        {text && (
          <p className="text-gray-600 text-sm font-medium animate-pulse">
            {text}
          </p>
        )}
      </div>
    </div>
  );
};

export const PageLoader = ({ text = "Chargement..." }) => {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="relative inline-flex">
          <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
          <div className="w-16 h-16 border-4 border-transparent border-t-blue-600 rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
        <p className="mt-4 text-gray-600 font-medium animate-pulse">{text}</p>
        <div className="mt-2 flex justify-center space-x-1">
          <div
            className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          ></div>
          <div
            className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          ></div>
          <div
            className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export const TableLoader = ({ text = "Chargement des données..." }) => {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="relative inline-flex">
          <div className="w-10 h-10 border-3 border-gray-200 rounded-full"></div>
          <div className="w-10 h-10 border-3 border-transparent border-t-blue-600 rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
        <p className="mt-3 text-gray-600 text-sm font-medium animate-pulse">
          {text}
        </p>
      </div>
    </div>
  );
};

export const CardLoader = ({ text = "Chargement..." }) => {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="text-center">
        <div className="relative inline-flex">
          <div className="w-8 h-8 border-2 border-gray-200 rounded-full"></div>
          <div className="w-8 h-8 border-2 border-transparent border-t-blue-600 rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
        <p className="mt-2 text-gray-600 text-sm font-medium animate-pulse">
          {text}
        </p>
      </div>
    </div>
  );
};

export const InlineLoader = ({ text = "Chargement...", size = "sm" }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="relative inline-flex">
        <div
          className={`${sizeClasses[size]} border-2 border-gray-200 rounded-full`}
        ></div>
        <div
          className={`${sizeClasses[size]} border-2 border-transparent border-t-blue-600 rounded-full animate-spin absolute top-0 left-0`}
        ></div>
      </div>
      {text && (
        <span className="text-gray-600 text-sm animate-pulse">{text}</span>
      )}
    </div>
  );
};

export const SkeletonLoader = ({ lines = 3 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
        </div>
      ))}
    </div>
  );
};

export default Loader;
