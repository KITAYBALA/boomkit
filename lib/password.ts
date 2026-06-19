import { createHash, randomBytes, scrypt as scryptCallback, type ScryptOptions, timingSafeEqual } from 'crypto'

const ALGORITHM = 'scrypt'
const KEY_LENGTH = 64
const SCRYPT_N = 16384
const SCRYPT_R = 8
const SCRYPT_P = 1
const SCRYPT_MAXMEM = 64 * 1024 * 1024

export const MIN_PASSWORD_LENGTH = 8

export function validatePassword(password: unknown): string | null {
  if (typeof password !== 'string') return 'Password is required'
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
  }
  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[^A-Za-z0-9]/.test(password)

  if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
    return 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  }
  return null
}

export async function hashPassword(password: string): Promise<string> {
  const validationError = validatePassword(password)
  if (validationError) throw new Error(validationError)

  const salt = randomBytes(16).toString('hex')
  const key = await scryptAsync(password, salt, KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: SCRYPT_MAXMEM,
  })

  return `${ALGORITHM}$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt}$${key.toString('hex')}`
}

export async function verifyPassword(
  password: string,
  storedHash: string | null | undefined
): Promise<{ valid: boolean; needsRehash: boolean }> {
  if (!storedHash || typeof password !== 'string') {
    return { valid: false, needsRehash: false }
  }

  if (storedHash.startsWith(`${ALGORITHM}$`)) {
    return verifyScryptPassword(password, storedHash)
  }

  if (/^[a-f0-9]{64}$/i.test(storedHash)) {
    const legacyHash = createHash('sha256').update(password).digest('hex')
    const valid = timingSafeHexEqual(legacyHash, storedHash)
    return { valid, needsRehash: valid }
  }

  return { valid: false, needsRehash: false }
}

async function verifyScryptPassword(
  password: string,
  storedHash: string
): Promise<{ valid: boolean; needsRehash: boolean }> {
  const [algorithm, nRaw, rRaw, pRaw, salt, keyHex] = storedHash.split('$')
  const n = Number(nRaw)
  const r = Number(rRaw)
  const p = Number(pRaw)

  if (
    algorithm !== ALGORITHM ||
    !Number.isInteger(n) ||
    !Number.isInteger(r) ||
    !Number.isInteger(p) ||
    !salt ||
    !/^[a-f0-9]+$/i.test(keyHex)
  ) {
    return { valid: false, needsRehash: false }
  }

  const expectedKey = Buffer.from(keyHex, 'hex')
  const actualKey = await scryptAsync(password, salt, expectedKey.length, {
    N: n,
    r,
    p,
    maxmem: SCRYPT_MAXMEM,
  })

  const valid = expectedKey.length === actualKey.length && timingSafeEqual(expectedKey, actualKey)
  const needsRehash = valid && (n !== SCRYPT_N || r !== SCRYPT_R || p !== SCRYPT_P)

  return { valid, needsRehash }
}

function timingSafeHexEqual(leftHex: string, rightHex: string): boolean {
  try {
    const left = Buffer.from(leftHex, 'hex')
    const right = Buffer.from(rightHex, 'hex')
    return left.length === right.length && timingSafeEqual(left, right)
  } catch {
    return false
  }
}

function scryptAsync(password: string, salt: string, keyLength: number, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keyLength, options, (error, derivedKey) => {
      if (error) {
        reject(error)
        return
      }
      resolve(derivedKey)
    })
  })
}
