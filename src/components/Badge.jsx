export default function Badge({ count, children }) {
  if (!count || count === 0) {
    return children
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {children}
      <span style={{
        position: 'absolute',
        top: '-6px',
        right: '-8px',
        background: '#D94F3D',
        color: '#fff',
        fontSize: '10px',
        fontWeight: '700',
        padding: '2px 6px',
        borderRadius: '99px',
        minWidth: '18px',
        textAlign: 'center',
        lineHeight: '1.4',
        boxShadow: '0 2px 8px rgba(217,79,61,0.4)',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}>
        {count > 99 ? '99+' : count}
      </span>
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  )
}