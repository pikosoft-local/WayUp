// Typy używane przez autoryzację i dane użytkownika dołączane do żądania.
import { Request } from 'express';

export interface AuthUser {
  id: string;
  email?: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}