export default function Toast({ show, message, type, onClose }) {
  return (
    <div className="toast-container position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1100 }}>
      <div
        className={`toast align-items-center text-white border-0 ${
          type === 'error' ? 'bg-danger' : 'bg-success'
        } ${show ? 'show' : ''}`}
        role="alert"
        aria-live="assertive"
      >
        <div className="d-flex">
          <div className="toast-body">{message}</div>
          <button
            type="button"
            className="btn-close btn-close-white me-2 m-auto"
            onClick={onClose}
            aria-label="Close"
          />
        </div>
      </div>
    </div>
  )
}
