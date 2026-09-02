# Health Navigator: medical knowledge and safety provenance

## Purpose

Health Navigator is a health-information and triage assistant. It must not present an AI-generated diagnosis as a medical diagnosis.

The medical safety layer is deterministic and source-backed. The language model may extract symptoms from text/voice and ask questions, but it must not override a safety rule.

## Evidence strategy

Health Navigator uses separate evidence contours for Russian clinical guidance, international evidence, nutrition and traditional/complementary/folk medicine. Evidence is stored with source, jurisdiction, version and review metadata rather than silently mixing incompatible claims.

### Traditional/complementary contour

Traditional and folk practices are informationally supported but are not automatically treated as equivalent to evidence-based clinical care. The production rule is:

**traditional use ≠ evidence of efficacy ≠ medical recommendation**.

The database contains practice-level records and indication-specific evidence records. Each record separates population, intended purpose, outcome, evidence level, certainty, findings, safety, contraindications, interactions, jurisdiction and review date.

WHO's 2025–2034 traditional medicine strategy emphasizes evidence, safety, quality, regulation and appropriate integration. NCCIH is used as an additional evidence and safety resource for complementary approaches.

## Current traditional evidence implemented

The production database now contains reviewed indication-specific records for:

- **Имбирь**: evidence suggests possible benefit for nausea/vomiting associated with pregnancy; safety notes include gastrointestinal adverse effects and the need to check medicine interactions.
- **Масло перечной мяты**: limited/low-certainty evidence for modest short-term relief of IBS symptoms, particularly abdominal pain, bloating and gas; reflux/heartburn can worsen, especially with non-enteric-coated products.
- **Ромашка**: insufficient evidence for a clinical recommendation for insomnia; allergy and medicine-interaction cautions are recorded.
- **Мёд**: limited/low-certainty evidence for reducing nighttime cough in children with upper-respiratory infection; **never for children under 1 year** because of botulism risk.

These records are based on current NCCIH evidence summaries and are deliberately bounded. No dose is generated from the database, and no traditional practice is presented as a substitute for urgent care.

## Safety policy

Traditional medicine must never bypass the deterministic medical safety layer.

The AI may identify a practice, explain traditional use, summarize evidence and uncertainty, surface safety information, ask for context and distinguish cultural information from medical advice.

The AI must not claim that traditional use proves efficacy, replace urgent care with a remedy, recommend something solely because it is natural, invent doses/interactions, advise stopping prescribed treatment, or override an urgent rule.

For herbs, supplements and multi-ingredient preparations, exact composition, dose, route, age, allergies, pregnancy where relevant, kidney/liver considerations, concurrent medicines and interactions must be considered before actionable guidance.

If evidence or safety data are insufficient, user-facing status is: **"Недостаточно данных для медицинской рекомендации"**.

## Other evidence contours

Russian clinical recommendations remain the primary country-specific clinical pathway for the Russian locale. International guidance from WHO, NICE, Cochrane and relevant specialty organizations is used for cross-checking and where local guidance is absent or insufficient.

Nutrition remains a separate contour using WHO/FAO, EFSA, NIH Office of Dietary Supplements and relevant national guidance. A symptom alone must never be converted into a claimed nutrient deficiency.

## Runtime architecture

1. Medical knowledge base stores source-backed rules and evidence.
2. Evidence resolver keeps conflicting sources separate and selects by jurisdiction and safety relevance.
3. Deterministic safety engine produces `urgent`, `medical_review` or `self_care_review`.
4. AI layer extracts free-text/voice symptoms, selects questions and explains bounded results.
5. Personalized route combines safety result, evidence status, context and country.

The Edge Function `health-navigator` is active with authenticated access. It supports the existing episode workflow and a `traditional_search` action. The mobile app has a dedicated **Знания** section backed by the traditional-practice and evidence tables.

## Product behavior for traditional questions

`user question -> identify practice -> identify intended purpose -> screen urgent/red flags -> collect relevant context -> resolve evidence -> resolve safety -> show evidence status -> give bounded information -> route to care if needed`

## Audit status

Confirmed urgent mappings include severe breathing difficulty, sudden/severe chest pain, loss of consciousness, severe dehydration with emergency features, sudden stroke signs, severe/uncontrolled bleeding, immediate self-harm safety concern and rapidly developing allergic airway/breathing concern.

Rules still marked for clinical review include generic worsening, a universal numeric pain threshold of 8/10, generic pregnancy concern and the broad severe-infection rule.

Medication and supplement prescribing logic remains disabled until indication, contraindication, interaction and safety evidence are explicitly sourced.

## Next production work

Continue expanding indication-specific evidence records across the traditional, nutrition and clinical domains, then connect them to the symptom/question workflow so the same evidence resolver can power text, voice and future photo/wearable inputs.
