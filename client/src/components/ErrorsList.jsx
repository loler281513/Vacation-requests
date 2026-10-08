export function ErrorsList({ messages }) {
  if (!messages || messages.length === 0) return null;
  return (
    <div className="errors">
      <ul>
        {messages.map((m, i) => <li key={i}>{m}</li>)}
      </ul>
    </div>
  );
}