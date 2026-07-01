// At least one letter and one digit, 8+ characters.
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
export const PASSWORD_MESSAGE =
  "password must be at least 8 characters and include a letter and a number";
