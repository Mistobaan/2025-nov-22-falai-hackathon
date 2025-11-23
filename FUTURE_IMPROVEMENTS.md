# Future Improvements - Blueprint Generation System

This document tracks architectural improvements that were deferred for the initial hackathon implementation but should be considered for production deployment.

## 1. Async Image Generation with Webhooks

**Current**: Blocking `fal.subscribe()` that waits for generation to complete  
**Future**: Use `fal.submit()` + webhooks for non-blocking async generation

### Benefits
- Server doesn't block during long-running generation
- Better scalability for multiple concurrent users
- Reduced server resource usage

### Implementation
```typescript
// Submit job and get request_id
const handler = await fal.submit("fal-ai/flux-pro/v1.1", {
  input: { /* ... */ },
  webhookUrl: `${process.env.BASE_URL}/api/webhooks/fal`
});

// Store request_id in blueprint
await saveBlueprint(blueprintId, {
  jobs: [...jobs, { 
    requestId: handler.request_id,
    status: 'queued'
  }]
});

// Webhook endpoint receives completion
// POST /api/webhooks/fal
// Updates blueprint with results
```

### Effort Estimate
- 4-6 hours implementation
- Requires webhook endpoint setup
- Needs request_id tracking in blueprint schema

---

## 2. WebSocket-Based Real-Time Updates

**Current**: Frontend polls Blueprint API every 2-3 seconds  
**Future**: WebSocket push notifications for instant updates

### Benefits
- Instant UI updates when jobs complete
- Reduced server load (no polling overhead)
- Better user experience

### Implementation
- Use Socket.io or native WebSockets
- Server pushes events: `job_started`, `job_completed`, `job_failed`
- Frontend subscribes to blueprint-specific channels

### Effort Estimate
- 6-8 hours implementation
- Requires WebSocket server setup
- Client-side connection management

---

## 3. Multi-Image Blueprint Support

**Current**: Single image per blueprint  
**Future**: Multiple images (different angles, products)

### Benefits
- Generate defects across multiple product views
- Better training data diversity
- Matches original product vision

### Implementation
- Remove single-image limit in UploadStep
- Update generation to create defects for each image
- Matrix UI already supports multiple objects

### Effort Estimate
- 2-3 hours implementation
- Mostly UI changes + loop adjustments

---

## 4. Prompt Versioning & History Tracking

**Current**: Overwrite prompt on regeneration  
**Future**: Track full prompt lineage for GEPA optimization

### Benefits
- Enable GEPA evolutionary prompt optimization
- Analyze which prompts produce best results
- Rollback to previous versions

### Implementation
```typescript
interface PromptHistory {
  id: string;
  parentId: string | null;
  promptText: string;
  generatedImageUrl: string;
  userRating: 'approved' | 'rejected';
  timestamp: string;
}
```

### Effort Estimate
- 4-5 hours implementation
- Requires schema updates
- UI for viewing history

---

## 5. Cloud Storage Backend (S3/Spaces)

**Current**: Local filesystem storage  
**Future**: S3-compatible cloud storage (DigitalOcean Spaces, AWS S3, etc.)

### Benefits
- Persistent storage across deployments
- CDN integration for fast image delivery
- Scalable storage

### Implementation
- Already abstracted in `storage.ts`
- Swap implementation to use AWS SDK
- Configure credentials via environment variables

### Effort Estimate
- 2-3 hours implementation
- Requires cloud account setup
- Environment variable configuration

---

## 6. Database-Backed Blueprint Storage

**Current**: JSON files with file locks  
**Future**: PostgreSQL or similar relational database

### Benefits
- Better querying (find all blueprints by user, status, etc.)
- ACID transactions (no file locking needed)
- Relationships (users, projects, blueprints)

### Implementation
- Use Prisma or similar ORM
- Migrate JSON schema to database tables
- Update blueprintStorage.ts to use DB queries

### Effort Estimate
- 8-10 hours implementation
- Requires database setup
- Schema migration

---

## 7. Automatic Retry Logic

**Current**: Skip failed jobs, mark as failed  
**Future**: Automatic retry with exponential backoff

### Benefits
- Recover from transient failures
- Better success rate
- Less manual intervention

### Implementation
```typescript
async function generateWithRetry(job, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fal.subscribe(/* ... */);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(Math.pow(2, i) * 1000); // Exponential backoff
    }
  }
}
```

### Effort Estimate
- 2-3 hours implementation
- Add retry configuration to blueprint

---

## 8. Per-Job Progress Tracking

**Current**: Overall progress only (X of Y completed)  
**Future**: Individual job progress (0-100% per image)

### Benefits
- More granular user feedback
- Identify slow/stuck jobs
- Better UX for long generations

### Implementation
- Use fal.ai's `onQueueUpdate` callback
- Store progress percentage per job
- Update UI to show individual progress bars

### Effort Estimate
- 3-4 hours implementation
- Requires UI redesign for progress display

---

## 9. Blueprint Templates & Presets

**Future**: Pre-configured defect sets for common products

### Benefits
- Faster blueprint creation
- Industry-specific defect libraries
- Best practices sharing

### Implementation
- Store templates in database
- UI for selecting/customizing templates
- Community template sharing

### Effort Estimate
- 6-8 hours implementation
- Requires template management UI

---

## 10. Batch Export & Dataset Generation

**Future**: Export all generated images as training dataset

### Benefits
- Direct integration with ML training pipelines
- COCO/YOLO format export
- Annotation file generation

### Implementation
- Export API endpoint
- Generate annotation files (bounding boxes, labels)
- ZIP download of full dataset

### Effort Estimate
- 4-6 hours implementation
- Requires annotation format research

---

## Priority Recommendations

### High Priority (Next Sprint)
1. **Cloud Storage Backend** - Critical for production deployment
2. **Async Image Generation** - Improves scalability
3. **Multi-Image Support** - Core feature from original spec

### Medium Priority (Future Sprints)
4. **Database-Backed Storage** - Better data management
5. **WebSocket Updates** - Better UX
6. **Prompt Versioning** - Enables GEPA optimization

### Low Priority (Nice to Have)
7. **Automatic Retry** - Quality of life
8. **Per-Job Progress** - UX enhancement
9. **Templates** - Advanced feature
10. **Dataset Export** - Integration feature

---

## Notes

- All improvements maintain backward compatibility with current architecture
- Storage abstraction layer already enables easy swap to cloud storage
- Blueprint schema is extensible for new fields
- Most improvements are additive, not breaking changes
