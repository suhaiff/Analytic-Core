# Migration Plan: Gemini to GPT for InsightAI Application

## Executive Summary

This document outlines the complete migration strategy for converting the InsightAI application from Google Gemini AI to OpenAI GPT models. The migration involves replacing AI-powered features while maintaining all existing functionality, including data schema auditing, KPI suggestions, and natural language chart generation.

## Current Architecture Overview

### Gemini Integration Points

1. **Frontend Service (`services/geminiService.ts`)**
   - Uses `@google/genai` package (v1.30.0)
   - API key exposed via Vite environment variables
   - Three main functions:
     - `analyzeDataAndSuggestKPIs()` - Suggests 6-10 charts automatically
     - `generateChartFromPrompt()` - Creates charts from natural language
     - `auditSchema()` - Classifies column types deterministically

2. **Schema Service (`services/schemaService.ts`)**
   - Orchestrates AI + rule-based schema detection
   - Uses `auditSchema()` with 5-second timeout fallback

3. **UI Components**
   - `ChartBuilder.tsx` - Calls AI services for suggestions
   - Various UI references to "Powered by Gemini"

## Migration Strategy

### Phase 1: Environment Setup & Dependencies

1. **Update Dependencies**
   ```bash
   # Remove
   npm uninstall @google/genai
   
   # Add
   npm install openai
   ```

2. **Environment Variables**
   - Replace `GEMINI_API_KEY` with `OPENAI_API_KEY`
   - Update `vite.config.ts`:
   ```typescript
   define: {
     'process.env.OPENAI_API_KEY': JSON.stringify(env.OPENAI_API_KEY)
   }
   ```

### Phase 2: Core Service Migration

#### New `services/openaiService.ts`

Key considerations:
- Use OpenAI's Structured Outputs (JSON Schema)
- Map models: `gemini-2.5-flash` → `gpt-4o-mini` (suggestions), `gpt-4o` (custom prompts)
- Maintain low temperature (0.1) for schema audits
- Handle schema differences (all properties must be required in OpenAI)

#### Schema Conversion Example

**Gemini Schema:**
```typescript
const chartSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    sortOrder: { type: Type.STRING, enum: ["ASC", "DESC"] }
  },
  required: ["title"]
}
```

**OpenAI Schema:**
```typescript
const chartSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    sortOrder: { type: "string", enum: ["ASC", "DESC"] }
  },
  required: ["title"],
  additionalProperties: false
}
```

### Phase 3: Function Mapping

| Gemini Function | OpenAI Equivalent | Notes |
|----------------|-------------------|-------|
| `analyzeDataAndSuggestKPIs()` | `analyzeDataAndSuggestKPIs()` | Use `gpt-4o-mini` for cost efficiency |
| `generateChartFromPrompt()` | `generateChartFromPrompt()` | Use `gpt-4o` for complex prompts |
| `auditSchema()` | `auditSchema()` | Keep `temperature: 0.1` for determinism |

### Phase 4: Security Enhancement

**Recommendation**: Move AI calls to backend
- Current: API key exposed client-side
- Proposed: Proxy through Express server
- Benefits: Secure key management, rate limiting, usage tracking

Backend endpoint example:
```javascript
// server/index.js
app.post('/api/ai/suggest-charts', async (req, res) => {
  const { dataModel } = req.body;
  // Call OpenAI from server
});
```

## Implementation Details

### 1. Service Layer Changes

**File: `services/openaiService.ts`**
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Temporary for client-side
});

