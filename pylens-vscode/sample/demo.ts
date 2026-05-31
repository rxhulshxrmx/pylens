// PyLens demo file
// Open this file in VS Code with the extension running (F5 from pylens-vscode/)
// Each function below has a matching record in seed/demo.json

function authenticateUser(token: string): boolean {
  return token.length > 0;
}

function generateToken(userId: string): string {
  return `tok_${userId}`;
}

function validateSchema(data: unknown): boolean {
  return data !== null;
}

function fetchUserData(userId: string, page: number) {
  return { userId, page, items: [] };
}

function processPayment(amount: number, currency: string) {
  return { amount, currency, status: 'pending' };
}

function handleWebhook(payload: Buffer, signature: string): void {
  console.log(payload, signature);
}

// These functions have no provenance — extension stays silent for them
function formatDate(date: Date): string {
  return date.toISOString();
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
