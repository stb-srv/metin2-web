/** @type {import('next').NextConfig} */
const nextConfig = {
  // Erlaubte Origins für den Dev-Server
  // Tailscale IPs und lokale Netzwerk-IPs hier eintragen
  allowedDevOrigins: [
    // Tailscale Netzwerk (100.x.x.x)
    '100.127.193.74',
    // Lokales Netzwerk — ganzen Bereich erlauben
    '172.16.0.96',
    // Alle Tailscale IPs erlauben (bequemer als einzelne IPs)
    '100.*',
  ],
}

export default nextConfig
