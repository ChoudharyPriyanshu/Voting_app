/**
 * Validation middleware for signup and auth routes
 */

// Strong password: min 8 chars, uppercase, lowercase, number, special char
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#+\-_])[A-Za-z\d@$!%*?&#+\-_]{8,}$/;

/**
 * Calculate age from date of birth
 */
function calculateAge(dob) {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * Get password strength level
 */
function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[@$!%*?&#+\-_]/.test(password)) score++;

  if (score <= 2) return 'weak';
  if (score <= 4) return 'medium';
  if (score <= 5) return 'strong';
  return 'very-strong';
}

/**
 * Validate signup request body
 */
const validateSignup = (req, res, next) => {
  const errors = [];
  const data = req.body;

  // Block superadmin registration
  if (data.role === 'superadmin') {
    return res.status(403).json({ message: 'Unauthorized role assignment' });
  }

  // Validate role
  if (!data.role || !['voter', 'admin'].includes(data.role)) {
    errors.push('Role must be either voter or admin');
  }

  // Common required fields
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Full name is required (minimum 2 characters)');
  }

  if (!data.dob) {
    errors.push('Date of birth is required');
  } else {
    const age = calculateAge(data.dob);
    if (age < 18) {
      errors.push('You must be at least 18 years old to register');
    }
    if (age > 120) {
      errors.push('Invalid date of birth');
    }
  }

  if (!data.gender || !['male', 'female', 'other'].includes(data.gender)) {
    errors.push('Gender is required');
  }

  if (!data.mobile || !/^\d{10}$/.test(data.mobile)) {
    errors.push('Valid 10-digit mobile number is required');
  }

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Valid email address is required');
  }

  if (!data.state || data.state.trim().length === 0) {
    errors.push('State is required');
  }

  if (!data.district || data.district.trim().length === 0) {
    errors.push('District is required');
  }

  if (!data.pincode || !/^\d{6}$/.test(data.pincode)) {
    errors.push('Valid 6-digit pincode is required');
  }

  if (!data.address || data.address.trim().length < 10) {
    errors.push('Full address is required (minimum 10 characters)');
  }

  // Aadhaar validation (raw 12-digit number before hashing)
  if (!data.aadharCardNumber || !/^\d{12}$/.test(data.aadharCardNumber.toString().replace(/\s/g, ''))) {
    errors.push('Valid 12-digit Aadhaar number is required');
  }

  // Voter ID validation
  if (!data.voterIdNumber || data.voterIdNumber.trim().length < 6) {
    errors.push('Valid Voter ID number is required');
  }

  // Password validation
  if (!data.password) {
    errors.push('Password is required');
  } else if (!PASSWORD_REGEX.test(data.password)) {
    errors.push('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
  }

  if (!data.confirmPassword) {
    errors.push('Confirm password is required');
  } else if (data.password !== data.confirmPassword) {
    errors.push('Passwords do not match');
  }

  // Voter-specific validations
  if (data.role === 'voter') {
    if (!data.constituency || data.constituency.trim().length === 0) {
      errors.push('Constituency is required for voters');
    }
    if (!data.termsAccepted || data.termsAccepted === 'false') {
      errors.push('You must accept the terms and conditions');
    }
  }

  // Admin-specific validations
  if (data.role === 'admin') {
    if (!data.organizationName || data.organizationName.trim().length === 0) {
      errors.push('Organization name is required for admin registration');
    }
    if (!data.officialEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.officialEmail)) {
      errors.push('Valid official email is required for admin registration');
    }
    if (!data.employeeId || data.employeeId.trim().length === 0) {
      errors.push('Employee/Admin ID is required');
    }
    if (!data.designation || data.designation.trim().length === 0) {
      errors.push('Designation is required for admin registration');
    }
    if (!data.reasonForAccess || data.reasonForAccess.trim().length < 10) {
      errors.push('Reason for admin access is required (minimum 10 characters)');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: errors[0], errors });
  }

  next();
};

module.exports = { validateSignup, calculateAge, getPasswordStrength, PASSWORD_REGEX };
