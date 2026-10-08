export function normalizeSerial(value: string): string {
  return value.trim().toUpperCase()
}

export function formatMac(value: string): string {
  const raw = value.trim().replace(/[:.-]/g, "").toUpperCase()
  return /^[0-9A-F]{0,12}$/.test(raw)
    ? (raw.match(/.{1,2}/g) ?? []).join(":")
    : value.toUpperCase()
}

export function normalizeMac(value: string): string {
  const raw = value.trim().replace(/[:.-]/g, "")
  if (!/^[0-9a-fA-F]{12}$/.test(raw)) {
    throw new Error("MAC inválido: informe 12 caracteres, usando números e letras de A a F.")
  }
  return formatMac(raw)
}
