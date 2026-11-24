import type { ComponentProps, ReactNode } from 'react';
import { useId } from 'react';
import { inputStyles, textFieldStyles } from './text-field.styles';

export interface TextFieldProps extends ComponentProps<'input'> {
  label: string;
  hint?: string;
  error?: string;
  trailing?: ReactNode;
}

export function TextField({
  label,
  hint,
  error,
  trailing,
  id,
  className,
  placeholder = label,
  ...inputProps
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = [error && errorId, hint && hintId].filter(Boolean).join(' ');

  return (
    <div className={textFieldStyles.root}>
      <label htmlFor={inputId} className={textFieldStyles.label}>
        {label}
      </label>
      <div className={textFieldStyles.control}>
        <input
          id={inputId}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={inputStyles({
            invalid: Boolean(error),
            hasTrailing: Boolean(trailing),
            className,
          })}
          {...inputProps}
        />
        {trailing && <div className={textFieldStyles.trailing}>{trailing}</div>}
      </div>
      {error && (
        <p id={errorId} role="alert" className={textFieldStyles.error}>
          {error}
        </p>
      )}
      {hint && (
        <p id={hintId} className={textFieldStyles.hint}>
          {hint}
        </p>
      )}
    </div>
  );
}
