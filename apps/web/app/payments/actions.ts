'use server';
import { post } from '../../lib/api';

export async function approve(id: string) {
  await post(`/payments/${id}/approve`);
}

export async function deny(id: string) {
  await post(`/payments/${id}/deny`);
}
