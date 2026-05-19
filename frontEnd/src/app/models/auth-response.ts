import { Role } from './role';

export interface AuthResponse {
  success?: boolean;
  message?: string;
  id?: string;
  title?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: Role | string;
  jwtToken?: string;
  token?: string;
  accessToken?: string;
  user?: any;
  [key: string]: any;
}
