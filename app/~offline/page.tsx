export default function OfflinePage() {
  return (
    <div className="auth-wrap">
      <div className="auth-card" style={{ textAlign: "center" }}>
        <h1>Trail<em>head</em></h1>
        <div className="auth-sub">DU BIST OFFLINE</div>
        <p className="sub" style={{ fontSize: 14 }}>
          Diese Seite ist noch nicht auf deinem Gerät gespeichert. Öffne die App
          einmal mit Internetverbindung — danach funktioniert sie auch offline.
        </p>
      </div>
    </div>
  );
}
