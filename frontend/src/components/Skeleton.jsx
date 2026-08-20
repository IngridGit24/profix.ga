// src/components/Skeleton.jsx
export const SkeletonCard = () => (
  <div style={{
    background: '#fff',
    borderRadius: '12px',
    padding: '16px',
    border: '1px solid #E2EBE7',
  }}>
    <div style={{
      width: '100%',
      height: '120px',
      background: 'linear-gradient(90deg, #F0F0F0 25%, #E0E0E0 50%, #F0F0F0 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      borderRadius: '8px',
    }} />
    <div style={{
      width: '70%',
      height: '16px',
      marginTop: '12px',
      background: 'linear-gradient(90deg, #F0F0F0 25%, #E0E0E0 50%, #F0F0F0 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      borderRadius: '4px',
    }} />
    <div style={{
      width: '50%',
      height: '12px',
      marginTop: '8px',
      background: 'linear-gradient(90deg, #F0F0F0 25%, #E0E0E0 50%, #F0F0F0 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      borderRadius: '4px',
    }} />
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: '12px',
    }}>
      <div style={{
        width: '40%',
        height: '24px',
        background: 'linear-gradient(90deg, #F0F0F0 25%, #E0E0E0 50%, #F0F0F0 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        borderRadius: '4px',
      }} />
      <div style={{
        width: '30%',
        height: '24px',
        background: 'linear-gradient(90deg, #F0F0F0 25%, #E0E0E0 50%, #F0F0F0 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        borderRadius: '4px',
      }} />
    </div>
    <style>{`
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `}</style>
  </div>
)

export const SkeletonProviderList = ({ count = 6 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
    {[...Array(count)].map((_, i) => <SkeletonCard key={i} />)}
  </div>
)

export const SkeletonProfile = () => (
  <div style={{
    background: '#fff',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #E2EBE7',
  }}>
    <div style={{
      display: 'flex',
      gap: '16px',
      alignItems: 'center',
    }}>
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: 'linear-gradient(90deg, #F0F0F0 25%, #E0E0E0 50%, #F0F0F0 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }} />
      <div style={{ flex: 1 }}>
        <div style={{
          width: '60%',
          height: '20px',
          background: 'linear-gradient(90deg, #F0F0F0 25%, #E0E0E0 50%, #F0F0F0 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
          borderRadius: '4px',
          marginBottom: '8px',
        }} />
        <div style={{
          width: '40%',
          height: '14px',
          background: 'linear-gradient(90deg, #F0F0F0 25%, #E0E0E0 50%, #F0F0F0 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
          borderRadius: '4px',
        }} />
      </div>
    </div>
    <div style={{
      marginTop: '16px',
      height: '60px',
      background: 'linear-gradient(90deg, #F0F0F0 25%, #E0E0E0 50%, #F0F0F0 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      borderRadius: '8px',
    }} />
  </div>
)

export const SkeletonMessage = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    maxWidth: '70%',
  }}>
    <div style={{
      width: '40%',
      height: '12px',
      background: 'linear-gradient(90deg, #F0F0F0 25%, #E0E0E0 50%, #F0F0F0 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      borderRadius: '4px',
    }} />
    <div style={{
      padding: '10px 14px',
      height: '40px',
      background: 'linear-gradient(90deg, #F0F0F0 25%, #E0E0E0 50%, #F0F0F0 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      borderRadius: '12px',
    }} />
  </div>
)