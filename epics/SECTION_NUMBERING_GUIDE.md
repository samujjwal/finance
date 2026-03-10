# Section Numbering Standardization Guide

**Date:** March 2, 2026  
**Purpose:** Guide for standardizing section numbering across all epics

---

## Current State

Most epics use non-sequential section numbering:
- Section 6: Event Model Definition
- **Section 6.5:** Command Model Definition ⚠️
- Section 7: AI Integration Requirements
- Section 8: NFRs
- ...
- Section 14: Future-Safe Architecture Evaluation
- **Section 14.5:** Threat Model ⚠️

**Issue:** Sections 6.5 and 14.5 break the standard numbering pattern.

---

## Target State

All epics should use sequential integer numbering:
- Section 6: Event Model Definition
- **Section 7:** Command Model Definition ✅
- **Section 8:** AI Integration Requirements ✅
- **Section 9:** NFRs ✅
- **Section 10:** Acceptance Criteria ✅
- **Section 11:** Failure Modes & Resilience ✅
- **Section 12:** Observability & Audit ✅
- **Section 13:** Compliance & Regulatory Traceability ✅
- **Section 14:** Extension Points & Contracts ✅
- **Section 15:** Future-Safe Architecture Evaluation ✅
- **Section 16:** Threat Model ✅

---

## Migration Mapping

| Current Section | New Section | Section Name |
|----------------|-------------|--------------|
| 6 | 6 | Event Model Definition |
| 6.5 | 7 | Command Model Definition |
| 7 | 8 | AI Integration Requirements |
| 8 | 9 | NFRs |
| 9 | 10 | Acceptance Criteria |
| 10 | 11 | Failure Modes & Resilience |
| 11 | 12 | Observability & Audit |
| 12 | 13 | Compliance & Regulatory Traceability |
| 13 | 14 | Extension Points & Contracts |
| 14 | 15 | Future-Safe Architecture Evaluation |
| 14.2 | 15.2 | Workflow Sequence Diagram (if present) |
| 14.5 | 16 | Threat Model (if present) |

---

## Implementation Strategy

### Phase 1: Template (✅ COMPLETE)
- Update `EPIC_TEMPLATE.md` with correct numbering
- All new epics will use correct numbering from day 1

### Phase 2: High-Priority Epics (Recommended Next)
Update the most frequently referenced epics first:
1. K-01 IAM
2. K-05 Event Bus
3. K-07 Audit Framework
4. D-01 OMS
5. K-12 Platform SDK

### Phase 3: Kernel Layer (K-*)
Update all 16 kernel epics:
- K-01 through K-16

### Phase 4: Domain Layer (D-*)
Update all 12 domain epics:
- D-01 through D-12

### Phase 5: Other Layers
Update remaining epics:
- W-01, W-02 (Workflow)
- O-01 (Operations)
- P-01 (Packs)
- R-01 (Regulatory)
- T-01 (Testing)
- PU-004 (Platform Unity)

---

## Migration Process (Per Epic)

### Step 1: Backup
Create a backup or ensure version control is clean.

### Step 2: Find and Replace
Use the following find/replace operations in order:

```bash
# Replace Section 14.5 first (to avoid conflicts)
Find: "#### Section 14.5 — Threat Model"
Replace: "#### Section 16 — Threat Model"

# Replace Section 14.2 (if present)
Find: "#### Section 14.2 — Workflow Sequence Diagram"
Replace: "#### Section 15.2 — Workflow Sequence Diagram"

# Replace Section 14
Find: "#### Section 14 — Future-Safe Architecture Evaluation"
Replace: "#### Section 15 — Future-Safe Architecture Evaluation"

# Replace Section 13
Find: "#### Section 13 — Extension Points & Contracts"
Replace: "#### Section 14 — Extension Points & Contracts"

# Replace Section 12
Find: "#### Section 12 — Compliance & Regulatory Traceability"
Replace: "#### Section 13 — Compliance & Regulatory Traceability"

# Replace Section 11
Find: "#### Section 11 — Observability & Audit"
Replace: "#### Section 12 — Observability & Audit"

# Replace Section 10
Find: "#### Section 10 — Failure Modes & Resilience"
Replace: "#### Section 11 — Failure Modes & Resilience"

# Replace Section 9
Find: "#### Section 9 — Acceptance Criteria"
Replace: "#### Section 10 — Acceptance Criteria"

# Replace Section 8
Find: "#### Section 8 — NFRs"
Replace: "#### Section 9 — NFRs"

# Replace Section 7
Find: "#### Section 7 — AI Integration Requirements"
Replace: "#### Section 8 — AI Integration Requirements"

# Replace Section 6.5
Find: "#### Section 6.5 — Command Model Definition"
Replace: "#### Section 7 — Command Model Definition"
```

