import { createHash } from "crypto"

export const SUPERUSER_COOKIE_NAME = "portfolio_superuser"

export function getCookie(req: Request, name: string) {
  const header = req.headers.get("cookie")
  if (!header) return null

  const parts = header.split(";").map((part) => part.trim())
  for (const part of parts) {
    if (part.startsWith(`${name}=`)) return decodeURIComponent(part.slice(name.length + 1))
  }

  return null
}

export function signSuperuserToken(token: string) {
  const secret = process.env.SUPERUSER_PASSWORD ?? ""
  return createHash("sha256").update(`${token}.${secret}`).digest("hex")
}

export function isAuthedRequest(req: Request) {
  const cookie = getCookie(req, SUPERUSER_COOKIE_NAME)
  if (!cookie) return false

  const [token, signature] = cookie.split(".")
  const secret = process.env.SUPERUSER_PASSWORD ?? ""
  const expected = createHash("sha256").update(`${token}.${secret}`).digest("hex")
  return signature === expected && Boolean(secret)
}
