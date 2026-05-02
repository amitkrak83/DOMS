import type { NotificationCategory } from '@/app/api/notifications/send/route'

export async function sendNotification(category: NotificationCategory, title: string, body: string) {
  try {
    await fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, title, body }),
    })
  } catch {
    // Non-critical — never block the main action
  }
}
