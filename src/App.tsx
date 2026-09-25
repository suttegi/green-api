export default function App() {
  return (
    <div className="app">
      <aside className="sidebar">
        <header className="sidebar__header">
          <div className="sidebar__title">Чаты</div>
        </header>
        <ul className="chat-list">
          <li className="chat-list__empty">Нет чатов</li>
        </ul>
      </aside>
      <section className="chat chat--placeholder">
        <div className="placeholder">Выберите чат или создайте новый</div>
      </section>
    </div>
  )
}
