export enum SplitType {
    EQUAL = "EQUAL",
    EXACT = "EXACT",
    PERCENT = "PERCENT"
}

export interface ExpenseShareInput {
    userId: string;
    amount?: number;
    percent?: number;
}

export interface CreateExpenseRequest {
    title: string;
    amountTotal: number;
    currency?: string;
    category?: string;
    expenseType?: string;
    expenseDate?: Date;
    note?: string;
    splitType: SplitType;
    shares: ExpenseShareInput[];
}

export interface UpdateExpenseRequest {
    title?: string;
    amountTotal?: number;
    currency?: string;
    category?: string;
    expenseType?: string;
    expenseDate?: Date;
    note?: string;
    splitType?: SplitType;
    shares?: ExpenseShareInput[];
}

export interface UserSummary {
    id: string;
    email: string;
    displayName?: string;
    avatarUrl?: string;
}

export interface ExpenseShareResponse {
    id: string;
    expenseId: string;
    userId: string;
    owedAmount: number;
    shareNote?: string;
    user?: UserSummary;
}

export interface ExpenseResponse {
    id: string;
    groupId: string;
    title: string;
    amountTotal: number;
    currency: string;
    category?: string;
    expenseType?: string;
    paidBy: UserSummary;
    expenseDate: Date;
    note?: string;
    shares: ExpenseShareResponse[];
    createdAt: Date;
}

export interface ExpenseListResponse {
    expenses: ExpenseResponse[];
    total: number;
}