### Step 3: Verify
- Check that all sections are numbered sequentially
- Ensure no duplicate section numbers
- Verify table of contents (if present) is updated

### Step 4: Update Version
- Increment epic version (PATCH version)
- Add changelog entry:
  ```markdown
  ### Version X.Y.Z (YYYY-MM-DD)
  **Type:** PATCH  
  **Changes:**
  - Standardized section numbering (6.5→7, 14.5→16)
  ```

### Step 5: Commit
```bash
git add epics/EPIC-{ID}-{NAME}.md
git commit -m "[EPIC-{ID}] vX.Y.Z: Standardize section numbering (PATCH)"
```

---

## Automated Script

```bash
#!/bin/bash
# standardize-epic-sections.sh
# Usage: ./standardize-epic-sections.sh EPIC-K-01-IAM.md

EPIC_FILE=$1

if [ ! -f "$EPIC_FILE" ]; then
    echo "Error: File not found: $EPIC_FILE"
    exit 1
fi

echo "Standardizing section numbering in $EPIC_FILE..."

# Create backup
cp "$EPIC_FILE" "${EPIC_FILE}.bak"

# Apply replacements in reverse order (to avoid conflicts)
sed -i '' 's/#### Section 14\.5 — Threat Model/#### Section 16 — Threat Model/g' "$EPIC_FILE"
sed -i '' 's/#### Section 14\.2 — Workflow Sequence Diagram/#### Section 15.2 — Workflow Sequence Diagram/g' "$EPIC_FILE"
sed -i '' 's/#### Section 14 — Future-Safe Architecture Evaluation/#### Section 15 — Future-Safe Architecture Evaluation/g' "$EPIC_FILE"
sed -i '' 's/#### Section 13 — Extension Points & Contracts/#### Section 14 — Extension Points & Contracts/g' "$EPIC_FILE"
sed -i '' 's/#### Section 12 — Compliance & Regulatory Traceability/#### Section 13 — Compliance & Regulatory Traceability/g' "$EPIC_FILE"
sed -i '' 's/#### Section 11 — Observability & Audit/#### Section 12 — Observability & Audit/g' "$EPIC_FILE"
sed -i '' 's/#### Section 10 — Failure Modes & Resilience/#### Section 11 — Failure Modes & Resilience/g' "$EPIC_FILE"
sed -i '' 's/#### Section 9 — Acceptance Criteria/#### Section 10 — Acceptance Criteria/g' "$EPIC_FILE"
sed -i '' 's/#### Section 8 — NFRs/#### Section 9 — NFRs/g' "$EPIC_FILE"
sed -i '' 's/#### Section 7 — AI Integration Requirements/#### Section 8 — AI Integration Requirements/g' "$EPIC_FILE"
sed -i '' 's/#### Section 6\.5 — Command Model Definition/#### Section 7 — Command Model Definition/g' "$EPIC_FILE"

echo "✓ Section numbering standardized"
echo "✓ Backup created: ${EPIC_FILE}.bak"
echo ""
echo "Next steps:"
echo "1. Review changes: diff ${EPIC_FILE}.bak ${EPIC_FILE}"
echo "2. Update epic version (PATCH)"
echo "3. Add changelog entry"
echo "4. Commit changes"
```

---

## Validation Checklist

After updating an epic:

