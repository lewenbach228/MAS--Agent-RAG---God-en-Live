/**
 * MessageUser
 *
 * Bulle de message de l'utilisateur.
 */

interface MessageUserProps {
  text: string;
}

export function MessageUser({ text }: MessageUserProps) {
  return (
    <div className="message message--user">
      <div className="message__content">
        <p className="message__text">{text}</p>
      </div>
      <div className="message__avatar">M</div>
    </div>
  );
}
