import { Link } from "react-router-dom";

// Loading, empty and error are required on every list page in Labs 03-06, so
// they share one component instead of being re-written five times.
const StateMessage = ({ icon, title, description, actionLabel, actionTo, onAction, busy }) => (
  <div className="state-message" role="status" aria-live="polite">
    {icon && (
      <span className="state-message__icon" aria-hidden="true">
        {icon}
      </span>
    )}

    <p className="state-message__title">{title}</p>
    {description && <p className="state-message__description">{description}</p>}

    {actionTo && (
      <Link className="button button--primary" to={actionTo}>
        {actionLabel}
      </Link>
    )}

    {onAction && (
      <button className="button button--primary" type="button" onClick={onAction} disabled={busy}>
        {busy ? "Retrying..." : actionLabel}
      </button>
    )}
  </div>
);

export default StateMessage;
