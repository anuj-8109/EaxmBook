import { BookOpen, CheckCircle2 } from 'lucide-react';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  variant?: 'light' | 'dark' | 'auto';
}

const Logo = ({ size = 'md', showText = true, className = '', variant = 'auto' }: LogoProps) => {
  const { systemSettings } = useSystemSettings();

  const sizeClasses = {
    sm: {
      container: 'gap-2',
      icon: 'h-6 w-6',
      check: 'h-2.5 w-2.5 -bottom-0.5 -right-0.5',
      text: 'text-base',
      subtext: 'text-sm -mt-0.5'
    },
    md: {
      container: 'gap-2.5',
      icon: 'h-8 w-8',
      check: 'h-3.5 w-3.5 -bottom-0.5 -right-0.5',
      text: 'text-lg',
      subtext: 'text-base -mt-0.5'
    },
    lg: {
      container: 'gap-3',
      icon: 'h-10 w-10',
      check: 'h-4 w-4 -bottom-0.5 -right-0.5',
      text: 'text-xl',
      subtext: 'text-lg -mt-1'
    },
  };

  const classes = sizeClasses[size];
  const appName = systemSettings.app_name || 'Easy Exam Gen';
  const nameParts = appName.split(' ');

  // Determine text colors based on variant
  const getTextColors = () => {
    if (variant === 'dark') {
      return {
        primary: 'text-white',
        secondary: 'text-emerald-400',
        icon: 'text-white',
        check: 'text-emerald-400'
      };
    }
    // Light or auto (uses CSS variables)
    return {
      primary: 'text-primary',
      secondary: 'text-success',
      icon: 'text-primary',
      check: 'text-success'
    };
  };

  const colors = getTextColors();

  return (
    <div className={`flex items-center ${classes.container} ${className}`}>
      {/* Logo Image or Default Icon */}
      {systemSettings.logo ? (
        <img
          src={systemSettings.logo}
          alt="EXAMPULSE Logo"
          className={`${classes.icon} object-contain`}
        />
      ) : (
        <div className="relative">
          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-600 to-green-500 shadow-lg shadow-purple-500/25">
            <BookOpen className={`${classes.icon} text-white`} strokeWidth={2} />
          </div>
          <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-md">
            <CheckCircle2 className={`${classes.check} text-white`} />
          </div>
        </div>
      )}

      {/* Text */}
      {showText && (
        <div className="flex flex-col">
          <span className={`${classes.text} font-black tracking-tight text-white`}>
            EXAMPULSE
          </span>
          <span className={`${classes.subtext} font-bold tracking-widest uppercase   text-whitet`} style={{ fontSize: '0.65em' }}>
            Smart Study
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
