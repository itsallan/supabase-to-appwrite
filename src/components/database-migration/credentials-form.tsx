import React from 'react';
import { Input } from '@/components/ui/input';
import type { Credentials } from '@/lib/types';

interface CredentialsFormProps {
  credentials: Credentials;
  onChange: (credentials: Credentials) => void;
}

export function CredentialsForm({ credentials, onChange }: CredentialsFormProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onChange({
      ...credentials,
      [name]: value
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Credentials</h2>
      <div className="grid grid-cols-1 gap-4">
        <Input
          type="text"
          name="supabaseUrl"
          placeholder="Supabase URL (e.g., https://your-project.supabase.co)"
          value={credentials.supabaseUrl}
          onChange={handleChange}
        />
        <Input
          type="password"
          name="supabaseKey"
          placeholder="Supabase Key"
          value={credentials.supabaseKey}
          onChange={handleChange}
        />
        <Input
          type="text"
          name="appwriteEndpoint"
          placeholder="Appwrite Endpoint (e.g., https://cloud.appwrite.io/v1)"
          value={credentials.appwriteEndpoint}
          onChange={handleChange}
        />
        <Input
          type="text"
          name="appwriteProjectId"
          placeholder="Appwrite Project ID"
          value={credentials.appwriteProjectId}
          onChange={handleChange}
        />
        <Input
          type="password"
          name="appwriteApiKey"
          placeholder="Appwrite API Key"
          value={credentials.appwriteApiKey}
          onChange={handleChange}
        />
      </div>
    </div>
  );
}