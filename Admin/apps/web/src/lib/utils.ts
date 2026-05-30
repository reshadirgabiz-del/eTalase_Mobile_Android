export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function truncate(str: string | null | undefined, len = 12): string {
  if (!str) return '—';
  return str.length > len ? str.slice(0, len) + '…' : str;
}

export function formatIDR(amount: number): string {
  return 'Rp ' + Number(amount).toLocaleString('id-ID');
}
