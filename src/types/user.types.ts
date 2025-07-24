import { UserSearchPreferences } from './user-search-preferences.types.js';

export interface User {
  user_id?: number;
  auth_user_id: string; // Auth0 sub
  first_name: string;
  last_name: string;
  email_address: string;
  phone_number?: string;
  searchPreferences?: UserSearchPreferences;
  created_at?: Date;
  updated_at?: Date;
} 