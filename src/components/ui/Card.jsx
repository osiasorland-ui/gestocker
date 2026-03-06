import React from 'react';

const Card = ({ 
  children, 
  className = "", 
  padding = "p-6", 
  shadow = "shadow-sm",
  border = "border border-gray-200",
  hover = false 
}) => {
  const baseClasses = "bg-white rounded-lg";
  const hoverClasses = hover ? "hover:shadow-md transition-shadow duration-200" : "";
  
  return (
    <div className={`${baseClasses} ${border} ${shadow} ${padding} ${className} ${hoverClasses}`}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = "" }) => {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  );
};

export const CardTitle = ({ children, className = "" }) => {
  return (
    <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>
      {children}
    </h3>
  );
};

export const CardDescription = ({ children, className = "" }) => {
  return (
    <p className={`text-sm text-gray-600 mt-1 ${className}`}>
      {children}
    </p>
  );
};

export const CardContent = ({ children, className = "" }) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

export const CardFooter = ({ children, className = "" }) => {
  return (
    <div className={`mt-4 pt-4 border-t border-gray-200 ${className}`}>
      {children}
    </div>
  );
};

export default Card;
