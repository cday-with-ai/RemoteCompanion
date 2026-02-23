import * as SMS from 'expo-sms';
import * as Contacts from 'expo-contacts';

export async function isSmsAvailable(): Promise<boolean> {
  return SMS.isAvailableAsync();
}

/** Look up a phone number from contacts by name. Returns null if not found. */
async function resolveRecipient(nameOrNumber: string): Promise<string | null> {
  // If it already looks like a phone number, use as-is
  if (/^[\d+\-() ]{7,}$/.test(nameOrNumber.trim())) {
    return nameOrNumber.trim();
  }

  const { status } = await Contacts.requestPermissionsAsync();
  if (status !== 'granted') return null;

  const { data } = await Contacts.getContactsAsync({
    fields: [Contacts.Fields.PhoneNumbers],
    name: nameOrNumber,
  });

  if (data.length === 0) return null;

  // Use the first matching contact's first phone number
  const phone = data[0].phoneNumbers?.[0]?.number;
  return phone ?? null;
}

export async function openSmsCompose(
  recipient: string,
  body: string,
): Promise<{ sent: boolean; error?: string }> {
  const available = await SMS.isAvailableAsync();
  if (!available) return { sent: false, error: 'SMS is not available on this device' };

  const resolved = await resolveRecipient(recipient);
  if (!resolved) {
    return { sent: false, error: `Could not find a phone number for "${recipient}"` };
  }

  const { result } = await SMS.sendSMSAsync([resolved], body);
  return { sent: result === 'sent' };
}
