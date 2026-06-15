import { getDatabase } from './database';

export async function getConfiguracao(chave: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ valor: string }>(
    'SELECT valor FROM configuracoes WHERE chave = ?',
    [chave]
  );
  return row?.valor ?? null;
}

export async function salvarConfiguracao(chave: string, valor: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR REPLACE INTO configuracoes (chave, valor) VALUES (?, ?)',
    [chave, valor]
  );
}
