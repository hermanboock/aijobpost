import React, { useState, useEffect, useRef } from "react";

// ---- JOBJACK palette (rough approximations from the screenshots) ----
const C = {
  navy: "#0f2740", navy2: "#16324f", green: "#2f8f4e", greenDark: "#256e3d",
  greenTint: "#eaf5ee", ink: "#1f2d3d", sub: "#5b6b7b", line: "#e3e8ee",
  bg: "#f4f6f8", blueTint: "#eef4fb", blueInk: "#2b6cb0",
  amberTint: "#fff6e6", amberInk: "#9a6b00", amberLine: "#f0d9a0",
  violetTint: "#f0edfb", violetInk: "#6b57c4",
};

const CREDITS = "2,950";

const btn = (bg, color = "#fff") => ({
  background: bg, color, border: "none", borderRadius: 6,
  padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer",
});
const ghostBtn = {
  background: "#fff", color: C.ink, border: `1px solid ${C.line}`, borderRadius: 6,
  padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer",
};
const smallGhost = { ...ghostBtn, padding: "5px 12px", fontSize: 13 };

// ---- Full option lists from the Requirements & Preferences screen ----
const REQ_OPTIONS = [
  "Matric", "Tertiary qualification", "Clear criminal record", "Language(s)",
  "Job experience types", "Industry", "Drivers license(s)",
  "Applicant required to live within certain radius from job location",
];
const PREF_OPTIONS = [
  "Tertiary qualification", "Clear criminal record", "Language(s)", "Job experience types",
  "Industry", "Drivers license(s)", "Applicant preferred to live within certain radius from job location",
  "Has own car", "Employment equity", "Nationality preference", "Gender preference", "Age preference",
];
// Sensitive categories the AI must never auto-select (fairness / regulated criteria).
// Users can still add them deliberately.
const SENSITIVE_PREFS = ["Nationality preference", "Gender preference", "Age preference", "Employment equity"];

// ---- Brief example chips (suggestion 4) ----
const BRIEF_CHIPS = [
  "manages a small team", "weekend shifts", "comfortable with customers",
  "cash handling", "own transport", "physically active role",
];

// ---- "AI" generation from the intake (suggestion 4: brief influences output) ----
function seedJob(role, location, brief) {
  const r = role.trim() || "Store Manager";
  const b = (brief || "").toLowerCase();

  const about =
    `We're looking for ${/manager|lead|supervisor/.test(r.toLowerCase()) ? "an experienced" : "a motivated"} ${r} ` +
    `to join our team${location ? ` in ${location.split(",")[0]}` : ""}. ` +
    `You'll play a key role in day-to-day operations and delivering a great customer experience.`;

  const duties = ["Carry out the core day-to-day responsibilities of the role", "Deliver excellent customer service"];
  if (/team|manage|lead|supervis/.test(b)) duties.push("Lead and support team members");
  if (/cash|finance|till|money/.test(b)) duties.push("Handle cash and daily reconciliation accurately");
  if (/stock|merch|inventory/.test(b)) duties.push("Manage stock and merchandising");
  if (/sales|target/.test(b)) duties.push("Work towards sales targets");
  duties.push("Maintain a safe and compliant work environment");

  // Role-neutral requirements only (suggestion 7)
  const requirements = ["Matric"];
  if (/experience|retail|years/.test(b)) requirements.push("Job experience types");
  if (/drive|license|licence|deliver/.test(b)) requirements.push("Drivers license(s)");
  if (/language|english|afrikaans|zulu|xhosa/.test(b)) requirements.push("Language(s)");

  // Preferences: role-neutral only, never sensitive categories
  const preferences = [];
  if (/car|own transport|vehicle/.test(b)) preferences.push("Has own car");
  if (/industry|retail|hospitality/.test(b)) preferences.push("Industry");

  return {
    role: r,
    location: location || "",
    employmentType: "Full-time",
    salary: "", startDate: "", schedule: "",   // never fabricated
    about,
    duties,
    requirements,
    preferences,
    checks: [
      { id: "credit", label: "Credit check", why: "Role involves handling cash or finances", enabled: false },
      { id: "risk", label: "Risk check", why: "Reviews arrests / criminal cases linked to ID", enabled: false },
      { id: "matric", label: "Matric check", why: "Verifies a valid matric certificate", enabled: false },
    ],
    brief,
    // provenance: which sections are still untouched AI drafts (suggestion 1)
    aiDraft: { about: true, duties: true, requirements: true, preferences: true },
  };
}

