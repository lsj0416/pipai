# PIPAi Chat — UI Kit

A high-fidelity recreation of PIPAi's conversational AI surface for Korean SMB owners. Three-column shell: brand sidebar (navy) · chat column · risk checklist panel.

## Files

- `index.html` — interactive demo (login → chat → ask a question → see law/case cards stream in → risk checklist updates)
- `Sidebar.jsx` — left nav with chat list and the brand mark
- `RiskPanel.jsx` — right side real-time checklist
- `ChatThread.jsx` — message list with user + assistant bubbles
- `LawCard.jsx`, `CaseCard.jsx` — inline citation cards
- `Composer.jsx` — sticky bottom input
- `Welcome.jsx` — empty state for a new chat
- `Topbar.jsx` — chat header with title + actions

## Caveats
- Not connected to a real model — replies are scripted to demonstrate the law/case-card streaming pattern.
- Risk checklist categories are invented for the demo; replace with real schema when shared.
