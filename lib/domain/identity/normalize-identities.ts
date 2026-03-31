export function normalizePhone(value?: string) {
  if (!value) {
    return undefined;
  }

  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }
  return digits.length > 0 ? `+${digits}` : undefined;
}

export function normalizeEmail(value?: string) {
  return value?.trim().toLowerCase();
}

export function normalizeName(value?: string) {
  return value?.trim().toLowerCase().replace(/\s+/g, " ");
}

export function getInitialLastName(value?: string) {
  const normalized = normalizeName(value);
  if (!normalized) {
    return undefined;
  }

  const parts = normalized.split(" ");
  if (parts.length < 2) {
    return undefined;
  }

  return `${parts[0][0]} ${parts[parts.length - 1]}`;
}