- [ ] All sections numbered sequentially (no decimals)
- [ ] Section 6: Event Model Definition
- [ ] Section 7: Command Model Definition
- [ ] Section 8: AI Integration Requirements
- [ ] Section 9: NFRs
- [ ] Section 10: Acceptance Criteria
- [ ] Section 11: Failure Modes & Resilience
- [ ] Section 12: Observability & Audit
- [ ] Section 13: Compliance & Regulatory Traceability
- [ ] Section 14: Extension Points & Contracts
- [ ] Section 15: Future-Safe Architecture Evaluation
- [ ] Section 16: Threat Model (if present)
- [ ] No duplicate section numbers
- [ ] Epic version incremented (PATCH)
- [ ] Changelog entry added
- [ ] File compiles/renders correctly

---

## Rationale for Incremental Approach

### Why Not Update All 35 Epics Immediately?

1. **Massive Diff:** Would create 35 file changes in a single commit
2. **Merge Conflicts:** High risk of conflicts with ongoing work
3. **Review Burden:** Difficult to review 35 file changes simultaneously
4. **Low Priority:** Current numbering is functional, not broken
5. **Natural Migration:** Epics will be updated during normal version increments

### Benefits of Incremental Approach

1. **Manageable Changes:** Update 1-5 epics at a time
2. **Reduced Risk:** Smaller changes, easier to review and test
3. **Natural Cadence:** Align with epic version updates
4. **Template Compliance:** New epics already use correct numbering
5. **Backward Compatible:** Old numbering still works, no breaking changes

---

## Timeline

### Immediate (✅ Complete)
- Template updated with correct numbering
- Guide created for reference

### Q2 2026 (Recommended)
- Update 5 high-priority epics (K-01, K-05, K-07, D-01, K-12)
- Validate process and tooling

### Q3 2026
- Update all kernel epics (K-01 through K-16)

### Q4 2026
- Update all domain epics (D-01 through D-12)

### Q1 2027
- Update remaining epics (W-*, O-*, P-*, R-*, T-*, PU-*)

---

## Communication

### When Updating Epics

**Commit Message:**
```
[EPIC-{ID}] v{X.Y.Z}: Standardize section numbering (PATCH)

- Renamed Section 6.5 → Section 7 (Command Model)
- Renamed Section 7-13 → Sections 8-14
- Renamed Section 14 → Section 15 (Future-Safe)
- Renamed Section 14.5 → Section 16 (Threat Model)
```

**Changelog Entry:**
```markdown
### Version X.Y.Z (YYYY-MM-DD)
**Type:** PATCH  
**Changes:**
- Standardized section numbering for consistency with template
- No content changes, only section number updates
```

**Team Notification:**
```
Subject: Epic Section Numbering Update - EPIC-{ID}

Team,

We've updated EPIC-{ID} to use standardized section numbering:
- Section 6.5 → Section 7 (Command Model)
- Section 14.5 → Section 16 (Threat Model)
- All other sections renumbered accordingly

This is a PATCH version update with no content changes.
All new epics already use this numbering scheme.

Ref: SECTION_NUMBERING_GUIDE.md
```

---

## FAQ

**Q: Why not use Section 6.5 and 14.5?**  
A: Decimal section numbers are unconventional and break sequential numbering. Standard practice is to use integers.

**Q: Will this break existing references?**  
A: No. References to section content (e.g., "see Command Model Definition") remain valid. Only the section number changes.

**Q: Do we need to update all epics immediately?**  
A: No. This is a gradual migration. New epics use correct numbering; existing epics can be updated incrementally.

**Q: What if I'm working on an epic with old numbering?**  
A: Continue using the old numbering. Update to new numbering when you increment the epic version for other reasons.

**Q: How do I know which numbering scheme to use?**  
A: Always use the template (`EPIC_TEMPLATE.md`) as the source of truth. It has the correct numbering.

---

**Guide Status:** ✅ ACTIVE  
**Last Updated:** March 2, 2026  
**Next Review:** June 2, 2026  
**Owner:** Platform Architecture Team
