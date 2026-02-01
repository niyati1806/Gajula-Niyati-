import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'lg' | 'md' | 'sm';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  icon,
  className = '',
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-semibold transition-colors duration-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-teal-600 hover:bg-teal-700 text-white focus:ring-teal-300 shadow-lg",
    secondary: "bg-indigo-100 hover:bg-indigo-200 text-indigo-900 focus:ring-indigo-300",
    danger: "bg-red-500 hover:bg-red-600 text-white focus:ring-red-300",
    outline: "border-2 border-slate-300 bg-white hover:bg-slate-50 text-slate-700 focus:ring-slate-200"
  };

  const sizes = {
    lg: "px-8 py-5 text-xl w-full",
    md: "px-6 py-3 text-lg",
    sm: "px-4 py-2 text-sm"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {icon && <span className="mr-3">{icon}</span>}
      {children}
    </button>
  );
};
