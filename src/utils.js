export function parseCommand(text, prefix = '.') {
  if (!text.startsWith(prefix)) return null;
  const [command, ...args] = text.slice(prefix.length).trim().split(/\s+/);
  return command ? { command: command.toLowerCase(), args, input: args.join(' ') } : null;
}
export function unwrap(message) {
  for (let i = 0; i < 5; i++) {
    const next = message?.ephemeralMessage?.message || message?.viewOnceMessage?.message || message?.viewOnceMessageV2?.message;
    if (!next) break;
    message = next;
  }
  return message || {};
}
export function textOf(m) {
  return m.conversation || m.extendedTextMessage?.text || m.imageMessage?.caption || m.videoMessage?.caption || '';
}
export function downloadURL(input) {
  const u = new URL(input);
  const hosts = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.instagram.com', 'instagram.com', 'www.tiktok.com', 'tiktok.com', 'vm.tiktok.com', 'vt.tiktok.com', 'm.tiktok.com', 'www.facebook.com', 'facebook.com', 'fb.watch'];
  if (u.protocol !== 'https:' || u.username || u.password || u.port || !hosts.includes(u.hostname)) throw new Error('Supported HTTPS video URL එකක් දෙන්න.');
  return u.href;
}
export function adminAllowed(participants, sender, bot) {
  return participants.some(p => p.id === sender && p.admin) && participants.some(p => p.id === bot && p.admin);
}
