import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const secretsClient = new SecretsManagerClient({});

/**
 * Fetch a secret from AWS Secrets Manager by secretId (ARN or name).
 * Returns the parsed JSON if the secret is a JSON string, otherwise the raw string.
 */
export async function getSecret(secretId: string): Promise<any> {
  const command = new GetSecretValueCommand({ SecretId: secretId });
  const response = await secretsClient.send(command);
  if (!response.SecretString) throw new Error('Secret has no value');
  try {
    return JSON.parse(response.SecretString);
  } catch {
    return response.SecretString;
  }
} 