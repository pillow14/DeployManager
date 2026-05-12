export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  refreshToken: string
  expiresAt: string
  username: string
  role: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  role: string
}

export interface RefreshTokenRequest {
  token: string
  refreshToken: string
}

export interface AuthUser {
  username: string
  role: string
  token: string
  refreshToken: string
}