export const analyzeDataAndSuggestKPIs = async (model: DataModel): Promise<ChartConfig[]> => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "system", content: SYSTEM_INSTRUCTION },
               { role: "user", content: context }],
    response_format: {
      type: "json_schema",
      json_schema: chartSchema
    },
    temperature: 0.7
  });
  
  return JSON.parse(response.choices[0].message.content).suggestions;
};
```

### 2. Schema Updates

**Critical Changes Required:**
1. All object schemas need `additionalProperties: false`
2. Optional properties must be handled differently
3. Enum values must be explicitly listed

### 3. UI Updates

**Text Changes:**
- "Powered by Gemini 2.0 Flash" → "Powered by GPT-4"
- "Consulting Gemini..." → "Analyzing with AI..."
- Update loading states and tooltips

## Testing Strategy

### 1. Unit Tests
- Test schema conversion accuracy
- Validate JSON responses match expected structure
- Compare output quality between Gemini and GPT

### 2. Integration Tests
- End-to-end chart generation flows
- Schema audit accuracy with sample datasets
- Error handling and timeout scenarios

### 3. Performance Tests
- Response time comparison
- Token usage analysis
- Cost estimation

## Risk Mitigation for Accelerated Timeline

### Critical Risks in 2-Day Migration

1. **Schema Validation Errors**
   - Mitigation: Prepare test datasets in advance
   - Fallback: Keep Gemini service as backup for 48 hours

2. **Limited Testing Time**
   - Mitigation: Focus on high-usage scenarios only
   - Accept: Minor edge cases may need post-deployment fixes

3. **Deployment Pressure**
   - Mitigation: Prepare rollback script in advance
   - Plan: Deploy to staging first, then production

### Day 1 Showstoppers to Watch For
- OpenAI API authentication failures
- JSON schema validation rejections
- Component compilation errors

### Day 2 Showstoppers to Watch For
- Response quality degradation
- Performance regression (>2x slower)
- Integration failures with existing data

## Timeline: 2-Day Accelerated Migration

### Day 1: Core Migration & Implementation (8-10 hours)

| Time | Milestone | Deliverables |
|------|----------|--------------|
| 9:00-10:00 | Environment Setup | Dependencies updated, API keys configured |
| 10:00-12:00 | Service Layer Migration | Complete `openaiService.ts` with all functions |
| 12:00-13:00 | Lunch | |
| 13:00-15:00 | Integration & Basic Testing | All components updated, smoke tests passing |
| 15:00-17:00 | UI Updates & Bug Fixes | Text updated, critical issues resolved |
| 17:00-18:00 | Initial QA | Core functionality verified |

### Day 2: Testing & Deployment (8-10 hours)

| Time | Milestone | Deliverables |
|------|----------|--------------|
| 9:00-11:00 | Comprehensive Testing | All AI features tested with various datasets |
| 11:00-12:00 | Performance Optimization | Response times optimized, caching implemented |
| 12:00-13:00 | Lunch | |
| 13:00-15:00 | Security Hardening | Backend proxy implemented (optional but recommended) |
| 15:00-17:00 | Final QA & Documentation | Full test suite passed, docs updated |
| 17:00-18:00 | Deployment & Monitoring | Production deployment, monitoring active |

## Critical Path Dependencies

**Must Complete in Sequence:**
1. Environment setup → Service migration
2. Service migration → Component integration
3. Integration testing → Production deployment

**Parallel Tasks:**
- UI text updates can happen during service testing
- Documentation can be written during QA phase

## Implementation Checklist (2-Day Sprint)

### Pre-Migration Preparation (Day 0)
- [ ] OpenAI API key obtained and funded
- [ ] Backup of current production code
- [ ] Test datasets prepared (3-5 varying CSV files)
- [ ] Staging environment ready
- [ ] Rollback script prepared

### Day 1 Tasks
- [ ] Remove `@google/genai`, add `openai` package
- [ ] Create `services/openaiService.ts`
- [ ] Convert all 3 AI functions to OpenAI
- [ ] Update `vite.config.ts` environment variables
- [ ] Update imports in `ChartBuilder.tsx` and `schemaService.ts`
- [ ] Change UI text references from Gemini to GPT
- [ ] Basic smoke tests (upload → suggest → generate)

### Day 2 Tasks
- [ ] Full regression testing with all chart types
- [ ] Performance benchmarking (target: <3s response)
- [ ] Implement backend proxy (if time permits)
- [ ] Update documentation
- [ ] Deploy to production
- [ ] Monitor for 2 hours post-deployment

### Immediate Post-Migration (Day 3)
- [ ] Monitor error rates and response quality
- [ ] Fix any critical bugs discovered
- [ ] Gather user feedback
- [ ] Keep Gemini code for 1 week as safety net

## Cost Analysis

### Current (Gemini)
- `gemini-2.5-flash`: ~$0.075 per 1M tokens
- `gemini-2.0-flash`: ~$0.075 per 1M tokens

### Proposed (OpenAI)
- `gpt-4o-mini`: $0.150 per 1M input tokens, $0.600 per 1M output tokens
- `gpt-4o`: $2.50 per 1M input tokens, $10.00 per 1M output tokens

**Estimated Impact**: 2-4x cost increase, mitigated by:
- Using `gpt-4o-mini` for most operations
- Implementing caching for repeated requests
- Optimizing prompts to reduce tokens

## Conclusion for 2-Day Migration



**Expected Outcome:**
- All AI features functional with GPT
- Minor quality/performance differences acceptable
- Some optimizations deferred to post-launch sprint
