export function requiredText(formData: FormData, key: string, label: string, maxLength = 255) {
  const value = String(formData.get(key) || '').trim();
  if (!value) throw new Error(`${label} es obligatorio`);
  if (value.length > maxLength) throw new Error(`${label} supera el máximo de ${maxLength} caracteres`);
  return value;
}

export function optionalText(formData: FormData, key: string, maxLength = 2_000) {
  const value = String(formData.get(key) || '').trim();
  if (value.length > maxLength) throw new Error(`El campo ${key} supera el máximo permitido`);
  return value || null;
}

export function enumValue<T extends Record<string, string>>(values: T, value: string, label: string): T[keyof T] {
  if (!Object.values(values).includes(value)) throw new Error(`${label} no es válido`);
  return value as T[keyof T];
}

export function optionalDate(value: FormDataEntryValue | null, label: string) {
  if (!value) return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) throw new Error(`${label} no es válida`);
  return date;
}

export function requiredId(value: string, label: string) {
  if (!value || value.length > 191) throw new Error(`${label} no es válido`);
  return value;
}
