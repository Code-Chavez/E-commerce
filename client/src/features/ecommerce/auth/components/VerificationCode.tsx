import React, { useRef, useState, useEffect } from 'react';

interface VerificationCodeProps {
  length?: number;
  onComplete: (code: string) => void;
  isLoading?: boolean;
}

export const VerificationCode = ({
  length = 6,
  onComplete,
  isLoading = false,
}: VerificationCodeProps) => {
  const [code, setCode] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Clean focus array on initialization
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  const processCodeChange = (value: string, index: number) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    if (!numericValue) return;

    const newCode = [...code];
    // Take the last character inserted if user replaced something
    newCode[index] = numericValue[numericValue.length - 1];
    setCode(newCode);

    // Call onComplete if filled
    const fullCode = newCode.join('');
    if (fullCode.length === length) {
      onComplete(fullCode);
    }

    // Move focus forward if not on last input
    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!code[index] && index > 0) {
        // Move focus back if empty and backspace pressed
        const newCode = [...code];
        newCode[index - 1] = '';
        setCode(newCode);
        inputRefs.current[index - 1]?.focus();
      } else {
        // Just clear current
        const newCode = [...code];
        newCode[index] = '';
        setCode(newCode);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').trim();
    
    // Keep only the amount needed and only numeric
    const numericPasted = pastedData.replace(/[^0-9]/g, '').slice(0, length);
    
    if (numericPasted) {
      const newCode = [...code];
      numericPasted.split('').forEach((char, index) => {
        if (index < length) newCode[index] = char;
      });
      setCode(newCode);
      
      // Update focus to the last filled input, or next empty if not full
      const focusIndex = numericPasted.length < length ? numericPasted.length : length - 1;
      inputRefs.current[focusIndex]?.focus();

      // Trigger onComplete if fully filled
      if (numericPasted.length === length) {
        onComplete(numericPasted);
      }
    }
  };

  return (
    <div className="flex justify-between gap-2 w-full max-w-xs mx-auto">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={length} // Allowed max length to catch paste data
          disabled={isLoading}
          value={code[index]}
          onPaste={handlePaste}
          onChange={(e) => processCodeChange(e.target.value, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          className="w-12 h-12 text-center text-xl font-semibold border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-brand-accent focus:border-brand-accent focus:outline-none bg-white text-brand-accent disabled:opacity-50"
        />
      ))}
    </div>
  );
};
