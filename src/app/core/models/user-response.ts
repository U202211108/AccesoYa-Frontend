import { UserRole } from './auth-user';

export type UserStatus =
    | 'ACTIVE'
    | 'INACTIVE';


export interface UserResponse {

    id: string;

    firstName: string;

    lastName: string;

    email: string;

    role: UserRole;

    status: UserStatus;

    createdAt: string;

    updatedAt: string;
}