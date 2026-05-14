import { toast } from "sonner";

/**
 * Renders a brand-styled toast for network/fetch failures.
 * Pass a retry callback that will re-run the failed request when the
 * user clicks "Retry now".
 */
export function showNetworkErrorToast(onRetry?: () => void) {
  toast.custom(
    (t) => (
      <div
        style={{
          backgroundColor: "#FFFCF5",
          border: "1px solid rgba(26,24,21,0.12)",
          borderRadius: 12,
          boxShadow: "none",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          minWidth: 320,
          maxWidth: 420,
        }}
        role="status"
      >
        <span
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontWeight: 400,
            fontSize: 15,
            color: "#1A1815",
            lineHeight: 1.4,
          }}
        >
          Something went sideways. We're trying again.
        </span>
        {onRetry && (
          <button
            onClick={() => {
              try { onRetry(); } finally { toast.dismiss(t); }
            }}
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: 14,
              color: "#B8472D",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 0,
              flexShrink: 0,
            }}
          >
            Retry now
          </button>
        )}
      </div>
    ),
    { duration: 5000 }
  );
}
