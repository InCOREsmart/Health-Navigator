# Health Navigator: medical knowledge and safety provenance

## Purpose

Health Navigator is a health-information and triage assistant. It must not present an AI-generated diagnosis as a medical diagnosis.

The medical safety layer is deterministic and source-backed. The language model may extract symptoms from text/voice and ask questions, but it must not override a safety rule.

## Evidence strategy: Russian + international

Health Navigator uses a **dual evidence base** rather than choosing between Russian and international medicine.

### Tier 1: local clinical guidance

For the Russian product/locale, use current Russian clinical recommendations from the Ministry of Health clinical-recommendation rubricator and relevant Russian professional medical societies. Russian guidance is the primary source for country-specific clinical pathways, terminology and local organization of care.

### Tier 2: international evidence-based guidance

Use current guidance from internationally recognized evidence-producing organizations, including:

- WHO guidelines and evidence-to-decision materials.
- NICE guidelines.
- Cochrane systematic reviews where they answer the relevant clinical question.
- Other major specialty guideline organizations when appropriate, such as ESC, AHA/ACC, ERS/ATS, IDSA, ACG, EASL, EULAR and comparable bodies.

International guidance is especially important when a Russian recommendation is absent, outdated, narrower than the available evidence, or when cross-checking a high-risk safety rule.

### Evidence precedence

When sources disagree, the system must not silently merge them. Store both positions, their publication/version dates and the reason for the selected production rule. Country-specific care instructions should follow the user's selected country/locale. Safety-critical rules should be reviewed against the strongest current evidence available.

WHO describes its guideline process as evidence-based, transparent and subject to methodological quality assurance. Its handbook uses systematic evidence retrieval, synthesis and assessment, with recommendations informed by evidence and other decision factors. citeturn0search0turn0search1

Cochrane systematic reviews synthesize multiple studies using standardized methods and are specifically intended to assess the overall evidence for clinical questions. citeturn0search2turn0search14

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

### International

1. NHS, Anaphylaxis: https://www.nhs.uk/conditions/anaphylaxis/
2. NHS, Chest pain: https://www.nhs.uk/symptoms/chest-pain/
3. NHS, Heart attack: https://www.nhs.uk/conditions/heart-attack/
4. NHS, When to call 999: https://www.nhs.uk/nhs-services/urgent-and-emergency-care-services/when-to-call-999/
5. NHS, Symptoms of a stroke: https://www.nhs.uk/conditions/stroke/symptoms/
6. NHS, Dehydration: https://www.nhs.uk/conditions/dehydration/
7. NHS, Diarrhoea and vomiting: https://www.nhs.uk/symptoms/diarrhoea-and-vomiting/
8. NICE NG225, Self-harm: assessment, management and preventing recurrence: https://www.nice.org.uk/guidance/ng225/chapter/recommendations
9. WHO guideline framework and evidence standards.
10. Cochrane systematic-review methodology/evidence resources.

### Russian

11. Ministry of Health of the Russian Federation, clinical recommendations rubricator and related official clinical-recommendation resources.
12. Official Russian legal/medical publication resources for current standards and regulatory requirements where relevant.

The Russian Ministry of Health maintains an electronic rubricator of clinical recommendations, and its educational portal states that the clinical recommendations in that rubricator are updated as the recommendation set changes. citeturn1search0turn1search24

## Audit status

### Confirmed against the currently loaded international sources

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

## Planned evidence matrix

Each production rule will be tracked as:

`domain -> clinical question -> trigger/criteria -> action -> source -> country -> version -> evidence certainty -> review date`

Priority domains:

1. Emergency/red flags across all domains.
2. Gastroenterology.
3. Cardiovascular.
4. Respiratory.
5. Neurology.
6. Dermatology/allergy.
7. Urology.
8. Musculoskeletal.
9. Mental health.
10. Women's health and pregnancy.
11. General symptoms, fever and dehydration.
12. Preventive health and lifestyle.

## Safety architecture

1. **Medical knowledge base**: source-backed clinical facts and rules with versions, jurisdiction and review dates.
2. **Evidence resolver**: compares Russian and international sources and records conflicts instead of hiding them.
3. **Safety engine**: deterministic evaluation of explicit user answers and measurements. It can produce `urgent`, `medical_review`, or `self_care_review`.
4. **AI layer**: understands free text/voice, extracts candidate symptoms, selects relevant questions, and explains results. It cannot downgrade an urgent rule.

## Important implementation rule

Do not add a clinical rule to production simply because an LLM considers it plausible. Every safety rule needs a named source, trigger definition, action level, jurisdiction, version and review status.

## Localization

Emergency instructions must be expressed as `экстренная медицинская помощь` in the Russian UI and mapped to the user's actual country/emergency system separately. Do not hard-code the UK number 999 into the Russian product.

Self-care guidance also needs country-aware handling where medication availability, approved indications, care pathways or regulatory requirements differ.

## Next evidence work

The next implementation phase is to audit the existing symptoms/questions/rules against both evidence bases, add Russian provenance and international cross-checks, mark every item as confirmed/needs-review/unverified, and only then connect those rules to personalized routes. Medication advice should remain disabled until the corresponding indication, contraindication and safety evidence is explicitly sourced.
