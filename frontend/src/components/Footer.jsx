// src/components/Footer.jsx
// Mirrors moncv.ga's landing-footer: centered, border-top, muted link to
// ISM.Inc. Mounted once in App.jsx so it appears under every route.
export default function Footer() {
  return (
    <footer style={{
      textAlign: 'center',
      padding: '30px 24px',
      borderTop: '1px solid #E2EBE7',
    }}>
      <a
        href="https://www.ingridcode.site"
        target="_blank"
        rel="noopener noreferrer"
        style={{ fontSize: '12.5px', color: '#6b6375', textDecoration: 'none' }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#0F4526'; e.currentTarget.style.textDecoration = 'underline' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = '#6b6375'; e.currentTarget.style.textDecoration = 'none' }}
      >
        Tous droits réservés à ISM.Inc
      </a>
    </footer>
  )
}
