# Health Navigator: medical knowledge and safety provenance

## Purpose

Health Navigator is a health-information and triage assistant. It must not present an AI-generated diagnosis as a medical diagnosis.

The medical safety layer is deterministic and source-backed. The language model may extract symptoms from text/voice and ask questions, but it must not override a safety rule.

## Evidence strategy: Russian + international + traditional/complementary

Health Navigator uses a **multi-contour evidence base** rather than choosing between Russian, international, nutritional and traditional knowledge.

### Tier 1: local clinical guidance

For the Russian product/locale, use current Russian clinical recommendations from the Ministry of Health clinical-recommendation rubricator and relevant Russian professional medical societies. Russian guidance is the primary source for country-specific clinical pathways, terminology and local organization of care.

### Tier 2: international evidence-based guidance

Use current guidance from internationally recognized evidence-producing organizations, including:

- WHO guidelines and evidence-to-decision materials.
- NICE guidelines.
- Cochrane systematic reviews where they answer the relevant clinical question.
- Other major specialty guideline organizations when appropriate, such as ESC, AHA/ACC, ERS/ATS, IDSA, ACG, EASL, EULAR and comparable bodies.

International guidance is especially important when a Russian recommendation is absent, outdated, narrower than the available evidence, or when cross-checking a high-risk safety rule.

### Tier 3: nutrition and nutritional science

Nutrition is a separate evidence contour. It covers healthy dietary patterns, nutrients, hydration, deficiencies, food composition, nutritional risk, therapeutic nutrition and supplements.

Primary evidence resources include WHO/FAO, EFSA dietary reference values and food composition resources, NIH Office of Dietary Supplements and current Russian/national nutrition guidance. Country-specific dietary recommendations and food composition data must remain localized.

Nutrition advice must not infer a nutrient deficiency from a symptom alone. Therapeutic nutrition and supplement recommendations require clinical context and explicit evidence for indication, safety, contraindications, interactions and, where relevant, dose.

### Tier 4: traditional, complementary and folk medicine

Traditional and folk practices are a **separate knowledge contour**. They are not automatically treated as equivalent to evidence-based clinical care, but they are also not automatically dismissed.

The contour may contain:

- folk herbal remedies and traditional food remedies;
- heat/bathing practices;
- traditional massage and body practices;
- traditional Chinese medicine (TCM);
- Ayurveda;
- Unani and other traditional systems;
- Japanese traditional practices;
- Arabic and regional traditional practices;
- other culturally specific practices when reliable evidence and safety information can be identified.

WHO's 2025–2034 traditional medicine strategy emphasizes evidence, safety, quality, regulation and appropriate integration. NCCIH is used as an additional evidence and safety resource for complementary health approaches.

The production rule is: **traditional use is not evidence of clinical efficacy**. Every user-facing claim must distinguish traditional use, research evidence, uncertainty and safety.

## Evidence precedence

When sources disagree, the system must not silently merge them. Store both positions, their publication/version dates and the reason for the selected production rule. Country-specific care instructions should follow the user's selected country/locale. Safety-critical rules should be reviewed against the strongest current evidence available.

For traditional/complementary practices, the system must preserve the distinction between:

1. traditional use;
2. evidence of efficacy for a defined indication;
3. evidence certainty;
4. known or suspected harms;
5. contraindications and interactions;
6. regulatory/country context.

A traditional practice may be shown as cultural or informational context without being recommended as treatment.

## Current database inventory

The initial database contained:

- 25 symptom definitions across gastro, cardio, respiratory, neurology, dermatology, urology, musculoskeletal, mental/sleep and general domains.
- 21 intake questions.
- 10 safety rules.

These records were created on 2026-09-02. Their original provenance was not stored in the schema, so they must not be treated as clinically validated merely because they existed in the database.

## Provenance layer added

Supabase now contains:

- `hos_medical_sources`: source organization, title, URL, status and review metadata, with jurisdiction/country/region/evidence metadata available for the evidence contours.
- `hos_medical_rules`: clinical basis, trigger definition, action level, source and review metadata.
- `hos_safety_rules.medical_rule_id`: link from runtime safety rule to its medical rule.
- `hos_safety_rules.validation_status`: `confirmed`, `needs_review`, `unverified`, or `retired`.
- `hos_safety_rules.source_notes`: short clinical provenance note.
- `hos_traditional_practices`: catalog of traditional/folk practices with system, origin, category, evidence status and safety status.
- `hos_traditional_evidence`: practice-level evidence records with clinical question, population, intervention/exposure, outcome, finding, safety notes, contraindications, interactions, jurisdiction, version and review date.

Traditional-practice tables have RLS enabled and authenticated read access. They are deliberately informational until individual evidence records are reviewed.

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
11. WHO, Global traditional medicine strategy 2025–2034: https://www.who.int/teams/who-global-traditional-medicine-centre/traditional-medicine-strategy-2025-2034
12. WHO, Traditional medicine takes centre stage at WHA78: https://www.who.int/news/item/02-06-2025-wha78--traditional-medicine-takes-centre-stage
13. U.S. NCCIH, Safety of complementary health approaches: https://www.nccih.nih.gov/health/safety

### Nutrition