// ============================================================
function App() {
  const [screen, setScreen] = useState("select");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [locationResolved, setLocationResolved] = useState(false); // suggestion 7
  const [brief, setBrief] = useState("");
  const [job, setJob] = useState(null);

  const startGenerate = () => {
    setScreen("generating");
    setTimeout(() => { setJob(seedJob(role, location, brief)); setScreen("ready"); }, 2600);
  };
  const reset = () => {
    setRole(""); setLocation(""); setLocationResolved(false); setBrief(""); setJob(null); setScreen("select");
  };

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif", background: C.bg, minHeight: "100vh", color: C.ink }}>
      <Shell>
        {screen === "select" && <SelectScreen onAI={() => setScreen("intake")} />}
        {screen === "intake" && (
          <Intake role={role} setRole={setRole}
            location={location} setLocation={setLocation}
            locationResolved={locationResolved} setLocationResolved={setLocationResolved}
            brief={brief} setBrief={setBrief}
            onBack={() => setScreen("select")} onGenerate={startGenerate} />
        )}
        {screen === "generating" && <Generating />}
        {screen === "ready" && job && (
          <Ready job={job} setJob={setJob} onSubmit={() => setScreen("submitted")} onRestart={() => setScreen("intake")} />
        )}
        {screen === "submitted" && <Submitted job={job} onReset={reset} />}
      </Shell>
    </div>
  );
}

