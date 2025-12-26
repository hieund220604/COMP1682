import e from "express";

export interface SignUpRequest {
    email: string;
    password: string;
    displayName?: string
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface VerifyOTPRequest {
    email: string;
    otp: string;
}

export interface ResetPasswordRequest {
    email: string;
    newPassword: string;
}

export interface VeriftEmailRequest {
    email: string;
    otp: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    data?: {
        token?: string;
        user?: {
            id: string;
            email: string;
            displayName?: string;
        };
    };

    error?: string;
}

export interface JWTPayLoad {
    userId: string;
    email: string;
    iat?: number;
    exp?: number;
}

export interface OTPRecord {
    email: string;
    otp: string;
    createdAt: Date;
    expiresAt: Date;
    attemptCount: number;
}