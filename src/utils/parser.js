export function parseRecord(line) {
    if (!line || typeof line !== 'string') return null;

    // Format: email:passwort | Points = ... | Locked = ... | ...
    // Strategy: Split by pipe '|', then parse each segment.

    const parts = line.split('|').map(p => p.trim());
    if (parts.length === 0) return null;

    const data = {};

    // First part is usually email:pass
    const firstPart = parts[0];
    if (firstPart.includes(':')) {
        const [email, password] = firstPart.split(':');
        data.email = email.trim();
        data.password = password.trim();
    } else {
        // Fallback if no colon
        data.rawFirst = firstPart;
    }

    // Parse rest: "Key = Value"
    for (let i = 1; i < parts.length; i++) {
        const part = parts[i];
        const separatorIndex = part.indexOf('=');

        if (separatorIndex !== -1) {
            const key = part.substring(0, separatorIndex).trim();
            const value = part.substring(separatorIndex + 1).trim();
            data[key] = value;
        } else {
            // Key only or malformed
            data[`Field_${i}`] = part;
        }
    }

    return data;
}