function Shell({ children }) {
  const nav = ["Home", "Jobs", "Interview Calendar", "Assessment & Checks Hub", "My Company", "My Profile", "Resources", "Logout"];
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside style={{ width: 210, background: C.navy, color: "#cfd8e3", padding: "22px 0", flexShrink: 0 }}>
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <div style={{ width: 62, height: 62, borderRadius: "50%", background: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", color: C.green, fontWeight: 800, fontSize: 22 }}>JJ</div>
        </div>
        {nav.map((n) => (
          <div key={n} style={{ padding: "11px 22px", fontSize: 14, color: n === "Jobs" ? "#fff" : "#cfd8e3", fontWeight: n === "Jobs" ? 700 : 500, background: n === "Jobs" ? C.navy2 : "transparent" }}>{n}</div>
        ))}
      </aside>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <header style={{ height: 54, background: "#f7f7f7", borderBottom: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "center", letterSpacing: 3, fontWeight: 800, color: C.navy }}>JOBJACK</header>
        <main style={{ flex: 1, padding: "28px 40px", overflow: "auto" }}>{children}</main>
      </div>
    </div>
  );
}

// ---- Persistent credit / terms banner (suggestion 2) ----
function CreditBanner() {
  const items = [
    ["🧾", `Posting this job uses ${CREDITS} credits`],
    ["📅", "Open for applications for 30 days"],
    ["⏱", "You'll have access to the job for 90 days"],
  ];
  return (
    <div style={{ background: C.blueTint, borderRadius: 8, padding: "12px 16px", display: "flex", gap: 26, flexWrap: "wrap", marginBottom: 18 }}>
      {items.map(([ic, t]) => (
        <span key={t} style={{ fontSize: 13, color: C.blueInk, display: "flex", gap: 7 }}><span>{ic}</span>{t}</span>
      ))}
    </div>
  );
}

function SelectScreen({ onAI }) {
  return (
    <div style={{ maxWidth: 940, margin: "0 auto" }}>
      <h2 style={{ textAlign: "center", marginBottom: 4 }}>Ready to post a new job? Let's get started.</h2>
      <p style={{ textAlign: "center", color: C.sub, marginTop: 0 }}>Pick how you'd like to build it.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18, marginTop: 26 }}>
        <div style={{ border: `2px solid ${C.green}`, borderRadius: 12, padding: 22, background: C.greenTint, position: "relative" }}>
          <span style={{ position: "absolute", top: -12, left: 18, background: C.green, color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20 }}>Recommended</span>
          <div style={{ fontSize: 30, marginBottom: 8 }}>🤖</div>
          <h3 style={{ margin: "6px 0" }}>AI Job Builder</h3>
          <p style={{ color: C.sub, fontSize: 14, minHeight: 66 }}>Tell us who you're looking for and we'll create the job post for you.</p>
          <button style={{ ...btn(C.green), width: "100%" }} onClick={onAI}>Create with AI</button>
        </div>
        {[{ t: "Company Templates", d: "Start from a job spec your company has set up before." },
          { t: "JOBJACK Templates", d: "Choose from ready-made blueprints for popular roles." }].map((c) => (
          <div key={c.t} style={{ border: `1px solid ${C.line}`, borderRadius: 12, padding: 22, background: "#fff" }}>
            <div style={{ fontSize: 26, marginBottom: 8, color: C.sub }}>▤</div>
            <h3 style={{ margin: "6px 0" }}>{c.t}</h3>
            <p style={{ color: C.sub, fontSize: 14, minHeight: 66 }}>{c.d}</p>
            <button style={{ ...ghostBtn, width: "100%" }}>Choose</button>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 22, background: C.blueTint, borderRadius: 8, padding: "12px 16px", fontSize: 13, color: C.blueInk }}>
        💡 New to posting jobs? The AI Job Builder is the fastest way to get started.
      </div>
    </div>
  );
}

// ---- Google Places-style location autocomplete ----
const MOCK_PLACES = [
  "Durbanville, Cape Town, South Africa",
  "Paarl Mall, Cecilia Street, Southern Paarl, Paarl, South Africa",
  "Sandton City, Sandton, Johannesburg, South Africa",
  "Gateway Theatre of Shopping, Umhlanga, Durban, South Africa",
  "V&A Waterfront, Cape Town, South Africa",
  "Menlyn Park Shopping Centre, Pretoria, South Africa",
  "Canal Walk, Century City, Cape Town, South Africa",
];
function LocationField({ value, onChange, onResolvedChange, placeholder }) {
  const [q, setQ] = useState(value || "");
  const [open, setOpen] = useState(false);
  const [resolved, setResolved] = useState(!!value);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const matches = q.trim().length < 2 ? [] : MOCK_PLACES.filter((p) => p.toLowerCase().includes(q.toLowerCase())).slice(0, 5);
  const setResolvedState = (v) => { setResolved(v); onResolvedChange && onResolvedChange(v); };
  return (
    <div style={{ position: "relative" }} ref={ref}>
      <input style={inp} value={q} placeholder={placeholder}
        onChange={(e) => { setQ(e.target.value); setOpen(true); setResolvedState(false); onChange(e.target.value); }}
        onFocus={() => setOpen(true)} />
      {q.trim() && !resolved && (
        <div style={{ fontSize: 12, color: C.amberInk, marginTop: 4 }}>Pick a suggestion so we can match this to a real location.</div>
      )}
      {open && matches.length > 0 && (
        <div style={{ position: "absolute", zIndex: 20, top: "calc(100% + 2px)", left: 0, right: 0, background: "#fff", border: `1px solid ${C.line}`, borderRadius: 6, marginTop: 4, boxShadow: "0 6px 18px rgba(0,0,0,.08)", overflow: "hidden" }}>
          {matches.map((m) => (
            <div key={m} style={{ padding: "9px 12px", fontSize: 14, cursor: "pointer", display: "flex", gap: 8 }}
              onMouseDown={() => { setQ(m); onChange(m); setResolvedState(true); setOpen(false); }}
              onMouseEnter={(e) => (e.currentTarget.style.background = C.greenTint)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}>
              <span>📍</span><span>{m}</span>
            </div>
          ))}
          <div style={{ padding: "6px 12px", fontSize: 11, color: C.sub, borderTop: `1px solid ${C.line}` }}>Powered by Google</div>
        </div>
      )}
    </div>
  );
}

function Intake({ role, setRole, location, setLocation, locationResolved, setLocationResolved, brief, setBrief, onBack, onGenerate }) {
  const ready = role.trim() && location.trim() && locationResolved && brief.trim();
  const addChip = (chip) => {
    if (brief.toLowerCase().includes(chip.toLowerCase())) return;
    setBrief((brief ? brief.replace(/\s*$/, "").replace(/\.?$/, "") + ", " : "") + chip);
  };
  return (
    <div style={{ maxWidth: 940, margin: "0 auto" }}>
      <button style={{ ...ghostBtn, marginBottom: 18 }} onClick={onBack}>← Back</button>
      <CreditBanner />
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
        <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 12, padding: 26 }}>
          <h2 style={{ marginTop: 0 }}>Tell us about the role</h2>
          <p style={{ color: C.sub, marginTop: 0 }}>Just the basics. We'll draft the full job post for you.</p>
          <Field label="Role">
            <input style={inp} value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Store Manager" />
          </Field>
          <Field label="Where is the role based?">
            <LocationField value={location} onChange={setLocation} onResolvedChange={setLocationResolved} placeholder="Start typing a location or store" />
          </Field>
          <Field label="What are you looking for?">
            <textarea style={{ ...inp, height: 96, resize: "vertical" }} maxLength={500} value={brief} onChange={(e) => setBrief(e.target.value)}
              placeholder="e.g. Someone with retail experience who can manage a small team, work weekends and is comfortable with customers." />
            <div style={{ textAlign: "right", fontSize: 12, color: C.sub }}>{brief.length}/500</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
              {BRIEF_CHIPS.map((chip) => (
                <button key={chip} onClick={() => addChip(chip)}
                  style={{ border: `1px solid ${C.line}`, background: "#fff", borderRadius: 20, padding: "5px 12px", fontSize: 12, cursor: "pointer", color: C.sub }}>
                  + {chip}
                </button>
              ))}
            </div>
          </Field>
          <p style={{ fontSize: 13, color: C.sub }}>ⓘ The more detail you add, the better your draft. We'll flag anything we couldn't work out.</p>
          <button style={{ ...btn(ready ? C.green : "#b9c4cf"), cursor: ready ? "pointer" : "not-allowed" }} disabled={!ready} onClick={onGenerate}>Create my job post</button>
        </div>
        <div style={{ background: C.greenTint, borderRadius: 12, padding: 22 }}>
          <h4 style={{ marginTop: 0 }}>What happens next?</h4>
          {[
            "We create a draft job spec from your details",
            "You review, edit, and fill in anything we couldn't infer",
            "Post when you're happy",
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 12, marginBottom: 16 }}>
              <span style={{ width: 24, height: 24, borderRadius: "50%", background: C.green, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>{i + 1}</span>
              <span style={{ fontSize: 14 }}>{s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Generating() {
  const steps = [
    "Analysing your input", "Creating job description", "Generating responsibilities",
    "Suggesting requirements", "Adding preferences", "Setting up application process",
  ];
  const [done, setDone] = useState(0);
  useEffect(() => {
    if (done >= steps.length) return;
    const t = setTimeout(() => setDone((d) => d + 1), 380);
    return () => clearTimeout(t);
  }, [done]);
  return (
    <div style={{ maxWidth: 420, margin: "48px auto", textAlign: "center" }}>
      <div style={{ fontSize: 44, marginBottom: 6 }}>📝✨</div>
      <h2 style={{ marginBottom: 4 }}>Creating your job...</h2>
      <p style={{ color: C.sub, marginTop: 0 }}>We're turning your details into a complete job post.</p>
      <div style={{ display: "inline-block", textAlign: "left", margin: "22px 0" }}>
        {steps.map((s, i) => {
          const isDone = i < done, isActive = i === done;
          return (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", opacity: isDone || isActive ? 1 : 0.4, transition: "opacity .3s" }}>
              <span style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#fff",
                background: isDone ? C.green : isActive ? C.greenDark : "#c4cdd6" }}>
                {isDone ? "✓" : isActive ? "•" : ""}
              </span>
              <span style={{ fontSize: 15 }}>{s}</span>
            </div>
          );
        })}
      </div>
      <div style={{ background: "#f2f4f7", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: C.sub }}>
        ✨ This usually takes less than 30 seconds.
      </div>
    </div>
  );
}

// ---- AI draft pill (suggestion 1) ----
function DraftPill({ isDraft }) {
  return isDraft ? (
    <span style={{ background: C.violetTint, color: C.violetInk, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20 }}>✨ AI draft</span>
  ) : (
    <span style={{ background: C.greenTint, color: C.greenDark, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20 }}>✓ Edited</span>
  );
}

function Ready({ job, setJob, onSubmit, onRestart }) {
  const anyCheckOff = job.checks.some((c) => !c.enabled);
  const missing = [!job.salary && "Salary", !job.startDate && "Start date", !job.schedule && "Work schedule"].filter(Boolean);

  const clearDraft = (key) => setJob((j) => ({ ...j, aiDraft: { ...j.aiDraft, [key]: false } }));


  return (
    <div style={{ maxWidth: 880, margin: "0 auto" }}>
      <h2 style={{ marginBottom: 2 }}>Your job is ready 🎉</h2>
      <p style={{ color: C.sub, marginTop: 0 }}>We drafted this from your notes. Review each section, edit anything, then post.</p>

      <CreditBanner />

      <div id="job-details">
        <EditableList title="Job details"
          seed={() => ({ role: job.role, location: job.location, employmentType: job.employmentType, salary: job.salary, schedule: job.schedule, startDate: job.startDate })}
          onSave={(v) => setJob({ ...job, ...v })}
          render={() => (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 30px", fontSize: 14 }}>
              <KV k="Role" v={job.role} />
              <KV k="Location" v={job.location} />
              <KV k="Employment type" v={job.employmentType} />
              <KV k="Salary" v={job.salary} />
              <KV k="Work schedule" v={job.schedule} />
              <KV k="Start date" v={job.startDate} />
            </div>
          )}
          editor={(draft, set) => (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="role"><input style={inp} value={draft.role} onChange={(e) => set({ ...draft, role: e.target.value })} /></Field>
              <Field label="location"><LocationField value={draft.location} onChange={(v) => set({ ...draft, location: v })} placeholder="Start typing a location or store" /></Field>
              <Field label="employment type"><input style={inp} value={draft.employmentType} onChange={(e) => set({ ...draft, employmentType: e.target.value })} /></Field>
              <Field label="salary"><input style={inp} value={draft.salary} onChange={(e) => set({ ...draft, salary: e.target.value })} placeholder="e.g. R8,000 - R12,000 / month" /></Field>
              <Field label="work schedule"><input style={inp} value={draft.schedule} onChange={(e) => set({ ...draft, schedule: e.target.value })} placeholder="e.g. Weekdays + weekends" /></Field>
              <Field label="start date"><input style={inp} value={draft.startDate} onChange={(e) => set({ ...draft, startDate: e.target.value })} placeholder="e.g. ASAP" /></Field>
            </div>
          )}
        />
      </div>

      <SectionCard title="About the role" isDraft={job.aiDraft.about}>
        <InlineText value={job.about} onSave={(v) => { setJob({ ...job, about: v }); clearDraft("about"); }} />
      </SectionCard>

      <ListSection title="What you'll do" items={job.duties} isDraft={job.aiDraft.duties}
        onSave={(v) => { setJob({ ...job, duties: v }); clearDraft("duties"); }} />

      <ChecklistSection title="Requirements" options={REQ_OPTIONS} selected={job.requirements} isDraft={job.aiDraft.requirements}
        note="Criteria applicants are expected to meet. Requirements contribute to the JOBJACK ranking of applicants."
        onSave={(v) => { setJob({ ...job, requirements: v }); clearDraft("requirements"); }} />

      <ChecklistSection title="Preferences" options={PREF_OPTIONS} selected={job.preferences} isDraft={job.aiDraft.preferences} allowCustom
        note="Additional criteria applicants ideally meet. Preferences also contribute to ranking."
        onSave={(v) => { setJob({ ...job, preferences: v }); clearDraft("preferences"); }} />

      <Section title="Assessments & checks">
        {anyCheckOff && (
          <div style={{ background: C.amberTint, border: `1px solid ${C.amberLine}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: C.amberInk, marginBottom: 14 }}>
            ⚠ These checks require your consent and legal confirmation, so we left them off. Turn on only the ones that apply.
          </div>
        )}
        {job.checks.map((c) => (
          <label key={c.id} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 0", borderBottom: `1px solid ${C.line}`, cursor: "pointer" }}>
            <input type="checkbox" checked={c.enabled} style={{ marginTop: 3 }}
              onChange={() => setJob({ ...job, checks: job.checks.map((x) => x.id === c.id ? { ...x, enabled: !x.enabled } : x) })} />
            <span>
              <strong>{c.label}</strong>{c.enabled && <span style={{ color: C.green, marginLeft: 8, fontSize: 12 }}>● enabled</span>}
              <div style={{ fontSize: 13, color: C.sub }}>{c.why}. I confirm I want this active for this job.</div>
            </span>
          </label>
        ))}
      </Section>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 26, alignItems: "center" }}>
        <button style={ghostBtn} onClick={onRestart}>← Start over</button>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <span style={{ fontSize: 13, color: C.sub }}>Uses {CREDITS} credits</span>
          <button style={{ ...btn(missing.length ? "#b9c4cf" : C.green), cursor: missing.length ? "not-allowed" : "pointer" }} disabled={missing.length > 0} onClick={onSubmit}>
            Post job
          </button>
        </div>
      </div>
      {missing.length > 0 && (
        <p style={{ textAlign: "right", fontSize: 12, color: C.amberInk, marginTop: 8 }}>Add {missing.join(", ")} before posting.</p>
      )}
    </div>
  );
}

function Submitted({ job, onReset }) {
  return (
    <div style={{ maxWidth: 560, margin: "80px auto", textAlign: "center", background: "#fff", border: `1px solid ${C.line}`, borderRadius: 12, padding: 40 }}>
      <div style={{ fontSize: 40 }}>✅</div>
      <h2>Job posted</h2>
      <p style={{ color: C.sub }}>{job.role}{job.location ? `, ${job.location},` : ""} is now live and open for applications for 30 days.</p>
      <p style={{ fontSize: 13, color: C.sub }}>{job.checks.filter((c) => c.enabled).length} check(s) enabled. {CREDITS} credits used.</p>
      <button style={{ ...btn(C.green), marginTop: 18 }} onClick={onReset}>Post another job</button>
    </div>
  );
}

// ---- building blocks ----
const inp = { width: "100%", boxSizing: "border-box", padding: "9px 11px", border: `1px solid ${C.line}`, borderRadius: 6, fontSize: 14, fontFamily: "inherit" };
function Field({ label, children }) {
  return <div style={{ marginBottom: 14 }}><label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, textTransform: "capitalize" }}>{label}</label>{children}</div>;
}
function KV({ k, v }) {
  return (
    <div>
      <div style={{ color: C.sub, fontSize: 12 }}>{k}</div>
      {v ? <div style={{ fontWeight: 600 }}>{v}</div>
         : <div style={{ fontWeight: 600, color: C.amberInk, fontSize: 13 }}>⚠ Needs your input</div>}
    </div>
  );
}
function Section({ title, children }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 12, padding: 22, marginTop: 16 }}>
      <h3 style={{ marginTop: 0, marginBottom: 14 }}>{title}</h3>
      {children}
    </div>
  );
}

// header row with draft pill + optional regenerate (suggestions 1 & 5)
function SectionHead({ title, isDraft, editing, onEdit }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        {isDraft !== undefined && <DraftPill isDraft={isDraft} />}
      </div>
      {!editing && onEdit && <button style={smallGhost} onClick={onEdit}>Edit</button>}
    </div>
  );
}

function SectionCard({ title, isDraft, children }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 12, padding: 22, marginTop: 16 }}>
      <SectionHead title={title} isDraft={isDraft} editing={false} />
      <div style={{ marginTop: 10 }}>{children}</div>
    </div>
  );
}

function EditableList({ title, render, editor, seed, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(seed());
  return (
    <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 12, padding: 22, marginTop: 16 }}>
      <SectionHead title={title} editing={editing} onEdit={() => { setDraft(seed()); setEditing(true); }} />
      {editing ? (
        <>
          {editor(draft, setDraft)}
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button style={btn(C.green)} onClick={() => { onSave(draft); setEditing(false); }}>Save</button>
            <button style={ghostBtn} onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </>
      ) : render()}
    </div>
  );
}

function InlineText({ value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]); // stay in sync when regenerated
  return editing ? (
    <>
      <textarea style={{ ...inp, height: 110, resize: "vertical" }} value={draft} onChange={(e) => setDraft(e.target.value)} />
      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        <button style={btn(C.green)} onClick={() => { onSave(draft); setEditing(false); }}>Save</button>
        <button style={ghostBtn} onClick={() => { setDraft(value); setEditing(false); }}>Cancel</button>
      </div>
    </>
  ) : (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
      <p style={{ margin: 0, lineHeight: 1.55, fontSize: 14 }}>{value}</p>
      <button style={{ ...smallGhost, height: 32, flexShrink: 0 }} onClick={() => { setDraft(value); setEditing(true); }}>Edit</button>
    </div>
  );
}

function ListSection({ title, items, onSave, isDraft }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(items);
  const upd = (i, v) => setDraft(draft.map((x, j) => (j === i ? v : x)));
  return (
    <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 12, padding: 22, marginTop: 16 }}>
      <SectionHead title={title} isDraft={isDraft} editing={editing} onEdit={() => { setDraft(items); setEditing(true); }} />
      {editing ? (
        <div style={{ marginTop: 10 }}>
          {draft.map((it, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input style={inp} value={it} onChange={(e) => upd(i, e.target.value)} />
              <button style={smallGhost} onClick={() => setDraft(draft.filter((_, j) => j !== i))}>✕</button>
            </div>
          ))}
          <button style={{ ...ghostBtn, marginTop: 4 }} onClick={() => setDraft([...draft, ""])}>+ Add item</button>
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button style={btn(C.green)} onClick={() => { onSave(draft.filter((x) => x.trim())); setEditing(false); }}>Save</button>
            <button style={ghostBtn} onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <ul style={{ margin: "10px 0 0", paddingLeft: 20, fontSize: 14, lineHeight: 1.7 }}>{items.map((it, i) => <li key={i}>{it}</li>)}</ul>
      )}
    </div>
  );
}

// Requirements / Preferences: selected only until Edit reveals the full checkbox list
function ChecklistSection({ title, note, options, selected, onSave, allowCustom, isDraft }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(selected);
  const [custom, setCustom] = useState([]);
  const toggle = (opt) => setDraft(draft.includes(opt) ? draft.filter((x) => x !== opt) : [...draft, opt]);
  const allOptions = [...options, ...custom];
  return (
    <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 12, padding: 22, marginTop: 16 }}>
      <SectionHead title={title} isDraft={isDraft} editing={editing} onEdit={() => { setDraft(selected); setEditing(true); }} />
      <p style={{ fontSize: 13, color: C.sub, marginTop: 0, marginBottom: 14 }}>{note}</p>
      {editing ? (
        <>
          {allOptions.map((opt) => {
            const sensitive = SENSITIVE_PREFS.includes(opt);
            return (
              <label key={opt} style={{ display: "flex", gap: 10, alignItems: "center", padding: "7px 0", cursor: "pointer", fontSize: 14 }}>
                <input type="checkbox" checked={draft.includes(opt)} onChange={() => toggle(opt)} />
                <span>{opt}{sensitive && <span style={{ color: C.sub, fontSize: 12, marginLeft: 8 }}>· add only if role-justified</span>}</span>
              </label>
            );
          })}
          {allowCustom && (
            <button style={{ ...ghostBtn, marginTop: 8 }}
              onClick={() => { const v = prompt("Custom preference"); if (v && v.trim()) { setCustom([...custom, v.trim()]); setDraft([...draft, v.trim()]); } }}>
              Add custom preference
            </button>
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button style={btn(C.green)} onClick={() => { onSave(draft); setEditing(false); }}>Save</button>
            <button style={ghostBtn} onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </>
      ) : (
        selected.length === 0
          ? <p style={{ fontSize: 14, color: C.sub, margin: 0 }}>None selected. Click Edit to choose.</p>
          : <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.7 }}>{selected.map((s) => <li key={s}>{s}</li>)}</ul>
      )}
    </div>
  );
}

export default App;
