export const validators = {
  // Email validation
  email: (value) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) return 'Email is required';
    if (!regex.test(value)) return 'Please enter a valid email address';
    return null;
  },

  // Password validation (Min 8 chars, 1 Upper, 1 Lower, 1 Number)
  password: (value) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    if (!value) return 'Password is required';
    if (value.length < 8) return 'Password must be at least 8 characters';
    if (!regex.test(value)) return 'Must include uppercase, lowercase, and a number';
    return null;
  },

  // Phone validation (10 digits)
  phone: (value) => {
    const regex = /^[6-9]\d{9}$/;
    if (!value) return 'Phone number is required';
    if (!regex.test(value)) return 'Enter a valid 10-digit mobile number';
    return null;
  },

  // Required field check
  required: (value, fieldName = 'Field') => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} is required`;
    }
    return null;
  },

  // File validation
  file: (file, maxSizeMB = 5) => {
    if (!file) return null;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) return 'Only JPG, PNG and WEBP are allowed';
    if (file.size > maxSizeMB * 1024 * 1024) return `File size must be less than ${maxSizeMB}MB`;
    return null;
  }
};