# Health Navigator: medical knowledge and safety provenance

## Purpose

Health Navigator is a health-information and triage assistant. It must not present an AI-generated diagnosis as a medical diagnosis.

The medical safety layer is deterministic and source-backed. The language model may extract symptoms from text/voice and ask questions, but it must not override a safety rule.

## Current database inventory

The initial database contained:

- 25 symptom definitions across gastro, cardio, respiratory, neurology, dermatology, urology, musculoskeletal, mental/sleep and general domains.
- 21 intake questions.
- 10 safety rules.

These records were created on 2026-09-02. Their original provenance was not stored in the schema, so they must not be treated as clinically validated merely because they existed in the database.

## Provenance layer added

Supabase now contains:

- `hos_medical_sources`: source organization, title, URL, status and review metadata.
- `hos_medical_rules`: clinical basis, trigger definition, action level, source and review metadata.
- `hos_safety_rules.medical_rule_id`: link from runtime safety rule to its medical rule.
- `hos_safety_rules.validation_status`: `confirmed`, `needs_review`, `unverified`, or `retired`.
- `hos_safety_rules.source_notes`: short clinical provenance note.

## Sources currently loaded

1. NHS, Anaphylaxis: https://www.nhs.uk/conditions/anaphylaxis/
2. NHS, Chest pain: https://www.nhs.uk/symptoms/chest-pain/
3. NHS, Heart attack: https://www.nhs.uk/conditions/heart-attack/
4. NHS, When to call 999: https://www.nhs.uk/nhs-services/urgent-and-emergency-care-services/when-to-call-999/
5. NHS, Symptoms of a stroke: https://www.nhs.uk/conditions/stroke/symptoms/
6. NHS, Dehydration: https://www.nhs.uk/conditions/dehydration/
7. NHS, Diarrhoea and vomiting: https://www.nhs.uk/symptoms/diarrhoea-and-vomiting/
8. NICE NG225, Self-harm: assessment, management and preventing recurrence: https://www.nice.org.uk/guidance/ng225/chapter/recommendations

## Audit status

### Confirmed against the currently loaded sources

- severe breathing difficulty -> urgent
- sudden/severe chest pain -> urgent
- loss of consciousness -> urgent
- severe dehydration with emergency features -> urgent
- sudden stroke signs -> urgent
- severe/uncontrolled bleeding -> urgent
- immediate suicidal/self-harm safety concern -> urgent
- rapidly developing allergic airway/breathing concern -> urgent

### Needs clinical review before being treated as authoritative

- generic worsening -> medical review
- numeric pain threshold `>= 8/10` -> medical review; the cited public source supports sudden severe pain but does not establish a universal 8/10 threshold
- generic pregnancy concern -> medical review; pregnancy-specific guidance still needs to be added
- generic severe infection rule -> medical review; the existing wording is broader than the source used for the initial mapping

## Safety architecture

1. **Medical knowledge base**: source-backed clinical facts and rules with versions and review dates.
2. **Safety engine**: deterministic evaluation of explicit user answers and measurements. It can produce `urgent`, `medical_review`, or `self_care_review`.
3. **AI layer**: understands free text/voice, extracts candidate symptoms, selects relevant questions, and explains results. It cannot downgrade an urgent rule.

## Important implementation rule

Do not add a clinical rule to production simply because an LLM considers it plausible. Every safety rule needs a named source, trigger definition, action level, version and review status.

## Localization

Emergency instructions must be expressed as `экстренная медицинская помощь` in the Russian UI and mapped to the user's actual country/emergency system separately. Do not hard-code the UK number 999 into the Russian product.

## Next evidence work

Before expanding self-care recommendations or medication advice, build source-backed rule sets for each supported domain: gastroenterology, cardiovascular, respiratory, neurology, dermatology/allergy, urology, musculoskeletal, mental health, women's health and general symptoms. Add local Russian clinical guidance where the product will operate in Russia, and keep international sources as supporting references.
