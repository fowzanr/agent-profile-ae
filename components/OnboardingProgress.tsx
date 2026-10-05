export function OnboardingProgress({ step }: { step: 1 | 2 | 3 | 4 }) {
  return (
    <div className="onboard-progress">
      {[1, 2, 3, 4].map((n, i) => (
        <div key={n} style={{ display: "flex", alignItems: "center", flex: n === 4 ? "0 0 auto" : 1 }}>
          <div className={`step-dot${n === step ? " active" : n < step ? " done" : ""}`}>{n}</div>
          {i < 3 && <div className={`step-line${n < step ? " done" : ""}`} />}
        </div>
      ))}
    </div>
  );
}
