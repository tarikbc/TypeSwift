import { ChangeEvent, InputHTMLAttributes, forwardRef, useState } from "react";
import styles from "./InputField.module.css";

export interface InputFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  error?: string;
  onChange?: (value: string, e: ChangeEvent<HTMLInputElement>) => void;
  fullWidth?: boolean;
  helperText?: string;
}

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ 
    label, 
    error, 
    onChange, 
    className, 
    fullWidth = true, 
    helperText,
    id,
    ...props 
  }, ref) => {
    const [focused, setFocused] = useState(false);
    
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        onChange(e.target.value, e);
      }
    };

    const inputId = id || label ? label?.toLowerCase().replace(/\s+/g, '-') : undefined;
    
    return (
      <div 
        className={`${styles.inputContainer} ${fullWidth ? styles.fullWidth : ''} ${className || ''}`}
      >
        {label && (
          <label 
            htmlFor={inputId}
            className={styles.label}
          >
            {label}
          </label>
        )}
        
        <div className={styles.inputWrapper}>
          <input
            id={inputId}
            ref={ref}
            className={`
              ${styles.input}
              ${error ? styles.error : ''}
              ${focused ? styles.focused : ''}
            `}
            onChange={handleChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            {...props}
          />
        </div>
        
        {(error || helperText) && (
          <div className={styles.helperTextContainer}>
            <span className={`${styles.helperText} ${error ? styles.errorText : ''}`}>
              {error || helperText}
            </span>
          </div>
        )}
      </div>
    );
  }
);

InputField.displayName = "InputField";

export default InputField;
