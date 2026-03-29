interface PasswordStrengthBarProps {
  password?: string;
}

export default function PasswordStrengthBar({ password = '' }: PasswordStrengthBarProps) {
  const getStrength = () => {
    if (!password) return 0;
    let score = 0;
    if (password.length > 5) score += 1;
    if (password.length > 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return Math.min(3, Math.floor(score / 1.5));
  };

  const strength = getStrength();
  
  const colors = [
    'bg-gray-200', // 0
    'bg-red-500',  // 1
    'bg-amber-500',// 2
    'bg-green-500' // 3
  ];

  return (
    <div className="mt-2 flex gap-1 h-1.5 w-full">
      <div className={`flex-1 rounded-full transition-colors ${strength >= 1 ? colors[strength] : colors[0]}`}></div>
      <div className={`flex-1 rounded-full transition-colors ${strength >= 2 ? colors[strength] : colors[0]}`}></div>
      <div className={`flex-1 rounded-full transition-colors ${strength >= 3 ? colors[strength] : colors[0]}`}></div>
    </div>
  );
}
