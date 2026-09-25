const colors = ['#e17076', '#7bc862', '#65aadd', '#a695e7', '#ee7aae', '#6ec9cb', '#faa774']

export function Avatar({ name, size = 48 }: { name: string; size?: number }) {
  const letters = name.replace(/[^\p{L}\p{N}]/gu, '').slice(0, 2).toUpperCase() || '?'
  const hash = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return (
    <div className="avatar" style={{ width: size, height: size, background: colors[hash % colors.length] }}>
      {letters}
    </div>
  )
}
