import React from "react";
import { cn } from "../../lib/utils";

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const checkboxId =
      id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="w-full">
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id={checkboxId}
              type="checkbox"
              className={cn(
                "h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500",
                error && "border-red-500 focus:ring-red-500",
                className
              )}
              ref={ref}
              {...props}
            />
          </div>
          {label && (
            <div className="ml-3 text-sm">
              <label
                htmlFor={checkboxId}
                className="font-medium text-gray-700 cursor-pointer"
              >
                {label}
              </label>
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";





