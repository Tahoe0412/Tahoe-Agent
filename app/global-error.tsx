"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="zh-CN">
      <body
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          fontFamily: "system-ui, sans-serif",
          background: "#f8f9fa",
          color: "#1a1a1a",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.75rem" }}>页面加载失败</h1>
        <p style={{ fontSize: "0.95rem", color: "#666", marginBottom: "1.5rem", maxWidth: "28rem", lineHeight: 1.7 }}>
          服务器未能完成数据加载，可能是数据库连接暂时不可用。请稍后重试。
        </p>
        <button
          onClick={reset}
          style={{
            padding: "0.6rem 1.6rem",
            fontSize: "0.9rem",
            fontWeight: 500,
            background: "#111",
            color: "#fff",
            border: "none",
            borderRadius: "12px",
            cursor: "pointer",
          }}
        >
          重新加载
        </button>
        {process.env.NODE_ENV === "development" && error?.message ? (
          <pre
            style={{
              marginTop: "2rem",
              fontSize: "0.75rem",
              color: "#999",
              maxWidth: "40rem",
              overflow: "auto",
              textAlign: "left",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
            }}
          >
            {error.message}
          </pre>
        ) : null}
      </body>
    </html>
  );
}
