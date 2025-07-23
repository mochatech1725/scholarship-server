export interface User {
  user_id?: number;
  auth_user_id: string; // Auth0 sub
  first_name: string;
  last_name: string;
  email_address: string;
  phone_number?: string;
  created_at?: Date;
  updated_at?: Date;
} 