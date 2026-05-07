import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  block?: boolean;
  children: ReactNode;
}

const variants = {
  primary:
    'bg-accent text-[#2A2522] hover:bg-accent-strong active:scale-[0.98] disabled:opacity-50',
  secondary:
    'bg-surface-2 text-text border border-border hover:bg-surface active:scale-[0.98] disabled:opacity-50',
  ghost: 'bg-transparent text-text hover:bg-surface-2 active:scale-[0.98] disabled:opacity-50',
  danger:
    'bg-error text-white hover:opacity-90 active:scale-[0.98] disabled:opacity-50',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2.5 rounded-xl',
  lg: 'px-5 py-3.5 text-lg rounded-2xl font-medium',
};

export function Button({
  variant = 'primary',
  size = 'md',
  block,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      className={`transition-all duration-150 ${variants[variant]} ${sizes[size]} ${
        block ? 'w-full' : ''
      } ${className}`}
    >
      {children}
    </button>
  );
}