14. WHO, Healthy diet: https://www.who.int/news-room/fact-sheets/detail/healthy-diet
15. WHO/FAO, Healthy diets: joint statement and evidence resources.
16. EFSA, Dietary Reference Values: https://www.efsa.europa.eu/en/topics/topic/dietary-reference-values
17. EFSA, Food composition databases and related resources.
18. NIH Office of Dietary Supplements: https://ods.od.nih.gov/

### Russian

19. Ministry of Health of the Russian Federation, clinical recommendations rubricator and related official clinical-recommendation resources.
20. Official Russian legal/medical publication resources for current standards and regulatory requirements where relevant.

### Regional traditional/complementary evidence sources

The regional contour is country-aware and must prefer primary national or professional sources where available:

- Japan: MHLW and the Minds guideline platform.
- India: ICMR and National Institute of Nutrition resources.
- China: official national health authorities and recognized professional societies; TCM evidence is stored separately from conventional clinical evidence.
- Saudi Arabia/GCC: Ministry of Health and national evidence-based healthcare resources.
- UAE: relevant health authorities and clinical governance/evidence resources.

Discovery/indexing sites may help locate a document, but production safety rules should cite the original issuing organization whenever possible.

## Traditional medicine safety policy

Traditional and folk medicine must never bypass the deterministic medical safety layer.

The AI may:

- identify that a user is asking about a traditional practice;
- explain what the practice is traditionally used for;
- summarize available evidence and uncertainty;
- surface known safety information;
- ask for the clinical context needed to assess risk;
- distinguish cultural information from medical advice.

The AI must not:

- claim that traditional use proves efficacy;
- replace urgent medical care with a traditional remedy;
- recommend a treatment solely because it is natural or traditional;
- invent a dose, preparation, contraindication or interaction;
- advise stopping prescribed treatment in favor of a traditional practice;
- override an urgent safety rule.

For herbs, supplements and multi-ingredient traditional preparations, the system must additionally consider exact composition, dose, route, pregnancy status where relevant, age, allergies, kidney/liver considerations, concurrent medicines and known interactions before any actionable recommendation.

If evidence or safety data are insufficient, the user-facing status should be explicit: **"Недостаточно данных для медицинской рекомендации"**.

## Evidence status vocabulary

Use a controlled vocabulary across evidence contours:

- `supported`: evidence supports the stated claim for a defined indication/context.
- `limited`: some evidence exists, but certainty or applicability is limited.
- `mixed`: studies or guidelines conflict.
- `insufficient_evidence`: evidence is inadequate for a clinical recommendation.
- `not_evaluated`: no production evidence assessment has been completed.

Safety status:

- `reviewed`
- `needs_review`
- `unsafe`
- `not_evaluated`

These statuses are not diagnoses and must not be converted into a simplistic "works/doesn't work" score.

## Current audit status

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

Traditional and nutrition catalog entries are not automatically clinical recommendations. They remain `not_evaluated` / `needs_review` until an evidence record is explicitly reviewed.

## Evidence matrix

Each production rule will be tracked as:

`domain -> clinical question -> population -> intervention/exposure -> outcome -> trigger/criteria -> action/recommendation -> source -> country -> version -> evidence level -> certainty -> contraindications -> interactions -> review date`

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
13. Nutrition and nutritional deficiencies.
14. Supplements and nutraceuticals.
15. Traditional/complementary medicine.
16. Culturally adapted food and health practices.

## Safety architecture

1. **Medical knowledge base**: source-backed clinical facts and rules with versions, jurisdiction and review dates.
2. **Evidence resolver**: compares Russian, international, nutrition and traditional/complementary evidence and records conflicts instead of hiding them.
3. **Safety engine**: deterministic evaluation of explicit user answers and measurements. It can produce `urgent`, `medical_review`, or `self_care_review`.
4. **AI layer**: understands free text/voice, extracts candidate symptoms, selects relevant questions, and explains results. It cannot downgrade an urgent rule.
5. **Personalized route**: combines the safety result, evidence status, user context and country without turning uncertain evidence into a diagnosis.

## Localization

Emergency instructions must be expressed as `экстренная медицинская помощь` in the Russian UI and mapped to the user's actual country/emergency system separately. Do not hard-code the UK number 999 into the Russian product.

Self-care guidance also needs country-aware handling where medication availability, approved indications, care pathways or regulatory requirements differ.

Traditional and nutrition guidance should also respect local food culture, health-system pathways and regulatory context.

## Medication and supplement policy

Medication advice remains disabled until the corresponding indication, contraindication and safety evidence is explicitly sourced.

The same principle applies to supplements, herbs and multi-ingredient traditional preparations. No dose should be generated from general model knowledge alone.

## Product behavior

When a user asks about a folk or traditional remedy, the response pipeline should be:

`user question -> identify practice -> identify intended purpose -> screen urgent/red flags -> collect relevant context -> resolve evidence -> resolve safety -> show evidence status -> give bounded information -> route to care if needed`

A traditional remedy must never be presented as an alternative to emergency care.

## Next evidence work

The evidence architecture is now implemented for traditional practices, but individual claims still require source-level review. The next production step is to populate `hos_traditional_evidence` with reviewed, indication-specific records and link them to named sources. The same audit process continues for the existing symptoms/questions/safety rules and for nutrition.
