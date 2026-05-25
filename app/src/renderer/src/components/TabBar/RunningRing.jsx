export default function RunningRing({ children, running }) {
  return (
    <span className="relative inline-flex items-center justify-center shrink-0" style={{ width: 22, height: 22 }}>
      {children}
      {running && (
        <span
          style={{
            position: 'absolute',
            bottom: 1,
            right: 1,
            width: 5,
            height: 5,
            borderRadius: '50%',
            backgroundColor: 'var(--color-accent, #3b82f6)',
          }}
        />
      )}
    </span>
  )
}
