# Blueprint Generation Workflow - Revised Plan Summary

## ✅ Architecture Decisions Finalized

Based on your feedback, here's the approved architecture:

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Storage** | S3-compatible abstraction (local for now) | Cloud-ready, easy to swap implementation |
| **Blueprint Persistence** | JSON files with UUID naming + locks | Simple, no DB setup, works for hackathon |
| **Job Updates** | Polling (2-3 seconds) | Simpler than WebSockets, works everywhere |
| **Claude Timing** | On "Define Categories" click | Blueprint API auto-detects and triggers |
| **Fal.ai** | Keep blocking `fal.subscribe()` | Acceptable for hackathon, document async for future |
| **Defect Format** | Name + rationale | Claude provides both |
| **Image Limit** | Single image per blueprint | Single product focus |
| **Versioning** | Overwrite on regeneration | No history tracking (future improvement) |
| **Error Handling** | Skip failed, mark failure, continue | Don't block on failures |
| **Progress** | Overall progress only | X of Y defects completed |
| **Notifications** | Toast/alert notifications | User-visible error messages |

## 📋 Implementation Components

### 1. Storage Abstraction Layer
- S3-compatible interface (`uploadImage`, `getImageUrl`, `deleteImage`)
- Local filesystem implementation
- Single image upload limit
- File validation (10MB max, image types only)

### 2. Blueprint API & JSON Storage
- JSON files in `.blueprints/{uuid}.json`
- File locking with `proper-lockfile` package
- Auto-trigger Claude when no defects + 1 image
- Poll endpoint for status updates

### 3. Claude Analysis Integration
- Trigger on OntologyStep mount
- Return structured `{ name, rationale }[]`
- 120-second timeout
- Toast notifications for errors

### 4. Image Generation (Blocking)
- Keep `fal.subscribe()` approach
- Skip failed jobs, don't fail batch
- Overall progress tracking
- Document async improvements in FUTURE_IMPROVEMENTS.md

### 5. Review & Refinement
- Poll Blueprint API every 2-3 seconds
- Overall progress bar
- Display failures (no retry)
- Overwrite on regeneration

### 6. Shared Types & Schemas
- Blueprint, DefectDefinition, GenerationJob, BlueprintStatus
- TypeScript interfaces for type safety

### 7. Toast Notification System
- Centralized `useToast` hook
- Error, success, info notifications
- Integrated throughout all flows

## 📄 Deliverables Created

1. **[Implementation Plan](file:///Users/fmilo/.gemini/antigravity/brain/7d6694cb-0c8d-48fa-aed9-557138b32030/implementation_plan.md)** - Detailed technical specifications
2. **[Task Breakdown](file:///Users/fmilo/.gemini/antigravity/brain/7d6694cb-0c8d-48fa-aed9-557138b32030/task.md)** - Granular checklist (7 components, 60+ tasks)
3. **[Future Improvements](file:///Users/fmilo/workspace/sandbox/2025-nov-22-blackforest-hackathon/FUTURE_IMPROVEMENTS.md)** - Deferred features with effort estimates

## 🚀 Next Steps

Ready to start implementation! The plan is approved and documented. 

**Suggested order:**
1. Component 6 (Schemas) - Foundation for other components
2. Component 1 (Storage) - Upload infrastructure
3. Component 2 (Blueprint API) - Core persistence
4. Component 7 (Toast) - Error handling UX
5. Component 3 (Claude) - Analysis integration
6. Component 4 (Generation) - Image creation
7. Component 5 (Review) - Final UI polish

**Estimated total time**: 12-16 hours for full implementation

Would you like me to start implementing any specific component?
